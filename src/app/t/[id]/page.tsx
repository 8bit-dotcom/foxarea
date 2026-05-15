'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Trophy, Users, Swords, Copy, Check, Share2, Code2,
  RefreshCw, Loader2, AlertTriangle, ChevronDown, Crown,
  Zap, Eye, ChevronUp, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import LogoFoxArea from '@/components/LogoFoxArea'

// ======== TYPES ========
interface TournamentInfo {
  id: string
  name: string
  description: string | null
  status: string
  maxTeams: number
  matchCount: number
  killPointValue: number
  teamCount: number
  createdAt: string
}

interface LeaderboardEntry {
  id: string
  name: string
  tag: string
  nickname: string
  totalPoints: number
  totalKills: number
  totalPlacementPoints: number
  totalKillPoints: number
  matchesPlayed: number
  avgPlacement: number
  bestPlacement: number
  firstPlaceCount: number
  matchBreakdown: { matchNumber: number; placement: number; kills: number; placementPoints: number; killPoints: number; totalPoints: number }[]
}

interface MatchInfo {
  id: string
  matchNumber: number
  status: string
  results: { team: { name: string; tag: string }; placement: number; kills: number; placementPoints: number; killPoints: number; totalPoints: number }[]
}

interface VoteInfo {
  teamId: string
  teamName: string
  teamTag: string
  voteCount: number
}

// ======== RANK BADGE ========
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm rank-1 text-black shadow-lg shadow-yellow-500/20">
      {rank}
    </div>
  )
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm rank-2 text-black shadow-lg shadow-gray-400/20">
      {rank}
    </div>
  )
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm rank-3 text-white shadow-lg shadow-amber-700/20">
      {rank}
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-[#F3F4F6] text-[#6B7280]">
      {rank}
    </div>
  )
}

