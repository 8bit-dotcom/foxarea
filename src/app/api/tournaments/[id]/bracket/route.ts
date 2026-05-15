import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bracketMatches = await db.bracketMatch.findMany({
      where: { tournamentId: id },
      include: {
        team1: { select: { id: true, name: true, tag: true } },
        team2: { select: { id: true, name: true, tag: true } },
        winner: { select: { id: true, name: true, tag: true } },
      },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    })
    return NextResponse.json(bracketMatches)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bracket' }, { status: 500 })
  }
}

// Generate single-elimination bracket from teams/players
// Uses a compact bracket approach that handles any team count
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: { teams: true, bracketMatches: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.mode !== 'clash_squad') {
      return NextResponse.json({ error: 'Not a Clash Squad tournament' }, { status: 400 })
    }

    if (tournament.teams.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
    }

    // Delete existing bracket if regenerating
    if (tournament.bracketMatches.length > 0) {
      await db.bracketMatch.deleteMany({ where: { tournamentId: id } })
    }

    const allTeams = tournament.teams
    const teamCount = allTeams.length

    // Shuffle teams for random seeding
    const shuffled = [...allTeams].sort(() => Math.random() - 0.5)

    // Special case: exactly 2 players → single final match
    if (teamCount === 2) {
      await db.bracketMatch.create({
        data: {
          tournamentId: id,
          round: 1,
          position: 1,
          team1Id: shuffled[0].id,
          team2Id: shuffled[1].id,
          status: 'ongoing',
        },
      })
      const result = await db.bracketMatch.findMany({
        where: { tournamentId: id },
        include: {
          team1: { select: { id: true, name: true, tag: true } },
          team2: { select: { id: true, name: true, tag: true } },
          winner: { select: { id: true, name: true, tag: true } },
        },
        orderBy: [{ round: 'asc' }, { position: 'asc' }],
      })
      return NextResponse.json(result, { status: 201 })
    }

    // Calculate bracket structure
    const totalRounds = Math.ceil(Math.log2(teamCount))
    const bracketSize = Math.pow(2, totalRounds)
    const byeCount = bracketSize - teamCount

    // Split teams: bye teams skip R1, playing teams play in R1
    const playingTeams = shuffled.slice(byeCount)  // Lower seeds play R1
    const byeTeams = shuffled.slice(0, byeCount)    // Top seeds get byes

    // Build a flat bracket structure
    // Each round has a specific number of matches:
    // R1: playingTeams.length / 2 (or 0 if all teams get byes)
    // R2: bracketSize / 4
    // R3: bracketSize / 8
    // ...
    // Final: 1

    // But we use a COMPACT structure:
    // - R1 only has matches for teams that actually play
    // - R2+ have standard bracket size matches
    // - Bye teams go directly into R2 slots

    const r1MatchCount = Math.ceil(playingTeams.length / 2)
    const r2MatchCount = bracketSize / 4

    // Create all matches
    const allMatches: { id: string; round: number; position: number }[] = []

    // R1: compact - only matches with playing teams
    if (r1MatchCount > 0) {
      for (let pos = 1; pos <= r1MatchCount; pos++) {
        const match = await db.bracketMatch.create({
          data: { tournamentId: id, round: 1, position: pos, status: 'upcoming' },
        })
        allMatches.push({ id: match.id, round: 1, position: pos })
      }
    }

    // R2 through Final: standard bracket sizes
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round)
      for (let pos = 1; pos <= matchesInRound; pos++) {
        const match = await db.bracketMatch.create({
          data: { tournamentId: id, round, position: pos, status: 'upcoming' },
        })
        allMatches.push({ id: match.id, round, position: pos })
      }
    }

    const round1Matches = allMatches.filter(m => m.round === 1)
    const round2Matches = allMatches.filter(m => m.round === 2)

    // Assign playing teams to R1 matches (pairwise)
    for (let i = 0; i < round1Matches.length; i++) {
      const t1 = playingTeams[i * 2] || null
      const t2 = playingTeams[i * 2 + 1] || null
      const updateData: any = {}

      if (t1) updateData.team1Id = t1.id
      if (t2) updateData.team2Id = t2.id

      if (t1 && t2) {
        updateData.status = 'ongoing'
      } else if (t1 && !t2) {
        // Single team (odd playing teams) → auto-advance
        updateData.status = 'completed'
        updateData.winnerId = t1.id
        updateData.score1 = 1
        updateData.score2 = 0
      }

      await db.bracketMatch.update({
        where: { id: round1Matches[i].id },
        data: updateData,
      })
    }

    // Link R1 matches to R2 matches
    // R1 matches feed into R2 alongside bye teams
    // Strategy: distribute R1 matches and bye teams across R2 matches
    // Each R2 match gets: 1 bye team (team1 slot) + link to 1 R1 match (team2 slot from R1 winner)
    // If more R1 matches than R2 matches, some R2 matches get 2 R1 links (no bye team)
    // If more bye teams than R2 matches, some R2 matches get 2 bye teams

    // Total sources for R2: r1MatchCount + byeTeams.length
    // Should equal r2MatchCount * 2 (each R2 match needs 2 sources)

    // Distribute sources: alternate bye teams and R1 match links
    const sources: ({ type: 'bye'; teamId: string } | { type: 'r1'; matchId: string; autoWinnerId?: string })[] = []

    // Interleave: bye teams first, then R1 matches
    // For proper distribution, place bye teams at even indices and R1 matches at odd indices
    const maxSources = r2MatchCount * 2
    let byeIdx = 0
    let r1Idx = 0

    for (let i = 0; i < maxSources; i++) {
      if (i % 2 === 0 && byeIdx < byeTeams.length) {
        sources.push({ type: 'bye', teamId: byeTeams[byeIdx++].id })
      } else if (r1Idx < round1Matches.length) {
        sources.push({ type: 'r1', matchId: round1Matches[r1Idx++].id })
      } else if (byeIdx < byeTeams.length) {
        sources.push({ type: 'bye', teamId: byeTeams[byeIdx++].id })
      } else if (r1Idx < round1Matches.length) {
        sources.push({ type: 'r1', matchId: round1Matches[r1Idx++].id })
      }
    }

    // Assign sources to R2 matches (2 sources per match)
    for (let i = 0; i < round2Matches.length; i++) {
      const source1 = sources[i * 2]
      const source2 = sources[i * 2 + 1]
      const updateData: any = {}

      // Source 1 → team1 slot
      if (source1) {
        if (source1.type === 'bye') {
          updateData.team1Id = source1.teamId
        } else {
          // Link R1 match to this R2 match's team1 slot
          await db.bracketMatch.update({
            where: { id: source1.matchId },
            data: { nextMatchId: round2Matches[i].id, nextMatchSlot: 1 },
          })
          // Check if R1 match was auto-completed → advance winner now
          const r1Match = await db.bracketMatch.findUnique({ where: { id: source1.matchId } })
          if (r1Match?.winnerId) {
            updateData.team1Id = r1Match.winnerId
          }
        }
      }

      // Source 2 → team2 slot
      if (source2) {
        if (source2.type === 'bye') {
          updateData.team2Id = source2.teamId
        } else {
          // Link R1 match to this R2 match's team2 slot
          await db.bracketMatch.update({
            where: { id: source2.matchId },
            data: { nextMatchId: round2Matches[i].id, nextMatchSlot: 2 },
          })
          // Check if R1 match was auto-completed → advance winner now
          const r1Match = await db.bracketMatch.findUnique({ where: { id: source2.matchId } })
          if (r1Match?.winnerId) {
            updateData.team2Id = r1Match.winnerId
          }
        }
      }

      await db.bracketMatch.update({
        where: { id: round2Matches[i].id },
        data: updateData,
      })
    }

    // Link rounds 2+ to subsequent rounds (standard bracket pairing)
    for (let round = 2; round < totalRounds; round++) {
      const currentMatches = allMatches.filter(m => m.round === round)
      const nextMatches = allMatches.filter(m => m.round === round + 1)

      for (let i = 0; i < currentMatches.length; i++) {
        const nextMatchIndex = Math.floor(i / 2)
        const nextSlot = (i % 2) + 1
        if (nextMatchIndex < nextMatches.length) {
          await db.bracketMatch.update({
            where: { id: currentMatches[i].id },
            data: {
              nextMatchId: nextMatches[nextMatchIndex].id,
              nextMatchSlot: nextSlot,
            },
          })
        }
      }
    }

    // Update match statuses — if both teams assigned, it's ready to play
    const allBracketMatches = await db.bracketMatch.findMany({
      where: { tournamentId: id },
    })
    for (const bm of allBracketMatches) {
      if (bm.status === 'upcoming' && bm.team1Id && bm.team2Id) {
        await db.bracketMatch.update({
          where: { id: bm.id },
          data: { status: 'ongoing' },
        })
      }
    }

    // Return the full bracket
    const result = await db.bracketMatch.findMany({
      where: { tournamentId: id },
      include: {
        team1: { select: { id: true, name: true, tag: true } },
        team2: { select: { id: true, name: true, tag: true } },
        winner: { select: { id: true, name: true, tag: true } },
      },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Bracket generation error:', error)
    return NextResponse.json({ error: 'Failed to generate bracket' }, { status: 500 })
  }
}
