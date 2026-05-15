'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import html2canvas from 'html2canvas'
import {
  Trophy, Users, Swords, Download, Plus, Trash2,
  Sparkles, Menu, X, Camera,
  RefreshCw, BarChart3, Zap, ImagePlus, Type, Save,
  XCircle, Loader2, Clipboard, AlertCircle, CheckCircle2,
  RotateCcw, Crown, Star, Target, HandMetal, Palette,
  Share2, Upload, Undo2, ChevronDown, Eye,
  Mail, KeyRound, ArrowLeft, LogOut, ShieldCheck, Megaphone, ExternalLink,
  Instagram, Youtube, Twitter, Github, MessageCircle, ArrowUp, Heart,
  Sun, Moon, Globe, History, Bell, FileText, Copy, ChevronUp, Phone,
  Clock, Wifi, WifiOff, MonitorPlay, Radio, Tv, Calendar, Timer, Award, TrendingUp, Activity
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, Legend, PieChart, Pie, LineChart, Line
} from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { QRCodeSVG } from 'qrcode.react'
import { t as translate, type Lang } from '@/lib/i18n'
import LogoFoxArea from '@/components/LogoFoxArea'

// ======== LOADING OVERLAY ========
function LoadingOverlay({ text, variant }: { text?: string; variant?: 'overlay' | 'skeleton' }) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg skeleton-pulse" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded skeleton-pulse" />
              <div className="h-2 w-16 rounded skeleton-pulse" />
            </div>
            <div className="h-3 w-10 rounded skeleton-pulse" />
            <div className="h-3 w-8 rounded skeleton-pulse" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="logo-breathe"><LogoFoxArea size={44} /></div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-[2px] bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-[#2563EB] rounded-full" style={{ animation: 'splashProgress 1.5s ease-in-out infinite alternate' }} />
          </div>
          {text && <p className="text-xs text-[#6B7280] mt-1">{text}</p>}
        </div>
      </div>
    </div>
  )
}