// ======== STATUS BADGE ========
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; dotClass: string }> = {
    upcoming: { label: 'Upcoming', className: 'bg-[#64748b]/10 text-[#4B5563] border-[#64748b]/20', dotClass: 'bg-[#64748b]' },
    ongoing: { label: 'LIVE', className: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30', dotClass: 'bg-[#2563EB] animate-pulse' },
    completed: { label: 'Completed', className: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20', dotClass: 'bg-[#22c55e]' },
  }
  const c = config[status] || config.upcoming
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border ${c.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dotClass}`} />
      {c.label}
    </span>
  )
}

// ======== GENERATE FINGERPRINT ========
function generateFingerprint(): string {
  const stored = typeof window !== 'undefined' ? localStorage.getItem('foxarea_fp') : null
  if (stored) return stored
  const fp = 'fp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)
  if (typeof window !== 'undefined') localStorage.setItem('foxarea_fp', fp)
  return fp
}

// ======== MAIN COMPONENT ========
export default function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)

  const [tournament, setTournament] = useState<TournamentInfo | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [matches, setMatches] = useState<MatchInfo[]>([])
  const [votes, setVotes] = useState<VoteInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  // Vote state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState<string | null>(null) // teamId if voted
  const [voteError, setVoteError] = useState<string | null>(null)

  // UI state
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [showMatchHistory, setShowMatchHistory] = useState<string | null>(null) // team id
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fingerprintRef = useRef<string>('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize fingerprint
  useEffect(() => {
    fingerprintRef.current = generateFingerprint()
  }, [])

  // Fetch data
  const fetchData = useCallback(async (showRefreshLoader = false) => {
    if (showRefreshLoader) setRefreshing(true)
    try {
      const [tRes, vRes] = await Promise.all([
        fetch(`/api/tournaments/${id}/public`),
        fetch(`/api/votes?tournamentId=${id}`),
      ])

      if (!tRes.ok) {
        if (tRes.status === 404) {
          setNotFound(true)
          setLoading(false)
          return
        }
        throw new Error('Failed to fetch tournament')
      }

      const tData = await tRes.json()
      setTournament(tData.tournament)
      setLeaderboard(tData.leaderboard || [])
      setMatches(tData.matches || [])

      if (vRes.ok) {
        const vData = await vRes.json()
        setVotes(vData)
      }

      // Check if already voted
      const existingVote = localStorage.getItem(`foxarea_vote_${id}`)
      if (existingVote) {
        setHasVoted(existingVote)
      }

      setLastRefreshed(new Date())
      setError(null)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load tournament data')
    }
    setLoading(false)
    setRefreshing(false)
  }, [id])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 10 seconds for ongoing tournaments
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (tournament?.status === 'ongoing') {
      intervalRef.current = setInterval(() => {
        fetchData()
      }, 10000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [tournament?.status, fetchData])

  // Handle vote
  const handleVote = async () => {
    if (!selectedTeamId || !fingerprintRef.current) return
    setVoting(true)
    setVoteError(null)
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: id,
          teamId: selectedTeamId,
          fingerprint: fingerprintRef.current,
        }),
      })
      const data = await res.json()

      if (res.status === 409) {
        // Already voted
        setHasVoted(data.votedTeamId || selectedTeamId)
        localStorage.setItem(`foxarea_vote_${id}`, data.votedTeamId || selectedTeamId)
        if (data.votes) setVotes(data.votes)
        setVoteError('You have already voted in this tournament')
      } else if (data.success) {
        setHasVoted(selectedTeamId)
        localStorage.setItem(`foxarea_vote_${id}`, selectedTeamId)
        if (data.votes) setVotes(data.votes)
      } else {
        setVoteError(data.error || 'Failed to vote')
      }
    } catch {
      setVoteError('Failed to submit vote. Please try again.')
    }
    setVoting(false)
  }

  // Copy link
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Copy embed code
  const copyEmbed = async () => {
    const embedCode = `<iframe src="${window.location.origin}/api/embed/${id}" width="100%" height="500" frameborder="0" style="border-radius:12px;border:1px solid #E5E7EB;"></iframe>`
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = embedCode
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    }
  }

  // Total votes
  const totalVotes = votes.reduce((sum, v) => sum + v.voteCount, 0)

  // Get vote count for a team
  const getVoteCount = (teamId: string) => votes.find(v => v.teamId === teamId)?.voteCount || 0

  // ======== LOADING STATE ========
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="logo-breathe">
            <LogoFoxArea size={48} />
          </div>
          <div className="w-32 h-[2px] bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#2563EB] rounded-full splash-progress-fill" style={{ animation: 'splashProgress 2s ease-in-out infinite alternate' }} />
          </div>
          <p className="text-xs text-[#6B7280]">Loading tournament...</p>
        </div>
      </div>
    )
  }

  // ======== NOT FOUND STATE ========
  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <LogoFoxArea size={56} className="mx-auto opacity-30" />
          </div>
          <h1 className="text-4xl font-black text-[#111827] mb-3">404</h1>
          <p className="text-[#6B7280] mb-2 text-lg">Tournament not found</p>
          <p className="text-[#9CA3AF] text-sm mb-8">
            The tournament you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-bold rounded-xl hover:bg-[#1D4ED8] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Go to FoxArea
          </a>
        </div>
      </div>
    )
  }

  // ======== ERROR STATE ========
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-[#ff6b6b] mx-auto mb-4" />
          <p className="text-[#111827] text-lg font-bold mb-2">Something went wrong</p>
          <p className="text-[#6B7280] text-sm mb-6">{error}</p>
          <Button onClick={() => fetchData(true)} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  // ======== MAIN PAGE ========
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#2563EB]/[0.03] rounded-full blur-3xl hero-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#2563EB]/[0.02] rounded-full blur-3xl hero-orb-2" />
        <div className="absolute inset-0 hero-grid-bg opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1">
        {/* Header */}
        <header className="border-b border-[#E5E7EB] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <LogoFoxArea size={28} className="transition-transform group-hover:scale-110" />
              <span className="font-black text-[#111827] text-lg brand-text">FoxArea</span>
            </a>
            <div className="flex items-center gap-2">
              {tournament?.status === 'ongoing' && (
                <span className="flex items-center gap-1.5 text-xs text-[#2563EB] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                  Auto-refresh ON
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Tournament Hero */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                    {tournament?.name}
                  </h1>
                  <StatusBadge status={tournament?.status || 'upcoming'} />
                </div>
                {tournament?.description && (
                  <p className="text-sm text-[#6B7280] max-w-xl">{tournament.description}</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-center">
                <Users className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
                <p className="text-xl font-black text-[#111827]">{tournament?.teamCount || 0}</p>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Teams</p>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-center">
                <Swords className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
                <p className="text-xl font-black text-[#111827]">{tournament?.matchCount || 0}</p>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Matches</p>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-center">
                <Trophy className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
                <p className="text-xl font-black text-[#111827]">{totalVotes}</p>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Votes</p>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 text-center">
                <Eye className="w-4 h-4 text-[#2563EB] mx-auto mb-1" />
                <p className="text-xl font-black text-[#111827]">
                  {matches.filter(m => m.status === 'completed').length}
                </p>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Played</p>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <Card className="bg-[#F9FAFB] border-[#E5E7EB] overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-lg font-black text-[#111827]">Leaderboard</h2>
              </div>
              {lastRefreshed && (
                <span className="text-[10px] text-[#9CA3AF]">
                  Updated {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full ffws-table">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="px-3 sm:px-4 py-3 text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-12">#</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Team</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">MP</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Kills</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-[10px] font-bold text-[#2563EB] uppercase tracking-wider">PTS</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-[10px] font-bold text-[#6B7280] uppercase tracking-wider w-10 hidden sm:table-cell"></th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[#6B7280] text-sm">
                        No results yet. Matches haven&apos;t been played.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, idx) => {
                      const rank = idx + 1
                      const isExpanded = showMatchHistory === entry.id
                      const voteCount = getVoteCount(entry.id)
                      const votePercent = totalVotes > 0 ? (voteCount / totalVotes * 100) : 0
                      return (
                        <React.Fragment key={entry.id}>
                          <tr
                            className="border-b border-[#E5E7EB]/60 hover:bg-[#F3F4F6]/30 transition-colors cursor-pointer group"
                            onClick={() => {
                              if (entry.matchBreakdown && entry.matchBreakdown.length > 0) {
                                setShowMatchHistory(isExpanded ? null : entry.id)
                              }
                            }}
                          >
                            <td className="px-3 sm:px-4 py-3 text-center">
                              <RankBadge rank={rank} />
                            </td>
                            <td className="px-3 sm:px-4 py-3">
                              <div className="flex items-center gap-2">
                                {rank === 1 && <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[#2563EB] font-extrabold text-xs">{entry.tag}</span>
                                    <span className="text-[#111827] font-bold text-sm">{entry.name}</span>
                                  </div>
                                  {entry.nickname && (
                                    <span className="text-[10px] text-[#9CA3AF]">{entry.nickname}</span>
                                  )}
                                  {/* Vote bar */}
                                  {totalVotes > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className="w-16 h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-[#2563EB]/60 rounded-full transition-all duration-500"
                                          style={{ width: `${votePercent}%` }}
                                        />
                                      </div>
                                      <span className="text-[9px] text-[#9CA3AF]">{voteCount}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-center text-sm text-[#4B5563] hidden sm:table-cell">{entry.matchesPlayed}</td>
                            <td className="px-3 sm:px-4 py-3 text-center text-sm text-[#4B5563]">{entry.totalKills}</td>
                            <td className="px-3 sm:px-4 py-3 text-center">
                              <span className="text-[#2563EB] font-black text-sm">{entry.totalPoints}</span>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-center hidden sm:table-cell">
                              {entry.matchBreakdown && entry.matchBreakdown.length > 0 && (
                                <button className="text-[#9CA3AF] hover:text-[#4B5563] transition-colors">
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              )}
                            </td>
                          </tr>
                          {/* Expanded match breakdown */}
                          {isExpanded && entry.matchBreakdown && entry.matchBreakdown.length > 0 && (
                            <tr>
                              <td colSpan={6} className="bg-white/50 px-4 sm:px-8 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {entry.matchBreakdown.map((m) => (
                                    <div key={m.matchNumber} className="bg-[#F9FAFB] rounded-lg p-2 border border-[#E5E7EB]">
                                      <p className="text-[10px] text-[#6B7280] font-semibold mb-1">Match {m.matchNumber}</p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-[#111827] font-bold">#{m.placement}</span>
                                        <span className="text-[10px] text-[#4B5563]">{m.kills} <span className="text-[#6B7280]">kills</span></span>
                                        <span className="text-xs text-[#2563EB] font-bold">{m.totalPoints}pts</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Vote / Prediction Section */}
          <Card className="bg-[#F9FAFB] border-[#E5E7EB] overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-[#E5E7EB] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-lg font-black text-[#111827]">Predict the Winner</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {hasVoted ? (
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#2563EB]/10 border-2 border-[#2563EB]/30 mx-auto flex items-center justify-center">
                    <Check className="w-7 h-7 text-[#2563EB]" />
                  </div>
                  <p className="text-[#111827] font-bold">You&apos;ve voted!</p>
                  <p className="text-sm text-[#6B7280]">
                    Your prediction: <span className="text-[#2563EB] font-bold">{leaderboard.find(t => t.id === hasVoted)?.name || 'Unknown Team'}</span>
                  </p>
                  {totalVotes > 0 && (
                    <div className="max-w-sm mx-auto space-y-2 mt-4">
                      <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Vote Distribution</p>
                      {votes
                        .filter(v => v.voteCount > 0)
                        .sort((a, b) => b.voteCount - a.voteCount)
                        .map(v => {
                          const pct = totalVotes > 0 ? (v.voteCount / totalVotes * 100) : 0
                          return (
                            <div key={v.teamId} className="flex items-center gap-2">
                              <span className="text-xs text-[#4B5563] w-20 truncate font-medium">{v.teamTag}</span>
                              <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${v.teamId === hasVoted ? 'bg-[#2563EB]' : 'bg-[#2563EB]/40'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-[#6B7280] w-10 text-right">{Math.round(pct)}%</span>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#4B5563]">
                    Pick the team you think will win this tournament. You can only vote once!
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {leaderboard.map(entry => (
                      <button
                        key={entry.id}
                        onClick={() => setSelectedTeamId(entry.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedTeamId === entry.id
                            ? 'border-[#2563EB] bg-[#2563EB]/10'
                            : 'border-[#E5E7EB] bg-white hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5'
                        }`}
                      >
                        <span className="text-[#2563EB] font-extrabold text-xs block">{entry.tag}</span>
                        <span className="text-[#111827] font-bold text-xs block truncate">{entry.name}</span>
                        {totalVotes > 0 && (
                          <span className="text-[9px] text-[#9CA3AF] mt-1 block">{getVoteCount(entry.id)} votes</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {voteError && (
                    <p className="text-xs text-[#ff6b6b]">{voteError}</p>
                  )}
                  <Button
                    onClick={handleVote}
                    disabled={!selectedTeamId || voting}
                    className="w-full sm:w-auto bg-[#2563EB] text-white font-bold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {voting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Submit Prediction
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Share & Embed Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Share */}
            <Card className="bg-[#F9FAFB] border-[#E5E7EB]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#111827]">Share This Tournament</h3>
                </div>
                <p className="text-xs text-[#6B7280]">Share the leaderboard link with others.</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#4B5563] font-mono truncate"
                  />
                  <Button
                    size="sm"
                    onClick={copyLink}
                    className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold px-3"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Embed */}
            <Card className="bg-[#F9FAFB] border-[#E5E7EB]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#111827]">Embed Widget</h3>
                </div>
                <p className="text-xs text-[#6B7280]">Embed this leaderboard on your website.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEmbed(!showEmbed)}
                  className="w-full border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] text-xs"
                >
                  {showEmbed ? 'Hide' : 'Show'} Embed Code
                </Button>
                {showEmbed && (
                  <div className="space-y-2">
                    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 relative">
                      <code className="text-[10px] text-[#4B5563] font-mono break-all leading-relaxed">
                        {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/embed/${id}" width="100%" height="500" frameborder="0" style="border-radius:12px;border:1px solid #E5E7EB;"></iframe>`}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      onClick={copyEmbed}
                      className="w-full bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] font-bold text-xs"
                    >
                      {copiedEmbed ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedEmbed ? 'Copied!' : 'Copy Embed Code'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#E5E7EB] bg-white/90 backdrop-blur-xl mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2 group">
            <LogoFoxArea size={20} className="opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors font-medium">
              Powered by <span className="text-[#2563EB] font-bold">FoxArea</span>
            </span>
          </a>
          <p className="text-[10px] text-[#9CA3AF]">
            Free Fire Tournament Point Calculator
          </p>
        </div>
      </footer>
    </div>
  )
}
