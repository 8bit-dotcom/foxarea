import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const templates = await db.tournamentTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(templates)
  } catch (err) {
    console.error('Templates GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const { name, description, config } = await request.json()
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }
    if (!config) {
      return NextResponse.json({ error: 'Template config is required' }, { status: 400 })
    }

    const configStr = typeof config === 'string' ? config : JSON.stringify(config)

    const template = await db.tournamentTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        config: configStr,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'create',
        entity: 'TournamentTemplate',
        entityId: template.id,
        details: `Created template: ${name}`,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Templates POST error:', err)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Template id is required' }, { status: 400 })
    }

    const template = await db.tournamentTemplate.findUnique({ where: { id } })
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await db.tournamentTemplate.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'delete',
        entity: 'TournamentTemplate',
        entityId: id,
        details: `Deleted template: ${template.name}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Templates DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
