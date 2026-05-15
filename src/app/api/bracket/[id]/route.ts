import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Update bracket match result (set winner & score, or reset)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Reset bracket match action
    if (body.action === 'reset') {
      const match = await db.bracketMatch.findUnique({ where: { id } })
      if (!match) {
        return NextResponse.json({ error: 'Bracket match not found' }, { status: 404 })
      }

      // Clear this match's result
      await db.bracketMatch.update({
        where: { id },
        data: { winnerId: null, score1: 0, score2: 0, status: 'upcoming' },
      })

      // If this match feeds into a next match, remove the team from the next match slot
      if (match.nextMatchId) {
        const nextMatch = await db.bracketMatch.findUnique({ where: { id: match.nextMatchId } })
        if (nextMatch) {
          const updateData: any = {}
          if (match.nextMatchSlot === 1) {
            updateData.team1Id = null
          } else {
            updateData.team2Id = null
          }
          // Also reset next match if it was completed or ongoing
          if (nextMatch.status !== 'upcoming') {
            updateData.status = 'upcoming'
            updateData.winnerId = null
            updateData.score1 = 0
            updateData.score2 = 0
          }
          await db.bracketMatch.update({ where: { id: nextMatch.id }, data: updateData })

          // Also need to cascade reset any downstream matches
          // Reset the next match's nextMatch connections recursively
          if (nextMatch.nextMatchId && nextMatch.status !== 'upcoming') {
            const nextNextMatch = await db.bracketMatch.findUnique({ where: { id: nextMatch.nextMatchId } })
            if (nextNextMatch) {
              const cascadeData: any = {}
              if (nextMatch.nextMatchSlot === 1) cascadeData.team1Id = null
              else cascadeData.team2Id = null
              if (nextNextMatch.status !== 'upcoming') {
                cascadeData.status = 'upcoming'
                cascadeData.winnerId = null
                cascadeData.score1 = 0
                cascadeData.score2 = 0
              }
              await db.bracketMatch.update({ where: { id: nextNextMatch.id }, data: cascadeData })
            }
          }
        }
      }

      // Revert tournament status if needed
      const tournament = await db.tournament.findUnique({ where: { id: match.tournamentId } })
      if (tournament?.status === 'completed') {
        await db.tournament.update({ where: { id: match.tournamentId }, data: { status: 'ongoing' } })
      }

      return NextResponse.json({ success: true, message: 'Match reset' })
    }

    // Normal flow: set winner & score
    const { winnerId, score1, score2 } = body

    const match = await db.bracketMatch.findUnique({
      where: { id },
    })

    if (!match) {
      return NextResponse.json({ error: 'Bracket match not found' }, { status: 404 })
    }

    if (!match.team1Id || !match.team2Id) {
      return NextResponse.json({ error: 'Both teams must be assigned' }, { status: 400 })
    }

    if (winnerId !== match.team1Id && winnerId !== match.team2Id) {
      return NextResponse.json({ error: 'Winner must be one of the two teams' }, { status: 400 })
    }

    // Update the match
    const updated = await db.bracketMatch.update({
      where: { id },
      data: {
        winnerId,
        score1: score1 ?? 0,
        score2: score2 ?? 0,
        status: 'completed',
      },
    })

    // Advance winner to next match
    if (match.nextMatchId) {
      const nextMatch = await db.bracketMatch.findUnique({
        where: { id: match.nextMatchId },
      })
      if (nextMatch) {
        if (match.nextMatchSlot === 1) {
          await db.bracketMatch.update({
            where: { id: nextMatch.id },
            data: { team1Id: winnerId },
          })
        } else {
          await db.bracketMatch.update({
            where: { id: nextMatch.id },
            data: { team2Id: winnerId },
          })
        }

        // Check if next match now has both teams
        const refreshedNext = await db.bracketMatch.findUnique({
          where: { id: nextMatch.id },
        })
        if (refreshedNext?.team1Id && refreshedNext?.team2Id && refreshedNext?.status === 'upcoming') {
          await db.bracketMatch.update({
            where: { id: nextMatch.id },
            data: { status: 'ongoing' },
          })
        }
      }
    }

    // Check if tournament is complete (final match has a winner)
    const finalMatch = await db.bracketMatch.findFirst({
      where: { tournamentId: match.tournamentId, nextMatchId: null },
    })
    if (finalMatch?.winnerId) {
      await db.tournament.update({
        where: { id: match.tournamentId },
        data: { status: 'completed' },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Bracket match update error:', error)
    return NextResponse.json({ error: 'Failed to update bracket match' }, { status: 500 })
  }
}
