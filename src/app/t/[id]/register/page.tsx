'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TournamentInfo {
  id: string; name: string; description: string | null; status: string
  maxTeams: number; allowRegistration: boolean; gameType: string
  teams: { id: string; name: string; tag: string }[]
}

export default function RegisterPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string

  const [tournament, setTournament] = useState<TournamentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  const [teamName, setTeamName] = useState('')
  const [teamTag, setTeamTag] = useState('')
  const [teamNickname, setTeamNickname] = useState('')

  useEffect(() => {
    fetch(`/api/tournaments/${id}/public`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setTournament(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleRegister = async () => {
    if (!teamName.trim() || !teamTag.trim()) {
      toast({ title: 'Error', description: 'Nama dan Tag wajib diisi', variant: 'destructive' })
      return
    }
    setRegistering(true)
    try {
      const r = await fetch(`/api/tournaments/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, tag: teamTag.toUpperCase(), nickname: teamNickname })
      })
      const data = await r.json()
      if (r.ok) {
        setRegistered(true)
        toast({ title: 'Berhasil!', description: `${teamName} berhasil terdaftar!` })
      } else {
        toast({ title: 'Gagal', description: data.error || 'Gagal mendaftar', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Gagal mendaftar', variant: 'destructive' })
    }
    setRegistering(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="loader-ring" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <XCircle className="w-12 h-12 text-[#ef4444]" />
        <h1 className="text-xl font-black text-[#f1f5f9]">Turnamen Tidak Ditemukan</h1>
        <button onClick={() => router.push('/')} className="text-sm text-[#b4f050] hover:underline">Kembali ke Beranda</button>
      </div>
    )
  }

  if (!tournament.allowRegistration) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <XCircle className="w-12 h-12 text-[#ef4444]" />
        <h1 className="text-xl font-black text-[#f1f5f9]">Registrasi Ditutup</h1>
        <p className="text-sm text-[#888888]">Turnamen ini tidak membuka registrasi tim.</p>
        <button onClick={() => router.push(`/t/${id}`)} className="text-sm text-[#b4f050] hover:underline">Lihat Klasemen</button>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <CheckCircle2 className="w-16 h-16 text-[#b4f050]" />
        <h1 className="text-2xl font-black text-[#f1f5f9]">Berhasil Terdaftar!</h1>
        <p className="text-sm text-[#888888]">{teamName} sudah terdaftar di {tournament.name}</p>
        <button onClick={() => router.push(`/t/${id}`)} className="btn-primary px-6 py-3 text-sm">Lihat Klasemen</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.push(`/t/${id}`)} className="text-[#64748b] hover:text-[#b4f050]">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="pixel-font text-lg font-black text-[#b4f050]">8Bit</span>
          <span className="text-[10px] text-[#64748b] font-semibold tracking-widest">REGISTRASI TIM</span>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-5">
        {/* Tournament Info */}
        <Card className="bg-[#141414] border-[#262626] rounded-xl">
          <CardContent className="p-5">
            <Badge className={`text-[10px] mb-3 ${tournament.status === 'ongoing' ? 'bg-[#b4f050]/10 text-[#b4f050]' : 'bg-[#262626] text-[#64748b]'}`}>
              {tournament.status === 'ongoing' ? 'LIVE' : tournament.status === 'completed' ? 'Selesai' : 'Mendatang'}
            </Badge>
            <h1 className="text-xl font-black text-[#f1f5f9] mb-1">{tournament.name}</h1>
            {tournament.description && <p className="text-sm text-[#888888]">{tournament.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-[#888888]">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tournament.teams.length}/{tournament.maxTeams} tim</span>
              <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{tournament.gameType || 'Free Fire'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="bg-[#141414] border-[#b4f050]/20 rounded-xl">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-black text-[#f1f5f9]">Daftarkan Tim</h2>
            <p className="text-xs text-[#888888]">Isi data tim kamu untuk bergabung di turnamen</p>

            <div>
              <Label className="text-[#888888] text-xs">Nama Squad *</Label>
              <Input placeholder="EVOS Legend" value={teamName} onChange={e => setTeamName(e.target.value)} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-[#888888] text-xs">Tag *</Label>
              <Input placeholder="EVS" maxLength={5} value={teamTag} onChange={e => setTeamTag(e.target.value.toUpperCase())} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-[#888888] text-xs">Nickname</Label>
              <Input placeholder="Nama IG player" value={teamNickname} onChange={e => setTeamNickname(e.target.value)} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" />
            </div>

            <Button onClick={handleRegister} disabled={registering || !teamName.trim() || !teamTag.trim()} className="btn-primary w-full py-3 text-sm">
              {registering ? 'Mendaftar...' : 'Daftarkan Tim'}
            </Button>
          </CardContent>
        </Card>

        {/* Registered Teams */}
        {tournament.teams.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-[#888888] mb-2 uppercase tracking-wider">Tim Terdaftar</h3>
            <div className="space-y-2">
              {tournament.teams.map(t => (
                <div key={t.id} className="flex items-center gap-3 bg-[#141414] border border-[#262626] rounded-lg px-4 py-3">
                  <div className="w-8 h-8 rounded bg-[#b4f050]/10 flex items-center justify-center text-[9px] font-black text-[#b4f050]">{t.tag}</div>
                  <span className="text-sm font-bold text-[#f1f5f9]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#1a1a1a] py-4 text-center text-[10px] text-[#475569]">
        Powered by 8Bit Tournament
      </footer>
    </div>
  )
}
