import crypto from 'crypto'

const SECRET = process.env.AUTH_SECRET || 'dev-secret-key-change-in-production'

export function generateToken(payload: { userId: string; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const iat = Math.floor(Date.now() / 1000)
  const body = Buffer.from(JSON.stringify({ ...payload, iat })).toString('base64url')
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

export function verifyToken(token: string): { userId: string; email: string; iat: number } | null {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return null
    const expected = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
    if (signature !== expected) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (!payload.userId || !payload.email) return null
    return payload
  } catch {
    return null
  }
}
