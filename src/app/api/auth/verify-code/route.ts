import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth-token'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    if (!email || !code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Get stored OTP
    const stored = await db.siteSettings.findUnique({ where: { key: `otp_${email}` } })
    if (!stored) {
      return NextResponse.json(
        { error: 'No code found. Please request a new one.' },
        { status: 400 }
      )
    }

    const otpData = JSON.parse(stored.value)

    // Check expiry
    if (Date.now() > otpData.expiry) {
      await db.siteSettings.delete({ where: { key: `otp_${email}` } })
      return NextResponse.json(
        { error: 'Code expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Check attempts
    if (otpData.attempts >= 5) {
      await db.siteSettings.delete({ where: { key: `otp_${email}` } })
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code.' },
        { status: 400 }
      )
    }

    // Verify code
    if (otpData.code !== code) {
      otpData.attempts++
      await db.siteSettings.update({
        where: { key: `otp_${email}` },
        data: { value: JSON.stringify(otpData) },
      })
      return NextResponse.json(
        { error: 'Invalid code', attemptsLeft: 5 - otpData.attempts },
        { status: 400 }
      )
    }

    // Code is valid - delete it
    await db.siteSettings.delete({ where: { key: `otp_${email}` } })

    // Get or create user
    let user = await db.user.findUnique({ where: { email } })
    if (!user) {
      const name = email.split('@')[0]
      user = await db.user.create({ data: { email, name, role: 'user' } })
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    })
  } catch (err) {
    console.error('Verify code error:', err)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
