import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Get the match
    const match = await db.match.findUnique({
      where: { id },
      include: {
        results: true,
        tournament: true,
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.results.length === 0) {
      return NextResponse.json({ error: 'No results to undo' }, { status: 400 })
    }

    // Delete all results for this match
    await db.matchResult.deleteMany({ where: { matchId: id } })

    // Reset match status to upcoming
    await db.match.update({
      where: { id },
      data: { status: 'upcoming' },
    })

    // Update tournament status back to ongoing if it was completed
    if (match.tournament.status === 'completed') {
      await db.tournament.update({
        where: { id: match.tournamentId },
        data: { status: 'ongoing' },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'undo',
        entity: 'MatchResult',
        entityId: id,
        details: `Undid results for match ${match.matchNumber} in tournament ${match.tournament.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Results for match ${match.matchNumber} have been undone`,
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Match undo error:', err)
    return NextResponse.json({ error: 'Failed to undo match results' }, { status: 500 })
  }
}
