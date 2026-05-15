import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check tournament exists and allows registration
    const tournament = await db.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (!tournament.allowRegistration) {
      return NextResponse.json(
        { error: 'This tournament does not allow public registration' },
        { status: 403 }
      )
    }

    if (tournament.status !== 'upcoming' && tournament.status !== 'ongoing') {
      return NextResponse.json(
        { error: 'Registration is closed for this tournament' },
        { status: 400 }
      )
    }

    const { teamName, tag, nickname } = await request.json()

    // Validate inputs
    if (!teamName || typeof teamName !== 'string' || teamName.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }
    if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
      return NextResponse.json({ error: 'Team tag is required' }, { status: 400 })
    }
    if (tag.trim().length > 5) {
      return NextResponse.json({ error: 'Team tag must be 5 characters or less' }, { status: 400 })
    }

    // Check if tournament is full
    const teamCount = await db.team.count({ where: { tournamentId: id } })
    if (teamCount >= tournament.maxTeams) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 })
    }

    // Create team
    const team = await db.team.create({
      data: {
        name: teamName.trim(),
        tag: tag.trim().toUpperCase(),
        nickname: nickname?.trim() || '',
        tournamentId: id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        team: { id: team.id, name: team.name, tag: team.tag, nickname: team.nickname },
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Team tag already exists in this tournament' },
        { status: 400 }
      )
    }
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Failed to register team' }, { status: 500 })
  }
}
