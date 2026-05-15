import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teams = await db.team.findMany({
      where: { tournamentId: id },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(teams)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, tag } = body

    const tournament = await db.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const teamCount = await db.team.count({ where: { tournamentId: id } })
    if (teamCount >= tournament.maxTeams) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 })
    }

    const nickname = body.nickname || ''
    const team = await db.team.create({
      data: {
        name,
        tag: tag.toUpperCase(),
        nickname,
        tournamentId: id,
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Team tag already exists in this tournament' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const teamId = body.teamId

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    await db.matchResult.deleteMany({ where: { teamId } })
    await db.team.delete({ where: { id: teamId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
