import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tournament = await db.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const teams = await db.team.findMany({
      where: { tournamentId: id },
      include: {
        results: {
          include: { match: true },
          orderBy: { match: { matchNumber: 'asc' } },
        },
      },
    })

    const leaderboard = teams.map(team => {
      const totalPoints = team.results.reduce((sum, r) => sum + r.totalPoints, 0)
      const totalKills = team.results.reduce((sum, r) => sum + r.kills, 0)
      const matchesPlayed = team.results.length

      return {
        name: team.name,
        tag: team.tag,
        nickname: team.nickname,
        totalPoints,
        totalKills,
        matchesPlayed,
        results: team.results.map(r => ({
          match: r.match.matchNumber,
          placement: r.placement,
          kills: r.kills,
          placementPoints: r.placementPoints,
          killPoints: r.killPoints,
          totalPoints: r.totalPoints,
        })),
      }
    }).sort((a, b) => b.totalPoints - a.totalPoints)

    // Generate CSV
    const matchCount = tournament.matchCount
    const headers = ['Rank', 'Squad', 'Tag', 'Nickname', 'Total Points', 'Total Kills']

    for (let i = 1; i <= matchCount; i++) {
      headers.push(`M${i} Place`, `M${i} Kills`, `M${i} Points`)
    }

    const rows = leaderboard.map((team, index) => {
      const row = [index + 1, team.name, team.tag, team.nickname, team.totalPoints, team.totalKills]
      for (let i = 1; i <= matchCount; i++) {
        const result = team.results.find(r => r.match === i)
        row.push(result?.placement ?? '-', result?.kills ?? '-', result?.totalPoints ?? '-')
      }
      return row
    })

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${tournament.name.replace(/\s+/g, '_')}_results.csv"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
