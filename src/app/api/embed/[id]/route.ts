import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [tournament, teams] = await Promise.all([
      db.tournament.findUnique({
        where: { id },
        include: {
          matches: {
            orderBy: { matchNumber: 'asc' },
            include: {
              results: {
                include: { team: true },
                orderBy: { placement: 'asc' },
              },
            },
          },
        },
      }),
      db.team.findMany({
        where: { tournamentId: id },
        include: {
          results: { include: { match: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ])

    if (!tournament) {
      return new NextResponse('<html><body style="background:#06080f;color:#e8ecf4;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>Tournament not found</h2></body></html>', {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Build leaderboard
    const leaderboard = teams.map(team => {
      const totalPoints = team.results.reduce((sum, r) => sum + r.totalPoints, 0)
      const totalKills = team.results.reduce((sum, r) => sum + r.kills, 0)
      const matchesPlayed = team.results.length
      const firstPlaceCount = team.results.filter(r => r.placement === 1).length

      return {
        id: team.id,
        name: team.name,
        tag: team.tag,
        totalPoints,
        totalKills,
        matchesPlayed,
        firstPlaceCount,
      }
    })

    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      return b.totalKills - a.totalKills
    })

    const statusColors: Record<string, string> = {
      upcoming: '#5c6370',
      ongoing: '#2563EB',
      completed: '#22c55e',
    }
    const statusLabel: Record<string, string> = {
      upcoming: 'Upcoming',
      ongoing: 'LIVE',
      completed: 'Completed',
    }
    const statusColor = statusColors[tournament.status] || '#5c6370'
    const statusText = statusLabel[tournament.status] || tournament.status

    const rows = leaderboard.map((entry, idx) => {
      const rank = idx + 1
      let rankBg = '#1c2130'
      let rankColor = '#5c6370'
      if (rank === 1) { rankBg = 'linear-gradient(135deg,#FFD700,#FFA500)'; rankColor = '#000' }
      else if (rank === 2) { rankBg = 'linear-gradient(135deg,#C0C0C0,#A0A0A0)'; rankColor = '#000' }
      else if (rank === 3) { rankBg = 'linear-gradient(135deg,#CD7F32,#A0522D)'; rankColor = '#fff' }

      const rankStyle = rank <= 3
        ? `background:${rankBg};color:${rankColor};font-weight:900;`
        : `background:#1c2130;color:#5c6370;font-weight:700;`

      return `<tr style="border-bottom:1px solid #1c2130;${rank === 1 ? 'background:linear-gradient(90deg,rgba(37,99,235,0.08),transparent);' : ''}">
        <td style="padding:8px 12px;text-align:center;">
          <span style="display:inline-block;width:28px;height:28px;line-height:28px;border-radius:6px;font-size:12px;${rankStyle}">${rank}</span>
        </td>
        <td style="padding:8px 12px;color:#e8ecf4;font-weight:600;font-size:13px;">
          <span style="color:#2563EB;font-weight:800;margin-right:6px;font-size:11px;">${entry.tag}</span>
          ${entry.name}
        </td>
        <td style="padding:8px 12px;text-align:center;color:#8b929e;font-size:13px;">${entry.matchesPlayed}</td>
        <td style="padding:8px 12px;text-align:center;color:#8b929e;font-size:13px;">${entry.totalKills}</td>
        <td style="padding:8px 12px;text-align:center;color:#2563EB;font-weight:900;font-size:14px;">${entry.totalPoints}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tournament.name} — Leaderboard</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0e1a; color:#e8ecf4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:16px; }
  .header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .header h2 { font-size:16px; font-weight:800; color:#e8ecf4; }
  .badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px; }
  table { width:100%; border-collapse:separate; border-spacing:0; }
  thead th { padding:8px 12px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#5c6370; font-weight:600; text-align:left; border-bottom:1px solid #1c2130; }
  .footer { margin-top:12px; display:flex; align-items:center; gap:6px; font-size:10px; color:#464c58; }
  .footer a { color:#2563EB; text-decoration:none; }
</style>
</head>
<body>
  <div class="header">
    <h2>${tournament.name}</h2>
    <span class="badge" style="background:${statusColor}20;color:${statusColor};">${statusText}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:48px;text-align:center;">#</th>
        <th>Team</th>
        <th style="text-align:center;">MP</th>
        <th style="text-align:center;">Kills</th>
        <th style="text-align:center;">PTS</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <span>&#x1F98A;</span> Powered by <a href="https://foxarea.com">FoxArea</a>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors *",
      },
    })
  } catch (err) {
    console.error('Embed GET error:', err)
    return new NextResponse('<html><body style="background:#06080f;color:#e8ecf4;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h2>Error loading leaderboard</h2></body></html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
