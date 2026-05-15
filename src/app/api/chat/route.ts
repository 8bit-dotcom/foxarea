import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 })
    }

    const messages = await db.chatMessage.findMany({
      where: { tournamentId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Return in chronological order
    return NextResponse.json(messages.reverse())
  } catch (err) {
    console.error('Chat GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const { tournamentId, message } = await request.json()
    if (!tournamentId || !message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'tournamentId and message are required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 characters)' }, { status: 400 })
    }

    // Verify tournament exists
    const tournament = await db.tournament.findUnique({ where: { id: tournamentId } })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const chatMessage = await db.chatMessage.create({
      data: {
        tournamentId,
        userId: user.id,
        message: message.trim(),
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json(chatMessage, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Chat POST error:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
