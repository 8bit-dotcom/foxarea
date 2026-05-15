import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_ffscorer_salt').digest('hex')
}

// GET /api/settings — Returns all settings (for admin panel)
export async function GET(request: Request) {
  try {
    // Check admin auth
    const adminKey = request.headers.get('x-admin-key')
    const settings = await db.appSetting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }

    // If not admin, return limited settings
    if (!adminKey || adminKey !== map['admin_password_hash']) {
      return NextResponse.json({
        whatsappGroupLink: map['whatsapp_group_link'] || '',
        whatsappContact: map['whatsapp_contact'] || '',
        appName: map['app_name'] || '8Bit Tournament',
        appTagline: map['app_tagline'] || 'Free Fire Tournament Point Calculator',
      })
    }

    // Admin - return all settings
    return NextResponse.json({
      whatsappGroupLink: map['whatsapp_group_link'] || '',
      whatsappContact: map['whatsapp_contact'] || '',
      appName: map['app_name'] || '8Bit Tournament',
      appTagline: map['app_tagline'] || 'Free Fire Tournament Point Calculator',
      adminPassword: '', // never return password
      heroBadgeText: map['hero_badge_text'] || 'AI-POWERED TOURNAMENT TOOL',
      heroSubtitle: map['hero_subtitle'] || 'Kalkulator point turnamen Free Fire paling lengkap. Upload screenshot, AI baca otomatis — klasemen langsung update real-time.',
      heroSubDescription: map['hero_sub_description'] || 'Mendukung sistem point custom, 3 template klasemen, statistik interaktif, dan AI analysis.',
    })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 })
  }
}

// PUT /api/settings — Update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { whatsappGroupLink, whatsappContact, appName, appTagline, adminPassword, heroSubtitle, heroSubDescription, heroBadgeText, adminKey } = body

    // Verify admin
    const existing = await db.appSetting.findMany({ where: { key: 'admin_password_hash' } })
    const storedHash = existing[0]?.value
    if (!storedHash || !adminKey || adminKey !== storedHash) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates: { key: string; value: string }[] = []

    if (whatsappGroupLink !== undefined) {
      updates.push({ key: 'whatsapp_group_link', value: whatsappGroupLink })
    }
    if (whatsappContact !== undefined) {
      updates.push({ key: 'whatsapp_contact', value: whatsappContact })
    }
    if (appName !== undefined) {
      updates.push({ key: 'app_name', value: appName })
    }
    if (appTagline !== undefined) {
      updates.push({ key: 'app_tagline', value: appTagline })
    }
    if (heroSubtitle !== undefined) {
      updates.push({ key: 'hero_subtitle', value: heroSubtitle })
    }
    if (heroSubDescription !== undefined) {
      updates.push({ key: 'hero_sub_description', value: heroSubDescription })
    }
    if (heroBadgeText !== undefined) {
      updates.push({ key: 'hero_badge_text', value: heroBadgeText })
    }
    if (adminPassword && adminPassword.trim().length >= 4) {
      updates.push({ key: 'admin_password_hash', value: hashPassword(adminPassword) })
    }

    for (const u of updates) {
      await db.appSetting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      })
    }

    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan' })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
  }
}

// POST /api/settings — Initialize default settings
export async function POST() {
  try {
    const defaults = [
      { key: 'whatsapp_group_link', value: 'https://chat.whatsapp.com/HFFqKqG94fLJhMj0UJ5ngV' },
      { key: 'whatsapp_contact', value: '08987557108' },
      { key: 'app_name', value: '8Bit Tournament' },
      { key: 'app_tagline', value: 'Free Fire Tournament Point Calculator' },
      { key: 'hero_subtitle', value: 'Kalkulator point turnamen Free Fire paling lengkap. Upload screenshot, AI baca otomatis — klasemen langsung update real-time.' },
      { key: 'hero_sub_description', value: 'Mendukung sistem point custom, 3 template klasemen, statistik interaktif, dan AI analysis.' },
      { key: 'hero_badge_text', value: 'AI-POWERED TOURNAMENT TOOL' },
      { key: 'admin_password_hash', value: hashPassword('admin123') },
    ]

    for (const d of defaults) {
      await db.appSetting.upsert({
        where: { key: d.key },
        update: {},
        create: d,
      })
    }

    return NextResponse.json({ success: true, message: 'Pengaturan default diinisialisasi' })
  } catch (error) {
    console.error('Init settings error:', error)
    return NextResponse.json({ error: 'Gagal inisialisasi' }, { status: 500 })
  }
}
