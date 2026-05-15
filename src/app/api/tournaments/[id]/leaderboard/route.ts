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
      include: {
        results: {
          include: { match: true },
        },
      },
    })

    const leaderboard = teams.map(team => {
      const totalPoints = team.results.reduce((sum, r) => sum + r.totalPoints, 0)
      const totalKills = team.results.reduce((sum, r) => sum + r.kills, 0)
      const totalPlacementPoints = team.results.reduce((sum, r) => sum + r.placementPoints, 0)
      const totalKillPoints = team.results.reduce((sum, r) => sum + r.killPoints, 0)
      const matchesPlayed = team.results.length
      const avgPlacement = matchesPlayed > 0
        ? team.results.reduce((sum, r) => sum + r.placement, 0) / matchesPlayed
        : 0
      const bestPlacement = team.results.length > 0
        ? Math.min(...team.results.map(r => r.placement))
        : 0
      const firstPlaceCount = team.results.filter(r => r.placement === 1).length

      // Per-match breakdown
      const matchBreakdown = team.results
        .sort((a, b) => a.match.matchNumber - b.match.matchNumber)
        .map(r => ({
          matchNumber: r.match.matchNumber,
          placement: r.placement,
          kills: r.kills,
          placementPoints: r.placementPoints,
          killPoints: r.killPoints,
          totalPoints: r.totalPoints,
        }))

      return {
        id: team.id,
        name: team.name,
        tag: team.tag,
        nickname: team.nickname,
        totalPoints,
        totalKills,
        totalPlacementPoints,
        totalKillPoints,
        matchesPlayed,
        avgPlacement: Math.round(avgPlacement * 100) / 100,
        bestPlacement,
        firstPlaceCount,
        matchBreakdown,
      }
    })

    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills
      return a.avgPlacement - b.avgPlacement
    })

    return NextResponse.json(leaderboard)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
