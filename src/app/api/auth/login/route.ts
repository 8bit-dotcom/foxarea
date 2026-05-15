import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_ffscorer_salt').digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })

    if (!user || user.password !== hashPassword(password)) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Gagal login' }, { status: 500 })
  }
}
