import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/achievements/check
// Body: { userId: string, tournamentId: string }
// Checks and auto-creates achievements based on stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tournamentId } = body

    if (!userId || !tournamentId) {
      return NextResponse.json(
        { error: 'userId and tournamentId are required' },
        { status: 400 }
      )
    }

    // Verify tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: { select: { teams: true } },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Get total tournament count
    const totalTournaments = await db.tournament.count()

    // Get existing achievements for this tournament to avoid duplicates
    const existingAchievements = await db.achievement.findMany({
      where: { tournamentId },
      select: { type: true },
    })
    const existingTypes = new Set(existingAchievements.map((a) => a.type))

    const newAchievements: Array<{
      id: string
      type: string
      label: string
      icon: string
      createdAt: Date
      tournament: { name: string }
    }> = []

    // Define achievement checks
    const checks: Array<{
      type: string
      label: string
      icon: string
      condition: boolean
    }> = [
      {
        type: 'first_tournament',
        label: 'First Tournament',
        icon: '🌟',
        condition: totalTournaments >= 1,
      },
      {
        type: 'hosted_5',
        label: 'Hosted 5 Tournaments',
        icon: '🏅',
        condition: totalTournaments >= 5,
      },
      {
        type: 'hosted_10',
        label: 'Hosted 10 Tournaments',
        icon: '👑',
        condition: totalTournaments >= 10,
      },
      {
        type: 'managed_12_teams',
        label: 'Managed 12+ Teams',
        icon: '🎯',
        condition: tournament._count.teams >= 12,
      },
      {
        type: 'completed_tournament',
        label: 'Completed a Tournament',
        icon: '✅',
        condition: tournament.status === 'completed',
      },
      {
        type: 'clash_squad_master',
        label: 'Clash Squad Master',
        icon: '⚔️',
        condition: tournament.mode === 'clash_squad',
      },
    ]

    // Create achievements that pass their condition and don't already exist
    for (const check of checks) {
      if (check.condition && !existingTypes.has(check.type)) {
        const achievement = await db.achievement.create({
          data: {
            tournamentId,
            userId,
            type: check.type,
            label: check.label,
            icon: check.icon,
          },
          include: {
            tournament: { select: { name: true } },
          },
        })

        newAchievements.push({
          id: achievement.id,
          type: achievement.type,
          label: achievement.label,
          icon: achievement.icon,
          createdAt: achievement.createdAt,
          tournament: { name: achievement.tournament.name },
        })
      }
    }

    return NextResponse.json({
      newlyCreated: newAchievements,
      totalChecked: checks.length,
      totalNew: newAchievements.length,
    })
  } catch (error) {
    console.error('Failed to check achievements:', error)
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 })
  }
}
