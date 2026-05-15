import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    // Return only public settings (keys that start with "public_")
    const settings = await db.siteSettings.findMany({
      where: {
        key: { startsWith: 'public_' },
      },
    })

    // Convert to key-value object
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Site settings GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Admin only
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { settings } = body as { settings: Record<string, string> }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    // Upsert each setting
    let updatedCount = 0
    for (const [key, value] of Object.entries(settings)) {
      await db.siteSettings.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
      updatedCount++
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'update',
        entity: 'SiteSettings',
        details: `Updated ${Object.keys(settings).length} setting(s): ${Object.keys(settings).join(', ')}`,
      },
    })

    return NextResponse.json({ success: true, updated: updatedCount })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Site settings PUT error:', err)
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 })
  }
}
