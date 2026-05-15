import { verifyToken } from './auth-token'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export async function getUser(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  if (!payload) return null

  // Get user from DB
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) return null
    return { id: user.id, email: user.email, name: user.name, role: user.role }
  } finally {
    await prisma.$disconnect()
  }
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getUser(request)
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin(request: Request): Promise<{ error?: NextResponse } | { user: AuthUser }> {
  const { NextResponse } = await import('next/server')
  try {
    const user = await requireAuth(request)
    if (user.role !== 'admin') {
      return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
    }
    return { user }
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}

export async function canModifyTournament(request: Request): Promise<{ error?: NextResponse } | { user: AuthUser }> {
  const { NextResponse } = await import('next/server')
  try {
    const user = await requireAuth(request)
    if (user.role !== 'admin' && user.role !== 'moderator') {
      return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) }
    }
    return { user }
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}
