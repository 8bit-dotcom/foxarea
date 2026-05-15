import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_ffscorer_salt').digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, name } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password minimal 4 karakter' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username sudah dipakai' }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        username,
        password: hashPassword(password),
        name: name || username,
      },
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 })
  }
}
