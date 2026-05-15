import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/settings/public — Returns public settings (no auth needed)
export async function GET() {
  try {
    const settings = await db.appSetting.findMany({
      where: {
        key: { in: ['whatsapp_group_link', 'whatsapp_contact', 'app_name', 'app_tagline', 'hero_subtitle', 'hero_sub_description', 'hero_badge_text'] }
      }
    })

    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }

    return NextResponse.json({
      whatsappGroupLink: map['whatsapp_group_link'] || '',
      whatsappContact: map['whatsapp_contact'] || '',
      appName: map['app_name'] || '8Bit Tournament',
      appTagline: map['app_tagline'] || 'Free Fire Tournament Point Calculator',
      heroBadgeText: map['hero_badge_text'] || 'AI-POWERED TOURNAMENT TOOL',
      heroSubtitle: map['hero_subtitle'] || 'Kalkulator point turnamen Free Fire paling lengkap. Upload screenshot, AI baca otomatis — klasemen langsung update real-time.',
      heroSubDescription: map['hero_sub_description'] || 'Mendukung sistem point custom, 3 template klasemen, statistik interaktif, dan AI analysis.',
    })
  } catch (error) {
    console.error('Get public settings error:', error)
    return NextResponse.json({
      whatsappGroupLink: '',
      whatsappContact: '',
      appName: '8Bit Tournament',
      appTagline: 'Free Fire Tournament Point Calculator',
      heroBadgeText: 'AI-POWERED TOURNAMENT TOOL',
      heroSubtitle: '',
      heroSubDescription: '',
    })
  }
}
