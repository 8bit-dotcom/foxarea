import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify tournament exists
  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) {
    return new Response(JSON.stringify({ error: 'Tournament not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Set up SSE response
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ tournamentId: id, timestamp: Date.now() })}\n\n`
      controller.enqueue(encoder.encode(connectEvent))

      // Polling interval for tournament updates
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval)
          return
        }

        try {
          // Fetch current leaderboard state
          const teams = await db.team.findMany({
            where: { tournamentId: id },
            include: {
              results: {
                include: { match: true },
              },
            },
          })

          const leaderboard = teams.map(team => {
            const totalPoints = team.results.reduce((sum, r) => sum + r.totalPoints, 0)
            const totalKills = team.results.reduce((sum, r) => sum + r.kills, 0)
            const matchesPlayed = team.results.length
            return {
              id: team.id,
              name: team.name,
              tag: team.tag,
              totalPoints,
              totalKills,
              matchesPlayed,
            }
          }).sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
            return b.totalKills - a.totalKills
          })

          const currentTournament = await db.tournament.findUnique({ where: { id } })

          const data = {
            tournamentId: id,
            status: currentTournament?.status || tournament.status,
            leaderboard,
            timestamp: Date.now(),
          }

          const event = `event: update\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(event))
        } catch {
          // Silently ignore errors during polling
        }
      }, 5000) // Poll every 5 seconds

      // Handle request abort
      request.signal.addEventListener('abort', () => {
        closed = true
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          // Stream may already be closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
