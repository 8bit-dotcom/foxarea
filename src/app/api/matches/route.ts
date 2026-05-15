import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request)
    if (authResult.error) return authResult.error

    const body = await request.json()
    const { matchId, scheduledAt, roundName } = body
    if (!matchId) return NextResponse.json({ error: 'matchId required' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    if (roundName !== undefined) updateData.roundName = roundName || null

    const match = await db.match.update({
      where: { id: matchId },
      data: updateData,
    })
    return NextResponse.json(match)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
  }
}
