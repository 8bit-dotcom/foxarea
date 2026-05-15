import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { canModifyTournament } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id, matchId } = await params
    const authResult = await canModifyTournament(request, id)
    if (authResult.error) return authResult.error

    const body = await request.json()
    const { scheduledAt, roundName } = body

    const match = await db.match.update({
      where: { id: matchId },
      data: {
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(roundName !== undefined && { roundName: roundName || null }),
      },
    })

    return NextResponse.json(match)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update match schedule' }, { status: 500 })
  }
}
