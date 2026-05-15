import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// GET /api/votes?tournamentId=xxx — returns vote counts per team
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 })
    }

    // Check tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Use raw query to avoid cached Prisma Client issues with Vote model
    const voteRows = await db.$queryRaw<Array<{ teamId: string; cnt: bigint }>>(
      Prisma.sql`SELECT "teamId", COUNT(*) as cnt FROM "Vote" WHERE "tournamentId" = ${tournamentId} GROUP BY "teamId"`
    )

    // Count votes per team
    const voteCountMap = new Map<string, number>()
    for (const row of voteRows) {
      voteCountMap.set(row.teamId, Number(row.cnt))
    }

    // Get team details
    const teams = await db.team.findMany({
      where: { tournamentId },
      select: { id: true, name: true, tag: true },
    })

    const result = teams.map(team => ({
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag,
      voteCount: voteCountMap.get(team.id) || 0,
    }))

    // Sort by vote count descending
    result.sort((a, b) => b.voteCount - a.voteCount)

    return NextResponse.json(result)
  } catch (err) {
    console.error('Votes GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
  }
}

// POST /api/votes — body: { tournamentId, teamId, fingerprint }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tournamentId, teamId, fingerprint } = body

    if (!tournamentId || !teamId || !fingerprint) {
      return NextResponse.json(
        { error: 'tournamentId, teamId, and fingerprint are required' },
        { status: 400 }
      )
    }

    // Validate fingerprint length
    if (typeof fingerprint !== 'string' || fingerprint.length < 8 || fingerprint.length > 128) {
      return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 })
    }

    // Check tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, status: true },
    })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Check team exists in this tournament
    const team = await db.team.findFirst({
      where: { id: teamId, tournamentId },
      select: { id: true },
    })
    if (!team) {
      return NextResponse.json({ error: 'Team not found in this tournament' }, { status: 404 })
    }

    // Check if already voted using raw query
    const existing = await db.$queryRaw<Array<{ id: string; teamId: string }>>(
      Prisma.sql`SELECT id, "teamId" FROM "Vote" WHERE "tournamentId" = ${tournamentId} AND "voterFingerprint" = ${fingerprint} LIMIT 1`
    )

    if (existing.length > 0) {
      // Already voted
      const voteRows = await db.$queryRaw<Array<{ teamId: string; cnt: bigint }>>(
        Prisma.sql`SELECT "teamId", COUNT(*) as cnt FROM "Vote" WHERE "tournamentId" = ${tournamentId} GROUP BY "teamId"`
      )

      const voteCountMap = new Map<string, number>()
      for (const row of voteRows) {
        voteCountMap.set(row.teamId, Number(row.cnt))
      }

      const teams = await db.team.findMany({
        where: { tournamentId },
        select: { id: true, name: true, tag: true },
      })

      const result = teams.map(t => ({
        teamId: t.id,
        teamName: t.name,
        teamTag: t.tag,
        voteCount: voteCountMap.get(t.id) || 0,
      })).sort((a, b) => b.voteCount - a.voteCount)

      return NextResponse.json({
        success: false,
        error: 'You have already voted in this tournament',
        votes: result,
        votedTeamId: existing[0].teamId,
      }, { status: 409 })
    }

    // Create the vote using raw query
    const voteId = 'vote_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8)
    await db.$executeRaw(
      Prisma.sql`INSERT INTO "Vote" (id, "tournamentId", "teamId", "voterFingerprint", "createdAt") VALUES (${voteId}, ${tournamentId}, ${teamId}, ${fingerprint}, datetime('now'))`
    )

    // Return updated vote counts
    const voteRows = await db.$queryRaw<Array<{ teamId: string; cnt: bigint }>>(
      Prisma.sql`SELECT "teamId", COUNT(*) as cnt FROM "Vote" WHERE "tournamentId" = ${tournamentId} GROUP BY "teamId"`
    )

    const voteCountMap = new Map<string, number>()
    for (const row of voteRows) {
      voteCountMap.set(row.teamId, Number(row.cnt))
    }

    const teams = await db.team.findMany({
      where: { tournamentId },
      select: { id: true, name: true, tag: true },
    })

    const result = teams.map(t => ({
      teamId: t.id,
      teamName: t.name,
      teamTag: t.tag,
      voteCount: voteCountMap.get(t.id) || 0,
    })).sort((a, b) => b.voteCount - a.voteCount)

    return NextResponse.json({
      success: true,
      votes: result,
    })
  } catch (err) {
    console.error('Votes POST error:', err)
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 })
  }
}
