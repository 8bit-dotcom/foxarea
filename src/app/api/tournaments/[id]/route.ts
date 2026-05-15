import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        teams: { orderBy: { name: 'asc' } },
        matches: {
          orderBy: { matchNumber: 'asc' },
          include: {
            results: {
              include: { team: true },
              orderBy: { placement: 'asc' },
            },
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    return NextResponse.json(tournament)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, status, maxTeams, matchCount, placementPointsJson, killPointValue, allowRegistration } = body

    const tournament = await db.tournament.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(maxTeams && { maxTeams }),
        ...(matchCount && { matchCount }),
        ...(placementPointsJson && { placementPointsJson }),
        ...(killPointValue !== undefined && { killPointValue }),
        ...(allowRegistration !== undefined && { allowRegistration }),
      },
    })

    return NextResponse.json(tournament)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.matchResult.deleteMany({ where: { match: { tournamentId: id } } })
    await db.match.deleteMany({ where: { tournamentId: id } })
    await db.team.deleteMany({ where: { tournamentId: id } })
    await db.tournament.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
  }
}
