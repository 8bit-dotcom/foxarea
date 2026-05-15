import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_ffscorer_salt').digest('hex')
}

// POST /api/admin/login — Admin login
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 })
    }

    let setting = await db.appSetting.findUnique({ where: { key: 'admin_password_hash' } })
    if (!setting) {
      // Initialize default password
      const defaultHash = hashPassword('admin123')
      await db.appSetting.upsert({
        where: { key: 'admin_password_hash' },
        update: {},
        create: { key: 'admin_password_hash', value: defaultHash },
      })
      setting = { key: 'admin_password_hash', value: defaultHash }
    }

    if (hashPassword(password) === setting.value) {
      return NextResponse.json({ success: true, key: setting.value })
    }

    return NextResponse.json({ error: 'Password salah' }, { status: 401 })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Gagal login' }, { status: 500 })
  }
}
