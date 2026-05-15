import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const tournaments = await db.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { teams: true, matches: true } },
      },
    })
    return NextResponse.json(tournaments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, maxTeams, matchCount, placementPointsJson, killPointValue, allowRegistration, mode } = body

    const tournamentMode = mode || 'battle_royale'

    const tournament = await db.tournament.create({
      data: {
        name,
        description: description || null,
        mode: tournamentMode,
        maxTeams: maxTeams || 12,
        matchCount: matchCount || 6,
        placementPointsJson: placementPointsJson || JSON.stringify({1:12,2:9,3:8,4:7,5:6,6:5,7:4,8:3,9:2,10:1,11:0,12:0}),
        killPointValue: killPointValue ?? 1,
        allowRegistration: allowRegistration ?? false,
      },
    })

    // Auto-create matches for battle royale mode
    if (tournamentMode === 'battle_royale') {
      for (let i = 1; i <= (matchCount || 6); i++) {
        await db.match.create({
          data: {
            tournamentId: tournament.id,
            matchNumber: i,
            status: 'upcoming',
          },
        })
      }
    }

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}
