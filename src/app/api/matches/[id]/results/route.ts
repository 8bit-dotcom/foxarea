import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const DEFAULT_PLACEMENT_POINTS: Record<number, number> = {
  1: 12, 2: 9, 3: 8, 4: 7, 5: 6,
  6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
  11: 0, 12: 0,
}

async function calcPoints(placement: number, kills: number, matchId: string) {
  // Fetch tournament's custom point system
  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  })
  let placementPointsMap = DEFAULT_PLACEMENT_POINTS
  let killPointValue = 1
  if (match?.tournament) {
    try {
      placementPointsMap = JSON.parse(match.tournament.placementPointsJson)
    } catch { /* use default */ }
    killPointValue = match.tournament.killPointValue
  }
  const placementPoints = placementPointsMap[placement] ?? 0
  const killPoints = kills * killPointValue
  return { placementPoints, killPoints, totalPoints: placementPoints + killPoints }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const results = await db.matchResult.findMany({
      where: { matchId: id },
      include: { team: true },
      orderBy: { placement: 'asc' },
    })
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { results } = body as { results: { teamId: string; placement: number; kills: number }[] }

    // Delete existing results
    await db.matchResult.deleteMany({ where: { matchId: id } })

    // Create new results
    const created: any[] = []
    for (const r of results) {
      const { placementPoints, killPoints, totalPoints } = await calcPoints(r.placement, r.kills, id)
      const result = await db.matchResult.create({
        data: {
          matchId: id,
          teamId: r.teamId,
          placement: r.placement,
          kills: r.kills,
          placementPoints,
          killPoints,
          totalPoints,
        },
        include: { team: true },
      })
      created.push(result)
    }

    // Update match status
    await db.match.update({
      where: { id },
      data: { status: 'completed' },
    })

    // Update tournament status if needed
    const match = await db.match.findUnique({ where: { id }, include: { tournament: { include: { matches: true } } } })
    if (match) {
      const allCompleted = match.tournament.matches.every(m => m.status === 'completed')
      if (allCompleted) {
        await db.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'completed' },
        })
      } else {
        await db.tournament.update({
          where: { id: match.tournamentId },
          data: { status: 'ongoing' },
        })
      }
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete all results for this match
    await db.matchResult.deleteMany({ where: { matchId: id } })

    // Reset match status to upcoming
    await db.match.update({
      where: { id },
      data: { status: 'upcoming' },
    })

    // Update tournament status back to ongoing if it was completed
    const match = await db.match.findUnique({
      where: { id },
      include: { tournament: { include: { matches: true } } },
    })
    if (match && match.tournament.status === 'completed') {
      await db.tournament.update({
        where: { id: match.tournamentId },
        data: { status: 'ongoing' },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to reset match' }, { status: 500 })
  }
}
