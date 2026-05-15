import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [totalTournaments, totalTeams, totalMatches, totalUsers] =
      await Promise.all([
        prisma.tournament.count(),
        prisma.team.count(),
        prisma.match.count({ where: { status: 'completed' } }),
        prisma.user.count(),
      ])

    return NextResponse.json({
      totalTournaments,
      totalTeams,
      totalMatches,
      totalUsers,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
