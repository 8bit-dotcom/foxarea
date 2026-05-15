import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Rate limit: 5 requests per 15 minutes per email
    const rl = rateLimit(`otp_${email}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', waitSeconds: Math.ceil(rl.resetIn / 1000) },
        { status: 429 }
      )
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiry = Date.now() + 5 * 60 * 1000

    await db.siteSettings.upsert({
      where: { key: `otp_${email}` },
      create: { key: `otp_${email}`, value: JSON.stringify({ code, expiry, attempts: 0 }) },
      update: { value: JSON.stringify({ code, expiry, attempts: 0 }) },
    })

    // Always include devCode - SMTP not configured yet
    return NextResponse.json({ 
      success: true, 
      devCode: code
    })
  } catch (err) {
    console.error('Send code error:', err)
    return NextResponse.json({ error: 'Failed to send code', _err: String(err) }, { status: 500 })
  }
}
