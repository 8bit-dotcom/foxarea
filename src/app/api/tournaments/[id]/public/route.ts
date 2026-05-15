import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch tournament with all related data for leaderboard
    const [tournament, teams] = await Promise.all([
      db.tournament.findUnique({
        where: { id },
        include: {
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
      }),
      db.team.findMany({
        where: { tournamentId: id },
        include: {
          results: {
            include: { match: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Build leaderboard
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

    // Return public-safe data (no sensitive info)
    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description,
        status: tournament.status,
        maxTeams: tournament.maxTeams,
        matchCount: tournament.matchCount,
        killPointValue: tournament.killPointValue,
        allowRegistration: tournament.allowRegistration,
        teamCount: teams.length,
        createdAt: tournament.createdAt,
      },
      leaderboard,
      matches: tournament.matches.map(m => ({
        id: m.id,
        matchNumber: m.matchNumber,
        status: m.status,
        results: m.results.map(r => ({
          team: { name: r.team.name, tag: r.team.tag },
          placement: r.placement,
          kills: r.kills,
          placementPoints: r.placementPoints,
          killPoints: r.killPoints,
          totalPoints: r.totalPoints,
        })),
      })),
    })
  } catch (err) {
    console.error('Public tournament GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 })
  }
}
