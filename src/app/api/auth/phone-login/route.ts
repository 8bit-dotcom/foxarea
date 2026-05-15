import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth-token'

export async function POST(request: NextRequest) {
  try {
    const { phone, uid, name } = await request.json()
    if (!phone || !uid) {
      return NextResponse.json({ error: 'Phone and uid are required' }, { status: 400 })
    }

    // Find user by phone number (stored as email field since our schema uses email)
    // Or by Firebase UID stored in a custom field
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: phone },
          { email: `phone:${phone}` },
        ]
      }
    })

    if (!user) {
      // Create new user with phone number
      const userName = name || phone.replace(/\+/g, '')
      user = await db.user.create({
        data: {
          email: `phone:${phone}`,
          name: userName,
          role: 'user',
        }
      })
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email })

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    })
  } catch (err) {
    console.error('Phone login error:', err)
    return NextResponse.json({ error: 'Phone login failed' }, { status: 500 })
  }
}
