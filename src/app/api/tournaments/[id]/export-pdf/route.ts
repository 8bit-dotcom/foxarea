import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const tournament = await db.tournament.findUnique({
    where: { id },
    include: { teams: true, matches: { include: { results: { include: { team: true } } } } },
  })

  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

  // Build leaderboard
  const teamStats: Record<string, { id: string; name: string; tag: string; nickname: string; totalPoints: number; totalKills: number; totalPP: number; totalKP: number; matchesPlayed: number }> = {}

  for (const team of tournament.teams) {
    teamStats[team.id] = { id: team.id, name: team.name, tag: team.tag, nickname: team.nickname, totalPoints: 0, totalKills: 0, totalPP: 0, totalKP: 0, matchesPlayed: 0 }
  }

  let pp: Record<number, number> = {}
  try { pp = JSON.parse(tournament.placementPointsJson) } catch { pp = {} }
  const kpt = tournament.killPointValue ?? 1

  for (const match of tournament.matches) {
    if (match.status !== 'completed') continue
    for (const r of match.results) {
      const s = teamStats[r.teamId]
      if (!s) continue
      s.totalPoints += r.totalPoints
      s.totalKills += r.kills
      s.totalPP += r.placementPoints
      s.totalKP += r.killPoints
      s.matchesPlayed++
    }
  }

  const leaderboard = Object.values(teamStats).sort((a, b) => b.totalPoints - a.totalPoints || b.totalKills - a.totalKills)

  const mode = tournament.mode || 'battle_royale'
  const isCS = mode === 'clash_squad'
  const label = isCS ? 'Clash Squad' : 'Battle Royale'

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${tournament.name} - FoxArea</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1e293b; padding: 40px; }
  .header { border-bottom: 3px solid #2563EB; padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; }
  .logo { width: 40px; height: 40px; background: #2563EB; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 18px; }
  .title { font-size: 24px; font-weight: bold; color: #0f172a; }
  .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; letter-spacing: 1px; }
  .meta { font-size: 11px; color: #64748b; margin-bottom: 20px; display: flex; gap: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-weight: bold; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { border: 1px solid #e2e8f0; padding: 8px 12px; }
  tr:nth-child(1) td { background: #FFF7ED; }
  tr:nth-child(2) td { background: #F8FAFC; }
  tr:nth-child(3) td { background: #FFFBEB; }
  .pts { font-weight: bold; color: #2563EB; }
  .rank { font-weight: bold; text-align: center; }
  .rank-1 { background: #FFD700 !important; color: #000; }
  .rank-2 { background: #C0C0C0 !important; color: #000; }
  .rank-3 { background: #CD7F32 !important; color: #fff; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <div class="logo">F</div>
  <div>
    <div class="title">${tournament.name.toUpperCase()}</div>
    <div class="subtitle">${label.toUpperCase()} TOURNAMENT &middot; FOXAREA</div>
  </div>
</div>
<div class="meta">
  <span>Tim/Pemain: ${tournament.teams.length}/${tournament.maxTeams}</span>
  <span>Match: ${tournament.matches.length}</span>
  <span>Tanggal: ${new Date(tournament.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  ${!isCS ? `<span>Poin: #1=${pp[1] || 0}, Kill=${kpt}pt</span>` : ''}
</div>
<table>
  <thead><tr>
    <th style="width:40px;text-align:center">#</th>
    <th>${isCS ? 'Pemain' : 'Squad'}</th>
    <th>Tag</th>
    ${!isCS ? '<th style="text-align:center">Match</th>' : ''}
    <th style="text-align:center">Kill</th>
    <th style="text-align:center">PP</th>
    <th style="text-align:center">KP</th>
    <th style="text-align:right">PTS</th>
  </tr></thead>
  <tbody>
    ${leaderboard.map((entry, i) => `<tr>
      <td class="rank ${i < 3 ? `rank-${i + 1}` : ''}">${i + 1}</td>
      <td>${entry.name}${entry.nickname ? ` <span style="color:#94a3b8">&middot; ${entry.nickname}</span>` : ''}</td>
      <td>${entry.tag}</td>
      ${!isCS ? `<td style="text-align:center">${entry.matchesPlayed}</td>` : ''}
      <td style="text-align:center">${entry.totalKills}</td>
      <td style="text-align:center">${entry.totalPP}</td>
      <td style="text-align:center">${entry.totalKP}</td>
      <td class="pts" style="text-align:right">${entry.totalPoints}</td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="footer">
  <span>FOXAREA TOURNAMENT &mdash; AI-Powered Free Fire Tournament System</span>
  <span>Generated: ${new Date().toLocaleString('id-ID')}</span>
</div>
</body></html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${tournament.name.replace(/\s+/g, '_')}_standings.html"`,
    },
  })
}
