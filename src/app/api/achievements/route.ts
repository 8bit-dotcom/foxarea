import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/achievements?userId=xxx&tournamentId=xxx
// Returns achievements for a user or tournament
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const tournamentId = searchParams.get('tournamentId')

    if (!userId && !tournamentId) {
      return NextResponse.json(
        { error: 'userId or tournamentId is required' },
        { status: 400 }
      )
    }

    const where: Record<string, string> = {}
    if (userId) where.userId = userId
    if (tournamentId) where.tournamentId = tournamentId

    const achievements = await db.achievement.findMany({
      where,
      include: {
        tournament: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      achievements: achievements.map((a) => ({
        id: a.id,
        type: a.type,
        label: a.label,
        icon: a.icon,
        createdAt: a.createdAt,
        tournament: { name: a.tournament.name },
      })),
    })
  } catch (error) {
    console.error('Failed to fetch achievements:', error)
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
  }
}

// POST /api/achievements
// Body: { tournamentId: string, userId?: string, type: string, label: string, icon?: string }
// Creates an achievement. Unique per tournamentId+type.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tournamentId, userId, type, label, icon } = body

    if (!tournamentId || !type || !label) {
      return NextResponse.json(
        { error: 'tournamentId, type, and label are required' },
        { status: 400 }
      )
    }

    // Check if achievement already exists for this tournament+type
    const existing = await db.achievement.findUnique({
      where: {
        tournamentId_type: {
          tournamentId,
          type,
        },
      },
      include: {
        tournament: { select: { name: true } },
      },
    })

    if (existing) {
      return NextResponse.json({
        achievement: {
          id: existing.id,
          type: existing.type,
          label: existing.label,
          icon: existing.icon,
          createdAt: existing.createdAt,
          tournament: { name: existing.tournament.name },
        },
        alreadyExisted: true,
      })
    }

    // Verify tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { name: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const achievement = await db.achievement.create({
      data: {
        tournamentId,
        userId: userId || null,
        type,
        label,
        icon: icon || '🏆',
      },
      include: {
        tournament: { select: { name: true } },
      },
    })

    return NextResponse.json({
      achievement: {
        id: achievement.id,
        type: achievement.type,
        label: achievement.label,
        icon: achievement.icon,
        createdAt: achievement.createdAt,
        tournament: { name: achievement.tournament.name },
      },
      alreadyExisted: false,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create achievement:', error)
    return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 })
  }
}