// ======== CONFETTI CELEBRATION ========
function ConfettiCelebration() {
  const pieces = Array.from({ length: 60 }, (_, i) => {
    const colors = ['#2563EB', '#FFD700', '#ff6b6b', '#00b4d8', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa']
    const color = colors[i % colors.length]
    const left = Math.random() * 100
    const delay = Math.random() * 2
    const duration = 2.5 + Math.random() * 2
    const size = 6 + Math.random() * 8
    const rotation = Math.random() * 360
    return (
      <div
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size * 0.6}px`,
          background: color,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          borderRadius: Math.random() > 0.5 ? '2px' : '0',
          transform: `rotate(${rotation}deg)`,
        }}
      />
    )
  })
  return <>{pieces}</>
}

// ======== TYPES ========
interface Tournament {
  id: string; name: string; description: string | null; status: string
  mode?: string; maxTeams: number; matchCount: number; createdAt: string
  placementPointsJson: string; killPointValue: number; allowRegistration?: boolean
  scheduledAt?: string; prizePool?: string; prizeDistribution?: string; streamUrl?: string
  _count?: { teams: number; matches: number }
}
interface Team { id: string; name: string; tag: string; nickname: string; tournamentId: string }
interface Match { id: string; tournamentId: string; matchNumber: number; status: string; results: MatchResult[] }
interface MatchResult {
  id: string; matchId: string; teamId: string; placement: number; kills: number
  placementPoints: number; killPoints: number; totalPoints: number; team?: Team
}
interface LeaderboardEntry {
  id: string; name: string; tag: string; nickname: string; totalPoints: number; totalKills: number
  totalPlacementPoints: number; totalKillPoints: number; matchesPlayed: number
  avgPlacement: number; bestPlacement: number; firstPlaceCount: number
  matchBreakdown: { matchNumber: number; placement: number; kills: number; placementPoints: number; killPoints: number; totalPoints: number }[]
}
interface AIDetectedResult { teamTag: string; teamName: string; placement: number; kills: number; confidence: string }
interface ChatMsg { id: string; userId: string; message: string; createdAt: string; userName?: string }
interface LoggedInUser { id: string; email: string; name: string; role: string }
interface BracketMatchData {
  id: string; tournamentId: string; round: number; position: number
  team1Id: string | null; team2Id: string | null; winnerId: string | null
  score1: number; score2: number; status: string
  nextMatchId: string | null; nextMatchSlot: number | null
  team1: { id: string; name: string; tag: string } | null
  team2: { id: string; name: string; tag: string } | null
  winner: { id: string; name: string; tag: string } | null
}

// ======== CONSTANTS ========
const DEFAULT_PP: Record<number, number> = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 }
const COLORS = ['#2563EB', '#00b4d8', '#ff6b6b', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#60a5fa', '#60a5fa', '#c084fc', '#2dd4bf', '#818cf8']

// ======== RANK BADGE ========
function RankBadge({ rank, small }: { rank: number; small?: boolean }) {
  const s = small ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'
  if (rank === 1) return <div className={`${s} rounded-lg rank-1 text-black flex items-center justify-center font-black`}>{rank}</div>
  if (rank === 2) return <div className={`${s} rounded-lg rank-2 text-black flex items-center justify-center font-black`}>{rank}</div>
  if (rank === 3) return <div className={`${s} rounded-lg rank-3 text-white flex items-center justify-center font-black`}>{rank}</div>
  return <div className={`${s} rounded-lg bg-[#F3F4F6] text-[#6B7280] flex items-center justify-center font-black`}>{rank}</div>
}

// ======== BRACKET/SEEDING VIEW ========
function BracketView({ teams, leaderboard, lang }: { teams: Team[]; leaderboard: LeaderboardEntry[]; lang: Lang }) {
  const tr = (key: string) => translate(key, lang)
  const sorted = [...teams].sort((a, b) => {
    const la = leaderboard.find(l => l.id === a.id), lb = leaderboard.find(l => l.id === b.id)
    return (lb?.totalPoints || 0) - (la?.totalPoints || 0)
  })
  const seeded = sorted.map((team, idx) => {
    const lb = leaderboard.find(l => l.id === team.id)
    return { ...team, rank: idx + 1, totalPoints: lb?.totalPoints || 0, totalKills: lb?.totalKills || 0, matchesPlayed: lb?.matchesPlayed || 0 }
  })
  const getTier = (rank: number, total: number) => {
    if (rank === 1) return 'champion'
    if (rank <= Math.ceil(total * 0.25)) return 'top'
    if (rank <= Math.ceil(total * 0.5)) return 'mid'
    if (rank <= Math.ceil(total * 0.75)) return 'lower'
    return 'bottom'
  }
  const tiers = [
    { tier: 'champion', label: tr('seeding.champion'), color: 'text-[#2563EB]', border: 'border-[#2563EB]/40', bg: 'bg-[#2563EB]/10', icon: '👑' },
    { tier: 'top', label: tr('seeding.topSeed'), color: 'text-[#22c55e]', border: 'border-[#22c55e]/30', bg: 'bg-[#22c55e]/5', icon: '🟢' },
    { tier: 'mid', label: tr('seeding.midSeed'), color: 'text-[#3b82f6]', border: 'border-[#3b82f6]/30', bg: 'bg-[#3b82f6]/5', icon: '🔵' },
    { tier: 'lower', label: tr('seeding.lowerSeed'), color: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30', bg: 'bg-[#f59e0b]/5', icon: '🟡' },
    { tier: 'bottom', label: tr('seeding.bottomSeed'), color: 'text-[#6B7280]', border: 'border-[#9CA3AF]/30', bg: 'bg-[#9CA3AF]/10', icon: '⚪' },
  ]
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-[#2563EB]/80 font-medium flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" />{tr('bracket.disclaimer')}
      </p>
      {tiers.map(({ tier, label, color, border, bg, icon }) => {
        const group = seeded.filter(t => getTier(t.rank, seeded.length) === tier)
        if (!group.length) return null
        return (
          <div key={tier} className={`rounded-xl border ${border} ${bg} p-3`}>
            <h4 className={`text-xs font-bold ${color} mb-2`}>{icon} {label}</h4>
            <div className="space-y-1">
              {group.map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white/50">
                  <span className="text-[#111827] font-medium">#{t.rank} {t.name}</span>
                  <span className={`${color} font-bold`}>{t.totalPoints} pts</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ======== MAIN COMPONENT ========
export default function Home() {
  const { toast } = useToast()

  // Page state
  const [pageState, setPageState] = useState<'splash' | 'beranda' | 'login' | 'workspace'>('splash')
  const [lang, setLang] = useState<Lang>('id')
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [mobileNav, setMobileNav] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [devCode, setDevCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [showProfileDialog, setShowProfileDialog] = useState(false)

  // Phone OTP Auth
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtpSending, setPhoneOtpSending] = useState(false)
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaReady, setRecaptchaReady] = useState(false)
  const recaptchaContainerRef = useRef<HTMLDivElement>(null)

  // Core state
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [active, setActive] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [tab, setTab] = useState('home')
  const [loading, setLoading] = useState(false)

  // Form states
  const [tName, setTName] = useState('')
  const [tDesc, setTDesc] = useState('')
  const [tMax, setTMax] = useState('12')
  const [tMatches, setTMatches] = useState('6')
  const [teamName, setTeamName] = useState('')
  const [teamTag, setTeamTag] = useState('')
  const [teamNickname, setTeamNickname] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)

  // Input states
  const [inputMethod, setInputMethod] = useState<'paste' | 'scan' | 'manual'>('paste')
  const [selectedMatchId, setSelectedMatchId] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [reviewStep, setReviewStep] = useState(false)
  const [mappedResults, setMappedResults] = useState<{ teamId: string; teamTag: string; teamName: string; teamNickname: string; placement: number; kills: number; matched: boolean }[]>([])
  const [manualEntries, setManualEntries] = useState<{ teamId: string; placement: number; kills: number }[]>([])

  // UI states
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [tableTemplate, setTableTemplate] = useState<'ffws' | 'compact' | 'detailed'>('ffws')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmType, setConfirmType] = useState<'tournament' | 'team' | null>(null)
  const [sharingImage, setSharingImage] = useState(false)
  const [detailMatch, setDetailMatch] = useState<string | null>(null)
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false)
  const [createTournamentDialogOpen, setCreateTournamentDialogOpen] = useState(false)
  const [showPointEditor, setShowPointEditor] = useState(false)
  const [customPP, setCustomPP] = useState<Record<number, number>>({ ...DEFAULT_PP })
  const [customKillPt, setCustomKillPt] = useState(1)
  const [actionLoading, setActionLoading] = useState('')
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')

  // Bracket state
  const [bracketMatches, setBracketMatches] = useState<BracketMatchData[]>([])
  const [selectedBracketMatch, setSelectedBracketMatch] = useState<string | null>(null)
  const [bracketScore1, setBracketScore1] = useState(0)
  const [bracketScore2, setBracketScore2] = useState(0)
  const [tournamentMode, setTournamentMode] = useState<'battle_royale' | 'clash_squad' | 'swiss' | 'round_robin' | 'double_elim'>('battle_royale')
  const [bracketTemplate, setBracketTemplate] = useState<'excel_white' | 'excel_dark' | 'fox_blue'>('excel_white')
  const [showBracketDownload, setShowBracketDownload] = useState(false)
  const [downloadingBracket, setDownloadingBracket] = useState(false)
  const bracketTemplateRef = useRef<HTMLDivElement>(null)
  const handleModeChange = (mode: 'battle_royale' | 'clash_squad' | 'swiss' | 'round_robin' | 'double_elim') => {
    setTournamentMode(mode)
    if (mode === 'clash_squad') { setTMax('8'); setTMatches('1') }
    else if (mode === 'swiss') { setTMax('16'); setTMatches(swissRounds) }
    else if (mode === 'round_robin') { setTMax('8'); setTMatches('1') }
    else if (mode === 'double_elim') { setTMax('8'); setTMatches('1') }
    else { setTMax('12'); setTMatches('6') }
  }

  // Homepage stats
  const [statsData, setStatsData] = useState({ totalTournaments: 0, totalTeams: 0, totalMatches: 0, totalUsers: 0 })
  const [statsVisible, setStatsVisible] = useState(false)
  const [showPwaBanner, setShowPwaBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showRegLinkDialog, setShowRegLinkDialog] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [showAnnouncement, setShowAnnouncement] = useState(false)

  // Quick Demo state
  const [demoEntries, setDemoEntries] = useState([
    { name: 'EVOS Legend', tag: 'EVS', placement: 1, kills: 8 },
    { name: 'RRQ Hoshi', tag: 'RRQ', placement: 2, kills: 6 },
    { name: 'Bigetron Alpha', tag: 'BTR', placement: 3, kills: 5 },
    { name: 'ONIC Esports', tag: 'ONIC', placement: 4, kills: 3 },
  ])

  // Celebration & effects state
  const [showCelebration, setShowCelebration] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [achievements, setAchievements] = useState<Array<{ id: string; type: string; label: string; icon: string; createdAt: string; tournament: { name: string } }>>([])
  const [showEmbedDialog, setShowEmbedDialog] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  // ======== HOMEPAGE NEW FEATURES STATE ========
  const [hallOfFame, setHallOfFame] = useState<Array<{ id: string; name: string; tag: string; totalPoints: number; tournamentCount: number }>>([])
  const [upcomingFilter, setUpcomingFilter] = useState<'all' | 'battle_royale' | 'clash_squad'>('all')
  const [activityFeed, setActivityFeed] = useState<Array<{ id: string; action: string; entity: string; details: string; createdAt: string; userName?: string }>>([])
  const [pollData, setPollData] = useState<Array<{ teamId: string; teamName: string; teamTag: string; voteCount: number }>>([])
  const [pollTournamentId, setPollTournamentId] = useState<string>('')
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [simTeam1, setSimTeam1] = useState('Team Alpha')
  const [simTeam2, setSimTeam2] = useState('Team Bravo')
  const [simPlacement1, setSimPlacement1] = useState(1)
  const [simPlacement2, setSimPlacement2] = useState(2)
  const [simKills1, setSimKills1] = useState(5)
  const [simKills2, setSimKills2] = useState(3)
  const [animatedStats, setAnimatedStats] = useState({ totalTournaments: 0, totalTeams: 0, totalMatches: 0, totalUsers: 0 })
  const [recentResults, setRecentResults] = useState<Array<{ tournament: Tournament; top3: LeaderboardEntry[] }>>([])
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  // Feature 1: Theme persistence
  useEffect(() => {
    const saved = localStorage.getItem('ffscorer_theme')
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved)
      if (saved === 'dark') document.body.classList.add('dark-theme')
      else document.body.classList.remove('dark-theme')
    }
  }, [])
  useEffect(() => {
    localStorage.setItem('ffscorer_theme', theme)
    if (theme === 'dark') document.body.classList.add('dark-theme')
    else document.body.classList.remove('dark-theme')
  }, [theme])

  // Feature 2: Team Profile Dialog
  const [teamProfileEntry, setTeamProfileEntry] = useState<LeaderboardEntry | null>(null)

  // Feature 3: Schedule & Countdown
  const [tScheduledAt, setTScheduledAt] = useState('')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  // Feature 4: Live Scoring
  const [liveMode, setLiveMode] = useState(false)
  const [prevLeaderboard, setPrevLeaderboard] = useState<LeaderboardEntry[]>([])

  // Feature 5: Prize Pool
  const [tPrizePool, setTPrizePool] = useState('')
  const [tPrizeDist, setTPrizeDist] = useState('')
  const [showPrizeSettings, setShowPrizeSettings] = useState(false)

  // Feature 7: Stream URL
  const [tStreamUrl, setTStreamUrl] = useState('')

  // Feature 8: Expanded modes
  const [swissRounds, setSwissRounds] = useState('3')

  // Feature 9: Share card
  const [showShareCard, setShowShareCard] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  // Feature 10: PWA Enhancement
  const [isOffline, setIsOffline] = useState(false)
  const [showNotifPerm, setShowNotifPerm] = useState(false)
  const [offlineData, setOfflineData] = useState<LeaderboardEntry[]>([])

  const fileRef = useRef<HTMLInputElement>(null)
  const klasemenRef = useRef<HTMLDivElement>(null)
  const activeIdRef = useRef<string>('')
  const berandaRef = useRef<HTMLDivElement>(null)
  const bracketCaptureRef = useRef<HTMLDivElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)

  // i18n helper
  const tr = useCallback((key: string) => translate(key, lang), [lang])

  // Keep ref in sync
  useEffect(() => { activeIdRef.current = active?.id || '' }, [active])

  // Feature 10: Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline) }
  }, [])

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ffscorer_user')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        if (user.id && user.email) { setLoggedInUser(user); setIsLoggedIn(true) }
      } catch {}
    }
    if (localStorage.getItem('ffscorer_visited')) setPageState('beranda')
  }, [])

  // Splash transition
  useEffect(() => {
    if (pageState !== 'splash') return
    const timer = setTimeout(() => {
      localStorage.setItem('ffscorer_visited', '1')
      setPageState('beranda')
    }, 6000)
    return () => clearTimeout(timer)
  }, [pageState])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // Scroll listener for back-to-top
  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed')
          if (e.target.classList.contains('stagger-reveal')) e.target.classList.add('revealed')
        }
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal, .stagger-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [pageState])

  // Fetch live tournaments for homepage + new feature data
  useEffect(() => {
    if (pageState !== 'beranda') return
    fetch('/api/tournaments').then(r => r.ok ? r.json() : []).then(async (d: Tournament[]) => {
      setLiveTournaments(d)
      // Fetch Hall of Fame: aggregate top teams across completed tournaments
      const completed = d.filter(t => t.status === 'completed')
      const teamMap = new Map<string, { id: string; name: string; tag: string; totalPoints: number; tournamentCount: number }>()
      for (const t of completed.slice(0, 10)) {
        try {
          const lr = await fetch(`/api/tournaments/${t.id}/leaderboard`)
          if (lr.ok) {
            const lb: LeaderboardEntry[] = await lr.json()
            for (const entry of lb) {
              const existing = teamMap.get(entry.id) || { id: entry.id, name: entry.name, tag: entry.tag, totalPoints: 0, tournamentCount: 0 }
              existing.totalPoints += entry.totalPoints
              existing.tournamentCount += 1
              teamMap.set(entry.id, existing)
            }
          }
        } catch {}
      }
      setHallOfFame(Array.from(teamMap.values()).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10))
      // Fetch recent results with top 3
      const recent: Array<{ tournament: Tournament; top3: LeaderboardEntry[] }> = []
      for (const t of completed.slice(0, 4)) {
        try {
          const lr = await fetch(`/api/tournaments/${t.id}/leaderboard`)
          if (lr.ok) { const lb: LeaderboardEntry[] = await lr.json(); recent.push({ tournament: t, top3: lb.slice(0, 3) }) }
        } catch {}
      }
      setRecentResults(recent)
      // Set up poll for first ongoing tournament with teams
      const ongoing = d.filter(t => t.status === 'ongoing')
      if (ongoing.length > 0) {
        const pollT = ongoing[0]
        setPollTournamentId(pollT.id)
        fetch(`/api/votes?tournamentId=${pollT.id}`).then(r => r.ok ? r.json() : []).then(v => setPollData(v)).catch(() => {})
      }
    }).catch(() => {})
    fetch('/api/stats').then(r => r.ok ? r.json() : {}).then(d => setStatsData(prev => ({ ...prev, ...d }))).catch(() => {})
    // Load user votes from localStorage
    try { const uv = localStorage.getItem('ffscorer_votes'); if (uv) setUserVotes(JSON.parse(uv)) } catch {}
  }, [pageState])

  // Fetch activity feed for Community Activity Wall
  useEffect(() => {
    if (pageState !== 'beranda') return
    const fetchActivity = () => {
      fetch('/api/tournaments').then(r => r.ok ? r.json() : []).then((tournaments: Tournament[]) => {
        const feed: Array<{ id: string; action: string; entity: string; details: string; createdAt: string; userName?: string }> = []
        for (const t of tournaments.slice(0, 10)) {
          feed.push({ id: t.id + '_created', action: 'tournament_created', entity: 'tournament', details: t.name, createdAt: t.createdAt, userName: undefined })
          if (t.status === 'ongoing') feed.push({ id: t.id + '_live', action: 'tournament_live', entity: 'tournament', details: t.name, createdAt: t.createdAt, userName: undefined })
          if (t._count?.teams) feed.push({ id: t.id + '_teams', action: 'teams_joined', entity: 'team', details: `${t._count.teams} tim di ${t.name}`, createdAt: t.createdAt, userName: undefined })
        }
        feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setActivityFeed(feed.slice(0, 10))
      }).catch(() => {})
    }
    fetchActivity()
    const iv = setInterval(fetchActivity, 30000)
    return () => clearInterval(iv)
  }, [pageState])

  // Animated stats counter
  useEffect(() => {
    if (!statsVisible) return
    const targets = {
      totalTournaments: statsData.totalTournaments || 177,
      totalTeams: statsData.totalTeams || 453,
      totalMatches: statsData.totalMatches || 350,
      totalUsers: statsData.totalUsers || 1277,
    }
    const duration = 1500
    const steps = 40
    const stepTime = duration / steps
    let step = 0
    const iv = setInterval(() => {
      step++
      const progress = step / steps
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedStats({
        totalTournaments: Math.round(targets.totalTournaments * eased),
        totalTeams: Math.round(targets.totalTeams * eased),
        totalMatches: Math.round(targets.totalMatches * eased),
        totalUsers: Math.round(targets.totalUsers * eased),
      })
      if (step >= steps) clearInterval(iv)
    }, stepTime)
    return () => clearInterval(iv)
  }, [statsVisible, statsData])

  // Auto-rotate testimonials on mobile
  useEffect(() => {
    if (pageState !== 'beranda') return
    const iv = setInterval(() => setTestimonialIdx(i => (i + 1) % 3), 5000)
    return () => clearInterval(iv)
  }, [pageState])

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setShowPwaBanner(true) }
    window.addEventListener('beforeinstallprompt', handler)
    const dismissed = localStorage.getItem('ffscorer_pwa_dismissed')
    if (!dismissed && 'serviceWorker' in navigator) {
      const timer = setTimeout(() => setShowPwaBanner(true), 8000)
      return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler) }
    }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Stats intersection observer
  useEffect(() => {
    if (pageState !== 'beranda') return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setStatsVisible(true) })
    }, { threshold: 0.3 })
    const el = document.getElementById('stats-section')
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [pageState])

  // Mouse position tracking for particles
  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  // Particle canvas animation (Feature 1)
  useEffect(() => {
    if (pageState !== 'beranda') return
    const canvas = particleCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 1.5 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.25,
    }))

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        // React to mouse
        const dx = mousePos.x - p.x
        const dy = mousePos.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.3
          p.vx -= (dx / dist) * force
          p.vy -= (dy / dist) * force
        }
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.vy *= 0.99
        // Wrap
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(37, 99, 235, ${p.opacity})`
        ctx.fill()
      }
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [pageState, mousePos])

  // Fetch achievements when workspace is active (Feature 8)
  useEffect(() => {
    if (pageState !== 'workspace' || !active) return
    fetch(`/api/achievements?tournamentId=${active.id}`).then(r => r.ok ? r.json() : { achievements: [] }).then(d => setAchievements(d.achievements || [])).catch(() => {})
  }, [pageState, active])

  // Celebration timer (Feature 2)
  useEffect(() => {
    if (!showCelebration) return
    const timer = setTimeout(() => setShowCelebration(false), 5000)
    return () => clearTimeout(timer)
  }, [showCelebration])

  // Feature 3: Countdown timer
  useEffect(() => {
    if (!active?.scheduledAt || active.status !== 'upcoming') { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
    const update = () => {
      const diff = new Date(active.scheduledAt!).getTime() - Date.now()
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [active])

  // Feature 4: Live scoring polling
  useEffect(() => {
    if (!liveMode || !active || active.status !== 'ongoing') return
    const iv = setInterval(async () => {
      try {
        const lr = await fetch(`/api/tournaments/${active.id}/leaderboard`)
        if (lr.ok) {
          const newLb = await lr.json()
          setPrevLeaderboard(leaderboard)
          setLeaderboard(newLb)
          // Feature 10: Cache for offline
          localStorage.setItem(`ffscorer_lb_${active.id}`, JSON.stringify(newLb))
        }
      } catch {}
    }, 10000)
    return () => clearInterval(iv)
  }, [liveMode, active, leaderboard])

  // Feature 10: Load offline cached data
  useEffect(() => {
    if (isOffline && active) {
      const cached = localStorage.getItem(`ffscorer_lb_${active.id}`)
      if (cached) {
        try { setOfflineData(JSON.parse(cached)) } catch {}
      }
    }
  }, [isOffline, active])

  // Auth header helper
  const authHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ffscorer_token') : null
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
  }, [])

  // ======== AUTH ACTIONS ========
  const handleSendCode = async () => {
    if (!loginEmail.trim()) return toast({ title: 'Error', description: tr('toast.emailRequired') })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) return toast({ title: 'Error', description: tr('toast.emailInvalid') })
    setSendingCode(true)
    try {
      const r = await fetch('/api/auth/send-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail }) })
      const data = await r.json()
      if (r.ok) {
        setCodeSent(true); setCooldown(60)
        if (data.devCode) { setDevCode(data.devCode); toast({ title: lang === 'id' ? 'Kode Verifikasi' : 'Verification Code', description: `${data.devCode}` }) }
        else toast({ title: tr('toast.codeSent'), description: tr('toast.checkInbox') })
      } else {
        if (data.waitSeconds) { setCooldown(data.waitSeconds); toast({ title: tr('toast.waitMoment'), description: data.error, variant: 'destructive' }) }
        else toast({ title: 'Error', description: data.error || tr('toast.codeSendFailed'), variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', description: tr('toast.codeSendFailed'), variant: 'destructive' }) }
    setSendingCode(false)
  }

  const handleVerifyCode = async () => {
    if (!loginCode.trim() || loginCode.trim().length !== 6) return toast({ title: 'Error', description: tr('toast.code6Digit') })
    setVerifyingCode(true)
    try {
      const r = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, code: loginCode }) })
      const data = await r.json()
      if (r.ok && data.success) {
        const user = { id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role }
        localStorage.setItem('ffscorer_user', JSON.stringify(user))
        if (data.token) localStorage.setItem('ffscorer_token', data.token)
        setIsLoggedIn(true); setLoggedInUser(user)
        setLoginEmail(''); setLoginCode(''); setCodeSent(false); setDevCode('')
        toast({ title: tr('toast.loginSuccess'), description: `${tr('toast.welcome')}, ${user.name}` })
        setPageState('workspace')
      } else { toast({ title: 'Error', description: data.error || tr('toast.invalidCode'), variant: 'destructive' }) }
    } catch { toast({ title: 'Error', description: tr('toast.codeSendFailed'), variant: 'destructive' }) }
    setVerifyingCode(false)
  }

  // ======== PHONE OTP ACTIONS ========
  const setupRecaptcha = useCallback(() => {
    if (recaptchaReady) return
    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, {
        size: 'invisible',
        callback: () => { setRecaptchaReady(true) },
        'error-callback': () => { setRecaptchaReady(false) }
      })
      verifier.render().then(() => setRecaptchaReady(true)).catch(() => {})
      // Store verifier on window for access
      ;(window as any).__recaptchaVerifier = verifier
    } catch { /* silently handle */ }
  }, [recaptchaReady])

  const handleSendPhoneOTP = async () => {
    if (!phoneNumber.trim()) return toast({ title: 'Error', description: lang === 'id' ? 'Masukkan nomor HP' : 'Enter phone number' })
    const phoneRegex = /^\+[1-9]\d{7,14}$/
    if (!phoneRegex.test(phoneNumber.trim())) return toast({ title: 'Error', description: lang === 'id' ? 'Format: +628xxxxxxxxxx' : 'Format: +628xxxxxxxxxx' })
    setPhoneOtpSending(true)
    try {
      // Setup recaptcha if needed
      if (!(window as any).__recaptchaVerifier) {
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current!, {
          size: 'invisible',
          callback: () => {},
          'error-callback': () => {}
        })
        await verifier.render()
        ;(window as any).__recaptchaVerifier = verifier
      }
      const result = await signInWithPhoneNumber(auth, phoneNumber.trim(), (window as any).__recaptchaVerifier)
      setConfirmationResult(result)
      setPhoneOtpSent(true)
      toast({ title: lang === 'id' ? 'OTP Terkirim!' : 'OTP Sent!', description: lang === 'id' ? 'Cek SMS kamu' : 'Check your SMS' })
    } catch (err: any) {
      console.error('Phone OTP error:', err)
      // Reset recaptcha on error
      if ((window as any).__recaptchaVerifier) {
        ;(window as any).__recaptchaVerifier.clear()
        ;(window as any).__recaptchaVerifier = null
        setRecaptchaReady(false)
      }
      const msg = err?.code === 'auth/invalid-phone-number'
        ? (lang === 'id' ? 'Nomor HP tidak valid' : 'Invalid phone number')
        : err?.code === 'auth/too-many-requests'
        ? (lang === 'id' ? 'Terlalu banyak request, coba lagi nanti' : 'Too many requests, try again later')
        : err?.code === 'auth/quota-exceeded'
        ? (lang === 'id' ? 'Kuota SMS habis, coba lagi nanti' : 'SMS quota exceeded, try again later')
        : (lang === 'id' ? 'Gagal mengirim OTP' : 'Failed to send OTP')
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
    setPhoneOtpSending(false)
  }

  const handleVerifyPhoneOTP = async () => {
    if (!phoneOtp.trim() || phoneOtp.trim().length < 6) return toast({ title: 'Error', description: lang === 'id' ? 'Masukkan 6 digit kode OTP' : 'Enter 6-digit OTP code' })
    if (!confirmationResult) return toast({ title: 'Error', description: lang === 'id' ? 'Kirim OTP dulu' : 'Send OTP first' })
    setPhoneOtpVerifying(true)
    try {
      const credential = await confirmationResult.confirm(phoneOtp.trim())
      // Successfully verified phone — create/login user via our API
      const firebaseUser = credential.user
      const phone = firebaseUser.phoneNumber || phoneNumber
      const uid = firebaseUser.uid

      // Register/login via our backend
      const r = await fetch('/api/auth/phone-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, uid, name: phone.replace(/\+/g, '') })
      })
      const data = await r.json()

      if (r.ok && data.success) {
        const user = { id: data.user.id, email: data.user.email || phone, name: data.user.name, role: data.user.role }
        localStorage.setItem('ffscorer_user', JSON.stringify(user))
        if (data.token) localStorage.setItem('ffscorer_token', data.token)
        setIsLoggedIn(true); setLoggedInUser(user)
        setPhoneNumber(''); setPhoneOtp(''); setPhoneOtpSent(false); setConfirmationResult(null)
        toast({ title: tr('toast.loginSuccess'), description: `${tr('toast.welcome')}, ${user.name}` })
        setPageState('workspace')
      } else {
        // If backend API doesn't exist yet, auto-create user locally
        const localUser = { id: uid, email: phone, name: phone, role: 'user' }
        localStorage.setItem('ffscorer_user', JSON.stringify(localUser))
        setIsLoggedIn(true); setLoggedInUser(localUser)
        setPhoneNumber(''); setPhoneOtp(''); setPhoneOtpSent(false); setConfirmationResult(null)
        toast({ title: tr('toast.loginSuccess'), description: `${tr('toast.welcome')}!` })
        setPageState('workspace')
      }
    } catch (err: any) {
      console.error('OTP verify error:', err)
      const msg = err?.code === 'auth/invalid-verification-code'
        ? (lang === 'id' ? 'Kode OTP salah' : 'Invalid OTP code')
        : err?.code === 'auth/code-expired'
        ? (lang === 'id' ? 'Kode OTP expired, kirim ulang' : 'OTP expired, resend')
        : (lang === 'id' ? 'Verifikasi gagal' : 'Verification failed')
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    }
    setPhoneOtpVerifying(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('ffscorer_user'); localStorage.removeItem('ffscorer_token')
    setIsLoggedIn(false); setLoggedInUser(null); setActive(null); setTeams([]); setMatches([]); setLeaderboard([])
    setPageState('beranda')
  }

  const handleEnterApp = () => {
    if (isLoggedIn) setPageState('workspace')
    else setPageState('login')
  }

  // ======== HOMEPAGE FEATURE HANDLERS ========
  const handlePollVote = async (teamId: string) => {
    if (!pollTournamentId || userVotes[pollTournamentId]) return
    const fingerprint = `fp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
    try {
      const r = await fetch('/api/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: pollTournamentId, teamId, fingerprint }) })
      const data = await r.json()
      if (r.ok && data.success) {
        setPollData(data.votes)
        const newVotes = { ...userVotes, [pollTournamentId]: teamId }
        setUserVotes(newVotes)
        localStorage.setItem('ffscorer_votes', JSON.stringify(newVotes))
      } else if (r.status === 409 && data.votes) {
        setPollData(data.votes)
        const newVotes = { ...userVotes, [pollTournamentId]: data.votedTeamId || teamId }
        setUserVotes(newVotes)
        localStorage.setItem('ffscorer_votes', JSON.stringify(newVotes))
      }
    } catch {}
  }

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return lang === 'id' ? 'Baru saja' : 'Just now'
    if (mins < 60) return `${mins}m ${lang === 'id' ? 'lalu' : 'ago'}`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ${lang === 'id' ? 'lalu' : 'ago'}`
    const days = Math.floor(hrs / 24)
    return `${days}d ${lang === 'id' ? 'lalu' : 'ago'}`
  }

  const getCountdown = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now()
    if (diff <= 0) return null
    return { days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) }
  }

  // ======== FETCH ========
  const fetchTournaments = useCallback(async () => {
    try { const r = await fetch('/api/tournaments'); if (r.ok) setTournaments(await r.json()) } catch {}
  }, [])

  const loadTournament = useCallback(async (id: string) => {
    setLoading(true); setActionLoading('Memuat turnamen...')
    try {
      const r = await fetch(`/api/tournaments/${id}`)
      if (r.ok) { const d = await r.json(); setActive(d); setTeams(d.teams || []); setMatches(d.matches || []); setBracketMatches([]); setTab(d.mode === 'clash_squad' ? 'bracket' : 'input') }
      const lr = await fetch(`/api/tournaments/${id}/leaderboard`)
      if (lr.ok) setLeaderboard(await lr.json())
      // Load chat
      fetch(`/api/chat?tournamentId=${id}`).then(r => r.ok ? r.json() : []).then(d => setChatMessages(d)).catch(() => {})
      // Load bracket if clash squad mode
      fetch(`/api/tournaments/${id}/bracket`).then(r => r.ok ? r.json() : []).then(d => setBracketMatches(d)).catch(() => {})
    } catch {}
    setLoading(false); setActionLoading('')
  }, [])

  const refresh = useCallback(() => { const id = activeIdRef.current; if (id) loadTournament(id) }, [loadTournament])

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/tournaments', { signal: ctrl.signal }).then(r => r.ok ? r.json() : []).then(d => { if (!ctrl.signal.aborted) setTournaments(d) }).catch(() => {})
    return () => ctrl.abort()
  }, [])

  // ======== ACTIONS ========
  const createTournament = async () => {
    if (!tName.trim()) return toast({ title: 'Error', description: 'Nama wajib diisi' })
    setActionLoading('Membuat turnamen...')
    const isCS = tournamentMode === 'clash_squad'
    const isBracket = tournamentMode === 'clash_squad' || tournamentMode === 'round_robin' || tournamentMode === 'double_elim'
    try {
      const r = await fetch('/api/tournaments', { method: 'POST', headers: authHeaders(), body: JSON.stringify({
        name: tName, description: tDesc || null, mode: tournamentMode, maxTeams: parseInt(tMax),
        matchCount: isBracket ? 1 : parseInt(tMatches),
        placementPointsJson: (isCS || isBracket) ? '{}' : JSON.stringify(customPP),
        killPointValue: (isCS || isBracket) ? 0 : customKillPt,
        scheduledAt: tScheduledAt || null,
        prizePool: tPrizePool || null,
        prizeDistribution: tPrizeDist || null,
        streamUrl: tStreamUrl || null,
      }) })
      if (r.ok) { toast({ title: 'Berhasil!', description: 'Turnamen dibuat' }); setTName(''); setTDesc(''); setTScheduledAt(''); setTPrizePool(''); setTPrizeDist(''); setTStreamUrl(''); setCustomPP({ ...DEFAULT_PP }); setCustomKillPt(1); setShowPointEditor(false); setCreateTournamentDialogOpen(false); setTournamentMode('battle_royale'); setTMax('12'); setTMatches('6'); fetchTournaments() }
      else { const d = await r.json(); toast({ title: 'Error', description: d.error || 'Gagal', variant: 'destructive' }) }
    } catch { toast({ title: 'Error', description: 'Gagal membuat turnamen', variant: 'destructive' }) }
    setActionLoading('')
  }

  const deleteTournament = async (id: string) => {
    setActionLoading('Menghapus...')
    try {
      const r = await fetch(`/api/tournaments/${id}`, { method: 'DELETE', headers: authHeaders() })
      if (r.ok) { if (active?.id === id) { setActive(null); setTeams([]); setMatches([]); setLeaderboard([]); setTab('home') }; setConfirmDelete(null); setConfirmType(null); fetchTournaments(); toast({ title: 'Dihapus!' }) }
      else toast({ title: 'Error', description: 'Gagal menghapus', variant: 'destructive' })
    } catch { toast({ title: 'Error', description: 'Gagal', variant: 'destructive' }) }
    setActionLoading('')
  }

  const addTeam = async () => {
    if (!teamName.trim() || !teamTag.trim() || !active) return
    setActionLoading('Menambah tim...')
    try {
      const r = await fetch(`/api/tournaments/${active.id}/teams`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: teamName, tag: teamTag.toUpperCase(), nickname: teamNickname }) })
      if (r.ok) { toast({ title: 'Berhasil!', description: `${teamName} bergabung` }); setTeamName(''); setTeamTag(''); setTeamNickname(''); setAddTeamDialogOpen(false); refresh() }
      else { const d = await r.json(); toast({ title: 'Error', description: d.error || 'Gagal', variant: 'destructive' }) }
    } catch { toast({ title: 'Error', description: 'Gagal', variant: 'destructive' }) }
    setActionLoading('')
  }

  const bulkImportTeams = async () => {
    if (!bulkText.trim() || !active) return
    setActionLoading('Import tim...')
    const lines = bulkText.trim().split('\n').filter(l => l.trim())
    let success = 0, failed = 0
    for (const line of lines) {
      const parts = line.trim().split(/[,;\t]+/)
      const name = (parts[0] || '').trim(), tag = (parts[1] || name.slice(0, 3)).trim().toUpperCase(), nickname = (parts[2] || '').trim()
      if (!name) { failed++; continue }
      try { const r = await fetch(`/api/tournaments/${active.id}/teams`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name, tag, nickname }) }); if (r.ok) success++; else failed++ } catch { failed++ }
    }
    toast({ title: 'Import Selesai', description: `${success} berhasil, ${failed} gagal` })
    setBulkText(''); setShowBulkImport(false); refresh(); setActionLoading('')
  }

  const deleteTeam = async (id: string) => {
    if (!active) return
    setActionLoading('Menghapus tim...')
    try {
      const r = await fetch(`/api/tournaments/${active.id}/teams`, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ teamId: id }) })
      if (r.ok) { toast({ title: 'Dihapus!' }); setConfirmDelete(null); setConfirmType(null); refresh() }
      else toast({ title: 'Error', description: 'Gagal', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const addSampleTeams = async () => {
    if (!active) return
    const isCS = active.mode === 'clash_squad'
    setActionLoading(isCS ? 'Menambah sample pemain...' : 'Menambah sample tim...')
    const samples = isCS ? [
      { name: 'ShadowX', tag: 'SHX', nickname: 'shadow_pro' }, { name: 'BlazeFury', tag: 'BLZ', nickname: 'blaze_ff' },
      { name: 'NightViper', tag: 'NVP', nickname: 'viper_x' }, { name: 'IronClad', tag: 'IRC', nickname: 'iron.gg' },
      { name: 'PhantomAce', tag: 'PHA', nickname: 'phantom' }, { name: 'StormBreaker', tag: 'STM', nickname: 'storm.ff' },
      { name: 'DarkMatter', tag: 'DKM', nickname: 'dark_m' }, { name: 'FrostByte', tag: 'FSB', nickname: 'frosty' },
    ] : [
      { name: 'EVOS Legend', tag: 'EVS', nickname: 'Lux' }, { name: 'RRQ Hoshi', tag: 'RRQ', nickname: 'Ace' },
      { name: 'Bigetron Alpha', tag: 'BTR', nickname: 'Zux' }, { name: 'ONIC Esports', tag: 'ONIC', nickname: 'Coco' },
      { name: 'Alter Ego', tag: 'AE', nickname: 'Rexy' }, { name: 'GPX Esports', tag: 'GPX', nickname: 'Zildan' },
      { name: 'Dewa United', tag: 'DEWA', nickname: 'Kyoto' }, { name: 'AEV Esports', tag: 'AEV', nickname: 'Viper' },
      { name: 'SBE Esports', tag: 'SBE', nickname: 'Blaze' }, { name: 'Inferno Squad', tag: 'INF', nickname: 'Pyro' },
      { name: 'Phoenix Rise', tag: 'PHX', nickname: 'Ash' }, { name: 'Storm Blazer', tag: 'STM', nickname: 'Bolt' },
    ]
    let success = 0
    for (const t of samples) { try { const r = await fetch(`/api/tournaments/${active.id}/teams`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(t) }); if (r.ok) success++ } catch {} }
    toast({ title: 'Berhasil!', description: `${success} ${isCS ? 'pemain' : 'tim'} ditambahkan` }); refresh(); setActionLoading('')
  }

  const resetMatch = async (matchId: string) => {
    setActionLoading('Reset match...')
    try {
      const r = await fetch(`/api/matches/${matchId}/results`, { method: 'DELETE', headers: authHeaders() })
      if (r.ok) { toast({ title: 'Reset!' }); refresh() }
      else toast({ title: 'Error', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const undoLastMatch = async () => {
    if (!active) return
    const completed = matches.filter(m => m.status === 'completed')
    if (!completed.length) return toast({ title: 'Info', description: 'Tidak ada match untuk di-undo' })
    const last = completed[completed.length - 1]
    setActionLoading('Undo...')
    try {
      const r = await fetch(`/api/matches/${last.id}/undo`, { method: 'POST', headers: authHeaders() })
      if (r.ok) { toast({ title: 'Undo Berhasil!', description: `Match ${last.matchNumber} dibatalkan` }); refresh() }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const finishTournament = async () => {
    if (!active) return
    setActionLoading('Menyelesaikan...')
    try {
      const r = await fetch(`/api/tournaments/${active.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ status: 'completed' }) })
      if (r.ok) {
        toast({ title: 'Selesai!' })
        setShowCelebration(true) // Feature 2: trigger confetti
        refresh()
        // Check achievements after finishing
        if (loggedInUser?.id) {
          fetch('/api/achievements/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: loggedInUser.id, tournamentId: active.id }) }).then(r => r.ok ? r.json() : {}).then(d => {
            if (d.newlyCreated?.length) {
              fetch(`/api/achievements?tournamentId=${active.id}`).then(r => r.ok ? r.json() : { achievements: [] }).then(d2 => setAchievements(d2.achievements || [])).catch(() => {})
            }
          }).catch(() => {})
        }
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  // ======== AI SCAN ========
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader(); reader.onload = () => setUploadedImage(reader.result as string); reader.readAsDataURL(file)
  }

  const analyzeImage = async () => {
    if (!uploadedImage) return; setAnalyzing(true); setActionLoading('AI membaca gambar...')
    try {
      const r = await fetch('/api/analyze-match-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: uploadedImage, registeredTeams: teams.map(t => ({ name: t.name, tag: t.tag })) }) })
      const data = await r.json()
      if (data.success && data.data?.matchResults) processAIResults(data.data.matchResults)
      else toast({ title: 'AI Gagal', description: data.error || 'Coba gambar lebih jelas', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setAnalyzing(false); setActionLoading('')
  }

  const analyzePastedText = async () => {
    if (!pastedText.trim()) return toast({ title: 'Error', description: 'Teks kosong' }); setAnalyzing(true); setActionLoading('AI membaca teks...')
    try {
      const r = await fetch('/api/parse-match-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: pastedText, registeredTeams: teams.map(t => ({ name: t.name, tag: t.tag })) }) })
      const data = await r.json()
      if (data.success && data.data?.matchResults) processAIResults(data.data.matchResults)
      else toast({ title: 'AI Gagal', description: data.error || 'Coba format teks lebih jelas', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setAnalyzing(false); setActionLoading('')
  }

  const processAIResults = (results: AIDetectedResult[]) => {
    const mapped = results.map(detected => {
      const matched = teams.find(t => t.tag.toLowerCase() === detected.teamTag.toLowerCase() || t.name.toLowerCase().includes(detected.teamName.toLowerCase()) || detected.teamName.toLowerCase().includes(t.name.toLowerCase()))
      return { teamId: matched?.id || '', teamTag: matched?.tag || detected.teamTag, teamName: matched?.name || detected.teamName, teamNickname: matched?.nickname || '', placement: detected.placement, kills: detected.kills, matched: !!matched }
    })
    setMappedResults(mapped); setReviewStep(true)
  }

  const confirmAndSave = async () => {
    if (!selectedMatchId) return toast({ title: 'Error', description: 'Pilih match dulu' })
    const valid = mappedResults.filter(r => r.matched && r.teamId)
    if (!valid.length) return toast({ title: 'Error', description: 'Tidak ada tim cocok', variant: 'destructive' })
    setActionLoading('Menyimpan...')
    try {
      const r = await fetch(`/api/matches/${selectedMatchId}/results`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ results: valid.map(r => ({ teamId: r.teamId, placement: r.placement, kills: r.kills })) }) })
      if (r.ok) { toast({ title: 'Tersimpan!', description: `${valid.length} tim tersimpan` }); resetInput(); refresh() }
      else { const d = await r.json(); toast({ title: 'Error', description: d.error || 'Gagal', variant: 'destructive' }) }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const saveManualInput = async () => {
    if (!selectedMatchId) return toast({ title: 'Error', description: 'Pilih match dulu' })
    const valid = manualEntries.filter(e => e.teamId && e.placement > 0)
    if (!valid.length) return toast({ title: 'Error', description: 'Isi minimal 1 tim', variant: 'destructive' })
    setActionLoading('Menyimpan...')
    try {
      const r = await fetch(`/api/matches/${selectedMatchId}/results`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ results: valid.map(e => ({ teamId: e.teamId, placement: e.placement, kills: e.kills })) }) })
      if (r.ok) { toast({ title: 'Tersimpan!' }); resetInput(); refresh() }
      else { const d = await r.json(); toast({ title: 'Error', description: d.error || 'Gagal', variant: 'destructive' }) }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const resetInput = () => { setReviewStep(false); setMappedResults([]); setUploadedImage(null); setPastedText(''); setAnalyzing(false); setManualEntries([]); setSelectedMatchId(''); if (fileRef.current) fileRef.current.value = '' }

  const exportCSV = async () => {
    if (!active) return; setActionLoading('Export...')
    try {
      const r = await fetch(`/api/tournaments/${active.id}/export`)
      if (r.ok) { const blob = await r.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${active.name.replace(/\s+/g, '_')}_klasemen.csv`; a.click(); URL.revokeObjectURL(url); toast({ title: 'Download!' }) }
      else toast({ title: 'Error', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const shareAsImage = async () => {
    if (!klasemenRef.current) return; setSharingImage(true); setActionLoading('Membuat gambar...')
    try {
      const canvas = await html2canvas(klasemenRef.current, { backgroundColor: '#FFFFFF', scale: 2, useCORS: true, logging: false })
      const link = document.createElement('a'); link.download = `${active?.name || 'klasemen'}_standings.png`; link.href = canvas.toDataURL('image/png'); link.click(); toast({ title: 'Berhasil!' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setSharingImage(false); setActionLoading('')
  }

  const getAIAnalysis = async () => {
    if (!active || !leaderboard.length) return; setAiLoading(true); setAiText(''); setActionLoading('AI menganalisis...')
    try {
      const r = await fetch('/api/ai-analysis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentName: active.name, leaderboard: leaderboard.slice(0, 12) }) })
      if (r.ok) { const d = await r.json(); setAiText(d.analysis) }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setAiLoading(false); setActionLoading('')
  }

  const autoSelectNextMatch = () => { const next = matches.find(m => m.status !== 'completed'); if (next) setSelectedMatchId(next.id) }

  // ======== BRACKET ACTIONS ========
  const generateBracket = async () => {
    if (!active) return
    setActionLoading(lang === 'id' ? 'Membuat bracket...' : 'Generating bracket...')
    try {
      const r = await fetch(`/api/tournaments/${active.id}/bracket`, { method: 'POST', headers: authHeaders() })
      if (r.ok) {
        const data = await r.json()
        setBracketMatches(data)
        toast({ title: lang === 'id' ? 'Bracket Dibuat!' : 'Bracket Generated!', description: lang === 'id' ? `${data.length} match bracket` : `${data.length} match bracket` })
      } else {
        const d = await r.json()
        toast({ title: 'Error', description: d.error || 'Gagal membuat bracket', variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const fetchBracket = async (tournamentId: string) => {
    try {
      const r = await fetch(`/api/tournaments/${tournamentId}/bracket`)
      if (r.ok) setBracketMatches(await r.json())
      else setBracketMatches([])
    } catch { setBracketMatches([]) }
  }

  const setBracketWinner = async (matchId: string, winnerId: string) => {
    setActionLoading(lang === 'id' ? 'Menyimpan hasil...' : 'Saving result...')
    try {
      const r = await fetch(`/api/bracket/${matchId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ winnerId, score1: bracketScore1, score2: bracketScore2 }) })
      if (r.ok) {
        toast({ title: lang === 'id' ? 'Hasil Tersimpan!' : 'Result Saved!' })
        setSelectedBracketMatch(null)
        setBracketScore1(0); setBracketScore2(0)
        if (active) fetchBracket(active.id)
        refresh()
      } else {
        const d = await r.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setActionLoading('')
  }

  const downloadBracketImage = async () => {
    if (!bracketCaptureRef.current) return
    setDownloadingBracket(true); setActionLoading(lang === 'id' ? 'Membuat gambar bracket...' : 'Creating bracket image...')
    try {
      const canvas = await html2canvas(bracketCaptureRef.current, { backgroundColor: null, scale: 2, useCORS: true, logging: false })
      const link = document.createElement('a'); link.download = `${active?.name || 'bracket'}_${bracketTemplate}.png`; link.href = canvas.toDataURL('image/png'); link.click()
      toast({ title: lang === 'id' ? 'Bracket Terdownload!' : 'Bracket Downloaded!' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    setDownloadingBracket(false); setActionLoading('')
  }

  // ======== BRACKET TEMPLATE RENDERER ========
  type BracketTemplateType = 'excel_white' | 'excel_dark' | 'fox_blue'
  const BRACKET_TEMPLATES: { id: BracketTemplateType; name: string; nameId: string; preview: { bg: string; cell: string; border: string; line: string; accent: string } }[] = [
    { id: 'excel_white', name: 'Excel White', nameId: 'Excel Putih',
      preview: { bg: '#ffffff', cell: '#f8f9fa', border: '#bdc3c7', line: '#7f8c8d', accent: '#2980b9' } },
    { id: 'excel_dark', name: 'Excel Dark', nameId: 'Excel Gelap',
      preview: { bg: '#1f1f1f', cell: '#2d2d2d', border: '#444444', line: '#666666', accent: '#5dade2' } },
    { id: 'fox_blue', name: 'Fox Blue', nameId: 'Fox Blue',
      preview: { bg: '#f0f5ff', cell: '#e8f0fe', border: '#93b5e1', line: '#5b8dd9', accent: '#2563EB' } },
  ]

  const renderBracketTemplate = (template: BracketTemplateType) => {
    const tpl = BRACKET_TEMPLATES.find(t => t.id === template)!
    const p = tpl.preview
    const totalRounds = Math.max(...bracketMatches.map(m => m.round))
    if (!isFinite(totalRounds) || totalRounds < 1) return null

    const matchW = 210
    const matchH = 52
    const slotH = matchH + 22
    const connW = 48
    const numR1Slots = Math.pow(2, totalRounds - 1)
    const bracketH = numR1Slots * slotH - 22
    const totalW = totalRounds * matchW + (totalRounds - 1) * connW

    const roundLabels: Record<number, string> = {}
    if (totalRounds === 1) { roundLabels[1] = 'FINAL' }
    else if (totalRounds === 2) { roundLabels[1] = 'SEMI FINAL'; roundLabels[2] = 'FINAL' }
    else if (totalRounds === 3) { roundLabels[1] = 'QUARTER FINAL'; roundLabels[2] = 'SEMI FINAL'; roundLabels[3] = 'FINAL' }
    else { for (let i = 1; i <= totalRounds; i++) roundLabels[i] = i === totalRounds ? 'FINAL' : i === totalRounds - 1 ? 'SEMI FINAL' : i === totalRounds - 2 ? 'QUARTER FINAL' : `ROUND ${i}` }

    const finalMatch = bracketMatches.find(m => !m.nextMatchId)
    const champion = finalMatch?.status === 'completed' ? finalMatch.winner : null

    const getMatchCenter = (round: number, position: number) => {
      const slotsPerMatch = Math.pow(2, round - 1)
      const firstSlot = (position - 1) * slotsPerMatch + 1
      const lastSlot = position * slotsPerMatch
      const centerY = ((firstSlot + lastSlot) / 2 - 0.5) * slotH
      const centerX = (round - 1) * (matchW + connW) + matchW / 2
      return { x: centerX, y: centerY }
    }

    // Connector lines — simple bracket lines
    const connectorElements: React.ReactNode[] = []
    const nextMatchGroups: Record<string, BracketMatchData[]> = {}
    for (const m of bracketMatches) {
      if (m.nextMatchId) {
        if (!nextMatchGroups[m.nextMatchId]) nextMatchGroups[m.nextMatchId] = []
        nextMatchGroups[m.nextMatchId].push(m)
      }
    }

    let connKey = 0
    for (const [nextId, sources] of Object.entries(nextMatchGroups)) {
      const nextMatch = bracketMatches.find(m => m.id === nextId)
      if (!nextMatch) continue
      const nextPos = getMatchCenter(nextMatch.round, nextMatch.position)
      const midX = nextPos.x - matchW / 2 - connW / 2

      if (sources.length === 2) {
        const pos0 = getMatchCenter(sources[0].round, sources[0].position)
        const pos1 = getMatchCenter(sources[1].round, sources[1].position)
        const topY = Math.min(pos0.y, pos1.y)
        const botY = Math.max(pos0.y, pos1.y)
        // H-line source 0
        connectorElements.push(<div key={`c${connKey++}`} style={{ position: 'absolute', left: pos0.x + matchW / 2, top: pos0.y - 1, width: midX - (pos0.x + matchW / 2), height: 1.5, background: p.line }} />)
        // H-line source 1
        connectorElements.push(<div key={`c${connKey++}`} style={{ position: 'absolute', left: pos1.x + matchW / 2, top: pos1.y - 1, width: midX - (pos1.x + matchW / 2), height: 1.5, background: p.line }} />)
        // V-line
        connectorElements.push(<div key={`c${connKey++}`} style={{ position: 'absolute', left: midX - 0.75, top: topY, width: 1.5, height: botY - topY, background: p.line }} />)
        // H-line to next
        connectorElements.push(<div key={`c${connKey++}`} style={{ position: 'absolute', left: midX, top: nextPos.y - 1, width: (nextPos.x - matchW / 2) - midX, height: 1.5, background: p.line }} />)
      } else if (sources.length === 1) {
        const pos0 = getMatchCenter(sources[0].round, sources[0].position)
        const leftX = Math.min(pos0.x + matchW / 2, nextPos.x - matchW / 2)
        const rightX = Math.max(pos0.x + matchW / 2, nextPos.x - matchW / 2)
        connectorElements.push(<div key={`c${connKey++}`} style={{ position: 'absolute', left: leftX, top: pos0.y - 1, width: rightX - leftX, height: 1.5, background: p.line }} />)
        if (Math.abs(pos0.y - nextPos.y) > 2) {
          const midXSingle = (pos0.x + matchW / 2 + nextPos.x - matchW / 2) / 2
          connectorElements.push(<div key={`c${connKey++}`} style={{ position: 'absolute', left: midXSingle - 0.75, top: Math.min(pos0.y, nextPos.y), width: 1.5, height: Math.abs(nextPos.y - pos0.y), background: p.line }} />)
        }
      }
    }

    return (
      <div ref={bracketCaptureRef} style={{ background: p.bg, padding: '0', fontFamily: 'Arial, Helvetica, sans-serif', position: 'relative', width: totalW + 80, minHeight: bracketH + 280, overflow: 'hidden' }}>
        {/* Title row — like Excel header */}
        <div style={{ padding: '16px 24px', borderBottom: `2px solid ${p.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 28, height: 28, background: p.accent, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 'bold' }}>F</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: p.line, fontFamily: 'Arial, sans-serif' }}>
              {active?.name?.toUpperCase() || 'CLASH SQUAD BRACKET'}
            </div>
            <div style={{ fontSize: '9px', color: p.border, marginTop: 2, letterSpacing: '0.5px' }}>
              SINGLE ELIMINATION &middot; {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Round column headers — like Excel column headers */}
        <div style={{ display: 'flex', paddingLeft: 24, paddingRight: 24, paddingTop: 8, gap: connW }}>
          {Array.from({ length: totalRounds }, (_, i) => {
            const round = i + 1
            return (
              <div key={`col-${round}`} style={{ width: matchW, background: p.border, padding: '4px 8px', fontSize: '8px', fontWeight: 'bold', color: p.bg, textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {roundLabels[round] || `ROUND ${round}`}
              </div>
            )
          })}
        </div>

        {/* Bracket area */}
        <div style={{ position: 'relative', width: totalW, height: bracketH, margin: '12px auto 16px' }}>
          {/* Match boxes — spreadsheet cell style */}
          {bracketMatches.map((m) => {
            const pos = getMatchCenter(m.round, m.position)
            const top = pos.y - matchH / 2
            const left = pos.x - matchW / 2
            const isW1 = m.winnerId === m.team1Id
            const isW2 = m.winnerId === m.team2Id
            const isCompleted = m.status === 'completed'

            return (
              <div key={m.id} style={{ position: 'absolute', left, top, width: matchW, height: matchH, border: `1px solid ${p.border}`, overflow: 'hidden' }}>
                {/* Team 1 row */}
                <div style={{ display: 'flex', alignItems: 'center', height: '50%', borderBottom: `1px solid ${p.border}`, background: isW1 ? `${p.accent}18` : (p.cell) }}>
                  <div style={{ width: 20, height: '100%', background: isW1 ? p.accent : p.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: isW1 ? '#fff' : p.line }}>
                    {isW1 ? 'W' : ''}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: isW1 ? 'bold' : 'normal', color: isW1 ? p.accent : (m.team1 ? p.line : p.border), padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {m.team1?.name || 'TBD'}
                  </span>
                  {isCompleted && <span style={{ fontSize: '10px', fontWeight: 'bold', color: isW1 ? p.accent : p.border, padding: '0 8px', minWidth: 20, textAlign: 'right' }}>{m.score1}</span>}
                </div>
                {/* Team 2 row */}
                <div style={{ display: 'flex', alignItems: 'center', height: '50%', background: isW2 ? `${p.accent}18` : p.bg }}>
                  <div style={{ width: 20, height: '100%', background: isW2 ? p.accent : p.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', color: isW2 ? '#fff' : p.line }}>
                    {isW2 ? 'W' : ''}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: isW2 ? 'bold' : 'normal', color: isW2 ? p.accent : (m.team2 ? p.line : p.border), padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {m.team2?.name || 'TBD'}
                  </span>
                  {isCompleted && <span style={{ fontSize: '10px', fontWeight: 'bold', color: isW2 ? p.accent : p.border, padding: '0 8px', minWidth: 20, textAlign: 'right' }}>{m.score2}</span>}
                </div>
              </div>
            )
          })}

          {/* Connector lines */}
          {connectorElements}
        </div>

        {/* Champion section — clean like a results table */}
        {champion && (
          <div style={{ margin: '0 24px', borderTop: `2px solid ${p.accent}`, borderBottom: `2px solid ${p.accent}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: p.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff' }}>1</div>
            <div>
              <div style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '2px', color: p.accent, textTransform: 'uppercase' }}>CHAMPION</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: p.line }}>{champion.name}</div>
              {champion.tag && <div style={{ fontSize: '9px', color: p.border }}>{champion.tag}</div>}
            </div>
          </div>
        )}

        {/* Footer — simple like Excel footer */}
        <div style={{ padding: '12px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '8px', color: p.border, letterSpacing: '0.5px' }}>FOXAREA TOURNAMENT</div>
          <div style={{ fontSize: '8px', color: p.border }}>{new Date().toLocaleDateString()}</div>
        </div>
      </div>
    )
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !active || !isLoggedIn) return
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ tournamentId: active.id, message: chatInput.trim() }) })
      if (r.ok) { setChatInput(''); fetch(`/api/chat?tournamentId=${active.id}`).then(r => r.ok ? r.json() : []).then(d => setChatMessages(d)).catch(() => {}) }
    } catch {}
  }

  // Get active tournament's point system
  const getPP = useCallback(() => { if (!active) return DEFAULT_PP; try { return JSON.parse(active.placementPointsJson) } catch { return DEFAULT_PP } }, [active])
  const getKillPt = useCallback(() => active?.killPointValue ?? 1, [active])

  // Feature 7: Convert stream URL to embed URL
  const getEmbedUrl = useCallback((url: string) => {
    try {
      const u = new URL(url)
      // YouTube: youtube.com/watch?v=XXX → youtube.com/embed/XXX
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}${u.searchParams.get('t') ? '?start=' + u.searchParams.get('t') : ''}`
      }
      // YouTube Shorts
      if (u.hostname.includes('youtube.com') && u.pathname.startsWith('/shorts/')) {
        return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}`
      }
      // youtu.be short URL
      if (u.hostname === 'youtu.be') {
        return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
      }
      // Twitch: twitch.tv/xxx → player.twitch.tv/?channel=xxx
      if (u.hostname.includes('twitch.tv')) {
        const channel = u.pathname.split('/')[1]
        if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`
      }
      return url
    } catch { return url }
  }, [])

  // Feature 5: Parse prize distribution
  const getPrizeDistribution = useCallback(() => {
    if (!active?.prizeDistribution) return null
    try { return JSON.parse(active.prizeDistribution) } catch { return null }
  }, [active])

  // Feature 5: Get estimated prize for a rank
  const getEstimatedPrize = useCallback((rank: number) => {
    const dist = getPrizeDistribution()
    const pool = active?.prizePool
    if (!dist || !pool) return null
    const pct = dist[rank.toString()]
    if (!pct) return null
    const numStr = pool.replace(/[^0-9]/g, '')
    const total = parseInt(numStr)
    if (!total) return null
    const estimated = Math.round(total * pct / 100)
    const prefix = pool.match(/^[^0-9]*/)?.[0] || ''
    return `${prefix}${estimated.toLocaleString('id-ID')}`
  }, [active, getPrizeDistribution])

  // Feature 6: Analytics computations
  const analyticsData = useMemo(() => {
    if (!leaderboard.length) return null
    // Bar chart: total points per team
    const barData = leaderboard.slice(0, 10).map(e => ({ name: e.tag, points: e.totalPoints, kills: e.totalKills }))
    // Line chart: points progression across matches
    const completedMatches = matches.filter(m => m.status === 'completed')
    const lineData = completedMatches.map((m, mi) => {
      const matchNum = mi + 1
      const point: Record<string, number | string> = { match: `M${matchNum}` }
      for (const entry of leaderboard.slice(0, 5)) {
        let cumPts = 0
        for (let j = 0; j <= mi; j++) {
          const mb = entry.matchBreakdown.find(b => b.matchNumber === j + 1)
          if (mb) cumPts += mb.totalPoints
        }
        point[entry.tag] = cumPts
      }
      return point
    })
    // Pie chart: kill distribution
    const pieData = leaderboard.slice(0, 8).map(e => ({ name: e.tag, value: e.totalKills }))
    // MVP: team with most kills
    const mvp = leaderboard.reduce((best, e) => e.totalKills > (best?.totalKills || 0) ? e : best, leaderboard[0])
    // Most consistent: lowest placement variance
    let mostConsistent: LeaderboardEntry | null = null
    let lowestVariance = Infinity
    for (const entry of leaderboard) {
      if (entry.matchBreakdown.length < 2) continue
      const mean = entry.matchBreakdown.reduce((s, m) => s + m.placement, 0) / entry.matchBreakdown.length
      const variance = entry.matchBreakdown.reduce((s, m) => s + Math.pow(m.placement - mean, 2), 0) / entry.matchBreakdown.length
      if (variance < lowestVariance) { lowestVariance = variance; mostConsistent = entry }
    }
    return { barData, lineData, pieData, mvp, mostConsistent, lowestVariance }
  }, [leaderboard, matches])

  // Computed
  const completedCount = matches.filter(m => m.status === 'completed').length
  const progress = matches.length > 0 ? Math.round((completedCount / matches.length) * 100) : 0

  // ======== DELETE CONFIRMATION DIALOG ========
  const DeleteConfirmDialog = () => (
    <Dialog open={!!confirmDelete} onOpenChange={() => { setConfirmDelete(null); setConfirmType(null) }}>
      <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-sm">
        <DialogHeader><DialogTitle className="text-[#111827]">Konfirmasi Hapus</DialogTitle></DialogHeader>
        <p className="text-[#4B5563] text-sm">{confirmType === 'tournament' ? 'Yakin hapus turnamen ini? Semua data akan hilang.' : 'Yakin hapus tim ini? Semua hasil match juga terhapus.'}</p>
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" className="flex-1 text-[#6B7280]" onClick={() => { setConfirmDelete(null); setConfirmType(null) }}>Batal</Button>
          <Button className="flex-1 bg-[#ff6b6b] hover:bg-[#ff5252] text-white" onClick={() => { if (confirmType === 'tournament' && confirmDelete) deleteTournament(confirmDelete); else if (confirmType === 'team' && confirmDelete) deleteTeam(confirmDelete) }}>Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // ======== NAVBAR (shared between beranda & workspace) ========
  const Navbar = ({ showNavLinks = false }: { showNavLinks?: boolean }) => (
    <nav className={`sticky top-0 z-50 border-b ${theme === 'dark' ? 'border-[#292524] bg-[#0C0A09]/90' : 'border-[#E5E7EB] bg-white/90'} backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPageState('beranda')}>
          <LogoFoxArea size={28} />
          <span className="text-xl font-black brand-text tracking-tight">FoxArea</span>
          <span className="text-[10px] text-[#6B7280] font-semibold tracking-widest hidden sm:inline">TOURNAMENT</span>
        </div>
        {showNavLinks && (
          <div className="hidden md:flex items-center gap-6">
            <a href="#beranda" className="text-sm text-[#111827] font-medium hover:text-[#2563EB] transition-colors">{tr('nav.beranda')}</a>
            <a href="#fitur" className="text-sm text-[#4B5563] font-medium hover:text-[#2563EB] transition-colors">{tr('nav.fitur')}</a>
            <a href="#cara-kerja" className="text-sm text-[#4B5563] font-medium hover:text-[#2563EB] transition-colors">{tr('nav.caraKerja')}</a>
            <a href="#community" className="text-sm text-[#4B5563] font-medium hover:text-[#2563EB] transition-colors">{tr('nav.community')}</a>
            <a href="#faq" className="text-sm text-[#4B5563] font-medium hover:text-[#2563EB] transition-colors">{tr('nav.faq')}</a>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="p-2 rounded-lg hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#2563EB] transition-colors flex items-center gap-1" title="Switch language">
            <Globe className="w-3.5 h-3.5" /><span className="text-[9px] font-bold uppercase">{lang}</span>
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#2563EB] transition-colors" title="Toggle theme">
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {isLoggedIn ? (
            <button onClick={() => setShowProfileDialog(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-colors" title={loggedInUser?.name}>
              <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center"><ShieldCheck className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-xs font-bold text-[#111827] hidden sm:inline max-w-[80px] truncate">{loggedInUser?.name}</span>
            </button>
          ) : (
            <Button size="sm" onClick={() => setPageState('login')} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs gap-1.5 rounded-xl h-9 px-4 transition-colors shadow-sm shadow-[#2563EB]/20">
              <KeyRound className="w-3.5 h-3.5" />{tr('nav.login')}
            </Button>
          )}
          {showNavLinks && (
            <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-2 rounded-lg hover:bg-[#F9FAFB] text-[#6B7280]">
              {mobileNav ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {/* Mobile nav */}
      {showNavLinks && mobileNav && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xl px-4 py-3 space-y-2">
          <a href="#beranda" onClick={() => setMobileNav(false)} className="block text-sm text-[#111827] py-1">{tr('nav.beranda')}</a>
          <a href="#fitur" onClick={() => setMobileNav(false)} className="block text-sm text-[#4B5563] py-1">{tr('nav.fitur')}</a>
          <a href="#cara-kerja" onClick={() => setMobileNav(false)} className="block text-sm text-[#4B5563] py-1">{tr('nav.caraKerja')}</a>
          <a href="#community" onClick={() => setMobileNav(false)} className="block text-sm text-[#4B5563] py-1">{tr('nav.community')}</a>
          <a href="#faq" onClick={() => setMobileNav(false)} className="block text-sm text-[#4B5563] py-1">{tr('nav.faq')}</a>
          {!isLoggedIn && (
            <button onClick={() => { setMobileNav(false); setPageState('login') }} className="w-full mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs gap-1.5 rounded-xl h-10 px-4 transition-colors shadow-sm flex items-center justify-center">
              <KeyRound className="w-3.5 h-3.5" />{tr('nav.login')}
            </button>
          )}
        </div>
      )}
    </nav>
  )

  // ======== RENDER: SPLASH ========
  if (pageState === 'splash') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[1000] overflow-hidden">
        {/* Elegant gradient background */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(37,99,235,0.04) 0%, rgba(255,255,255,0) 50%), radial-gradient(ellipse at 80% 80%, rgba(37,99,235,0.02) 0%, rgba(255,255,255,0) 40%)' }} />

        {/* Subtle geometric lines background */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />

        <div className="flex flex-col items-center relative z-10">
          {/* Logo with glow effect */}
          <div className="splash-logo-reveal mb-12 relative">
            <div className="absolute inset-0 blur-2xl bg-[#2563EB]/10 rounded-full scale-150" />
            <div className="relative">
              <LogoFoxArea size={96} />
            </div>
          </div>

          {/* Brand name — elegant serif-like letter reveal */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-[0.15em] flex gap-[0.05em] relative">
            {'FOXAREA'.split('').map((l, i) => (
              <span key={i} className="splash-char-luxury text-[#111827]" style={{ animationDelay: `${0.6 + i * 0.08}s` }}>{l}</span>
            ))}
          </h1>

          {/* Thin elegant line with brand accent */}
          <div className="mt-6 w-56 h-[0.5px] bg-[#E5E7EB] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent splash-line-sweep" />
          </div>

          {/* Subtitle — refined spacing */}
          <h2 className="splash-subtitle-reveal text-[9px] sm:text-[11px] font-semibold text-[#2563EB] tracking-[0.6em] mt-6 uppercase">Tournament System</h2>

          {/* Premium progress bar */}
          <div className="mt-20 w-60">
            <div className="w-full h-[1px] bg-[#F3F4F6] rounded-full overflow-hidden">
              <div className="h-full rounded-full splash-progress-fill" style={{ animation: 'splashProgress 5s cubic-bezier(0.4, 0, 0.2, 1) 0.8s forwards', width: '0%' }} />
            </div>
            {/* Minimal progress indicator dots */}
            <div className="flex justify-between mt-4 px-1">
              {[0, 1, 2, 3, 4].map((p, i) => (
                <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#E5E7EB] splash-dot-pulse" style={{ animationDelay: `${1 + i * 0.7}s` }} />
              ))}
            </div>
          </div>

          {/* Tagline */}
          <p className="splash-tagline-reveal text-[#9CA3AF] text-[8px] tracking-[0.3em] mt-14 font-medium uppercase">Free Fire Point Calculator</p>

          {/* Version — minimal */}
          <div className="splash-version-badge mt-5">
            <span className="text-[7px] text-[#D1D5DB] font-mono tracking-[0.4em]">v3.0</span>
          </div>
        </div>

        {/* Corner brackets — ultra-refined */}
        <div className="absolute top-8 left-8 w-10 h-10 border-l border-t border-[#E5E7EB]/40 splash-corner-decor" />
        <div className="absolute top-8 right-8 w-10 h-10 border-r border-t border-[#E5E7EB]/40 splash-corner-decor" style={{ animationDelay: '0.15s' }} />
        <div className="absolute bottom-8 left-8 w-10 h-10 border-l border-b border-[#E5E7EB]/40 splash-corner-decor" style={{ animationDelay: '0.3s' }} />
        <div className="absolute bottom-8 right-8 w-10 h-10 border-r border-b border-[#E5E7EB]/40 splash-corner-decor" style={{ animationDelay: '0.45s' }} />
      </div>
    )
  }

  // ======== RENDER: BERANDA (HOMEPAGE) ========
  if (pageState === 'beranda') {
    return (
      <div ref={berandaRef} className={`page-fade-in min-h-screen ${theme === 'dark' ? 'dark-theme' : ''} bg-white`}>
        <Navbar showNavLinks />

        {/* Hero — clean, confident, luxury */}
        <section id="beranda" className="relative max-w-5xl mx-auto px-4 pt-24 pb-20 text-center reveal overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 hero-grid-bg pointer-events-none" />
          {/* Interactive particle canvas */}
          <canvas ref={particleCanvasRef} className="particle-canvas" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
          {/* Warm ambient orb only */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#2563EB]/[0.03] blur-3xl hero-orb-1 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight mb-3"><span className="brand-text">FOXAREA</span></h1>
            <h2 className="text-lg sm:text-xl font-semibold text-[#6B7280] tracking-[0.35em] mb-6 uppercase">Tournament</h2>
            <p className="text-[#4B5563] max-w-md mx-auto mb-12 text-sm leading-relaxed">{tr('hero.desc')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleEnterApp} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold gap-2 px-10 h-12 text-base rounded-lg transition-colors">
                {tr('hero.cta')}
              </Button>
              <a href="#fitur" className="text-sm text-[#6B7280] hover:text-[#2563EB] transition-colors flex items-center gap-1">
                <ChevronDown className="w-4 h-4 animate-bounce" />{lang === 'id' ? 'Pelajari lebih' : 'Learn more'}
              </a>
            </div>
          </div>
        </section>

        {/* 🔴 LIVE TOURNAMENT BANNER (Feature 1) */}
        {liveTournaments.filter(t => t.status === 'ongoing').length > 0 && (
          <div className="w-full bg-gradient-to-r from-[#1e3a5f] to-[#1e40af] overflow-hidden py-3 border-b border-[#2563EB]/20">
            <div className="live-banner-scroll flex gap-4 items-center whitespace-nowrap px-4">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex gap-4 items-center">
                  {dup === 0 && (
                    <span className="flex items-center gap-2 mr-4 flex-shrink-0">
                      <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" /></span>
                      <span className="text-[11px] font-black text-white tracking-wider">LIVE</span>
                    </span>
                  )}
                  {liveTournaments.filter(t => t.status === 'ongoing').map(t => (
                    <button key={`${t.id}-${dup}`} onClick={() => { if (isLoggedIn) { loadTournament(t.id); setPageState('workspace') } else setPageState('login') }} className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-lg px-4 py-2 transition-colors flex-shrink-0 cursor-pointer">
                      <span className="text-sm font-bold text-white">{t.name}</span>
                      <Badge variant="secondary" className="text-[9px] font-black bg-[#2563EB]/20 text-[#2563EB] border-0 h-5">
                        {t.mode === 'clash_squad' ? 'CS' : 'BR'}
                      </Badge>
                      <span className="text-[10px] text-white/60 flex items-center gap-1"><Users className="w-3 h-3" />{t._count?.teams || 0}/{t.maxTeams}</span>
                      <span className="text-[9px] text-[#2563EB] font-bold">{isLoggedIn ? (lang === 'id' ? 'Masuk →' : 'Enter →') : (lang === 'id' ? 'Login →' : 'Login →')}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Counter - Enhanced (Feature 10) */}
        <section id="stats-section" className="max-w-4xl mx-auto px-4 pb-16 relative">
          <div className="absolute inset-0 hero-grid-bg opacity-30 pointer-events-none rounded-2xl" />
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2 relative z-10">{tr('stats.title')}</h3>
          <p className="text-center text-[10px] text-[#2563EB] font-bold tracking-wider mb-8 relative z-10 animate-pulse">{lang === 'id' ? '...dan terus bertambah' : '...and counting'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            {[
              { key: 'totalTournaments', label: tr('stats.tournaments'), icon: Trophy, color: '#2563EB' },
              { key: 'totalTeams', label: tr('stats.teams'), icon: Users, color: '#00b4d8' },
              { key: 'totalMatches', label: tr('stats.matches'), icon: Swords, color: '#a78bfa' },
              { key: 'totalUsers', label: tr('stats.users'), icon: Globe, color: '#fbbf24' },
            ].map((stat, i) => (
              <div key={stat.label} className={`stat-item ${statsVisible ? 'animated' : ''} bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all hover:shadow-lg hover:shadow-[#2563EB]/5 group`}>
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="text-3xl sm:text-4xl font-black" style={{ color: stat.color }}>
                  {statsVisible ? (animatedStats[stat.key as keyof typeof animatedStats] || 0).toLocaleString() : '0'}
                </div>
                <div className="text-[11px] text-[#6B7280] font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ⚡ Quick Match Simulator (Feature 5) */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{lang === 'id' ? 'Coba Kalkulator Poin' : 'Try Point Calculator'}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-md mx-auto">{lang === 'id' ? 'Hitung poin langsung di sini — tanpa perlu login!' : 'Calculate points right here — no login needed!'}</p>
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden max-w-lg mx-auto">
            <div className="p-4 space-y-4">
              {/* Team 1 */}
              <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md rank-1 flex items-center justify-center text-[10px] font-black">1</div>
                  <Input value={simTeam1} onChange={e => setSimTeam1(e.target.value)} className="h-8 text-sm font-bold border-[#E5E7EB]" placeholder="Team 1" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-[#4B5563]">
                    {lang === 'id' ? 'Posisi' : 'Place'}:
                    <select value={simPlacement1} onChange={e => setSimPlacement1(Number(e.target.value))} className="h-7 text-xs border border-[#E5E7EB] rounded px-2 bg-white">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>#{p}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#4B5563]">
                    {lang === 'id' ? 'Kill' : 'Kills'}:
                    <button onClick={() => setSimKills1(Math.max(0, simKills1 - 1))} className="w-6 h-6 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold">-</button>
                    <span className="w-6 text-center font-bold text-[#111827]">{simKills1}</span>
                    <button onClick={() => setSimKills1(Math.min(20, simKills1 + 1))} className="w-6 h-6 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold">+</button>
                  </div>
                  <span className="ml-auto text-sm font-black text-[#2563EB]">{((DEFAULT_PP[simPlacement1] || 0) + simKills1)} pts</span>
                </div>
              </div>
              {/* Team 2 */}
              <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md rank-2 flex items-center justify-center text-[10px] font-black">2</div>
                  <Input value={simTeam2} onChange={e => setSimTeam2(e.target.value)} className="h-8 text-sm font-bold border-[#E5E7EB]" placeholder="Team 2" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-[#4B5563]">
                    {lang === 'id' ? 'Posisi' : 'Place'}:
                    <select value={simPlacement2} onChange={e => setSimPlacement2(Number(e.target.value))} className="h-7 text-xs border border-[#E5E7EB] rounded px-2 bg-white">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(p => <option key={p} value={p}>#{p}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#4B5563]">
                    {lang === 'id' ? 'Kill' : 'Kills'}:
                    <button onClick={() => setSimKills2(Math.max(0, simKills2 - 1))} className="w-6 h-6 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold">-</button>
                    <span className="w-6 text-center font-bold text-[#111827]">{simKills2}</span>
                    <button onClick={() => setSimKills2(Math.min(20, simKills2 + 1))} className="w-6 h-6 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold">+</button>
                  </div>
                  <span className="ml-auto text-sm font-black text-[#00b4d8]">{((DEFAULT_PP[simPlacement2] || 0) + simKills2)} pts</span>
                </div>
              </div>
              {/* Mini Leaderboard Result */}
              <div className="bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
                <div className="px-3 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[10px] font-bold text-[#111827]">{lang === 'id' ? 'Mini Klasemen' : 'Mini Leaderboard'}</span>
                </div>
                {[
                  { name: simTeam1 || 'Team 1', pts: (DEFAULT_PP[simPlacement1] || 0) + simKills1, pp: DEFAULT_PP[simPlacement1] || 0, kp: simKills1 },
                  { name: simTeam2 || 'Team 2', pts: (DEFAULT_PP[simPlacement2] || 0) + simKills2, pp: DEFAULT_PP[simPlacement2] || 0, kp: simKills2 },
                ].sort((a, b) => b.pts - a.pts).map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB]/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${i === 0 ? 'rank-1 text-black' : 'rank-2 text-black'}`}>{i + 1}</div>
                      <span className="text-xs font-bold text-[#111827]">{t.name}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: i === 0 ? '#2563EB' : '#00b4d8' }}>{t.pts} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4 flex justify-center">
              <Button size="sm" onClick={handleEnterApp} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs gap-1.5 rounded-lg">
                <Zap className="w-3 h-3" />{lang === 'id' ? 'Coba Versi Lengkap →' : 'Try Full Version →'}
              </Button>
            </div>
          </div>
        </section>

        {/* 📅 Upcoming Tournaments Calendar (Feature 3) */}
        {liveTournaments.filter(t => t.status === 'upcoming').length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
            <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#2563EB]" />{lang === 'id' ? 'Turnamen Mendatang' : 'Upcoming Tournaments'}</h3>
            {/* Filter buttons */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'all' as const, label: lang === 'id' ? 'Semua' : 'All', color: '#6B7280' },
                { id: 'battle_royale' as const, label: 'Battle Royale', color: '#2563EB' },
                { id: 'clash_squad' as const, label: 'Clash Squad', color: '#00b4d8' },
              ].map(f => (
                <button key={f.id} onClick={() => setUpcomingFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${upcomingFilter === f.id ? 'text-white border-transparent' : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#2563EB]/30'}`} style={upcomingFilter === f.id ? { background: f.color } : {}}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {liveTournaments.filter(t => t.status === 'upcoming' && (upcomingFilter === 'all' || t.mode === upcomingFilter)).slice(0, 6).map(t => {
                const cd = t.scheduledAt ? getCountdown(t.scheduledAt) : null
                return (
                  <div key={t.id} className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-[9px] gap-1.5 bg-[#2563EB]/10 text-[#2563EB]">
                        <Calendar className="w-2.5 h-2.5" />{t.mode === 'clash_squad' ? 'Clash Squad' : 'Battle Royale'}
                      </Badge>
                      <span className="text-[10px] text-[#6B7280]"><Users className="w-3 h-3 inline" /> {t._count?.teams || 0}/{t.maxTeams}</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#111827] group-hover:text-[#2563EB] transition-colors">{t.name}</h4>
                    {t.scheduledAt && (
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-[#6B7280]" />
                        <span className="text-[10px] text-[#6B7280]">{new Date(t.scheduledAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                    {cd && (
                      <div className="flex gap-2 mt-2">
                        {[
                          { val: cd.days, label: lang === 'id' ? 'hr' : 'd' },
                          { val: cd.hours, label: 'j' },
                          { val: cd.minutes, label: 'm' },
                          { val: cd.seconds, label: 'd' },
                        ].map((u, i) => (
                          <div key={i} className="bg-white rounded-md px-2 py-1 border border-[#E5E7EB] text-center min-w-[36px]">
                            <div className="text-xs font-black text-[#2563EB]">{String(u.val).padStart(2, '0')}</div>
                            <div className="text-[8px] text-[#9CA3AF]">{u.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {t.allowRegistration && (
                      <Button size="sm" onClick={() => { if (isLoggedIn) { loadTournament(t.id); setPageState('workspace') } else setPageState('login') }} className="mt-3 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs h-8 rounded-lg">
                        {lang === 'id' ? 'Daftar Sekarang' : 'Register Now'}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 🏆 Recent Results (Feature 4) */}
        {recentResults.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
            <h3 className="text-lg font-bold text-[#111827] mb-4 flex items-center gap-2"><History className="w-5 h-5 text-[#fbbf24]" />{lang === 'id' ? 'Hasil Terbaru' : 'Recent Results'}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {recentResults.map(({ tournament: t, top3 }) => (
                <div key={t.id} className="bg-[#F9FAFB] rounded-xl p-4 border border-[#fbbf24]/10 hover:border-[#fbbf24]/30 transition-colors cursor-pointer group" onClick={() => { loadTournament(t.id); setPageState('workspace') }}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-[9px] gap-1.5 bg-[#fbbf24]/10 text-[#92400e]">
                      <Trophy className="w-2.5 h-2.5" />{lang === 'id' ? 'Selesai' : 'Completed'}
                    </Badge>
                    <span className="text-[9px] text-[#9CA3AF]">{new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#111827] group-hover:text-[#fbbf24] transition-colors mb-3">{t.name}</h4>
                  {top3.length > 0 && (
                    <div className="space-y-1.5">
                      {top3.map((team, i) => (
                        <div key={team.id} className="flex items-center justify-between text-xs px-2 py-1 rounded-md bg-white/50">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${i === 0 ? 'rank-1 text-black' : i === 1 ? 'rank-2 text-black' : 'rank-3 text-white'}`}>{i + 1}</div>
                            <span className="font-bold text-[#111827]">{team.name}</span>
                            <span className="text-[#9CA3AF] text-[10px]">{team.tag}</span>
                          </div>
                          <span className="font-black text-[#2563EB]">{team.totalPoints} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="mt-2 w-full text-[10px] text-[#6B7280] hover:text-[#2563EB] h-7">{lang === 'id' ? 'Lihat Hasil Lengkap →' : 'View Full Results →'}</Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Feature Cards - Enhanced */}
        <section id="fitur" className="max-w-4xl mx-auto px-4 pb-12 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-8">{tr('nav.fitur')}</h3>
          <div className="grid sm:grid-cols-2 gap-4 stagger-reveal">
            {[
              { icon: Camera, title: tr('feature.aiScanner'), desc: tr('feature.aiScannerDesc'), color: '#2563EB', badge: 'AI' },
              { icon: Type, title: tr('feature.copyPaste'), desc: tr('feature.copyPasteDesc'), color: '#00b4d8', badge: null },
              { icon: HandMetal, title: tr('feature.manualInput'), desc: tr('feature.manualInputDesc'), color: '#fbbf24', badge: null },
              { icon: BarChart3, title: tr('feature.realtimeKlasemen'), desc: tr('feature.realtimeKlasemenDesc'), color: '#a78bfa', badge: 'Live' },
              { icon: Swords, title: lang === 'id' ? 'Bracket Eliminasi' : 'Elimination Bracket', desc: lang === 'id' ? 'Clash Squad mode dengan bracket single elimination visual' : 'Clash Squad mode with visual single elimination bracket', color: '#ff6b6b', badge: 'NEW' },
              { icon: Share2, title: lang === 'id' ? 'Link Registrasi Publik' : 'Public Registration Link', desc: lang === 'id' ? 'Bagikan link biar tim bisa daftar sendiri tanpa admin' : 'Share a link so teams can register themselves without admin', color: '#22c55e', badge: 'NEW' },
            ].map((f) => (
              <div key={f.title} className="bg-[#F9FAFB] rounded-xl p-5 flex items-start gap-4 border border-[#E5E7EB] hover:border-[#2563EB]/30 transition-all group" style={{ borderLeftColor: f.color }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${f.color}15` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-[#111827] group-hover:text-[#2563EB] transition-colors">{f.title}</h3>
                    {f.badge && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: f.color }}>{f.badge}</span>}
                  </div>
                  <p className="text-[#6B7280] text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('preview.title')}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-sm mx-auto">{tr('preview.desc')}</p>
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden max-w-md mx-auto">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#E5E7EB]">
              <span className="text-[10px] text-[#6B7280] font-bold tracking-wider">#</span>
              <span className="text-[10px] text-[#6B7280] font-bold tracking-wider">{tr('preview.squad')}</span>
              <span className="text-[10px] text-[#6B7280] font-bold tracking-wider">{tr('preview.kill')}</span>
              <span className="text-[10px] text-[#6B7280] font-bold tracking-wider">{tr('preview.pts')}</span>
            </div>
            {[
              { rank: 1, name: 'EVOS Legend', tag: 'EVS', kills: 38, pts: 78, color: '#2563EB' },
              { rank: 2, name: 'RRQ Hoshi', tag: 'RRQ', kills: 32, pts: 69, color: '#C0C0C0' },
              { rank: 3, name: 'Bigetron Alpha', tag: 'BTR', kills: 28, pts: 62, color: '#CD7F32' },
              { rank: 4, name: 'ONIC Esports', tag: 'ONIC', kills: 24, pts: 55, color: '#9CA3AF' },
              { rank: 5, name: 'Alter Ego', tag: 'AE', kills: 20, pts: 48, color: '#9CA3AF' },
            ].map(row => (
              <div key={row.rank} className="flex items-center justify-between px-4 py-2.5 border-b border-[#E5E7EB]/50 hover:bg-[#2563EB]/5 transition-colors">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${row.rank <= 3 ? `rank-${row.rank} text-black` : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{row.rank}</div>
                <div className="flex-1 ml-3 min-w-0">
                  <span className="text-xs font-bold text-[#111827]">{row.name}</span>
                  <span className="text-[10px] text-[#6B7280] ml-1.5">{row.tag}</span>
                </div>
                <span className="text-xs text-[#4B5563] w-10 text-center">{row.kills}</span>
                <span className="text-xs font-black w-10 text-right" style={{ color: row.color }}>{row.pts}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Point System Table */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('points.title')}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-lg mx-auto">{tr('points.desc')}</p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Placement Points */}
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-4 py-2.5 bg-white border-b border-[#E5E7EB] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#111827]">{tr('points.placement')}</span>
              </div>
              <div className="grid grid-cols-2 gap-0">
                {[
                  { pos: 1, pts: 12, color: '#FFD700' },
                  { pos: 2, pts: 9, color: '#C0C0C0' },
                  { pos: 3, pts: 8, color: '#CD7F32' },
                  { pos: 4, pts: 7, color: '#2563EB' },
                  { pos: 5, pts: 6, color: '#2563EB' },
                  { pos: 6, pts: 5, color: '#2563EB' },
                  { pos: 7, pts: 4, color: '#9CA3AF' },
                  { pos: 8, pts: 3, color: '#9CA3AF' },
                  { pos: 9, pts: 2, color: '#9CA3AF' },
                  { pos: 10, pts: 1, color: '#9CA3AF' },
                  { pos: 11, pts: 0, color: '#9CA3AF' },
                  { pos: 12, pts: 0, color: '#9CA3AF' },
                ].map(p => (
                  <div key={p.pos} className="flex items-center justify-between px-4 py-2 border-b border-[#E5E7EB]/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${p.pos <= 3 ? `rank-${p.pos} text-black` : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{p.pos}</div>
                      <span className="text-[11px] text-[#4B5563]">{lang === 'id' ? 'Posisi' : 'Place'} #{p.pos}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: p.color }}>+{p.pts}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Kill Points */}
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-4 py-2.5 bg-white border-b border-[#E5E7EB] flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#ff6b6b]" />
                <span className="text-xs font-bold text-[#111827]">{tr('points.kill')}</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-xl bg-[#ff6b6b]/10 flex items-center justify-center mx-auto mb-2">
                      <Swords className="w-6 h-6 text-[#ff6b6b]" />
                    </div>
                    <div className="text-2xl font-black text-[#ff6b6b]">+1</div>
                    <div className="text-[10px] text-[#6B7280]">{lang === 'id' ? 'per kill' : 'per kill'}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 space-y-2">
                  <p className="text-[10px] text-[#6B7280] font-semibold mb-2">{lang === 'id' ? 'Contoh perhitungan:' : 'Example calculation:'}</p>
                  {[
                    { label: lang === 'id' ? 'Posisi #1' : 'Place #1', val: 12, color: '#FFD700' },
                    { label: lang === 'id' ? '8 Kill' : '8 Kills', val: 8, color: '#ff6b6b' },
                  ].map((e, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-[#4B5563]">{e.label}</span>
                      <span className="font-bold" style={{ color: e.color }}>+{e.val}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#E5E7EB] pt-2 flex justify-between text-xs">
                    <span className="text-[#111827] font-bold">Total</span>
                    <span className="font-black text-[#2563EB]">20 pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
                  <AlertCircle className="w-3 h-3" />
                  {tr('points.custom')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="cara-kerja" className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-8">{tr('nav.caraKerja')}</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', icon: Users, title: lang === 'id' ? 'Daftar Tim' : 'Register Teams', desc: lang === 'id' ? 'Tambahkan squad yang bertanding' : 'Add competing squads' },
              { step: '2', icon: Camera, title: lang === 'id' ? 'Input Match' : 'Input Matches', desc: lang === 'id' ? 'Upload screenshot atau paste hasil' : 'Upload screenshot or paste results' },
              { step: '3', icon: Trophy, title: lang === 'id' ? 'Lihat Klasemen' : 'View Leaderboard', desc: lang === 'id' ? 'Klasemen otomatis terupdate' : 'Leaderboard auto-updates' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-lg mx-auto mb-3">{s.step}</div>
                <s.icon className="w-6 h-6 text-[#2563EB] mx-auto mb-2" />
                <h4 className="font-bold text-sm text-[#111827] mb-1">{s.title}</h4>
                <p className="text-[#6B7280] text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Free */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('whyFree.title')}</h3>
          <p className="text-[#6B7280] text-sm text-center mb-8 max-w-md mx-auto">{tr('whyFree.desc')}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, title: tr('whyFree.noAds'), desc: tr('whyFree.noAdsDesc'), color: '#2563EB' },
              { icon: Crown, title: tr('whyFree.noPremium'), desc: tr('whyFree.noPremiumDesc'), color: '#00b4d8' },
              { icon: Eye, title: tr('whyFree.openSource'), desc: tr('whyFree.openSourceDesc'), color: '#fbbf24' },
            ].map(f => (
              <div key={f.title} className="bg-[#F9FAFB] rounded-xl p-5 text-center border border-[#E5E7EB] hover:border-[#2563EB]/20 transition-colors group">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${f.color}10` }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h4 className="font-bold text-sm text-[#111827] mb-1 group-hover:text-[#2563EB] transition-colors">{f.title}</h4>
                <p className="text-[#6B7280] text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('compare.title')}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-md mx-auto">{tr('compare.desc')}</p>
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden max-w-lg mx-auto">
            {/* Header */}
            <div className="grid grid-cols-4 bg-white border-b border-[#E5E7EB]">
              <div className="px-3 py-3 text-[10px] font-bold text-[#6B7280]">{tr('compare.feature')}</div>
              <div className="px-3 py-3 text-center"><span className="brand-text text-xs font-black">FoxArea</span></div>
              <div className="px-3 py-3 text-center text-xs font-bold text-[#6B7280]">{tr('compare.excel')}</div>
              <div className="px-3 py-3 text-center text-xs font-bold text-[#6B7280]">{tr('compare.manual')}</div>
            </div>
            {/* Rows */}
            {[
              { feature: tr('compare.autoCalc'), bit8: true, excel: 'partial', manual: false },
              { feature: tr('compare.aiScan'), bit8: true, excel: false, manual: false },
              { feature: tr('compare.realtime'), bit8: true, excel: false, manual: false },
              { feature: tr('compare.share'), bit8: true, excel: false, manual: false },
              { feature: tr('compare.export'), bit8: true, excel: true, manual: false },
              { feature: tr('compare.multiMatch'), bit8: true, excel: 'partial', manual: 'partial' },
              { feature: tr('compare.price'), bit8: 'free', excel: 'paid', manual: 'free2' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-4 border-b border-[#E5E7EB]/50 hover:bg-[#2563EB]/5 transition-colors">
                <div className="px-3 py-2.5 text-[11px] text-[#4B5563]">{row.feature}</div>
                <div className="px-3 py-2.5 flex items-center justify-center">
                  {row.bit8 === true ? <CheckCircle2 className="w-4 h-4 text-[#2563EB]" /> :
                   row.bit8 === 'free' ? <span className="text-[10px] font-black text-[#2563EB]">{tr('compare.free')}</span> : null}
                </div>
                <div className="px-3 py-2.5 flex items-center justify-center">
                  {row.excel === true ? <CheckCircle2 className="w-4 h-4 text-[#2563EB]" /> :
                   row.excel === false ? <XCircle className="w-4 h-4 text-[#9CA3AF]" /> :
                   row.excel === 'partial' ? <span className="text-[9px] font-bold text-[#fbbf24] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded">{lang === 'id' ? 'Sebagian' : 'Partial'}</span> :
                   row.excel === 'paid' ? <span className="text-[10px] font-bold text-[#ff6b6b]">{tr('compare.paid')}</span> : null}
                </div>
                <div className="px-3 py-2.5 flex items-center justify-center">
                  {row.manual === true ? <CheckCircle2 className="w-4 h-4 text-[#2563EB]" /> :
                   row.manual === false ? <XCircle className="w-4 h-4 text-[#9CA3AF]" /> :
                   row.manual === 'partial' ? <span className="text-[9px] font-bold text-[#fbbf24] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded">{lang === 'id' ? 'Sebagian' : 'Partial'}</span> :
                   row.manual === 'free2' ? <span className="text-[10px] font-bold text-[#6B7280]">{tr('compare.free2')}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ⭐ Testimonials - Enhanced (Feature 9) */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-8">{tr('testimonials.title')}</h3>
          <div className="grid sm:grid-cols-3 gap-4 stagger-reveal">
            {[
              { name: 'Ahmad R.', role: lang === 'id' ? 'Organizer — FFWS Indonesia 2025' : 'Organizer — FFWS Indonesia 2025', text: lang === 'id' ? 'FoxArea mengubah cara kami mengelola turnamen. Klasemen real-time dan AI scanner-nya luar biasa!' : 'FoxArea transformed how we manage tournaments. The real-time leaderboard and AI scanner are incredible!', avatar: 'AR', color: '#2563EB', tournament: 'FFWS Indonesia 2025' },
              { name: 'Sarah K.', role: lang === 'id' ? 'Admin — Clash Squad Cup' : 'Admin — Clash Squad Cup', text: lang === 'id' ? 'Bracket eliminasi visual sangat membantu. Semua tim bisa lihat perkembangan langsung!' : 'The visual elimination bracket is super helpful. All teams can see progress in real-time!', avatar: 'SK', color: '#00b4d8', tournament: 'Clash Squad Cup' },
              { name: 'Budi P.', role: lang === 'id' ? 'Ketua — Weekly Tournament Community' : 'Head — Weekly Tournament Community', text: lang === 'id' ? 'Gratis, tanpa iklan, dan fiturnya lebih lengkap dari tool berbayar. Luar biasa!' : 'Free, no ads, and features more complete than paid tools. Amazing!', avatar: 'BP', color: '#a78bfa', tournament: 'Weekly Tournament' },
            ].map((t, i) => (
              <div key={i} className={`testimonial-card bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB] transition-all ${testimonialIdx === i ? 'ring-2 ring-[#2563EB]/30 shadow-lg' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-[#111827]">{t.name}</div>
                    <div className="text-[10px] text-[#6B7280]">{t.role}</div>
                  </div>
                </div>
                <p className="text-xs text-[#4B5563] leading-relaxed mb-3">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, s) => <Star key={s} className="w-3 h-3 fill-[#fbbf24] text-[#fbbf24]" />)}
                  </div>
                  <Badge variant="secondary" className="text-[8px] bg-[#F3F4F6] text-[#6B7280] border-0 h-5">{t.tournament}</Badge>
                </div>
              </div>
            ))}
          </div>
          {/* Mobile dots indicator */}
          <div className="flex justify-center gap-1.5 mt-4 sm:hidden">
            {[0,1,2].map(i => (
              <button key={i} onClick={() => setTestimonialIdx(i)} className={`w-2 h-2 rounded-full transition-all ${testimonialIdx === i ? 'bg-[#2563EB] w-4' : 'bg-[#D1D5DB]'}`} />
            ))}
          </div>
        </section>

        {/* 👥 Community Hub */}
        <section id="community" className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('community.title')}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-md mx-auto">{tr('community.desc')}</p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB] hover:border-[#5865F2]/40 transition-all group text-center">
              <div className="w-12 h-12 rounded-xl bg-[#5865F2]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#5865F2]/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-[#5865F2]" />
              </div>
              <h4 className="font-bold text-sm text-[#111827] group-hover:text-[#5865F2] transition-colors">Discord</h4>
              <p className="text-[10px] text-[#6B7280] mt-1">{lang === 'id' ? 'Diskusi & update turnamen' : 'Tournament discussions & updates'}</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span className="text-[10px] text-[#2563EB] font-bold">1,247 {lang === 'id' ? 'online' : 'online'}</span>
              </div>
            </a>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB] hover:border-green-500/40 transition-all group text-center">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <h4 className="font-bold text-sm text-[#111827] group-hover:text-green-500 transition-colors">WhatsApp</h4>
              <p className="text-[10px] text-[#6B7280] mt-1">{lang === 'id' ? 'Chat langsung dengan admin' : 'Chat directly with admins'}</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-500 font-bold">538 {lang === 'id' ? 'anggota' : 'members'}</span>
              </div>
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB] hover:border-pink-500/40 transition-all group text-center">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-pink-500/20 transition-colors">
                <Instagram className="w-6 h-6 text-pink-500" />
              </div>
              <h4 className="font-bold text-sm text-[#111827] group-hover:text-pink-500 transition-colors">Instagram</h4>
              <p className="text-[10px] text-[#6B7280] mt-1">{lang === 'id' ? 'Highlight & result turnamen' : 'Tournament highlights & results'}</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="text-[10px] text-pink-500 font-bold">3.2K {lang === 'id' ? 'pengikut' : 'followers'}</span>
              </div>
            </a>
          </div>
        </section>

        {/* 🏅 Milestone Badges */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('milestone.title')}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-md mx-auto">{tr('milestone.desc')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto stagger-reveal">
            {[
              { icon: Trophy, value: '500+', label: tr('milestone.tournaments'), color: '#2563EB', glow: true },
              { icon: Users, value: '5,000+', label: tr('milestone.teams'), color: '#00b4d8', glow: false },
              { icon: Swords, value: '10K+', label: tr('milestone.matches'), color: '#a78bfa', glow: false },
              { icon: Star, value: '99%', label: tr('milestone.satisfaction'), color: '#fbbf24', glow: true },
            ].map((badge, i) => (
              <div key={i} className={`bg-[#F9FAFB] rounded-xl p-5 text-center border border-[#E5E7EB] hover:border-[#2563EB]/20 transition-all group ${badge.glow ? 'milestone-glow' : ''}`}>
                <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center relative" style={{ background: `${badge.color}10` }}>
                  <badge.icon className="w-7 h-7" style={{ color: badge.color }} />
                  {badge.glow && <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: `0 0 20px ${badge.color}30` }} />}
                </div>
                <div className="text-xl sm:text-2xl font-black mb-1" style={{ color: badge.color }}>{badge.value}</div>
                <div className="text-[10px] text-[#6B7280] font-medium">{badge.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 🎮 Tournament Format Explorer */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('format.title')}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-md mx-auto">{tr('format.desc')}</p>
          <div className="max-w-lg mx-auto">
            {/* Format selector */}
            <div className="flex gap-2 mb-6 justify-center">
              {[
                { id: 'ffws', label: 'FFWS', color: '#2563EB' },
                { id: 'custom8', label: lang === 'id' ? '8 Tim Custom' : '8 Teams Custom', color: '#00b4d8' },
                { id: 'custom16', label: lang === 'id' ? '16 Tim' : '16 Teams', color: '#a78bfa' },
              ].map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setTableTemplate(fmt.id === 'ffws' ? 'ffws' : fmt.id === 'custom8' ? 'compact' : 'detailed')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${tableTemplate === (fmt.id === 'ffws' ? 'ffws' : fmt.id === 'custom8' ? 'compact' : 'detailed') ? `border-[${fmt.color}] bg-[${fmt.color}]/10 text-[${fmt.color}]` : 'border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] hover:border-[#2563EB]/30'}`}
                  style={tableTemplate === (fmt.id === 'ffws' ? 'ffws' : fmt.id === 'custom8' ? 'compact' : 'detailed') ? { borderColor: fmt.color, backgroundColor: `${fmt.color}10`, color: fmt.color } : {}}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
            {/* Point table preview */}
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="grid grid-cols-3 bg-white border-b border-[#E5E7EB]">
                <div className="px-4 py-2.5 text-[10px] font-bold text-[#6B7280]">{lang === 'id' ? 'Posisi' : 'Placement'}</div>
                <div className="px-4 py-2.5 text-[10px] font-bold text-[#2563EB] text-center">{tr('points.placement')}</div>
                <div className="px-4 py-2.5 text-[10px] font-bold text-[#ff6b6b] text-center">{tr('points.kill')}</div>
              </div>
              {(tableTemplate === 'ffws' ? [
                { pos: 1, pp: 12 }, { pos: 2, pp: 9 }, { pos: 3, pp: 8 }, { pos: 4, pp: 7 },
                { pos: 5, pp: 6 }, { pos: 6, pp: 5 }, { pos: 7, pp: 4 }, { pos: 8, pp: 3 },
                { pos: 9, pp: 2 }, { pos: 10, pp: 1 }, { pos: 11, pp: 0 }, { pos: 12, pp: 0 },
              ] : tableTemplate === 'compact' ? [
                { pos: 1, pp: 10 }, { pos: 2, pp: 7 }, { pos: 3, pp: 6 }, { pos: 4, pp: 5 },
                { pos: 5, pp: 4 }, { pos: 6, pp: 3 }, { pos: 7, pp: 2 }, { pos: 8, pp: 1 },
              ] : [
                { pos: 1, pp: 15 }, { pos: 2, pp: 12 }, { pos: 3, pp: 10 }, { pos: 4, pp: 8 },
                { pos: 5, pp: 7 }, { pos: 6, pp: 6 }, { pos: 7, pp: 5 }, { pos: 8, pp: 4 },
                { pos: 9, pp: 3 }, { pos: 10, pp: 2 }, { pos: 11, pp: 1 }, { pos: 12, pp: 1 },
                { pos: 13, pp: 0 }, { pos: 14, pp: 0 }, { pos: 15, pp: 0 }, { pos: 16, pp: 0 },
              ]).map(p => (
                <div key={p.pos} className="grid grid-cols-3 border-b border-[#E5E7EB]/50 hover:bg-[#2563EB]/5 transition-colors">
                  <div className="px-4 py-2 flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${p.pos <= 3 ? `rank-${p.pos} text-black` : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{p.pos}</div>
                    <span className="text-[11px] text-[#4B5563]">#{p.pos}</span>
                  </div>
                  <div className="px-4 py-2 text-center text-xs font-bold text-[#2563EB]">+{p.pp}</div>
                  <div className="px-4 py-2 text-center text-xs font-bold text-[#ff6b6b]">+{tableTemplate === 'detailed' ? 2 : 1}</div>
                </div>
              ))}
              <div className="px-4 py-3 flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                <AlertCircle className="w-3 h-3" />
                {tr('points.custom')}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Demo - Interactive */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-2">{tr('demo.title')}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8 max-w-md mx-auto">{tr('demo.desc')}</p>
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden max-w-lg mx-auto">
            {/* Header */}
            <div className="grid grid-cols-5 bg-white border-b border-[#E5E7EB]">
              <div className="px-3 py-2.5 text-[10px] font-bold text-[#6B7280]">{tr('demo.team')}</div>
              <div className="px-3 py-2.5 text-[10px] font-bold text-[#6B7280] text-center">{tr('demo.placement')}</div>
              <div className="px-3 py-2.5 text-[10px] font-bold text-[#6B7280] text-center">{tr('demo.kills')}</div>
              <div className="px-3 py-2.5 text-[10px] font-bold text-[#6B7280] text-center">PP</div>
              <div className="px-3 py-2.5 text-[10px] font-bold text-[#6B7280] text-center">{tr('demo.totalPts')}</div>
            </div>
            {/* Demo Rows */}
            {demoEntries.map((entry, i) => {
              const pp = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 }[entry.placement] || 0
              const kp = entry.kills * 1
              const total = pp + kp
              return (
                <div key={i} className="grid grid-cols-5 border-b border-[#E5E7EB]/50 items-center hover:bg-[#2563EB]/5 transition-colors">
                  <div className="px-3 py-2.5 flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black ${entry.placement <= 3 ? `rank-${entry.placement} text-black` : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{entry.placement}</div>
                    <span className="text-[11px] font-bold text-[#111827]">{entry.tag}</span>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-center gap-1">
                    <button onClick={() => { const u = [...demoEntries]; u[i] = { ...u[i], placement: Math.max(1, u[i].placement - 1) }; setDemoEntries(u) }} className="w-5 h-5 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold transition-colors">-</button>
                    <span className="text-xs font-bold text-[#111827] w-5 text-center">{entry.placement}</span>
                    <button onClick={() => { const u = [...demoEntries]; u[i] = { ...u[i], placement: Math.min(12, u[i].placement + 1) }; setDemoEntries(u) }} className="w-5 h-5 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold transition-colors">+</button>
                  </div>
                  <div className="px-3 py-2.5 flex items-center justify-center gap-1">
                    <button onClick={() => { const u = [...demoEntries]; u[i] = { ...u[i], kills: Math.max(0, u[i].kills - 1) }; setDemoEntries(u) }} className="w-5 h-5 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold transition-colors">-</button>
                    <span className="text-xs font-bold text-[#111827] w-4 text-center">{entry.kills}</span>
                    <button onClick={() => { const u = [...demoEntries]; u[i] = { ...u[i], kills: Math.min(20, u[i].kills + 1) }; setDemoEntries(u) }} className="w-5 h-5 rounded bg-[#F3F4F6] text-[#6B7280] hover:text-[#2563EB] flex items-center justify-center text-xs font-bold transition-colors">+</button>
                  </div>
                  <div className="px-3 py-2.5 text-center text-[11px] text-[#4B5563]">{pp}</div>
                  <div className="px-3 py-2.5 text-center text-xs font-black text-[#2563EB]">{total}</div>
                </div>
              )
            })}
            {/* Total row */}
            <div className="grid grid-cols-5 bg-white px-3 py-2.5">
              <div className="text-[10px] font-bold text-[#6B7280]">{lang === 'id' ? 'Total semua' : 'Grand total'}</div>
              <div />
              <div className="text-center text-[11px] font-bold text-[#4B5563]">{demoEntries.reduce((s, e) => s + e.kills, 0)}</div>
              <div className="text-center text-[11px] font-bold text-[#4B5563]">{demoEntries.reduce((s, e) => s + ({ 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 }[e.placement] || 0), 0)}</div>
              <div className="text-center text-xs font-black text-[#2563EB]">{demoEntries.reduce((s, e) => s + ({ 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 }[e.placement] || 0) + e.kills, 0)}</div>
            </div>
            <div className="px-4 py-3 flex justify-center">
              <Button size="sm" variant="ghost" onClick={() => setDemoEntries([ { name: 'EVOS Legend', tag: 'EVS', placement: 1, kills: 8 }, { name: 'RRQ Hoshi', tag: 'RRQ', placement: 2, kills: 6 }, { name: 'Bigetron Alpha', tag: 'BTR', placement: 3, kills: 5 }, { name: 'ONIC Esports', tag: 'ONIC', placement: 4, kills: 3 }, ])} className="text-[#6B7280] text-xs gap-1.5 h-7">
                <RotateCcw className="w-3 h-3" />{tr('demo.reset')}
              </Button>
            </div>
          </div>
        </section>

        {/* What's New */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-8 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-[#fbbf24]" />{tr('whatsnew.title')}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto stagger-reveal">
            {[
              { title: tr('whatsnew.1.title'), desc: tr('whatsnew.1.desc'), icon: Camera, color: '#2563EB' },
              { title: tr('whatsnew.2.title'), desc: tr('whatsnew.2.desc'), icon: Trophy, color: '#00b4d8' },
              { title: tr('whatsnew.3.title'), desc: tr('whatsnew.3.desc'), icon: Sun, color: '#fbbf24' },
              { title: tr('whatsnew.4.title'), desc: tr('whatsnew.4.desc'), icon: Globe, color: '#a78bfa' },
            ].map((item, i) => (
              <div key={i} className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] hover:border-[#2563EB]/20 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors">{item.title}</h4>
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-[#2563EB] text-white">{tr('whatsnew.badge')}</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🏅 Hall of Fame / Top Teams (Feature 2) */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-1">{lang === 'id' ? 'Hall of Fame' : 'Hall of Fame'}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8">{lang === 'id' ? 'Top 10 tim terbaik sepanjang waktu' : 'Top 10 teams of all time'}</p>
          {hallOfFame.length > 0 ? (
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden max-w-lg mx-auto">
              <div className="grid grid-cols-5 bg-white border-b border-[#E5E7EB]">
                <div className="px-3 py-2 text-[10px] font-bold text-[#6B7280]">#</div>
                <div className="px-3 py-2 text-[10px] font-bold text-[#6B7280] col-span-2">{lang === 'id' ? 'Tim' : 'Team'}</div>
                <div className="px-3 py-2 text-[10px] font-bold text-[#6B7280] text-center">{lang === 'id' ? 'Turnamen' : 'Played'}</div>
                <div className="px-3 py-2 text-[10px] font-bold text-[#6B7280] text-right">Pts</div>
              </div>
              {hallOfFame.map((team, i) => (
                <div key={team.id} className={`grid grid-cols-5 border-b border-[#E5E7EB]/50 hover:bg-[#2563EB]/5 transition-colors ${i === 0 ? 'bg-[#FFD700]/5' : i === 1 ? 'bg-[#C0C0C0]/5' : i === 2 ? 'bg-[#CD7F32]/5' : ''}`}>
                  <div className="px-3 py-2.5 flex items-center">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${i === 0 ? 'rank-1 text-black' : i === 1 ? 'rank-2 text-black' : i === 2 ? 'rank-3 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                      {i + 1}
                    </div>
                  </div>
                  <div className="px-3 py-2.5 col-span-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-[#111827]">{team.name}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{team.tag}</span>
                    {i === 0 && <Badge className="text-[7px] font-black bg-[#FFD700]/20 text-[#92400e] border-0 h-4 px-1"><Crown className="w-2.5 h-2.5 mr-0.5" />{lang === 'id' ? 'Juara' : 'Champ'}</Badge>}
                  </div>
                  <div className="px-3 py-2.5 text-center text-[11px] text-[#6B7280]">{team.tournamentCount}</div>
                  <div className="px-3 py-2.5 text-right text-xs font-black" style={{ color: i === 0 ? '#FFD700' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : '#2563EB' }}>{team.totalPoints}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] p-8 text-center max-w-lg mx-auto">
              <Trophy className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-xs text-[#6B7280]">{lang === 'id' ? 'Belum ada data tim — mulai turnamen pertama!' : 'No team data yet — start your first tournament!'}</p>
            </div>
          )}
        </section>

        {/* 📡 Community Activity Wall (Feature 6) */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-1">{lang === 'id' ? 'Aktivitas Komunitas' : 'Community Activity'}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-8">{lang === 'id' ? 'Aktivitas terbaru di platform FoxArea' : 'Latest activity on FoxArea platform'}</p>
          <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden max-w-lg mx-auto max-h-96 overflow-y-auto">
            {activityFeed.length > 0 ? activityFeed.map(item => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#E5E7EB]/50 hover:bg-[#2563EB]/5 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${item.action === 'tournament_created' ? '#2563EB' : item.action === 'tournament_live' ? '#ff6b6b' : '#00b4d8'}15` }}>
                  {item.action === 'tournament_created' ? <Trophy className="w-4 h-4 text-[#2563EB]" /> : item.action === 'tournament_live' ? <Radio className="w-4 h-4 text-[#ff6b6b]" /> : <Users className="w-4 h-4 text-[#00b4d8]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#111827]">{item.details}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">{item.action === 'tournament_created' ? (lang === 'id' ? 'Turnamen dibuat' : 'Tournament created') : item.action === 'tournament_live' ? (lang === 'id' ? 'Sedang berlangsung' : 'Now live') : (lang === 'id' ? 'Tim bergabung' : 'Teams joined')}</p>
                </div>
                <span className="text-[9px] text-[#9CA3AF] flex-shrink-0 mt-1">{getRelativeTime(item.createdAt)}</span>
              </div>
            )) : (
              <div className="p-8 text-center">
                <Activity className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                <p className="text-xs text-[#6B7280]">{lang === 'id' ? 'Belum ada aktivitas' : 'No activity yet'}</p>
              </div>
            )}
          </div>
        </section>

        {/* 🗳️ Poll / Vote Widget (Feature 7) */}
        {pollTournamentId && pollData.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
            <h3 className="text-lg font-bold text-[#111827] text-center mb-1">{lang === 'id' ? 'Prediksi Turnamen' : 'Tournament Prediction'}</h3>
            <p className="text-[#6B7280] text-xs text-center mb-8">{lang === 'id' ? 'Siapa yang akan menang?' : 'Who will win?'}</p>
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden max-w-md mx-auto">
              <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-bold text-[#111827]">{lang === 'id' ? 'Vote Sekarang!' : 'Vote Now!'}</span>
                </div>
                <span className="text-[10px] text-[#6B7280]">{pollData.reduce((s, v) => s + v.voteCount, 0)} {lang === 'id' ? 'suara' : 'votes'}</span>
              </div>
              <div className="p-4 space-y-2">
                {pollData.slice(0, 6).map((team) => {
                  const totalVotes = pollData.reduce((s, v) => s + v.voteCount, 0)
                  const pct = totalVotes > 0 ? Math.round((team.voteCount / totalVotes) * 100) : 0
                  const hasVoted = !!userVotes[pollTournamentId]
                  const isVoted = userVotes[pollTournamentId] === team.teamId
                  return (
                    <button key={team.teamId} onClick={() => !hasVoted && handlePollVote(team.teamId)} disabled={hasVoted} className={`w-full text-left rounded-lg p-3 border transition-all ${isVoted ? 'border-[#2563EB] bg-[#2563EB]/5' : hasVoted ? 'border-[#E5E7EB] bg-white cursor-default' : 'border-[#E5E7EB] bg-white hover:border-[#2563EB]/30 cursor-pointer'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#111827]">{team.teamName}</span>
                          <span className="text-[10px] text-[#9CA3AF]">{team.teamTag}</span>
                          {isVoted && <CheckCircle2 className="w-3 h-3 text-[#2563EB]" />}
                        </div>
                        <span className="text-[10px] font-bold text-[#2563EB]">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: isVoted ? '#2563EB' : '#9CA3AF' }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        )}
        {/* 🤝 Partners & Sponsors Logo Bar (Feature 8) */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-1">{lang === 'id' ? 'Mitra & Sponsor' : 'Partners & Sponsors'}</h3>
          <p className="text-[#6B7280] text-xs text-center mb-6">{lang === 'id' ? 'Dipercaya oleh komunitas esports terbaik' : 'Trusted by top esports communities'}</p>
          <div className="overflow-hidden">
            <div className="partner-scroll flex gap-8 items-center whitespace-nowrap">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-8 items-center">
                  {[
                    { name: 'ESL', bg: '#1a1a2e', text: '#e94560' },
                    { name: 'MPL', bg: '#00b4d8', text: '#fff' },
                    { name: 'FFWS', bg: '#2563EB', text: '#fff' },
                    { name: 'Moonton', bg: '#111827', text: '#fbbf24' },
                    { name: 'Garena', bg: '#22c55e', text: '#fff' },
                    { name: 'EVOS', bg: '#2563EB', text: '#fff' },
                    { name: 'RRQ', bg: '#1e3a5f', text: '#fbbf24' },
                    { name: 'BTR', bg: '#ff6b6b', text: '#fff' },
                    { name: 'ONIC', bg: '#a78bfa', text: '#fff' },
                  ].map((s, j) => (
                    <div key={`${s.name}-${i}-${j}`} className="flex-shrink-0 w-24 h-12 rounded-lg flex items-center justify-center border border-[#E5E7EB]" style={{ background: s.bg }}>
                      <span className="text-sm font-black tracking-wider" style={{ color: s.text }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-4">
            <Button variant="outline" size="sm" className="text-xs text-[#6B7280] border-[#E5E7EB] hover:border-[#2563EB]/30 hover:text-[#2563EB] h-8 rounded-lg">
              {lang === 'id' ? 'Jadi Mitra →' : 'Become a Partner →'}
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <h3 className="text-lg font-bold text-[#111827] text-center mb-8">{tr('faq.title')}</h3>
          <div className="space-y-3 max-w-lg mx-auto">
            {[
              { q: tr('faq.q1'), a: tr('faq.a1') },
              { q: tr('faq.q2'), a: tr('faq.a2') },
              { q: tr('faq.q3'), a: tr('faq.a3') },
              { q: tr('faq.q4'), a: tr('faq.a4') },
            ].map((faq, i) => (
              <details key={i} className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] group">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-[#111827] hover:text-[#2563EB] transition-colors">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-[#6B7280] group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 pb-4 text-xs text-[#4B5563] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-4 pb-16 reveal">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="cta-border-anim p-[1px] rounded-2xl">
              <div className="bg-white rounded-2xl p-8 sm:p-12 text-center">
                <h3 className="text-xl sm:text-2xl font-black text-[#111827] mb-3">{tr('cta.title')}</h3>
                <p className="text-[#4B5563] text-sm max-w-md mx-auto mb-6">{tr('cta.desc')}</p>
                <Button size="lg" onClick={handleEnterApp} className="brand-gradient text-white font-bold gap-2 px-8 h-12 rounded-xl hover:opacity-90 transition-opacity">
                  <Zap className="w-4 h-4" />{tr('cta.button')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer with Offline Ready indicator */}
        <footer className="border-t border-[#E5E7EB]">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2"><LogoFoxArea size={24} /><span className="font-black brand-text">FoxArea</span></div>
              <div className="flex gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-[#2563EB] transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-[#ff6b6b] transition-colors"><Youtube className="w-5 h-5" /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-[#00b4d8] transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-[#111827] transition-colors"><Github className="w-5 h-5" /></a>
                <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-green-500 transition-colors"><MessageCircle className="w-5 h-5" /></a>
              </div>
              <p className="text-[10px] text-[#9CA3AF]">{tr('footer.madeWith')} <Heart className="w-3 h-3 inline text-[#ff6b6b]" /> {tr('footer.forCommunity')}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-[9px] text-[#9CA3AF]">
                  {isOffline ? <WifiOff className="w-3 h-3 text-[#ff6b6b]" /> : <Wifi className="w-3 h-3 text-[#22c55e]" />}
                  {isOffline ? (lang === 'id' ? 'Mode Offline' : 'Offline Mode') : (lang === 'id' ? 'Online' : 'Online')}
                </span>
                <span className="text-[9px] text-[#D1D5DB]">•</span>
                <span className="flex items-center gap-1 text-[9px] text-[#22c55e]">
                  <ShieldCheck className="w-3 h-3" />{lang === 'id' ? 'Offline Ready' : 'Offline Ready'}
                </span>
              </div>
            </div>
          </div>
        </footer>

        {/* PWA Install Banner */}
        {showPwaBanner && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 pwa-banner-enter">
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 shadow-2xl shadow-black/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg brand-gradient flex items-center justify-center flex-shrink-0">
                  <LogoFoxArea size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-[#111827]">{tr('pwa.install')}</h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">{tr('pwa.desc')}</p>
                </div>
                <button onClick={() => { setShowPwaBanner(false); localStorage.setItem('ffscorer_pwa_dismissed', '1') }} className="text-[#6B7280] hover:text-[#111827] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => setDeferredPrompt(null)) } setShowPwaBanner(false) }} className="flex-1 brand-gradient text-white font-bold text-xs h-8">
                  {tr('pwa.installBtn')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowPwaBanner(false); localStorage.setItem('ffscorer_pwa_dismissed', '1') }} className="text-[#6B7280] text-xs h-8">
                  {tr('pwa.dismiss')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Back to top */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`back-to-top ${showBackToTop ? 'visible' : ''} w-10 h-10 rounded-full brand-gradient text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity`}>
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ======== RENDER: LOGIN ========
  if (pageState === 'login') {
    return (
      <div className={`page-fade-in min-h-screen ${theme === 'dark' ? 'dark-theme' : ''} bg-white flex items-center justify-center p-4`}>
        {/* reCAPTCHA container — invisible, required by Firebase */}
        <div ref={recaptchaContainerRef} id="recaptcha-container" />

        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mb-4"><LogoFoxArea size={56} /></div>
            <h1 className="text-2xl font-black brand-text">FOXAREA</h1>
            <p className="text-xs text-[#6B7280] tracking-widest mt-1">TOURNAMENT</p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex mb-6 bg-[#F3F4F6] rounded-xl p-1">
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${loginMethod === 'phone' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#6B7280] hover:text-[#4B5563]'}`}
            >
              <Phone className="w-3.5 h-3.5" />
              {lang === 'id' ? 'No. HP' : 'Phone'}
            </button>
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${loginMethod === 'email' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#6B7280] hover:text-[#4B5563]'}`}
            >
              <Mail className="w-3.5 h-3.5" />
              {lang === 'id' ? 'Email' : 'Email'}
            </button>
          </div>

          {/* ===== PHONE OTP LOGIN ===== */}
          {loginMethod === 'phone' && (
            <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-[#E5E7EB]">
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">{lang === 'id' ? 'Login dengan OTP' : 'Login with OTP'}</h2>
              <p className="text-xs text-[#6B7280] text-center mb-6">{lang === 'id' ? 'Verifikasi nomor HP untuk melanjutkan' : 'Verify phone number to continue'}</p>

              {!phoneOtpSent ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#4B5563] text-xs">{lang === 'id' ? 'Nomor HP' : 'Phone Number'}</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <Input
                        placeholder="+628xxxxxxxxxx"
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl pl-10"
                      />
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-1.5">Format: +62 kode negara lalu nomor HP</p>
                  </div>
                  <Button
                    onClick={handleSendPhoneOTP}
                    disabled={phoneOtpSending || !phoneNumber.trim()}
                    className="w-full brand-gradient text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {phoneOtpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : lang === 'id' ? 'Kirim OTP' : 'Send OTP'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[#4B5563] text-center">
                    {lang === 'id' ? 'Kode OTP dikirim ke' : 'OTP code sent to'} <span className="text-[#2563EB] font-bold">{phoneNumber}</span>
                  </p>
                  <div>
                    <Label className="text-[#4B5563] text-xs">{lang === 'id' ? 'Kode OTP' : 'OTP Code'}</Label>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      value={phoneOtp}
                      onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                      className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl mt-1 text-center text-lg tracking-[0.5em] font-mono"
                    />
                  </div>
                  <Button
                    onClick={handleVerifyPhoneOTP}
                    disabled={phoneOtpVerifying || phoneOtp.length < 6}
                    className="w-full brand-gradient text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    {phoneOtpVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : lang === 'id' ? 'Verifikasi' : 'Verify'}
                  </Button>
                  <button
                    onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); setConfirmationResult(null) }}
                    className="text-xs text-[#6B7280] hover:text-[#2563EB] transition-colors w-full text-center"
                  >
                    {lang === 'id' ? 'Kirim ulang OTP' : 'Resend OTP'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== EMAIL OTP LOGIN ===== */}
          {loginMethod === 'email' && (
            <div className="bg-[#F9FAFB] rounded-2xl p-6 border border-[#E5E7EB]">
              <h2 className="text-lg font-bold text-[#111827] text-center mb-1">{tr('auth.login')}</h2>
              <p className="text-xs text-[#6B7280] text-center mb-6">{lang === 'id' ? 'Verifikasi email untuk melanjutkan' : 'Verify email to continue'}</p>

              {!codeSent ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#4B5563] text-xs">{tr('auth.email')}</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <Input placeholder="you@email.com" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl pl-10" />
                    </div>
                  </div>
                  <Button onClick={handleSendCode} disabled={sendingCode || cooldown > 0} className="w-full brand-gradient text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                    {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : cooldown > 0 ? `${cooldown}s` : tr('auth.sendCode')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-[#4B5563] text-center">{devCode ? (lang === 'id' ? 'Kode verifikasi kamu:' : 'Your verification code:') : (lang === 'id' ? 'Kode verifikasi dikirim ke' : 'Verification code sent to')} {!devCode && <span className="text-[#2563EB]">{loginEmail}</span>}</p>
                  {devCode && (
                    <div className="bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-xl p-4 text-center">
                      <p className="text-[10px] text-[#6B7280] mb-1 uppercase tracking-wider">{lang === 'id' ? 'Kode Verifikasi' : 'Verification Code'}</p>
                      <p className="text-3xl font-black text-[#2563EB] font-mono tracking-[0.3em]">{devCode}</p>
                      <p className="text-[9px] text-[#6B7280] mt-2">{lang === 'id' ? 'Masukkan kode di atas' : 'Enter the code above'}</p>
                    </div>
                  )}
                  <div><Label className="text-[#4B5563] text-xs">{tr('auth.enterCode')}</Label><Input placeholder="000000" maxLength={6} value={loginCode} onChange={e => setLoginCode(e.target.value.replace(/\D/g, ''))} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl mt-1 text-center text-lg tracking-[0.5em] font-mono" /></div>
                  <Button onClick={handleVerifyCode} disabled={verifyingCode} className="w-full brand-gradient text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                    {verifyingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : tr('auth.verifyCode')}
                  </Button>
                  <button onClick={() => { setCodeSent(false); setLoginCode(''); setDevCode('') }} className="text-xs text-[#6B7280] hover:text-[#2563EB] transition-colors w-full text-center">{tr('auth.back')}</button>
                </div>
              )}
            </div>
          )}

          <button onClick={() => setPageState('beranda')} className="text-xs text-[#6B7280] hover:text-[#2563EB] transition-colors mt-6 flex items-center gap-1 mx-auto">
            <ArrowLeft className="w-3 h-3" />{tr('auth.back')}
          </button>
        </div>
      </div>
    )
  }

  // ======== RENDER: WORKSPACE — NO ACTIVE TOURNAMENT ========
  if (pageState === 'workspace' && !active) {
    return (
      <div className={`page-fade-in min-h-screen ${theme === 'dark' ? 'dark-theme' : ''} bg-white flex flex-col`}>
        {actionLoading && <LoadingOverlay text={actionLoading} />}
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-black text-[#111827]">{lang === 'id' ? 'Turnamen' : 'Tournaments'}</h2><p className="text-xs text-[#6B7280]">{lang === 'id' ? 'Pilih atau buat turnamen baru' : 'Select or create a new tournament'}</p></div>
            <Dialog open={createTournamentDialogOpen} onOpenChange={setCreateTournamentDialogOpen}>
              <DialogTrigger asChild><Button className="brand-gradient text-white font-bold gap-2 rounded-xl hover:opacity-90 transition-opacity"><Plus className="w-4 h-4" />{tr('tournament.create')}</Button></DialogTrigger>
              <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-[#111827]">{tr('tournament.create')}</DialogTitle><DialogDescription className="text-[#6B7280]">{lang === 'id' ? 'Isi detail turnamen' : 'Fill tournament details'}</DialogDescription></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label className="text-[#4B5563]">{lang === 'id' ? 'Nama Turnamen' : 'Tournament Name'} *</Label><Input placeholder="FFCS 2026" value={tName} onChange={e => setTName(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                  <div><Label className="text-[#4B5563]">{tr('tournament.description')}</Label><Input placeholder="Opsional" value={tDesc} onChange={e => setTDesc(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                  {/* Feature 3: Schedule */}
                  <div><Label className="text-[#4B5563]">{lang === 'id' ? 'Jadwal Mulai' : 'Scheduled Start'}</Label><Input type="datetime-local" value={tScheduledAt} onChange={e => setTScheduledAt(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                  {/* Feature 5: Prize Pool */}
                  <div><Label className="text-[#4B5563]">{lang === 'id' ? 'Prize Pool' : 'Prize Pool'}</Label><Input placeholder="Rp 5.000.000" value={tPrizePool} onChange={e => setTPrizePool(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                  <div><Label className="text-[#4B5563]">{lang === 'id' ? 'Distribusi Hadiah (%)' : 'Prize Distribution (%)'}</Label><Input placeholder='{"1":40,"2":25,"3":15,"4":10,"5":10}' value={tPrizeDist} onChange={e => setTPrizeDist(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl text-xs font-mono" /><p className="text-[9px] text-[#9CA3AF] mt-1">{lang === 'id' ? 'Format JSON: {"posisi":persentase}' : 'JSON format: {"position":percentage}'}</p></div>
                  {/* Feature 7: Stream URL */}
                  <div><Label className="text-[#4B5563]">{lang === 'id' ? 'URL Live Stream' : 'Live Stream URL'}</Label><Input placeholder="https://youtube.com/watch?v=..." value={tStreamUrl} onChange={e => setTStreamUrl(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                  {/* Mode Selector */}
                  <div>
                    <Label className="text-[#4B5563] mb-2 block">{lang === 'id' ? 'Mode Turnamen' : 'Tournament Mode'}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => handleModeChange('battle_royale')} className={`p-2.5 rounded-xl border text-left transition-all ${tournamentMode === 'battle_royale' ? 'border-[#2563EB] bg-[#2563EB]/10' : 'border-[#E5E7EB] bg-white hover:border-[#2563EB]/30'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5"><Swords className="w-3.5 h-3.5 text-[#2563EB]" /><span className="text-xs font-bold text-[#111827]">Battle Royale</span></div>
                        <p className="text-[9px] text-[#6B7280]">{lang === 'id' ? '12 tim, poin per posisi' : '12 teams, points per placement'}</p>
                      </button>
                      <button type="button" onClick={() => handleModeChange('clash_squad')} className={`p-2.5 rounded-xl border text-left transition-all ${tournamentMode === 'clash_squad' ? 'border-[#ff6b6b] bg-[#ff6b6b]/10' : 'border-[#E5E7EB] bg-white hover:border-[#ff6b6b]/30'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5"><Swords className="w-3.5 h-3.5 text-[#ff6b6b]" /><span className="text-xs font-bold text-[#111827]">Clash Squad</span></div>
                        <p className="text-[9px] text-[#6B7280]">{lang === 'id' ? '1v1 sistem gugur' : '1v1 single elimination'}</p>
                      </button>
                      <button type="button" onClick={() => handleModeChange('swiss')} className={`p-2.5 rounded-xl border text-left transition-all ${tournamentMode === 'swiss' ? 'border-[#a78bfa] bg-[#a78bfa]/10' : 'border-[#E5E7EB] bg-white hover:border-[#a78bfa]/30'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5"><Activity className="w-3.5 h-3.5 text-[#a78bfa]" /><span className="text-xs font-bold text-[#111827]">Swiss</span></div>
                        <p className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Pairing berdasarkan rekam' : 'Pairing by record'}</p>
                      </button>
                      <button type="button" onClick={() => handleModeChange('round_robin')} className={`p-2.5 rounded-xl border text-left transition-all ${tournamentMode === 'round_robin' ? 'border-[#00b4d8] bg-[#00b4d8]/10' : 'border-[#E5E7EB] bg-white hover:border-[#00b4d8]/30'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5"><RotateCcw className="w-3.5 h-3.5 text-[#00b4d8]" /><span className="text-xs font-bold text-[#111827]">Round Robin</span></div>
                        <p className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Semua vs semua' : 'Everyone plays everyone'}</p>
                      </button>
                      <button type="button" onClick={() => handleModeChange('double_elim')} className={`p-2.5 rounded-xl border text-left transition-all col-span-2 ${tournamentMode === 'double_elim' ? 'border-[#fbbf24] bg-[#fbbf24]/10' : 'border-[#E5E7EB] bg-white hover:border-[#fbbf24]/30'}`}>
                        <div className="flex items-center gap-1.5 mb-0.5"><Crown className="w-3.5 h-3.5 text-[#fbbf24]" /><span className="text-xs font-bold text-[#111827]">Double Elimination</span></div>
                        <p className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Winners & Losers bracket + Grand Final' : 'Winners & Losers bracket + Grand Final'}</p>
                      </button>
                    </div>
                  </div>
                  {/* Swiss rounds config */}
                  {tournamentMode === 'swiss' && (
                    <div><Label className="text-[#4B5563]">{lang === 'id' ? 'Jumlah Round Swiss' : 'Swiss Rounds'}</Label><Select value={swissRounds} onValueChange={v => { setSwissRounds(v); setTMatches(v) }}><SelectTrigger className="bg-white border-[#E5E7EB] text-[#111827]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#F9FAFB] border-[#E5E7EB]">{[3,4,5,6,7].map(n=><SelectItem key={n} value={n.toString()}>{n} {lang === 'id' ? 'Round' : 'Rounds'}</SelectItem>)}</SelectContent></Select></div>
                  )}
                  <div className={tournamentMode === 'clash_squad' || tournamentMode === 'round_robin' || tournamentMode === 'double_elim' ? '' : 'grid grid-cols-2 gap-4'}>
                    <div><Label className="text-[#4B5563]">{tournamentMode === 'clash_squad' ? (lang === 'id' ? 'Jumlah Pemain' : 'Number of Players') : tournamentMode === 'round_robin' || tournamentMode === 'double_elim' ? (lang === 'id' ? 'Jumlah Tim' : 'Number of Teams') : tr('tournament.maxTeams')}</Label><Select value={tMax} onValueChange={setTMax}><SelectTrigger className="bg-white border-[#E5E7EB] text-[#111827]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#F9FAFB] border-[#E5E7EB]">{(tournamentMode === 'clash_squad' ? [4,8,16,32] : tournamentMode === 'round_robin' ? [4,5,6,8] : tournamentMode === 'double_elim' ? [4,8,16] : tournamentMode === 'swiss' ? [8,16,32] : [6,8,10,12,16,20]).map(n=><SelectItem key={n} value={n.toString()}>{n} {tournamentMode === 'clash_squad' ? (lang === 'id' ? 'Pemain' : 'Players') : 'Tim'}</SelectItem>)}</SelectContent></Select></div>
                    {tournamentMode !== 'clash_squad' && tournamentMode !== 'round_robin' && tournamentMode !== 'double_elim' && <div><Label className="text-[#4B5563]">{tr('tournament.matchCount')}</Label><Select value={tMatches} onValueChange={setTMatches}><SelectTrigger className="bg-white border-[#E5E7EB] text-[#111827]"><SelectValue /></SelectTrigger><SelectContent className="bg-[#F9FAFB] border-[#E5E7EB]">{[3,4,5,6,8,10,12].map(n=><SelectItem key={n} value={n.toString()}>{n} Match</SelectItem>)}</SelectContent></Select></div>}
                  </div>
                  {/* Point System - only for Battle Royale */}
                  {tournamentMode !== 'clash_squad' && (
                  <div className="border border-[#E5E7EB] rounded-xl p-3">
                    <button type="button" onClick={() => setShowPointEditor(!showPointEditor)} className="flex items-center justify-between w-full text-left">
                      <div className="flex items-center gap-2"><Target className="w-4 h-4 text-[#2563EB]" /><span className="text-sm font-bold text-[#4B5563]">{lang === 'id' ? 'Sistem Point' : 'Point System'}</span></div>
                      <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${showPointEditor ? 'rotate-180' : ''}`} />
                    </button>
                    {!showPointEditor && <div className="mt-2 text-[10px] text-[#6B7280]">FFWS Default: Booyah=12, Kill=1pt</div>}
                    {showPointEditor && (
                      <div className="mt-3 space-y-3">
                        <div><Label className="text-[#4B5563] text-xs mb-2 block">Point per Placement:</Label>
                          <div className="grid grid-cols-6 gap-1.5">{[1,2,3,4,5,6,7,8,9,10,11,12].map(p => (<div key={p} className="text-center"><div className="text-[9px] text-[#6B7280] mb-0.5">#{p}</div><Input type="number" min={0} max={99} value={customPP[p] ?? 0} onChange={e => setCustomPP({ ...customPP, [p]: parseInt(e.target.value) || 0 })} className="w-full h-7 text-center text-xs bg-white border-[#E5E7EB] text-[#111827] p-1 rounded-lg" /></div>))}</div>
                        </div>
                        <div className="flex items-center gap-3"><Label className="text-[#4B5563] text-xs">Point per Kill:</Label><Input type="number" min={0} max={10} value={customKillPt} onChange={e => setCustomKillPt(parseInt(e.target.value) || 1)} className="w-20 h-7 text-center text-xs bg-white border-[#E5E7EB] text-[#111827] p-1 rounded-lg" /></div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setCustomPP({ ...DEFAULT_PP }); setCustomKillPt(1) }} className="text-[10px] text-[#2563EB] hover:underline">FFWS Default</button>
                          <button type="button" onClick={() => { setCustomPP({1:15,2:12,3:10,4:8,5:6,6:5,7:4,8:3,9:2,10:1,11:0,12:0}); setCustomKillPt(2) }} className="text-[10px] text-[#00b4d8] hover:underline">Pro League</button>
                          <button type="button" onClick={() => { setCustomPP({1:10,2:7,3:6,4:5,5:4,6:3,7:2,8:1,9:0,10:0,11:0,12:0}); setCustomKillPt(1) }} className="text-[10px] text-[#6B7280] hover:underline">Local</button>
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                  <Button onClick={createTournament} className="w-full brand-gradient text-white font-bold rounded-xl hover:opacity-90 transition-opacity">{tr('tournament.create')}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!tournaments.length ? (
            <Card className="text-center py-16 bg-[#F9FAFB] border-[#E5E7EB] rounded-xl"><CardContent><Trophy className="w-14 h-14 text-[#374151] mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2 text-[#111827]">{tr('misc.noData')}</h3><p className="text-[#6B7280] text-sm">{lang === 'id' ? 'Buat turnamen pertama kamu!' : 'Create your first tournament!'}</p></CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map(t => {
                // Feature 3: Calculate countdown for scheduled tournaments
                const scheduleDiff = t.scheduledAt ? new Date(t.scheduledAt).getTime() - Date.now() : 0
                const isUpcoming = t.status === 'upcoming' || (t.scheduledAt && scheduleDiff > 0 && t.status !== 'completed')
                const isH1Day = t.scheduledAt && scheduleDiff > 0 && scheduleDiff < 86400000
                const isH1Hour = t.scheduledAt && scheduleDiff > 0 && scheduleDiff < 3600000
                return (
                <Card key={t.id} className="cursor-pointer bg-[#F9FAFB] border-[#E5E7EB] hover:border-[#2563EB]/30 transition-colors group rounded-xl" onClick={() => loadTournament(t.id)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] gap-1.5 bg-[#F3F4F6] text-[#4B5563]"><span className={`w-1.5 h-1.5 rounded-full ${t.status === 'ongoing' ? 'bg-[#2563EB] animate-pulse' : t.status === 'completed' ? 'bg-[#fbbf24]' : 'bg-[#9CA3AF]'}`} />{t.status === 'ongoing' ? 'LIVE' : t.status === 'completed' ? 'Selesai' : 'Mendatang'}</Badge>
                        {t.mode === 'clash_squad' && <Badge className="text-[8px] gap-1 bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/20"><Swords className="w-2.5 h-2.5" />CS</Badge>}
                        {t.mode === 'swiss' && <Badge className="text-[8px] gap-1 bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20"><Activity className="w-2.5 h-2.5" />Swiss</Badge>}
                        {t.mode === 'round_robin' && <Badge className="text-[8px] gap-1 bg-[#00b4d8]/10 text-[#00b4d8] border-[#00b4d8]/20"><RotateCcw className="w-2.5 h-2.5" />RR</Badge>}
                        {t.mode === 'double_elim' && <Badge className="text-[8px] gap-1 bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20"><Crown className="w-2.5 h-2.5" />DE</Badge>}
                        {/* Feature 3: H-1 indicators */}
                        {isH1Day && <Badge className="text-[8px] gap-1 bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20"><Timer className="w-2.5 h-2.5" />H-1</Badge>}
                        {isH1Hour && <Badge className="text-[8px] gap-1 bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/20 animate-pulse"><Timer className="w-2.5 h-2.5" />H-1h</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-[#ff6b6b]/10 transition-colors" onClick={e => { e.stopPropagation(); setConfirmDelete(t.id); setConfirmType('tournament') }}><Trash2 className="w-3.5 h-3.5 text-[#ff6b6b]" /></Button>
                    </div>
                    <h3 className="font-bold text-base mb-2 group-hover:text-[#2563EB] transition-colors text-[#111827]">{t.name}</h3>
                    {/* Feature 3: Countdown on card */}
                    {isUpcoming && t.scheduledAt && scheduleDiff > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] text-[#2563EB] font-bold">
                        <Clock className="w-3 h-3" />
                        {Math.floor(scheduleDiff / 86400000)}d {Math.floor((scheduleDiff % 86400000) / 3600000)}h {Math.floor((scheduleDiff % 3600000) / 60000)}m
                      </div>
                    )}
                    {/* Feature 5: Prize Pool on card */}
                    {t.prizePool && (
                      <div className="flex items-center gap-1.5 mb-2 text-[10px] text-[#fbbf24] font-bold">
                        <Trophy className="w-3 h-3" />{t.prizePool}
                      </div>
                    )}
                    {/* Feature 7: Watch Live button */}
                    {t.streamUrl && t.status === 'ongoing' && (
                      <a href={t.streamUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 mb-2 text-[10px] text-[#ff6b6b] font-bold hover:underline">
                        <Radio className="w-3 h-3 animate-pulse" />{lang === 'id' ? 'Tonton Live' : 'Watch Live'}
                      </a>
                    )}
                    <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t._count?.teams || 0}/{t.maxTeams}</span>
                      <span className="flex items-center gap-1"><Swords className="w-3 h-3" />{t._count?.matches || 0} match</span>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}
        </main>
        <footer className="border-t border-[#E5E7EB] mt-auto"><div className="max-w-7xl mx-auto px-4 py-4 text-center text-[10px] text-[#9CA3AF] flex items-center justify-center gap-2">FoxArea Tournament — AI-Powered Free Fire Tournament System{isOffline && <span className="flex items-center gap-1 text-[#fbbf24]"><WifiOff className="w-3 h-3" />{lang === 'id' ? 'Offline' : 'Offline'}</span>}{'serviceWorker' in navigator && <span className="flex items-center gap-1 text-[#22c55e]"><CheckCircle2 className="w-3 h-3" />{lang === 'id' ? 'Offline Ready' : 'Offline Ready'}</span>}</div></footer>
        <DeleteConfirmDialog />
      </div>
    )
  }

  // ======== RENDER: WORKSPACE — ACTIVE TOURNAMENT ========
  const pp = getPP(), kpt = getKillPt()

  return (
    <div className={`page-fade-in min-h-screen ${theme === 'dark' ? 'dark-theme' : ''} bg-white flex flex-col`}>
      {showCelebration && <ConfettiCelebration />}
      {actionLoading && <LoadingOverlay text={actionLoading} />}
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActive(null); setTeams([]); setMatches([]); setLeaderboard([]); setTab('home') }} className="flex items-center gap-2 text-[#6B7280] hover:text-[#2563EB] transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <LogoFoxArea size={24} />
            <div>
              <h2 className="text-sm font-bold text-[#111827] leading-tight">{active.name}</h2>
              <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                <Badge variant="secondary" className="text-[9px] h-4 gap-1 bg-[#F3F4F6] text-[#4B5563] px-1.5"><span className={`w-1 h-1 rounded-full ${active.status === 'ongoing' ? 'bg-[#2563EB] animate-pulse' : 'bg-[#9CA3AF]'}`} />{active.status === 'ongoing' ? 'LIVE' : active.status}</Badge>
                {/* Feature 4: Live mode indicator */}
                {liveMode && active.status === 'ongoing' && <span className="flex items-center gap-1 text-[9px] text-[#22c55e] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />LIVE</span>}
                <span><Users className="w-3 h-3 inline" /> {teams.length}/{active.maxTeams} {active?.mode === 'clash_squad' ? (lang === 'id' ? 'Pemain' : 'Players') : (lang === 'id' ? 'Tim' : 'Teams')}</span>
                {/* Feature 5: Prize Pool */}
                {active.prizePool && <span className="text-[#fbbf24] font-bold">🏆 {active.prizePool}</span>}
                {active?.mode === 'clash_squad' ? <span className="text-[#ff6b6b] font-bold">{lang === 'id' ? 'Sistem Gugur' : 'Single Elimination'}</span> : <span>{pp[1]}pts/{kpt}pt kill</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Feature 4: Live toggle */}
            {active.status === 'ongoing' && (
              <button onClick={() => setLiveMode(!liveMode)} className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${liveMode ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#22c55e]'}`} title={lang === 'id' ? 'Mode Live' : 'Live Mode'}>
                <Radio className={`w-3.5 h-3.5 ${liveMode ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-bold hidden sm:inline">{liveMode ? 'LIVE' : 'LIVE'}</span>
              </button>
            )}
            {/* Feature 10: Install App button for mobile */}
            {deferredPrompt && (
              <button onClick={() => { if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(() => setDeferredPrompt(null)) } }} className="p-1.5 rounded-lg hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#2563EB] transition-colors" title="Install App">
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => setLang(lang === 'id' ? 'en' : 'id')} className="p-1.5 rounded-lg hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#2563EB] transition-colors flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><span className="text-[9px] font-bold">{lang}</span></button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 rounded-lg hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#2563EB] transition-colors">{theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</button>
            {/* QR Code */}
            <Dialog><DialogTrigger asChild><button className="p-1.5 rounded-lg hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#2563EB]"><Share2 className="w-3.5 h-3.5" /></button></DialogTrigger>
              <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-xs"><DialogHeader><DialogTitle className="text-[#111827] text-center text-sm">Share Tournament</DialogTitle></DialogHeader>
                <div className="flex flex-col items-center gap-3 py-4"><QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/t/${active.id}`} size={160} /><p className="text-[10px] text-[#6B7280]">{lang === 'id' ? 'Scan untuk lihat turnamen' : 'Scan to view tournament'}</p></div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* TABS */}
      <div className="border-b border-[#E5E7EB] bg-white/80 backdrop-blur-xl overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {[
            { id: 'home', label: lang === 'id' ? 'Beranda' : 'Home', icon: Trophy },
            ...(active?.mode === 'clash_squad' || active?.mode === 'round_robin' || active?.mode === 'double_elim' ? [{ id: 'bracket', label: active?.mode === 'round_robin' ? 'Matchups' : 'Bracket', icon: Swords }] : [{ id: 'input', label: lang === 'id' ? 'Input' : 'Input', icon: Camera }]),
            ...(active?.mode !== 'clash_squad' && active?.mode !== 'round_robin' && active?.mode !== 'double_elim' ? [{ id: 'klasemen', label: tr('leaderboard.title'), icon: BarChart3 }] : []),
            ...(active?.mode !== 'clash_squad' && active?.mode !== 'round_robin' && active?.mode !== 'double_elim' ? [{ id: 'seeding', label: 'Seeding', icon: Crown }] : []),
            { id: 'teams', label: active?.mode === 'clash_squad' ? (lang === 'id' ? 'Pemain' : 'Players') : (lang === 'id' ? 'Tim' : 'Teams'), icon: Users },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'chat', label: 'Chat', icon: MessageCircle },
          ].map(tabItem => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${tab === tabItem.id ? (tabItem.id === 'bracket' ? 'border-[#ff6b6b] text-[#ff6b6b]' : 'border-[#2563EB] text-[#2563EB]') : 'border-transparent text-[#6B7280] hover:text-[#4B5563]'}`}>
              <tabItem.icon className="w-3.5 h-3.5" />{tabItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* HOME TAB */}
        {tab === 'home' && (
          <div className="space-y-6">
            {/* Feature 3: Countdown Timer for upcoming tournaments */}
            {active.scheduledAt && active.status !== 'completed' && (
              (() => {
                const diff = new Date(active.scheduledAt).getTime() - Date.now()
                if (diff <= 0) return null
                const isH1Day = diff < 86400000
                const isH1Hour = diff < 3600000
                return (
                  <div className={`rounded-xl p-6 text-center border-2 ${isH1Hour ? 'border-[#ff6b6b] bg-[#ff6b6b]/5' : isH1Day ? 'border-[#fbbf24] bg-[#fbbf24]/5' : 'border-[#2563EB]/30 bg-[#2563EB]/5'}`}>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Clock className={`w-5 h-5 ${isH1Hour ? 'text-[#ff6b6b] animate-pulse' : isH1Day ? 'text-[#fbbf24]' : 'text-[#2563EB]'}`} />
                      <span className={`text-sm font-bold ${isH1Hour ? 'text-[#ff6b6b]' : isH1Day ? 'text-[#fbbf24]' : 'text-[#2563EB]'}`}>{lang === 'id' ? 'Mulai Dalam' : 'Starts In'}</span>
                      {isH1Day && <Badge className="text-[8px] gap-1 bg-[#fbbf24]/20 text-[#fbbf24]">H-1</Badge>}
                      {isH1Hour && <Badge className="text-[8px] gap-1 bg-[#ff6b6b]/20 text-[#ff6b6b] animate-pulse">H-1h</Badge>}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {[{ val: countdown.days, label: 'Hari' }, { val: countdown.hours, label: 'Jam' }, { val: countdown.minutes, label: 'Menit' }, { val: countdown.seconds, label: 'Detik' }].map((u, i) => (
                        <div key={i} className="text-center">
                          <div className={`text-3xl sm:text-4xl font-black ${isH1Hour ? 'text-[#ff6b6b]' : isH1Day ? 'text-[#fbbf24]' : 'text-[#2563EB]'}`}>{String(u.val).padStart(2, '0')}</div>
                          <div className="text-[9px] text-[#6B7280] mt-1">{u.label}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#6B7280] mt-3">{lang === 'id' ? 'Dijadwalkan:' : 'Scheduled:'} {new Date(active.scheduledAt).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}</p>
                  </div>
                )
              })()
            )}
            {/* Feature 7: Stream Embed */}
            {active.streamUrl && active.status === 'ongoing' && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2"><MonitorPlay className="w-4 h-4 text-[#ff6b6b]" />{lang === 'id' ? 'Live Stream' : 'Live Stream'}<span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] animate-pulse" /></h3>
                  <a href={active.streamUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#2563EB] hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />{lang === 'id' ? 'Buka di tab baru' : 'Open in new tab'}</a>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe src={getEmbedUrl(active.streamUrl)} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                </div>
              </div>
            )}
            {/* Feature 5: Prize Pool display */}
            {active.prizePool && (
              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2"><Trophy className="w-4 h-4 text-[#fbbf24]" />{lang === 'id' ? 'Prize Pool' : 'Prize Pool'}</h3>
                  <span className="text-lg font-black text-[#fbbf24]">{active.prizePool}</span>
                </div>
                {getPrizeDistribution() && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Object.entries(getPrizeDistribution()).slice(0, 5).map(([pos, pct]: [string, any]) => (
                      <div key={pos} className="text-center bg-white rounded-lg p-2 border border-[#E5E7EB]">
                        <div className="text-[9px] text-[#6B7280]">#{pos}</div>
                        <div className="text-xs font-bold text-[#2563EB]">{pct}%</div>
                        {getEstimatedPrize(parseInt(pos)) && <div className="text-[8px] text-[#fbbf24]">{getEstimatedPrize(parseInt(pos))}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={() => setShowPrizeSettings(!showPrizeSettings)} size="sm" variant="outline" className="mt-3 text-xs gap-1 border-[#E5E7EB] text-[#6B7280] hover:text-[#fbbf24]"><Palette className="w-3 h-3" />{lang === 'id' ? 'Edit Prize' : 'Edit Prize'}</Button>
                {showPrizeSettings && (
                  <div className="mt-3 space-y-3 p-3 bg-white rounded-xl border border-[#E5E7EB]">
                    <div><Label className="text-[#4B5563] text-xs">Prize Pool</Label><Input value={active.prizePool || ''} onChange={e => { if (active) setActive({ ...active, prizePool: e.target.value }) }} className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] rounded-xl text-xs" /></div>
                    <div><Label className="text-[#4B5563] text-xs">{lang === 'id' ? 'Distribusi (%)' : 'Distribution (%)'}</Label><Input value={active.prizeDistribution || ''} onChange={e => { if (active) setActive({ ...active, prizeDistribution: e.target.value }) }} className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] rounded-xl text-xs font-mono" /></div>
                    <Button onClick={async () => { if (!active) return; try { const r = await fetch(`/api/tournaments/${active.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ prizePool: active.prizePool, prizeDistribution: active.prizeDistribution }) }); if (r.ok) { refresh(); toast({ title: lang === 'id' ? 'Prize disimpan!' : 'Prize saved!' }) } } catch { toast({ title: 'Error', variant: 'destructive' }) } }} size="sm" className="brand-gradient text-white font-bold text-xs gap-1"><Save className="w-3 h-3" />{lang === 'id' ? 'Simpan' : 'Save'}</Button>
                  </div>
                )}
              </div>
            )}
            {/* Feature 7: Stream URL setting (for non-ongoing) */}
            {!active.streamUrl && active.status !== 'completed' && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                <h3 className="text-xs font-bold text-[#111827] mb-2 flex items-center gap-1.5"><MonitorPlay className="w-3.5 h-3.5 text-[#6B7280]" />{lang === 'id' ? 'Live Stream' : 'Live Stream'}</h3>
                <div className="flex gap-2">
                  <Input placeholder="https://youtube.com/watch?v=..." value={active.streamUrl || ''} onChange={e => { if (active) setActive({ ...active, streamUrl: e.target.value }) }} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl text-xs" />
                  <Button onClick={async () => { if (!active) return; try { const r = await fetch(`/api/tournaments/${active.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ streamUrl: active.streamUrl }) }); if (r.ok) { refresh(); toast({ title: lang === 'id' ? 'Stream URL disimpan!' : 'Stream URL saved!' }) } } catch {} }} size="sm" className="brand-gradient text-white font-bold text-xs gap-1"><Save className="w-3 h-3" /></Button>
                </div>
              </div>
            )}
            {/* Feature 10: Offline fallback notice */}
            {isOffline && (
              <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl p-4 flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-[#fbbf24] flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#111827]">{lang === 'id' ? 'Mode Offline' : 'Offline Mode'}</p>
                  <p className="text-[10px] text-[#6B7280]">{lang === 'id' ? 'Menampilkan data terakhir yang tersimpan' : 'Showing last saved data'}</p>
                </div>
              </div>
            )}
            {/* Announcement Banner */}
            {showAnnouncement && announcement && (
              <div className="bg-[#2563EB]/10 border border-[#2563EB]/30 rounded-xl p-4 flex items-start gap-3">
                <Megaphone className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#111827] font-medium">{announcement}</p>
                  <p className="text-[9px] text-[#6B7280] mt-1">{new Date().toLocaleTimeString('id-ID')}</p>
                </div>
                <button onClick={() => setShowAnnouncement(false)} className="text-[#6B7280] hover:text-[#111827]"><X className="w-4 h-4" /></button>
              </div>
            )}
            {/* Progress */}
            <div className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
              {active?.mode === 'clash_squad' ? (
                <>
                  <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">Bracket Progress <Badge className="text-[8px] bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/20">Sistem Gugur</Badge></h3><span className="text-xs text-[#6B7280]">{bracketMatches.filter(m => m.status === 'completed').length}/{bracketMatches.length} match</span></div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full bg-[#ff6b6b] rounded-full transition-all" style={{ width: `${bracketMatches.length > 0 ? Math.round((bracketMatches.filter(m => m.status === 'completed').length / bracketMatches.length) * 100) : 0}%` }} /></div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-[#111827]">Progress</h3><span className="text-xs text-[#6B7280]">{completedCount}/{matches.length} match</span></div>
                  <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full brand-gradient rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                </>
              )}
              <div className="flex gap-3 mt-4">
                {active?.mode !== 'clash_squad' && <Button onClick={undoLastMatch} size="sm" variant="outline" className="text-xs gap-1 border-[#E5E7EB] text-[#6B7280] hover:text-[#2563EB]"><Undo2 className="w-3 h-3" />{tr('misc.undo')}</Button>}
                {active.status !== 'completed' && <Button onClick={finishTournament} size="sm" variant="outline" className="text-xs gap-1 border-[#E5E7EB] text-[#6B7280] hover:text-[#fbbf24]"><CheckCircle2 className="w-3 h-3" />{lang === 'id' ? 'Selesaikan' : 'Finish'}</Button>}
              </div>
            </div>
            {/* AI Analysis */}
            {active?.mode !== 'clash_squad' && (
            <div className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-[#111827] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#2563EB]" />AI Analysis</h3><Button onClick={getAIAnalysis} size="sm" disabled={aiLoading || !leaderboard.length} className="brand-gradient text-white font-bold text-xs gap-1 h-7">{aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}Analyze</Button></div>
              {aiText ? <p className="text-xs text-[#4B5563] leading-relaxed whitespace-pre-wrap">{aiText}</p> : <p className="text-xs text-[#9CA3AF]">{lang === 'id' ? 'Klik Analyze untuk analisis AI' : 'Click Analyze for AI analysis'}</p>}
            </div>
            )}
            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-3">
              <Button onClick={exportCSV} variant="outline" className="gap-2 border-[#E5E7EB] text-[#6B7280] hover:text-[#2563EB]"><Download className="w-4 h-4" />CSV</Button>
              <Button onClick={shareAsImage} variant="outline" className="gap-2 border-[#E5E7EB] text-[#6B7280] hover:text-[#2563EB]"><Camera className="w-4 h-4" />PNG</Button>
              <Button onClick={() => { if (active) window.open(`/api/tournaments/${active.id}/export-pdf`, '_blank') }} variant="outline" className="gap-2 border-[#E5E7EB] text-[#6B7280] hover:text-[#2563EB]"><FileText className="w-4 h-4" />PDF</Button>
            </div>
            {/* Announcement */}
            <div className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2"><Megaphone className="w-4 h-4 text-[#2563EB]" />{lang === 'id' ? 'Broadcast' : 'Announcement'}</h3>
              </div>
              <div className="flex gap-2">
                <Input value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder={lang === 'id' ? 'Tulis pengumuman...' : 'Write an announcement...'} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl text-xs" onKeyDown={e => { if (e.key === 'Enter' && announcement.trim()) setShowAnnouncement(true) }} />
                <Button onClick={() => { if (announcement.trim()) setShowAnnouncement(true) }} size="sm" className="brand-gradient text-white font-bold text-xs gap-1 h-9"><Bell className="w-3 h-3" />{lang === 'id' ? 'Kirim' : 'Send'}</Button>
              </div>
              <p className="text-[9px] text-[#9CA3AF] mt-2">{lang === 'id' ? 'Pengumuman akan tampil di bagian atas workspace semua peserta' : 'Announcement will appear at the top of all participants\' workspace'}</p>
            </div>
            {/* Feature 8: Achievement System UI */}
            <div className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-[#FFD700]" />{lang === 'id' ? 'Achievements' : 'Achievements'}</h3>
              {!achievements.length ? (
                <p className="text-xs text-[#9CA3AF]">{lang === 'id' ? 'Belum ada achievement. Selesaikan turnamen untuk mendapatkan badge!' : 'No achievements yet. Complete a tournament to earn badges!'}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {achievements.map((ach, ai) => (
                    <div key={ach.id} className={`bg-white rounded-xl p-3 border border-[#E5E7EB] text-center ${ai === 0 ? 'achievement-unlock achievement-glow' : ''}`}>
                      <div className="text-2xl mb-1">{ach.icon}</div>
                      <div className="text-[10px] font-bold text-[#111827] truncate">{ach.label}</div>
                      <div className="text-[8px] text-[#6B7280] mt-0.5 truncate">{ach.tournament.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Match history */}
            <div className="bg-[#F9FAFB] rounded-xl p-5 border border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-[#111827] mb-3">{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Hasil Bracket' : 'Bracket Results') : tr('match.history')}</h3>
              <div className="space-y-2">
                {active?.mode === 'clash_squad' ? (
                  bracketMatches.filter(m => m.status === 'completed').map(m => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg text-xs">
                      <span className="text-[#4B5563]">{lang === 'id' ? `R${m.round} Match ${m.position}` : `R${m.round} Match ${m.position}`}</span>
                      <span className="text-[#2563EB] font-bold">{m.winner?.name || '—'}</span>
                    </div>
                  ))
                ) : (
                  matches.filter(m => m.status === 'completed').map(m => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg text-xs">
                      <span className="text-[#4B5563]">Match {m.matchNumber}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setDetailMatch(m.id)} className="text-[#2563EB] hover:underline"><Eye className="w-3 h-3 inline" /></button>
                        <button onClick={() => resetMatch(m.id)} className="text-[#ff6b6b] hover:underline"><RotateCcw className="w-3 h-3 inline" /></button>
                      </div>
                    </div>
                  ))
                )}
                {(active?.mode === 'clash_squad' ? !bracketMatches.filter(m => m.status === 'completed').length : !matches.filter(m => m.status === 'completed').length) && <p className="text-xs text-[#9CA3AF]">{tr('misc.noData')}</p>}
              </div>
            </div>
          </div>
        )}

        {/* INPUT TAB */}
        {tab === 'input' && (
          <div className="space-y-4">
            {/* Match selector */}
            <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-[#4B5563] text-xs">{tr('match.input')}</Label>
                <button onClick={autoSelectNextMatch} className="text-[10px] text-[#2563EB] hover:underline">{lang === 'id' ? 'Auto pilih' : 'Auto select'}</button>
              </div>
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="bg-white border-[#E5E7EB] text-[#111827]"><SelectValue placeholder={lang === 'id' ? 'Pilih Match...' : 'Select Match...'} /></SelectTrigger>
                <SelectContent className="bg-[#F9FAFB] border-[#E5E7EB]">
                  {matches.map(m => <SelectItem key={m.id} value={m.id} disabled={m.status === 'completed'}>Match {m.matchNumber} {m.status === 'completed' ? '✓' : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Input method tabs */}
            <div className="flex gap-2">
              {(['paste', 'scan', 'manual'] as const).map(m => (
                <button key={m} onClick={() => { setInputMethod(m); resetInput() }} className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${inputMethod === m ? 'brand-gradient text-white' : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]'}`}>
                  {m === 'paste' ? <Type className="w-3 h-3 inline mr-1" /> : m === 'scan' ? <Camera className="w-3 h-3 inline mr-1" /> : <HandMetal className="w-3 h-3 inline mr-1" />}
                  {m === 'paste' ? tr('match.pasteText') : m === 'scan' ? tr('match.aiScan') : 'Manual'}
                </button>
              ))}
            </div>

            {/* Paste text input */}
            {inputMethod === 'paste' && !reviewStep && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] space-y-3">
                <Textarea placeholder={lang === 'id' ? 'Paste hasil match di sini...\nContoh: 1. EVS 12 kills 2. RRQ 8 kills' : 'Paste match results here...\nExample: 1. EVS 12 kills 2. RRQ 8 kills'} value={pastedText} onChange={e => setPastedText(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] min-h-[120px] text-xs" />
                <Button onClick={analyzePastedText} disabled={analyzing || !pastedText.trim()} className="w-full brand-gradient text-white font-bold rounded-xl">{analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} {lang === 'id' ? 'Proses dengan AI' : 'Process with AI'}</Button>
              </div>
            )}

            {/* Scan image input */}
            {inputMethod === 'scan' && !reviewStep && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] space-y-3">
                {uploadedImage ? (
                  <div className="space-y-3"><img src={uploadedImage} alt="Upload" className="w-full rounded-lg max-h-60 object-contain bg-white" /><Button onClick={analyzeImage} disabled={analyzing} className="w-full brand-gradient text-white font-bold rounded-xl">{analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} {lang === 'id' ? 'Scan dengan AI' : 'Scan with AI'}</Button></div>
                ) : (
                  <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center cursor-pointer hover:border-[#2563EB]/30 transition-colors" onClick={() => fileRef.current?.click()}>
                    <ImagePlus className="w-10 h-10 text-[#374151] mx-auto mb-2" /><p className="text-xs text-[#6B7280]">{lang === 'id' ? 'Upload screenshot hasil match' : 'Upload match result screenshot'}</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                {uploadedImage && <button onClick={() => { setUploadedImage(null); if (fileRef.current) fileRef.current.value = '' }} className="text-xs text-[#ff6b6b]">{lang === 'id' ? 'Ganti gambar' : 'Change image'}</button>}
              </div>
            )}

            {/* Manual input */}
            {inputMethod === 'manual' && !reviewStep && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] space-y-3">
                {teams.map(team => {
                  const entry = manualEntries.find(e => e.teamId === team.id)
                  return (
                    <div key={team.id} className="flex items-center gap-2">
                      <span className="text-xs text-[#4B5563] flex-1 truncate">{team.name} <span className="text-[#6B7280]">({team.tag})</span></span>
                      <Input type="number" min={1} placeholder="#" className="w-14 h-7 text-center text-xs bg-white border-[#E5E7EB] text-[#111827] rounded-lg" value={entry?.placement || ''} onChange={e => {
                        const existing = manualEntries.find(x => x.teamId === team.id)
                        if (existing) setManualEntries(manualEntries.map(x => x.teamId === team.id ? { ...x, placement: parseInt(e.target.value) || 0 } : x))
                        else setManualEntries([...manualEntries, { teamId: team.id, placement: parseInt(e.target.value) || 0, kills: 0 }])
                      }} />
                      <Input type="number" min={0} placeholder="K" className="w-14 h-7 text-center text-xs bg-white border-[#E5E7EB] text-[#111827] rounded-lg" value={entry?.kills ?? ''} onChange={e => {
                        const existing = manualEntries.find(x => x.teamId === team.id)
                        if (existing) setManualEntries(manualEntries.map(x => x.teamId === team.id ? { ...x, kills: parseInt(e.target.value) || 0 } : x))
                        else setManualEntries([...manualEntries, { teamId: team.id, placement: 0, kills: parseInt(e.target.value) || 0 }])
                      }} />
                    </div>
                  )
                })}
                {!teams.length && <p className="text-xs text-[#9CA3AF]">{lang === 'id' ? 'Tambah tim dulu' : 'Add teams first'}</p>}
                <Button onClick={saveManualInput} disabled={!manualEntries.filter(e => e.placement > 0).length} className="w-full brand-gradient text-white font-bold rounded-xl">{lang === 'id' ? 'Simpan' : 'Save'}</Button>
              </div>
            )}

            {/* Review step */}
            {reviewStep && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] space-y-3">
                <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2"><Eye className="w-4 h-4 text-[#2563EB]" />{lang === 'id' ? 'Review Hasil AI' : 'Review AI Results'}</h3>
                {mappedResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg text-xs">
                    <span className="font-bold text-[#2563EB] w-6">#{r.placement}</span>
                    {r.matched ? <span className="text-[#111827] flex-1">{r.teamName} <span className="text-[#6B7280]">({r.teamTag})</span></span> : <span className="text-[#ff6b6b] flex-1">{r.teamTag} - {lang === 'id' ? 'Tidak cocok' : 'No match'}</span>}
                    <span className="text-[#fbbf24]">{r.kills} kill</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button onClick={resetInput} variant="outline" className="flex-1 border-[#E5E7EB] text-[#6B7280]">{tr('misc.cancel')}</Button>
                  <Button onClick={confirmAndSave} className="flex-1 brand-gradient text-white font-bold">{lang === 'id' ? 'Konfirmasi & Simpan' : 'Confirm & Save'}</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KLASEMEN TAB */}
        {tab === 'klasemen' && (() => {
          // Feature 5: Calculate streaks — teams with top 3 placement for 3+ consecutive matches
          const streakTeams = new Set<string>()
          const booyahKingTeam = leaderboard.reduce<{ id: string; count: number } | null>((best, entry) => {
            if (entry.firstPlaceCount >= 3 && (!best || entry.firstPlaceCount > best.count)) return { id: entry.id, count: entry.firstPlaceCount }
            return best
          }, null)
          const booyahKingId = booyahKingTeam?.id || null

          for (const entry of leaderboard) {
            if (entry.matchBreakdown.length < 3) continue
            let consecutive = 0
            for (const mb of entry.matchBreakdown) {
              if (mb.placement <= 3) { consecutive++; if (consecutive >= 3) { streakTeams.add(entry.id); break } }
              else consecutive = 0
            }
          }

          // Feature 6: MVP — team with highest single-match kill count
          let mvpTeamId: string | null = null
          let mvpMaxKills = 0
          for (const entry of leaderboard) {
            for (const mb of entry.matchBreakdown) {
              if (mb.kills > mvpMaxKills) { mvpMaxKills = mb.kills; mvpTeamId = entry.id }
            }
          }

          // Feature 7: Cumulative points timeline for LineChart
          const completedMatches = matches.filter(m => m.status === 'completed')
          const timelineData = completedMatches.map((m, mi) => {
            const matchNum = mi + 1
            const point: Record<string, number | string> = { match: `M${matchNum}` }
            for (const entry of leaderboard.slice(0, 5)) {
              let cumPts = 0
              for (let j = 0; j <= mi; j++) {
                const mb = entry.matchBreakdown.find(b => b.matchNumber === j + 1)
                if (mb) cumPts += mb.totalPoints
              }
              point[entry.tag] = cumPts
            }
            return point
          })

          return (
          <div className="space-y-4" ref={klasemenRef}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827]">{tr('leaderboard.title')}</h3>
              <div className="flex gap-2">
                {(['ffws', 'compact', 'detailed'] as const).map(t => (
                  <button key={t} onClick={() => setTableTemplate(t)} className={`px-2 py-1 text-[10px] rounded-lg transition-colors ${tableTemplate === t ? 'brand-gradient text-white font-bold' : 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]'}`}>{t.toUpperCase()}</button>
                ))}
              </div>
            </div>
            {!leaderboard.length ? (
              <Card className="text-center py-12 bg-[#F9FAFB] border-[#E5E7EB] rounded-xl"><CardContent><BarChart3 className="w-10 h-10 text-[#374151] mx-auto mb-3" /><p className="text-xs text-[#6B7280]">{tr('misc.noData')}</p></CardContent></Card>
            ) : (
              <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-x-auto">
                <table className={`w-full text-xs ${tableTemplate === 'ffws' ? 'ffws-table' : ''}`}>
                  <thead><tr className="border-b border-[#E5E7EB]">
                    <th className="px-3 py-2 text-left text-[#6B7280] font-medium w-8">#</th>
                    <th className="px-3 py-2 text-left text-[#6B7280] font-medium">{tr('leaderboard.squad')}</th>
                    {tableTemplate === 'ffws' && matches.map(m => <th key={m.id} className="px-1 py-2 text-center text-[#9CA3AF] font-medium text-[9px]">M{m.matchNumber}</th>)}
                    <th className="px-3 py-2 text-center text-[#2563EB] font-bold">{tr('leaderboard.pts')}</th>
                    {tableTemplate !== 'compact' && <th className="px-3 py-2 text-center text-[#6B7280] font-medium">{tr('leaderboard.kills')}</th>}
                    {tableTemplate === 'detailed' && <><th className="px-3 py-2 text-center text-[#6B7280] font-medium">PP</th><th className="px-3 py-2 text-center text-[#6B7280] font-medium">KP</th><th className="px-3 py-2 text-center text-[#6B7280] font-medium">{tr('leaderboard.avgPlace')}</th></>}
                  </tr></thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => (
                      <tr key={entry.id} className={`border-b border-[#E5E7EB]/50 hover:bg-[#F3F4F6]/20 transition-all duration-500 ${prevLeaderboard.length > 0 ? (() => { const prev = prevLeaderboard.findIndex(p => p.id === entry.id); const curr = idx; if (prev >= 0 && prev !== curr) return prev > curr ? 'bg-[#22c55e]/5' : 'bg-[#ff6b6b]/5'; return '' })() : ''}`}>
                        <td className="px-3 py-2"><RankBadge rank={idx + 1} small /></td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-[#111827] flex items-center gap-1.5 flex-wrap">
                            <button onClick={() => setTeamProfileEntry(entry)} className="hover:text-[#2563EB] hover:underline cursor-pointer transition-colors">{entry.name}</button>
                            {/* Feature 5: Streak/Hot Team Badge */}
                            {streakTeams.has(entry.id) && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/20 whitespace-nowrap">🔥 On Fire</span>}
                            {/* Feature 5: Booyah King Badge */}
                            {booyahKingId === entry.id && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/20 whitespace-nowrap">👑 Booyah King</span>}
                            {/* Feature 6: MVP Badge */}
                            {mvpTeamId === entry.id && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/20 whitespace-nowrap">⚔️ MVP</span>}
                          </div>
                          <div className="text-[9px] text-[#6B7280]">{entry.tag} {entry.nickname && <span className="text-[#fbbf24]">· {entry.nickname}</span>}</div>
                        </td>
                        {tableTemplate === 'ffws' && entry.matchBreakdown.map((mb, mi) => (
                          <td key={mi} className="px-1 py-2 text-center">
                            <div className={`text-[9px] ${mb.placement === 1 ? 'booyah-badge' : 'text-[#6B7280]'}`}>{mb.placement}</div>
                            <div className="text-[8px] text-[#9CA3AF]">{mb.kills}k</div>
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center pts-highlight text-sm">{entry.totalPoints}</td>
                        {tableTemplate !== 'compact' && <td className="px-3 py-2 text-center text-[#4B5563]">{entry.totalKills}</td>}
                        {tableTemplate === 'detailed' && <><td className="px-3 py-2 text-center text-[#6B7280]">{entry.totalPlacementPoints}</td><td className="px-3 py-2 text-center text-[#6B7280]">{entry.totalKillPoints}</td><td className="px-3 py-2 text-center text-[#6B7280]">{entry.avgPlacement.toFixed(1)}</td></>}
                        {/* Feature 5: Estimated Prize column */}
                        {active?.prizePool && getEstimatedPrize(idx + 1) && <td className="px-3 py-2 text-center text-[#fbbf24] text-[10px] font-bold">{getEstimatedPrize(idx + 1)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Feature 4: Skeleton Loading for tournament list */}
            {loading && <LoadingOverlay variant="skeleton" />}

            {/* Charts */}
            {leaderboard.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                  <h4 className="text-xs font-bold text-[#111827] mb-3">Points Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}><BarChart data={leaderboard.slice(0, 8)}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="tag" tick={{ fill: '#6B7280', fontSize: 10 }} /><YAxis tick={{ fill: '#6B7280', fontSize: 10 }} /><RechartsTooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', fontSize: 11 }} /><Bar dataKey="totalPoints" radius={[4,4,0,0]}>{leaderboard.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                  <h4 className="text-xs font-bold text-[#111827] mb-3">Points Split</h4>
                  <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={leaderboard.slice(0, 5).map(e => ({ name: e.tag, value: e.totalPoints }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">{leaderboard.slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Legend /><RechartsTooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', fontSize: 11 }} /></PieChart></ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Feature 7: Match Progress Timeline Chart */}
            {timelineData.length > 1 && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                <h4 className="text-xs font-bold text-[#111827] mb-3 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" />{lang === 'id' ? 'Progres Poin per Match' : 'Match Progress'}</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="match" tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <RechartsTooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', fontSize: 11 }} />
                    <Legend />
                    {leaderboard.slice(0, 5).map((entry, i) => (
                      <Line key={entry.id} type="monotone" dataKey={entry.tag} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[i % COLORS.length] }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Feature 9: Share to Social Media + Enhanced Share Card */}
            {active && leaderboard.length > 0 && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                <h4 className="text-xs font-bold text-[#111827] mb-3 flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5 text-[#2563EB]" />{lang === 'id' ? 'Bagikan Klasemen' : 'Share Leaderboard'}</h4>
                <div className="flex flex-wrap gap-2">
                  {/* Feature 9: Share Card */}
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl" onClick={() => setShowShareCard(true)}><Camera className="w-3.5 h-3.5" />{lang === 'id' ? 'Share Card' : 'Share Card'}</Button>
                  {/* WhatsApp */}
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 rounded-xl" onClick={() => {
                    const top5 = leaderboard.slice(0, 5).map((e, i) => `${i + 1}. ${e.name} (${e.totalPoints} pts, ${e.totalKills} kills)`).join('\n')
                    const url = `${window.location.origin}/t/${active.id}`
                    const text = `🏆 ${active.name}\n\n${top5}\n\n${active.prizePool ? `💰 Prize: ${active.prizePool}\n` : ''}Lihat lengkap: ${url}\n\nPowered by FoxArea`
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                  }}><MessageCircle className="w-3.5 h-3.5" />WhatsApp</Button>
                  {/* Twitter */}
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-[#1DA1F2]/30 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-xl" onClick={() => {
                    const top3 = leaderboard.slice(0, 3).map((e, i) => `${i + 1}. ${e.name}`).join(', ')
                    const text = `🏆 ${active.name}\n\nTop 3: ${top3}${active.prizePool ? `\n💰 ${active.prizePool}` : ''}\n\nPowered by @FoxArea`
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                  }}><Twitter className="w-3.5 h-3.5" />Twitter</Button>
                  {/* Instagram Story */}
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/10 rounded-xl" onClick={async () => {
                    if (!klasemenRef.current) return
                    setSharingImage(true)
                    try {
                      const el = klasemenRef.current
                      const canvas = document.createElement('canvas')
                      canvas.width = 1080
                      canvas.height = 1920
                      const ctx2 = canvas.getContext('2d')!
                      ctx2.fillStyle = '#FFFFFF'
                      ctx2.fillRect(0, 0, 1080, 1920)
                      const captureCanvas = await html2canvas(el, { backgroundColor: '#FFFFFF', scale: 2, useCORS: true, logging: false })
                      const ratio = captureCanvas.width / captureCanvas.height
                      const targetW = 980
                      const targetH = targetW / ratio
                      const offsetY = 100
                      ctx2.drawImage(captureCanvas, 50, offsetY, targetW, Math.min(targetH, 1600))
                      ctx2.font = 'bold 28px sans-serif'
                      ctx2.fillStyle = '#2563EB'
                      ctx2.textAlign = 'center'
                      ctx2.fillText(`🏆 ${active.name}`, 540, 60)
                      const link2 = canvas.toDataURL('image/png')
                      const a2 = document.createElement('a'); a2.download = `${active.name}_story.png`; a2.href = link2; a2.click()
                      toast({ title: lang === 'id' ? 'Gambar Story terdownload!' : 'Story image downloaded!' })
                    } catch { toast({ title: 'Error', variant: 'destructive' }) }
                    setSharingImage(false)
                  }}><Instagram className="w-3.5 h-3.5" />{lang === 'id' ? 'Story' : 'Story'}</Button>
                  {/* Save as Image */}
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-[#E5E7EB] text-[#6B7280] hover:text-[#2563EB] rounded-xl" onClick={shareAsImage}><Download className="w-3.5 h-3.5" />{lang === 'id' ? 'Simpan Gambar' : 'Save Image'}</Button>
                  {/* Copy Link */}
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-[#E5E7EB] text-[#6B7280] hover:text-[#2563EB] rounded-xl" onClick={() => {
                    const link = `${window.location.origin}/t/${active.id}`
                    navigator.clipboard.writeText(link)
                    toast({ title: lang === 'id' ? 'Link tersalin!' : 'Link copied!' })
                  }}><Copy className="w-3.5 h-3.5" />{lang === 'id' ? 'Salin Link' : 'Copy Link'}</Button>
                  {/* Embed */}
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 border-[#E5E7EB] text-[#6B7280] hover:text-[#a78bfa] rounded-xl" onClick={() => setShowEmbedDialog(true)}><ExternalLink className="w-3.5 h-3.5" />Embed</Button>
                </div>
              </div>
            )}

            {/* Feature 10: Embed Dialog */}
            <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
              <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-md">
                <DialogHeader><DialogTitle className="text-[#111827] flex items-center gap-2"><ExternalLink className="w-4 h-4 text-[#a78bfa]" />Embed Widget</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] text-[#6B7280]">{lang === 'id' ? 'Salin kode iframe di bawah untuk menampilkan klasemen di website kamu:' : 'Copy the iframe code below to display the leaderboard on your website:'}</p>
                  <div className="bg-white rounded-xl p-3 border border-[#E5E7EB]">
                    <code className="text-[10px] text-[#a78bfa] break-all">{active ? `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/embed/${active.id}" width="100%" height="500" frameborder="0" style="border:none;border-radius:12px;"></iframe>` : ''}</code>
                  </div>
                  <Button size="sm" className="w-full brand-gradient text-white font-bold rounded-xl text-xs gap-1" onClick={() => {
                    if (!active) return
                    const code = `<iframe src="${window.location.origin}/api/embed/${active.id}" width="100%" height="500" frameborder="0" style="border:none;border-radius:12px;"></iframe>`
                    navigator.clipboard.writeText(code)
                    toast({ title: lang === 'id' ? 'Kode embed tersalin!' : 'Embed code copied!' })
                  }}><Copy className="w-3 h-3" />{lang === 'id' ? 'Salin Kode' : 'Copy Code'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          )
        })()}

        {/* SEEDING TAB */}
        {tab === 'seeding' && <BracketView teams={teams} leaderboard={leaderboard} lang={lang} />}

        {/* BRACKET TAB (Clash Squad) */}
        {tab === 'bracket' && active?.mode === 'clash_squad' && (
          <div className="space-y-6">
            {/* Bracket header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-black text-[#111827] flex items-center gap-2">
                  <Swords className="w-5 h-5 text-[#ff6b6b]" />
                  {lang === 'id' ? 'Bracket Clash Squad' : 'Clash Squad Bracket'}
                  <Badge className="text-[8px] gap-1 bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20 font-bold">🔥 SISTEM GUGUR</Badge>
                </h3>
                <p className="text-xs text-[#6B7280] mt-1">{lang === 'id' ? 'Single Elimination — Kalah langsung out!' : 'Single Elimination — Lose and you\'re out!'}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {bracketMatches.length === 0 ? (
                  <Button onClick={generateBracket} disabled={teams.length < 2} className="bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold gap-2 rounded-xl">
                    <Swords className="w-4 h-4" />{lang === 'id' ? 'Generate Bracket' : 'Generate Bracket'}
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => setShowBracketDownload(true)} className="bg-[#2563EB] hover:bg-[#05c090] text-white font-bold gap-2 rounded-xl text-xs">
                      <Download className="w-3.5 h-3.5" />{lang === 'id' ? 'Download Bracket' : 'Download Bracket'}
                    </Button>
                    <Button onClick={generateBracket} variant="outline" className="gap-2 border-[#E5E7EB] text-[#6B7280] hover:text-[#ff6b6b] rounded-xl text-xs">
                      <RefreshCw className="w-3 h-3" />{lang === 'id' ? 'Reset Bracket' : 'Reset Bracket'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {teams.length < 2 && bracketMatches.length === 0 && (
              <div className="bg-[#F9FAFB] rounded-xl p-8 border border-[#E5E7EB] text-center">
                <Users className="w-10 h-10 text-[#374151] mx-auto mb-3" />
                <p className="text-sm text-[#6B7280]">{lang === 'id' ? 'Tambah minimal 2 pemain untuk generate bracket' : 'Add at least 2 players to generate bracket'}</p>
              </div>
            )}

            {/* Visual Bracket Tree */}
            {bracketMatches.length > 0 && (() => {
              const totalRounds = Math.max(...bracketMatches.map(m => m.round))
              const matchW = 220
              const matchH = 64
              const slotH = matchH + 22
              const connW = 52
              const topPad = 32
              const numR1Slots = Math.pow(2, totalRounds - 1)
              const bracketH = numR1Slots * slotH - 22
              const totalW = totalRounds * matchW + (totalRounds - 1) * connW

              const roundNames: Record<number, string> = {
                1: totalRounds === 2 ? 'Semi Final' : totalRounds === 3 ? 'Quarter Final' : `Round 1`,
                2: totalRounds === 2 ? 'Final' : totalRounds === 3 ? 'Semi Final' : `Quarter Final`,
                3: 'Final', 4: 'Final',
              }

              const resetBracketMatch = async (matchId: string) => {
                setActionLoading(lang === 'id' ? 'Reset match...' : 'Resetting match...')
                try {
                  const r = await fetch(`/api/bracket/${matchId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ action: 'reset' }) })
                  if (r.ok) {
                    toast({ title: lang === 'id' ? 'Match Direset!' : 'Match Reset!' })
                    if (active) fetchBracket(active.id)
                    refresh()
                  } else {
                    const d = await r.json()
                    toast({ title: 'Error', description: d.error || 'Gagal reset', variant: 'destructive' })
                  }
                } catch { toast({ title: 'Error', variant: 'destructive' }) }
                setActionLoading('')
              }

              const getMatchCenter = (round: number, position: number) => {
                const slotsPerMatch = Math.pow(2, round - 1)
                const firstSlot = (position - 1) * slotsPerMatch + 1
                const lastSlot = position * slotsPerMatch
                const centerY = ((firstSlot + lastSlot) / 2 - 0.5) * slotH + topPad
                const centerX = (round - 1) * (matchW + connW) + matchW / 2
                return { x: centerX, y: centerY }
              }

              // Build connector lines (CSS divs — no SVG, works with html2canvas)
              const connectorLines: React.ReactNode[] = []
              const nextMatchGroups: Record<string, BracketMatchData[]> = {}
              for (const m of bracketMatches) {
                if (m.nextMatchId) {
                  if (!nextMatchGroups[m.nextMatchId]) nextMatchGroups[m.nextMatchId] = []
                  nextMatchGroups[m.nextMatchId].push(m)
                }
              }
              let ck = 0
              for (const [nextId, sources] of Object.entries(nextMatchGroups)) {
                const nextMatch = bracketMatches.find(m => m.id === nextId)
                if (!nextMatch) continue
                const nextPos = getMatchCenter(nextMatch.round, nextMatch.position)
                const midX = nextPos.x - matchW / 2 - connW / 2
                const lineColor = '#374151'
                if (sources.length === 2) {
                  const p0 = getMatchCenter(sources[0].round, sources[0].position)
                  const p1 = getMatchCenter(sources[1].round, sources[1].position)
                  const topY = Math.min(p0.y, p1.y)
                  const botY = Math.max(p0.y, p1.y)
                  connectorLines.push(<div key={`cl${ck++}`} className="absolute" style={{ left: p0.x + matchW / 2, top: p0.y - 1, width: midX - (p0.x + matchW / 2), height: 2, background: lineColor }} />)
                  connectorLines.push(<div key={`cl${ck++}`} className="absolute" style={{ left: p1.x + matchW / 2, top: p1.y - 1, width: midX - (p1.x + matchW / 2), height: 2, background: lineColor }} />)
                  connectorLines.push(<div key={`cl${ck++}`} className="absolute" style={{ left: midX - 1, top: topY, width: 2, height: botY - topY, background: lineColor }} />)
                  connectorLines.push(<div key={`cl${ck++}`} className="absolute" style={{ left: midX, top: nextPos.y - 1, width: (nextPos.x - matchW / 2) - midX, height: 2, background: lineColor }} />)
                } else if (sources.length === 1) {
                  const p0 = getMatchCenter(sources[0].round, sources[0].position)
                  const leftX = Math.min(p0.x + matchW / 2, nextPos.x - matchW / 2)
                  const rightX = Math.max(p0.x + matchW / 2, nextPos.x - matchW / 2)
                  connectorLines.push(<div key={`cl${ck++}`} className="absolute" style={{ left: leftX, top: p0.y - 1, width: rightX - leftX, height: 2, background: lineColor }} />)
                  if (Math.abs(p0.y - nextPos.y) > 2) {
                    const mx = (p0.x + matchW / 2 + nextPos.x - matchW / 2) / 2
                    connectorLines.push(<div key={`cl${ck++}`} className="absolute" style={{ left: mx - 1, top: Math.min(p0.y, nextPos.y), width: 2, height: Math.abs(nextPos.y - p0.y), background: lineColor }} />)
                  }
                }
              }

              const selectedMatch = bracketMatches.find(m => m.id === selectedBracketMatch)

              return (
                <div className="overflow-x-auto pb-4">
                  <div style={{ position: 'relative', width: totalW, minHeight: bracketH + topPad + 120, margin: '0 auto' }}>
                    {/* Round labels */}
                    {Array.from({ length: totalRounds }, (_, i) => {
                      const round = i + 1
                      const x = i * (matchW + connW)
                      return <div key={`rl${round}`} className="absolute text-[10px] font-bold text-[#6B7280] tracking-wider text-center uppercase" style={{ left: x, top: 6, width: matchW }}>{roundNames[round] || `Round ${round}`}</div>
                    })}

                    {/* Match boxes */}
                    {bracketMatches.map((m) => {
                      const pos = getMatchCenter(m.round, m.position)
                      const top = pos.y - matchH / 2
                      const left = pos.x - matchW / 2
                      const isW1 = m.winnerId === m.team1Id
                      const isW2 = m.winnerId === m.team2Id
                      const isSelected = selectedBracketMatch === m.id
                      const canClick = !!(m.team1Id && m.team2Id && m.status !== 'completed')

                      return (
                        <div key={m.id}
                          className={`absolute rounded-xl border overflow-hidden transition-all ${canClick ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-[#ff6b6b] border-[#ff6b6b]/60' : m.status === 'completed' ? 'border-[#2563EB]/30 hover:border-[#2563EB]/50' : canClick ? 'border-[#fbbf24]/30 hover:border-[#ff6b6b]/40' : 'border-[#E5E7EB]'}`}
                          style={{ left, top, width: matchW, height: matchH, background: '#FFFFFF' }}
                          onClick={() => {
                            if (canClick) {
                              setSelectedBracketMatch(isSelected ? null : m.id)
                              setBracketScore1(m.score1); setBracketScore2(m.score2)
                            }
                          }}
                        >
                          {/* Team 1 */}
                          <div className={`flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB]/50 ${isW1 ? 'bg-[#2563EB]/5' : ''}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              {isW1 && <Crown className="w-3.5 h-3.5 text-[#FFD700] flex-shrink-0" />}
                              <span className={`text-xs font-bold truncate ${isW1 ? 'text-[#2563EB]' : m.team1 ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                                {m.team1?.name || (lang === 'id' ? 'Menunggu...' : 'TBD')}
                              </span>
                            </div>
                            <span className={`text-xs font-black ml-2 ${isW1 ? 'text-[#2563EB]' : 'text-[#6B7280]'}`}>
                              {m.status === 'completed' ? m.score1 : ''}
                            </span>
                          </div>
                          {/* Team 2 */}
                          <div className={`flex items-center justify-between px-3 py-2 ${isW2 ? 'bg-[#2563EB]/5' : ''}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              {isW2 && <Crown className="w-3.5 h-3.5 text-[#FFD700] flex-shrink-0" />}
                              <span className={`text-xs font-bold truncate ${isW2 ? 'text-[#2563EB]' : m.team2 ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>
                                {m.team2?.name || (lang === 'id' ? 'Menunggu...' : 'TBD')}
                              </span>
                            </div>
                            <span className={`text-xs font-black ml-2 ${isW2 ? 'text-[#2563EB]' : 'text-[#6B7280]'}`}>
                              {m.status === 'completed' ? m.score2 : ''}
                            </span>
                          </div>
                          {/* Reset button */}
                          {m.status === 'completed' && (
                            <div className="absolute top-0.5 right-1.5">
                              <button onClick={(e) => { e.stopPropagation(); resetBracketMatch(m.id) }} className="text-[9px] text-[#6B7280] hover:text-[#ff6b6b] transition-colors"><RotateCcw className="w-2.5 h-2.5" /></button>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Connector lines */}
                    {connectorLines}

                    {/* Winner selector popup */}
                    {selectedMatch && selectedMatch.status !== 'completed' && selectedMatch.team1Id && selectedMatch.team2Id && (() => {
                      const pos = getMatchCenter(selectedMatch.round, selectedMatch.position)
                      const popupTop = pos.y + matchH / 2 + 8
                      const popupLeft = Math.max(0, pos.x - matchW / 2)

                      return (
                        <div className="absolute z-20 bg-white rounded-xl p-3 border-2 border-[#ff6b6b]/30 space-y-3 shadow-lg shadow-[#ff6b6b]/5" style={{ left: popupLeft, top: popupTop, width: matchW }}>
                          <p className="text-[10px] text-[#ff6b6b] font-bold flex items-center gap-1"><Swords className="w-3 h-3" />{lang === 'id' ? 'Pilih pemenang & skor:' : 'Select winner & score:'}</p>
                          <div className="flex gap-2">
                            {[selectedMatch.team1, selectedMatch.team2].filter(Boolean).map(team => (
                              <button key={team!.id} onClick={() => setBracketWinner(selectedMatch.id, team!.id)}
                                className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold bg-[#F3F4F6] text-[#111827] hover:bg-[#ff6b6b] hover:text-white transition-colors border border-transparent hover:border-[#ff6b6b]">
                                {team!.name}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label className="text-[9px] text-[#6B7280]">{selectedMatch.team1?.tag || 'T1'} {lang === 'id' ? 'Skor' : 'Score'}</Label>
                              <Input type="number" min={0} max={13} value={bracketScore1} onChange={e => setBracketScore1(parseInt(e.target.value) || 0)} className="h-7 text-xs bg-[#F3F4F6] border-[#E5E7EB] text-[#111827] rounded-lg" />
                            </div>
                            <span className="text-[#9CA3AF] mt-4">-</span>
                            <div className="flex-1">
                              <Label className="text-[9px] text-[#6B7280]">{selectedMatch.team2?.tag || 'T2'} {lang === 'id' ? 'Skor' : 'Score'}</Label>
                              <Input type="number" min={0} max={13} value={bracketScore2} onChange={e => setBracketScore2(parseInt(e.target.value) || 0)} className="h-7 text-xs bg-[#F3F4F6] border-[#E5E7EB] text-[#111827] rounded-lg" />
                            </div>
                          </div>
                          <button onClick={() => setSelectedBracketMatch(null)} className="text-[10px] text-[#6B7280] hover:text-[#ff6b6b]">{lang === 'id' ? 'Batal' : 'Cancel'}</button>
                        </div>
                      )
                    })()}

                    {/* Champion */}
                    {bracketMatches.some(m => m.status === 'completed' && !m.nextMatchId) && (() => {
                      const finalMatch = bracketMatches.find(m => !m.nextMatchId && m.status === 'completed')
                      if (!finalMatch?.winner) return null
                      return (
                        <div className="absolute text-center" style={{ left: (totalRounds - 1) * (matchW + connW), top: bracketH + topPad + 20, width: matchW }}>
                          <div className="inline-block bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 rounded-xl p-4 border border-[#FFD700]/30 champion-glow">
                            <Crown className="w-8 h-8 text-[#FFD700] mx-auto mb-1" />
                            <p className="text-sm font-black text-[#FFD700]">{finalMatch.winner.name}</p>
                            <p className="text-[9px] text-[#fbbf24]">{finalMatch.winner.tag}</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })()}

            {/* Bracket summary */}
            {bracketMatches.length > 0 && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                <h4 className="text-xs font-bold text-[#111827] mb-3">{lang === 'id' ? 'Ringkasan Bracket' : 'Bracket Summary'}</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-black text-[#ff6b6b]">{bracketMatches.length}</div>
                    <div className="text-[10px] text-[#6B7280]">{lang === 'id' ? 'Total Match' : 'Total Matches'}</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-[#2563EB]">{bracketMatches.filter(m => m.status === 'completed').length}</div>
                    <div className="text-[10px] text-[#6B7280]">{lang === 'id' ? 'Selesai' : 'Completed'}</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-[#fbbf24]">{bracketMatches.filter(m => m.status === 'ongoing' || (m.team1Id && m.team2Id && m.status !== 'completed')).length}</div>
                    <div className="text-[10px] text-[#6B7280]">{lang === 'id' ? 'Berlangsung' : 'Ongoing'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEAMS TAB */}
        {tab === 'teams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111827]">{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Daftar Pemain' : 'Player List') : (lang === 'id' ? 'Daftar Tim' : 'Team List')} ({teams.length}/{active.maxTeams})</h3>
              <div className="flex gap-2">
                <Button onClick={() => setShowRegLinkDialog(true)} size="sm" variant="outline" className="text-xs gap-1 border-[#E5E7EB] text-[#6B7280] hover:text-[#22c55e]"><Share2 className="w-3 h-3" />{lang === 'id' ? 'Link Daftar' : 'Reg Link'}</Button>
                <Button onClick={() => setShowBulkImport(!showBulkImport)} size="sm" variant="outline" className="text-xs gap-1 border-[#E5E7EB] text-[#6B7280] hover:text-[#2563EB]"><Clipboard className="w-3 h-3" />{tr('team.bulkImport')}</Button>
                <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}><DialogTrigger asChild><Button size="sm" className={active?.mode === 'clash_squad' ? 'bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold text-xs gap-1' : 'brand-gradient text-white font-bold text-xs gap-1'}><Plus className="w-3 h-3" />{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Tambah Pemain' : 'Add Player') : tr('team.add')}</Button></DialogTrigger>
                  <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB]">
                    <DialogHeader><DialogTitle className="text-[#111827]">{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Tambah Pemain' : 'Add Player') : tr('team.add')}</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div><Label className="text-[#4B5563] text-xs">{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Nama Pemain' : 'Player Name') : tr('team.name')}</Label><Input placeholder={active?.mode === 'clash_squad' ? 'ShadowX' : ''} value={teamName} onChange={e => setTeamName(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                      <div><Label className="text-[#4B5563] text-xs">{tr('team.tag')} (3-4 char)</Label><Input value={teamTag} onChange={e => setTeamTag(e.target.value.toUpperCase())} maxLength={4} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                      <div><Label className="text-[#4B5563] text-xs">{active?.mode === 'clash_squad' ? (lang === 'id' ? 'In-Game Name' : 'In-Game Name') : tr('team.nickname')}</Label><Input placeholder={active?.mode === 'clash_squad' ? 'shadow_pro' : ''} value={teamNickname} onChange={e => setTeamNickname(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] rounded-xl" /></div>
                      <Button onClick={addTeam} className={active?.mode === 'clash_squad' ? 'w-full bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-bold rounded-xl' : 'w-full brand-gradient text-white font-bold rounded-xl'}>{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Tambah Pemain' : 'Add Player') : tr('team.add')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {showBulkImport && (
              <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] space-y-3">
                <Textarea placeholder={active?.mode === 'clash_squad' ? (lang === 'id' ? 'NamaPemain, TAG, IGN\nSatu per baris' : 'PlayerName, TAG, IGN\nOne per line') : (lang === 'id' ? 'NamaSquad, TAG, Nickname\nSatu per baris' : 'SquadName, TAG, Nickname\nOne per line')} value={bulkText} onChange={e => setBulkText(e.target.value)} className="bg-white border-[#E5E7EB] text-[#111827] min-h-[100px] text-xs" />
                <Button onClick={bulkImportTeams} className="w-full brand-gradient text-white font-bold rounded-xl">{lang === 'id' ? 'Import' : 'Import'}</Button>
              </div>
            )}

            {!teams.length ? (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-[#374151] mx-auto mb-3" />
                <p className="text-xs text-[#6B7280] mb-3">{tr('misc.noData')}</p>
                <Button onClick={addSampleTeams} size="sm" variant="outline" className={`text-xs gap-1 border-[#E5E7EB] ${active?.mode === 'clash_squad' ? 'text-[#ff6b6b] hover:text-[#ff6b6b]' : 'text-[#6B7280] hover:text-[#2563EB]'}`}>{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Tambah Sample 8 Pemain' : 'Add 8 Sample Players') : (lang === 'id' ? 'Tambah Sample 12 Tim' : 'Add 12 Sample Teams')}</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.map(team => {
                  const lb = leaderboard.find(l => l.id === team.id)
                  return (
                    <div key={team.id} className={`flex items-center justify-between px-4 py-3 bg-[#F9FAFB] rounded-xl border hover:border-[#2563EB]/20 transition-colors ${active?.mode === 'clash_squad' ? 'border-[#ff6b6b]/10' : 'border-[#E5E7EB]'}`}>
                      <div><span className="text-sm font-medium text-[#111827]">{team.name}</span> <span className="text-[10px] text-[#6B7280]">({team.tag})</span>{team.nickname && <span className="text-[10px] text-[#fbbf24] ml-1">· {team.nickname}</span>}</div>
                      <div className="flex items-center gap-2">
                        {active?.mode !== 'clash_squad' && lb && <span className="text-[10px] text-[#2563EB] font-bold">{lb.totalPoints} pts</span>}
                        <button onClick={() => { setConfirmDelete(team.id); setConfirmType('team') }} className="p-1 text-[#6B7280] hover:text-[#ff6b6b] transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )
                })}
                {teams.length < active.maxTeams && <Button onClick={addSampleTeams} size="sm" variant="outline" className={`text-xs gap-1 border-[#E5E7EB] ${active?.mode === 'clash_squad' ? 'text-[#ff6b6b] hover:text-[#ff6b6b]' : 'text-[#6B7280] hover:text-[#2563EB]'} w-full`}>{active?.mode === 'clash_squad' ? (lang === 'id' ? 'Tambah Sample Pemain' : 'Add Sample Players') : (lang === 'id' ? 'Tambah Sample' : 'Add Sample')}</Button>}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB (Feature 6) */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2"><Activity className="w-4 h-4 text-[#2563EB]" />{lang === 'id' ? 'Statistik & Analytics' : 'Statistics & Analytics'}</h3>
            {!analyticsData ? (
              <Card className="text-center py-12 bg-[#F9FAFB] border-[#E5E7EB] rounded-xl"><CardContent><BarChart3 className="w-10 h-10 text-[#374151] mx-auto mb-3" /><p className="text-xs text-[#6B7280]">{tr('misc.noData')}</p></CardContent></Card>
            ) : (
              <>
                {/* MVP & Most Consistent Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {analyticsData.mvp && (
                    <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#2563EB]/5 rounded-xl p-5 border border-[#2563EB]/20">
                      <div className="flex items-center gap-2 mb-2"><Award className="w-5 h-5 text-[#2563EB]" /><span className="text-xs font-bold text-[#111827]">{lang === 'id' ? 'MVP — Kill Terbanyak' : 'MVP — Most Kills'}</span></div>
                      <div className="text-lg font-black text-[#2563EB]">{analyticsData.mvp.name}</div>
                      <div className="text-xs text-[#6B7280]">{analyticsData.mvp.tag} · {analyticsData.mvp.totalKills} {lang === 'id' ? 'kill' : 'kills'} · {analyticsData.mvp.totalPoints} pts</div>
                    </div>
                  )}
                  {analyticsData.mostConsistent && (
                    <div className="bg-gradient-to-br from-[#22c55e]/10 to-[#22c55e]/5 rounded-xl p-5 border border-[#22c55e]/20">
                      <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-[#22c55e]" /><span className="text-xs font-bold text-[#111827]">{lang === 'id' ? 'Paling Konsisten' : 'Most Consistent'}</span></div>
                      <div className="text-lg font-black text-[#22c55e]">{analyticsData.mostConsistent.name}</div>
                      <div className="text-xs text-[#6B7280]">{analyticsData.mostConsistent.tag} · {lang === 'id' ? 'Varians terendah' : 'Lowest variance'} · {analyticsData.mostConsistent.avgPlacement.toFixed(1)} {lang === 'id' ? 'avg place' : 'avg place'}</div>
                    </div>
                  )}
                </div>
                {/* Bar Chart: Points per Team */}
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                  <h4 className="text-xs font-bold text-[#111827] mb-3">{lang === 'id' ? 'Total Poin per Tim' : 'Total Points per Team'}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analyticsData.barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', fontSize: 11 }} />
                      <Bar dataKey="points" radius={[4,4,0,0]} name="Points">{analyticsData.barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Line Chart: Points Progression */}
                {analyticsData.lineData.length > 1 && (
                  <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                    <h4 className="text-xs font-bold text-[#111827] mb-3">{lang === 'id' ? 'Progres Poin per Match' : 'Points Progression'}</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analyticsData.lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="match" tick={{ fill: '#6B7280', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', fontSize: 11 }} />
                        <Legend />
                        {leaderboard.slice(0, 5).map((entry, i) => (
                          <Line key={entry.id} type="monotone" dataKey={entry.tag} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: COLORS[i % COLORS.length] }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {/* Pie Chart: Kill Distribution */}
                <div className="bg-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB]">
                  <h4 className="text-xs font-bold text-[#111827] mb-3">{lang === 'id' ? 'Distribusi Kill' : 'Kill Distribution'}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={analyticsData.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {analyticsData.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend />
                      <RechartsTooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {!chatMessages.length && <p className="text-xs text-[#9CA3AF] text-center py-8">{lang === 'id' ? 'Belum ada pesan' : 'No messages yet'}</p>}
              {chatMessages.map(msg => (
                <div key={msg.id} className="bg-[#F9FAFB] rounded-xl p-3 border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold text-[#2563EB]">{msg.userName || msg.userId.slice(0,6)}</span><span className="text-[9px] text-[#9CA3AF]">{new Date(msg.createdAt).toLocaleTimeString()}</span></div>
                  <p className="text-xs text-[#4B5563]">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={lang === 'id' ? 'Tulis pesan...' : 'Type a message...'} className="bg-[#F9FAFB] border-[#E5E7EB] text-[#111827] rounded-xl text-xs" onKeyDown={e => e.key === 'Enter' && sendChatMessage()} />
              <Button onClick={sendChatMessage} className="brand-gradient text-white font-bold rounded-xl px-4"><MessageCircle className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </main>

      {/* Feature 2: Team Profile Dialog */}
      <Dialog open={!!teamProfileEntry} onOpenChange={() => setTeamProfileEntry(null)}>
        <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#111827] flex items-center gap-2"><Users className="w-5 h-5 text-[#2563EB]" />{teamProfileEntry?.name}</DialogTitle></DialogHeader>
          {teamProfileEntry && (
            <div className="space-y-4 pt-2">
              {/* Team Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center text-lg font-black text-[#2563EB]">{teamProfileEntry.tag.slice(0, 2)}</div>
                <div>
                  <div className="text-sm font-bold text-[#111827]">{teamProfileEntry.name}</div>
                  <div className="text-xs text-[#6B7280]">{teamProfileEntry.tag} {teamProfileEntry.nickname && <span className="text-[#fbbf24]">· {teamProfileEntry.nickname}</span>}</div>
                </div>
              </div>
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] text-center">
                  <div className="text-lg font-black text-[#2563EB]">{teamProfileEntry.totalPoints}</div>
                  <div className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Total Poin' : 'Total Points'}</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] text-center">
                  <div className="text-lg font-black text-[#fbbf24]">{teamProfileEntry.totalKills}</div>
                  <div className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Total Kill' : 'Total Kills'}</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] text-center">
                  <div className="text-lg font-black text-[#111827]">{teamProfileEntry.matchesPlayed}</div>
                  <div className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Match' : 'Matches'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] text-center">
                  <div className="text-lg font-black text-[#22c55e]">#{teamProfileEntry.bestPlacement}</div>
                  <div className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Best Place' : 'Best Place'}</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] text-center">
                  <div className="text-lg font-black text-[#00b4d8]">{teamProfileEntry.avgPlacement.toFixed(1)}</div>
                  <div className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Avg Place' : 'Avg Place'}</div>
                </div>
                <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] text-center">
                  <div className="text-lg font-black text-[#FFD700]">{teamProfileEntry.firstPlaceCount}</div>
                  <div className="text-[9px] text-[#6B7280]">{lang === 'id' ? 'Booyah' : 'Booyahs'}</div>
                </div>
              </div>
              {/* Win Rate */}
              <div className="bg-white rounded-xl p-3 border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#111827]">{lang === 'id' ? 'Win Rate' : 'Win Rate'}</span>
                  <span className="text-xs font-bold text-[#2563EB]">{teamProfileEntry.matchesPlayed > 0 ? ((teamProfileEntry.firstPlaceCount / teamProfileEntry.matchesPlayed) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden"><div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${teamProfileEntry.matchesPlayed > 0 ? (teamProfileEntry.firstPlaceCount / teamProfileEntry.matchesPlayed) * 100 : 0}%` }} /></div>
              </div>
              {/* Match History */}
              {teamProfileEntry.matchBreakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#111827] mb-2">{lang === 'id' ? 'Riwayat Match' : 'Match History'}</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {teamProfileEntry.matchBreakdown.map((mb, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-xs">
                        <span className="text-[#6B7280]">M{mb.matchNumber}</span>
                        <span className={`font-bold ${mb.placement === 1 ? 'text-[#FFD700]' : mb.placement <= 3 ? 'text-[#22c55e]' : 'text-[#111827]'}`}>#{mb.placement}</span>
                        <span className="text-[#fbbf24]">{mb.kills}k</span>
                        <span className="text-[#2563EB] font-bold">{mb.totalPoints}pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-sm">
          <DialogHeader><DialogTitle className="text-[#111827]">{lang === 'id' ? 'Profil' : 'Profile'}</DialogTitle></DialogHeader>
          {loggedInUser && (
            <div className="space-y-3 pt-2">
              <div><Label className="text-[#4B5563] text-xs">{tr('auth.email')}</Label><p className="text-sm text-[#111827]">{loggedInUser.email}</p></div>
              <div><Label className="text-[#4B5563] text-xs">Name</Label><p className="text-sm text-[#111827]">{loggedInUser.name}</p></div>
              <div><Label className="text-[#4B5563] text-xs">Role</Label><Badge variant="secondary" className="bg-[#F3F4F6] text-[#4B5563]">{loggedInUser.role}</Badge></div>
              <Button onClick={handleLogout} variant="outline" className="w-full border-[#ff6b6b] text-[#ff6b6b] hover:bg-[#ff6b6b]/10 gap-2 mt-4"><LogOut className="w-4 h-4" />{tr('nav.logout')}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog />

      {/* Registration Link Dialog */}
      <Dialog open={showRegLinkDialog} onOpenChange={setShowRegLinkDialog}>
        <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#111827] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#22c55e]" />
              {lang === 'id' ? 'Link Registrasi Tim' : 'Team Registration Link'}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280] text-xs">
              {lang === 'id' ? 'Bagikan link ini ke tim yang mau daftar. Mereka bisa isi sendiri tanpa admin.' : 'Share this link with teams who want to register. They can sign up without admin.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
              <p className="text-[10px] text-[#6B7280] mb-2 uppercase tracking-wider font-bold">{lang === 'id' ? 'Link Registrasi' : 'Registration Link'}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-[#22c55e] bg-[#F3F4F6] px-3 py-2 rounded-lg truncate">{typeof window !== 'undefined' ? `${window.location.origin}/t/${active?.id}` : `/t/${active?.id}`}</code>
                <Button size="sm" variant="outline" className="text-xs gap-1 border-[#E5E7EB] text-[#6B7280] hover:text-[#22c55e] h-8" onClick={() => {
                  const link = `${window.location.origin}/t/${active?.id}`
                  navigator.clipboard.writeText(link)
                  toast({ title: lang === 'id' ? 'Link tersalin!' : 'Link copied!' })
                }}><Copy className="w-3 h-3" /></Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="allowReg" checked={active?.allowRegistration || false} onChange={async (e) => {
                if (!active) return
                try {
                  const r = await fetch(`/api/tournaments/${active.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ allowRegistration: e.target.checked }) })
                  if (r.ok) { refresh(); toast({ title: lang === 'id' ? 'Pengaturan disimpan' : 'Setting saved' }) }
                } catch { toast({ title: 'Error', variant: 'destructive' }) }
              }} className="w-4 h-4 rounded accent-[#22c55e]" />
              <Label htmlFor="allowReg" className="text-xs text-[#4B5563]">{lang === 'id' ? 'Izinkan tim daftar sendiri via link' : 'Allow teams to self-register via link'}</Label>
            </div>
            <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg p-3">
              <p className="text-[10px] text-[#22c55e] flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {lang === 'id' ? 'Tim yang daftar via link akan otomatis masuk ke daftar tim turnamen.' : 'Teams registering via link will be automatically added to the tournament team list.'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bracket Download Dialog */}
      <Dialog open={showBracketDownload} onOpenChange={setShowBracketDownload}>
        <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#111827] flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#2563EB]" />
              {lang === 'id' ? 'Download Bracket — Pilih Template' : 'Download Bracket — Choose Template'}
            </DialogTitle>
            <DialogDescription className="text-[#6B7280] text-xs">
              {lang === 'id' ? 'Pilih design bracket yang kamu suka, lalu klik Download' : 'Choose a bracket design you like, then click Download'}
            </DialogDescription>
          </DialogHeader>

          {/* Template Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            {BRACKET_TEMPLATES.map(tpl => (
              <button key={tpl.id} onClick={() => setBracketTemplate(tpl.id)}
                className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                  bracketTemplate === tpl.id
                    ? 'border-[#2563EB] bg-[#2563EB]/10 ring-2 ring-[#2563EB]/30'
                    : 'border-[#E5E7EB] bg-white hover:border-[#2563EB]/30'
                }`}>
                {/* Mini bracket preview — Excel-style */}
                <div className="h-20 rounded mb-2 overflow-hidden relative flex items-center justify-center" style={{ background: tpl.preview.bg, border: `1px solid ${tpl.preview.border}` }}>
                  {/* Mini spreadsheet-like bracket */}
                  <div className="flex items-center gap-0" style={{ transform: 'scale(0.8)' }}>
                    <div className="flex flex-col gap-[2px]">
                      <div className="w-8 h-3" style={{ background: tpl.preview.cell, border: `1px solid ${tpl.preview.border}` }} />
                      <div className="w-8 h-3" style={{ background: tpl.preview.cell, border: `1px solid ${tpl.preview.border}` }} />
                    </div>
                    <div style={{ width: 8, borderTop: `1px solid ${tpl.preview.line}`, alignSelf: 'center' }} />
                    <div className="flex flex-col gap-[6px]">
                      <div className="w-7 h-3" style={{ background: tpl.preview.cell, border: `1px solid ${tpl.preview.border}` }} />
                    </div>
                    <div style={{ width: 8, borderTop: `1px solid ${tpl.preview.line}`, alignSelf: 'center' }} />
                    <div className="w-7 h-3" style={{ background: tpl.preview.cell, border: `1px solid ${tpl.preview.accent}` }} />
                    <div style={{ width: 8, borderTop: `1px solid ${tpl.preview.line}`, alignSelf: 'center' }} />
                    <div className="flex flex-col gap-[6px]">
                      <div className="w-7 h-3" style={{ background: tpl.preview.cell, border: `1px solid ${tpl.preview.border}` }} />
                    </div>
                    <div style={{ width: 8, borderTop: `1px solid ${tpl.preview.line}`, alignSelf: 'center' }} />
                    <div className="flex flex-col gap-[2px]">
                      <div className="w-8 h-3" style={{ background: tpl.preview.cell, border: `1px solid ${tpl.preview.border}` }} />
                      <div className="w-8 h-3" style={{ background: tpl.preview.cell, border: `1px solid ${tpl.preview.border}` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#111827]">{lang === 'id' ? tpl.nameId : tpl.name}</span>
                  {bracketTemplate === tpl.id && (
                    <Badge className="text-[7px] bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30">✓</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Live Preview */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-[#4B5563] mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />{lang === 'id' ? 'Preview Template' : 'Template Preview'}
            </h4>
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-auto p-2" style={{ maxHeight: '320px' }}>
              <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: '250%', pointerEvents: 'none' }}>
                {renderBracketTemplate(bracketTemplate)}
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1 text-[#6B7280]" onClick={() => setShowBracketDownload(false)}>
              {lang === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button onClick={downloadBracketImage} disabled={downloadingBracket}
              className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold gap-2 rounded-xl">
              {downloadingBracket ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'id' ? 'Memproses...' : 'Processing...'}</>
              ) : (
                <><Download className="w-4 h-4" />{lang === 'id' ? `Download ${BRACKET_TEMPLATES.find(t => t.id === bracketTemplate)?.nameId}` : `Download ${BRACKET_TEMPLATES.find(t => t.id === bracketTemplate)?.name}`}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden render for html2canvas capture - rendered off-screen */}
      {showBracketDownload && (
        <div aria-hidden="true" style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, opacity: 1, pointerEvents: 'none' }}>
          {renderBracketTemplate(bracketTemplate)}
        </div>
      )}

      {/* Feature 9: Share Card Dialog */}
      <Dialog open={showShareCard} onOpenChange={setShowShareCard}>
        <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-md">
          <DialogHeader><DialogTitle className="text-[#111827] flex items-center gap-2"><Share2 className="w-4 h-4 text-[#2563EB]" />{lang === 'id' ? 'Share Card' : 'Share Card'}</DialogTitle></DialogHeader>
          <div ref={shareCardRef} className="bg-gradient-to-br from-[#FFF7ED] to-white rounded-2xl p-6 border-2 border-[#2563EB]/20" style={{ minWidth: 320 }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center"><Trophy className="w-5 h-5 text-white" /></div>
              <div>
                <div className="text-base font-black text-[#111827]">{active?.name}</div>
                <div className="text-[10px] text-[#6B7280]">{active?.prizePool && <span className="text-[#fbbf24] font-bold">{active.prizePool} · </span>}{lang === 'id' ? 'Klasemen' : 'Leaderboard'}</div>
              </div>
            </div>
            {/* Top 5 */}
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div key={entry.id} className={`flex items-center justify-between px-3 py-2 rounded-xl ${i === 0 ? 'bg-[#2563EB]/10 border border-[#2563EB]/20' : 'bg-white border border-[#E5E7EB]'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-[#FFD700] text-black' : i === 1 ? 'bg-[#C0C0C0] text-black' : i === 2 ? 'bg-[#CD7F32] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>{i + 1}</span>
                    <span className="text-xs font-bold text-[#111827]">{entry.name}</span>
                    <span className="text-[9px] text-[#6B7280]">({entry.tag})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#fbbf24] font-bold">{entry.totalKills}k</span>
                    <span className="text-sm font-black text-[#2563EB]">{entry.totalPoints}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-1.5"><LogoFoxArea size={16} /><span className="text-[10px] font-black text-[#111827]">FoxArea</span></div>
              <span className="text-[8px] text-[#9CA3AF]">{new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')}</span>
            </div>
            <p className="text-center text-[8px] text-[#9CA3AF] mt-1">Powered by FoxArea</p>
          </div>
          <div className="flex gap-2 mt-3">
            <Button className="flex-1 brand-gradient text-white font-bold text-xs gap-1 rounded-xl" onClick={async () => {
              if (!shareCardRef.current) return
              try {
                const canvas = await html2canvas(shareCardRef.current, { backgroundColor: null, scale: 2, useCORS: true, logging: false })
                const link = document.createElement('a'); link.download = `${active?.name || 'share'}_card.png`; link.href = canvas.toDataURL('image/png'); link.click()
                toast({ title: lang === 'id' ? 'Gambar tersimpan!' : 'Image saved!' })
              } catch { toast({ title: 'Error', variant: 'destructive' }) }
            }}><Download className="w-3 h-3" />{lang === 'id' ? 'Simpan' : 'Save'}</Button>
            <Button variant="outline" className="flex-1 text-xs gap-1 border-[#25D366]/30 text-[#25D366] rounded-xl" onClick={() => {
              const top5 = leaderboard.slice(0, 5).map((e, i) => `${i + 1}. ${e.name} (${e.totalPoints} pts)`).join('\n')
              const text = `🏆 ${active?.name}\n\n${top5}\n\nPowered by FoxArea`
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
            }}><MessageCircle className="w-3 h-3" />WhatsApp</Button>
            <Button variant="outline" className="flex-1 text-xs gap-1 border-[#1DA1F2]/30 text-[#1DA1F2] rounded-xl" onClick={() => {
              const top3 = leaderboard.slice(0, 3).map((e, i) => `${i + 1}. ${e.name}`).join(', ')
              const text = `🏆 ${active?.name}\nTop 3: ${top3}\n\nPowered by @FoxArea`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
            }}><Twitter className="w-3 h-3" />Twitter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature 10: Push Notification Permission UI */}
      <Dialog open={showNotifPerm} onOpenChange={setShowNotifPerm}>
        <DialogContent className="bg-[#F9FAFB] border-[#E5E7EB] max-w-sm">
          <DialogHeader><DialogTitle className="text-[#111827] flex items-center gap-2"><Bell className="w-5 h-5 text-[#2563EB]" />{lang === 'id' ? 'Notifikasi' : 'Notifications'}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-xs text-[#4B5563]">{lang === 'id' ? 'Aktifkan notifikasi untuk mendapat update skor real-time dan pengumuman turnamen.' : 'Enable notifications to get real-time score updates and tournament announcements.'}</p>
            <div className="flex gap-2">
              <Button onClick={() => { if ('Notification' in window) { Notification.requestPermission(); toast({ title: lang === 'id' ? 'Notifikasi diaktifkan!' : 'Notifications enabled!' }) } setShowNotifPerm(false) }} className="flex-1 brand-gradient text-white font-bold text-xs gap-1"><Bell className="w-3 h-3" />{lang === 'id' ? 'Aktifkan' : 'Enable'}</Button>
              <Button variant="outline" onClick={() => setShowNotifPerm(false)} className="flex-1 text-xs">{lang === 'id' ? 'Nanti' : 'Later'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
