'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, Save, Megaphone, Palette, Type, Zap,
  Eye, Target, BarChart3, Star, AlertCircle,
  Sun, Moon, Volume2, VolumeX, ArrowLeft, LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import Logo8Bit from '@/components/Logo8Bit'

// ======== LOADING OVERLAY ========
function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="loader-ring" />
        {text && <p className="text-xs text-[#888888] mt-1">{text}</p>}
      </div>
    </div>
  )
}

// ======== TYPES ========
interface AdBannerData { id: string; title: string; subtitle: string | null; imageUrl: string | null; linkUrl: string | null; position: string; slot: string; active: boolean; order: number }

// ======== MAIN COMPONENT ========
export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Check auth
  const [loggedInUser, setLoggedInUser] = useState<{ id?: string; email: string; name: string; role?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ffscorer_user')
      if (stored) { try { return JSON.parse(stored) } catch { return null } }
    }
    return null
  })
  const [authChecked, setAuthChecked] = useState(false)

  // Auth headers for API calls
  const authHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ffscorer_token') : null
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  }, [])

  // Theme & sound
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('8bit_theme') as 'dark' | 'light') || 'dark'
    }
    return 'dark'
  })
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('8bit_sound') !== 'off'
    }
    return true
  })

  // Sound FX
  const playSound = useCallback((type: 'click' | 'success' | 'error' | 'nav') => {
    if (!soundEnabled) return
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      gain.gain.value = 0.08; osc.type = 'square'
      if (type === 'click') { osc.frequency.value = 800; gain.gain.value = 0.05 }
      else if (type === 'success') { osc.frequency.value = 1200; gain.gain.value = 0.06 }
      else if (type === 'error') { osc.frequency.value = 200; gain.gain.value = 0.07 }
      else if (type === 'nav') { osc.frequency.value = 600; gain.gain.value = 0.04 }
      osc.start(); osc.stop(ctx.currentTime + 0.06)
      setTimeout(() => ctx.close(), 100)
    } catch {}
  }, [soundEnabled])

  // Admin states
  const [actionLoading, setActionLoading] = useState<string>('')
  const [adminTab, setAdminTab] = useState<'banners' | 'homepage' | 'settings'>('banners')
  const [adminAds, setAdminAds] = useState<AdBannerData[]>([])
  const [adminSiteSettings, setAdminSiteSettings] = useState<{ id: string; key: string; value: string; type: string }[]>([])
  const [adminEditingAd, setAdminEditingAd] = useState<AdBannerData | null>(null)
  const [adminNewAd, setAdminNewAd] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'homepage', slot: 'banner1', order: 0 })
  const [adminEditingSetting, setAdminEditingSetting] = useState<string>('')
  const [adminSettingValue, setAdminSettingValue] = useState('')

  // Fetch admin data
  const fetchAdminData = useCallback(async () => {
    try {
      const [adsRes, settingsRes] = await Promise.all([
        fetch('/api/ads?all=true'),
        fetch('/api/settings/site'),
      ])
      if (adsRes.ok) {
        const allAds = await adsRes.json()
        setAdminAds(Array.isArray(allAds) ? allAds : [])
      }
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setAdminSiteSettings(Array.isArray(settings) ? settings : [])
      }
    } catch (e) { console.error('fetchAdminData:', e) }
  }, [])

  // Auth check + fetch admin data
  useEffect(() => {
    if (!loggedInUser) {
      router.push('/')
      return
    }
    // Verify user role from API using token-based auth
    const token = localStorage.getItem('ffscorer_token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    fetch('/api/auth/verify-code', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ email: loggedInUser.email, checkOnly: true })
    }).then(r => {
      if (r.status === 401) {
        // Token invalid - redirect to login
        localStorage.removeItem('ffscorer_user')
        localStorage.removeItem('ffscorer_token')
        router.push('/')
        return null
      }
      return r.json()
    }).then(data => {
      if (data?.user) {
        const updatedUser = { ...loggedInUser, id: data.user.id, role: data.user.role }
        localStorage.setItem('ffscorer_user', JSON.stringify(updatedUser))
        setLoggedInUser(updatedUser)
        // Check admin role
        if (data.user.role !== 'admin') {
          router.push('/')
        }
      }
      setAuthChecked(true)
      // Fetch admin data after auth check passes
      return fetchAdminData()
    }).catch(() => {
      setAuthChecked(true)
    })
  }, [loggedInUser, router])

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light')
    localStorage.setItem('8bit_theme', theme)
  }, [theme])

  // Sound effect
  useEffect(() => {
    localStorage.setItem('8bit_sound', soundEnabled ? 'on' : 'off')
  }, [soundEnabled])

  // Admin actions
  const saveAd = async () => {
    setActionLoading('Menyimpan banner...')
    playSound('click')
    try {
      if (adminEditingAd) {
        const r = await fetch('/api/ads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: adminEditingAd.id, ...adminNewAd }) })
        if (r.ok) { toast({ title: 'Berhasil!', description: 'Banner diupdate' }); setAdminEditingAd(null); playSound('success') }
        else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); playSound('error') }
      } else {
        const r = await fetch('/api/ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminNewAd) })
        if (r.ok) { toast({ title: 'Berhasil!', description: 'Banner ditambahkan' }); playSound('success') }
        else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); playSound('error') }
      }
      setAdminNewAd({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'homepage', slot: 'banner1', order: 0 })
      fetchAdminData()
    } catch { toast({ title: 'Error', description: 'Gagal menyimpan', variant: 'destructive' }); playSound('error') }
    setActionLoading('')
  }

  const deleteAd = async (id: string) => {
    setActionLoading('Menghapus banner...')
    playSound('click')
    try {
      const r = await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
      if (r.ok) { toast({ title: 'Dihapus!', description: 'Banner dihapus' }); fetchAdminData(); playSound('success') }
      else { toast({ title: 'Error', description: 'Gagal menghapus', variant: 'destructive' }); playSound('error') }
    } catch { toast({ title: 'Error', description: 'Gagal menghapus', variant: 'destructive' }); playSound('error') }
    setActionLoading('')
  }

  const toggleAdActive = async (ad: AdBannerData) => {
    playSound('click')
    try {
      await fetch('/api/ads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ad.id, active: !ad.active }) })
      fetchAdminData()
    } catch { /* silent */ }
  }

  const saveSiteSetting = async (key: string, value: string) => {
    setActionLoading('Menyimpan...')
    playSound('click')
    try {
      const r = await fetch('/api/settings/site', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) })
      if (r.ok) { toast({ title: 'Berhasil!', description: 'Pengaturan disimpan' }); fetchAdminData(); playSound('success') }
      else { toast({ title: 'Error', description: 'Gagal menyimpan', variant: 'destructive' }); playSound('error') }
    } catch { toast({ title: 'Error', description: 'Gagal menyimpan', variant: 'destructive' }); playSound('error') }
    setActionLoading('')
  }

  const deleteSiteSetting = async (key: string) => {
    playSound('click')
    try {
      await fetch(`/api/settings/site?key=${key}`, { method: 'DELETE' })
      toast({ title: 'Dihapus!', description: 'Pengaturan dihapus' })
      fetchAdminData(); playSound('success')
    } catch { /* silent */ }
  }

  const handleLogout = () => {
    localStorage.removeItem('ffscorer_user')
    localStorage.removeItem('ffscorer_token')
    router.push('/')
    playSound('nav')
  }

  if (!loggedInUser || !authChecked) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {actionLoading && <LoadingOverlay text={actionLoading} />}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => { router.push('/'); playSound('nav') }} className="flex items-center gap-2 hover:text-[#b4f050] transition-colors">
              <ArrowLeft className="w-4 h-4 text-[#64748b]" />
              <Logo8Bit size={24} />
              <span className="text-xl font-black brand-text tracking-tight">8Bit</span>
              <span className="text-[10px] text-[#64748b] font-semibold tracking-widest hidden sm:inline">ADMIN PANEL</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setTheme(t => t === 'dark' ? 'light' : 'dark'); playSound('nav') }} className="p-2 rounded-lg hover:bg-[#1f1f1f] text-[#64748b] hover:text-[#b4f050] transition-colors" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { setSoundEnabled(s => !s); playSound('click') }} className="p-2 rounded-lg hover:bg-[#1f1f1f] text-[#64748b] hover:text-[#b4f050] transition-colors" title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}>
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <Badge className="bg-[#ef4444]/10 text-[#ef4444] text-[10px] border-[#ef4444]/20">ADMIN</Badge>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#b4f050] flex items-center justify-center text-[10px] font-black text-[#0a0a0a]">
                {loggedInUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-[#f1f5f9] hidden sm:inline max-w-[120px] truncate">{loggedInUser.name}</span>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-[#1f1f1f] text-[#64748b] hover:text-[#ef4444] transition-colors" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="border-b border-[#262626] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          {[
            { id: 'banners' as const, label: 'Banner Iklan', icon: Megaphone },
            { id: 'homepage' as const, label: 'Homepage', icon: Palette },
            { id: 'settings' as const, label: 'Pengaturan', icon: Target },
          ].map(t => (
            <button key={t.id} onClick={() => { setAdminTab(t.id); playSound('nav') }}
              className={`flex items-center gap-2 px-5 py-3 text-sm border-b-2 transition-colors ${adminTab === t.id ? 'border-[#b4f050] text-[#b4f050] font-semibold' : 'border-transparent text-[#888888] hover:text-[#f1f5f9]'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {/* ===== BANNERS TAB ===== */}
        {adminTab === 'banners' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#f1f5f9]">Banner Iklan</h2>
              <p className="text-xs text-[#888888]">Kelola banner sponsor & iklan</p>
            </div>
            <Card className="bg-[#141414] border-[#262626] rounded-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-[#f1f5f9] mb-4 flex items-center gap-2">
                  {adminEditingAd ? <><Save className="w-4 h-4 text-[#b4f050]" />Edit Banner</> : <><Plus className="w-4 h-4 text-[#b4f050]" />Tambah Banner Baru</>}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label className="text-[#888888] text-xs">Judul *</Label><Input placeholder="Nama Sponsor" value={adminNewAd.title} onChange={e => setAdminNewAd({...adminNewAd, title: e.target.value})} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" /></div>
                  <div><Label className="text-[#888888] text-xs">Subtitle</Label><Input placeholder="Deskripsi singkat" value={adminNewAd.subtitle} onChange={e => setAdminNewAd({...adminNewAd, subtitle: e.target.value})} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" /></div>
                  <div><Label className="text-[#888888] text-xs">Image URL</Label><Input placeholder="https://example.com/banner.jpg" value={adminNewAd.imageUrl} onChange={e => setAdminNewAd({...adminNewAd, imageUrl: e.target.value})} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" /></div>
                  <div><Label className="text-[#888888] text-xs">Link URL</Label><Input placeholder="https://sponsor.com" value={adminNewAd.linkUrl} onChange={e => setAdminNewAd({...adminNewAd, linkUrl: e.target.value})} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" /></div>
                  <div>
                    <Label className="text-[#888888] text-xs">Posisi</Label>
                    <Select value={adminNewAd.position} onValueChange={v => setAdminNewAd({...adminNewAd, position: v})}>
                      <SelectTrigger className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#141414] border-[#262626]">
                        <SelectItem value="homepage">Homepage</SelectItem>
                        <SelectItem value="workspace">Workspace</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-[#888888] text-xs">Urutan</Label><Input type="number" min={0} value={adminNewAd.order} onChange={e => setAdminNewAd({...adminNewAd, order: parseInt(e.target.value) || 0})} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] rounded-xl mt-1" /></div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={saveAd} disabled={!adminNewAd.title} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50">
                    {adminEditingAd ? <><Save className="w-4 h-4" />Update</> : <><Plus className="w-4 h-4" />Tambah Banner</>}
                  </button>
                  {adminEditingAd && (
                    <Button variant="ghost" onClick={() => { setAdminEditingAd(null); setAdminNewAd({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'homepage', slot: 'banner1', order: 0 }) }} className="text-[#888888]">Batal</Button>
                  )}
                </div>
              </CardContent>
            </Card>
            {adminAds.length === 0 ? (
              <Card className="bg-[#141414] border-[#262626] rounded-xl"><CardContent className="py-12 text-center">
                <Megaphone className="w-12 h-12 text-[#262626] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[#f1f5f9] mb-1">Belum Ada Banner</h3>
                <p className="text-xs text-[#888888]">Tambahkan banner iklan atau sponsor</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {adminAds.sort((a, b) => a.order - b.order).map(ad => (
                  <Card key={ad.id} className={`bg-[#141414] rounded-xl transition-all ${ad.active ? 'border-[#262626]' : 'border-[#1f1f1f] opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {ad.imageUrl ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#0a0a0a] border border-[#1f1f1f]"><img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" /></div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#b4f050]/10 border border-[#b4f050]/20 flex items-center justify-center flex-shrink-0"><Megaphone className="w-5 h-5 text-[#b4f050]" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-[#f1f5f9]">{ad.title}</span>
                            <Badge className={`text-[8px] ${ad.active ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' : 'bg-[#262626] text-[#64748b] border-[#333]'}`}>{ad.active ? 'AKTIF' : 'NONAKTIF'}</Badge>
                            <Badge className="bg-[#262626] text-[#888888] text-[8px]">{ad.position}</Badge>
                          </div>
                          {ad.subtitle && <p className="text-[11px] text-[#64748b] truncate">{ad.subtitle}</p>}
                          {ad.linkUrl && <p className="text-[10px] text-[#3b82f6] truncate">{ad.linkUrl}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button onClick={() => toggleAdActive(ad)} className={`p-2 rounded-lg text-xs font-bold transition-colors ${ad.active ? 'bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20' : 'bg-[#262626] text-[#64748b] hover:bg-[#333]'}`}>{ad.active ? 'ON' : 'OFF'}</button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#888888] hover:text-[#b4f050]" onClick={() => { setAdminEditingAd(ad); setAdminNewAd({ title: ad.title, subtitle: ad.subtitle || '', imageUrl: ad.imageUrl || '', linkUrl: ad.linkUrl || '', position: ad.position, slot: ad.slot, order: ad.order }) }}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#ef4444] hover:bg-[#ef4444]/10" onClick={() => deleteAd(ad.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== HOMEPAGE TAB ===== */}
        {adminTab === 'homepage' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#f1f5f9]">Homepage Editor</h2>
              <p className="text-xs text-[#888888]">Edit konten homepage dari sini</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'Hero Title', key: 'hero_title', placeholder: 'Hitung Poin Turnamen Free Fire dengan Cepat', icon: Type },
                { label: 'Hero Subtitle', key: 'hero_subtitle', placeholder: 'Upload screenshot, paste teks, atau input manual...', icon: Type },
                { label: 'CTA Text', key: 'cta_text', placeholder: 'Siap Kelola Turnamen Pro?', icon: Zap },
              ].map(item => {
                const existing = adminSiteSettings.find(s => s.key === item.key)
                return (
                  <Card key={item.key} className="bg-[#141414] border-[#262626] rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3"><item.icon className="w-4 h-4 text-[#b4f050]" /><Label className="text-xs font-bold text-[#f1f5f9]">{item.label}</Label></div>
                      <Input placeholder={item.placeholder} value={adminEditingSetting === item.key ? adminSettingValue : (existing?.value || '')} onChange={e => { setAdminEditingSetting(item.key); setAdminSettingValue(e.target.value) }} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] text-sm rounded-xl mb-3" />
                      <button onClick={() => saveSiteSetting(item.key, adminEditingSetting === item.key ? adminSettingValue : (existing?.value || ''))} className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5"><Save className="w-3 h-3" />Simpan</button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <Card className="bg-[#141414] border-[#262626] rounded-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-[#f1f5f9] mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#3b82f6]" />Statistik Counter</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[{ key: 'stat_tournaments', label: 'Turnamen', defaultVal: '500+' },{ key: 'stat_matches', label: 'Match', defaultVal: '12K+' },{ key: 'stat_teams', label: 'Tim', defaultVal: '3K+' },{ key: 'stat_accuracy', label: 'Akurasi AI', defaultVal: '99%' }].map(stat => {
                    const existing = adminSiteSettings.find(s => s.key === stat.key)
                    return (
                      <div key={stat.key} className="flex items-center gap-2">
                        <Label className="text-[#888888] text-xs w-20 flex-shrink-0">{stat.label}</Label>
                        <Input placeholder={stat.defaultVal} value={adminEditingSetting === stat.key ? adminSettingValue : (existing?.value || '')} onChange={e => { setAdminEditingSetting(stat.key); setAdminSettingValue(e.target.value) }} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] text-sm rounded-xl flex-1" />
                        <button onClick={() => saveSiteSetting(stat.key, adminEditingSetting === stat.key ? adminSettingValue : (existing?.value || ''))} className="btn-primary px-3 py-2 text-[10px] flex-shrink-0"><Save className="w-3 h-3" /></button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-[#262626] rounded-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-[#f1f5f9] mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-[#a78bfa]" />Testimonial</h3>
                <p className="text-xs text-[#64748b] mb-3">Edit testimoni dalam format JSON array</p>
                <Textarea placeholder='[{"name":"Andi R.","role":"Admin FFCS 2025","text":"Dulu itung poin pakai Excel..."}]' value={adminEditingSetting === 'testimonials' ? adminSettingValue : (adminSiteSettings.find(s => s.key === 'testimonials')?.value || '')} onChange={e => { setAdminEditingSetting('testimonials'); setAdminSettingValue(e.target.value) }} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] text-xs rounded-xl min-h-[120px] font-mono" />
                <button onClick={() => saveSiteSetting('testimonials', adminEditingSetting === 'testimonials' ? adminSettingValue : (adminSiteSettings.find(s => s.key === 'testimonials')?.value || ''))} className="btn-primary px-4 py-2 text-xs mt-3 flex items-center gap-1.5"><Save className="w-3 h-3" />Simpan Testimonial</button>
              </CardContent>
            </Card>
            <Card className="bg-[#141414] border-[#262626] rounded-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-[#f1f5f9] mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#ec4899]" />FAQ</h3>
                <p className="text-xs text-[#64748b] mb-3">Edit FAQ dalam format JSON array</p>
                <Textarea placeholder='[{"q":"Apakah gratis?","a":"Ya, 100% gratis!"}]' value={adminEditingSetting === 'faq' ? adminSettingValue : (adminSiteSettings.find(s => s.key === 'faq')?.value || '')} onChange={e => { setAdminEditingSetting('faq'); setAdminSettingValue(e.target.value) }} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] text-xs rounded-xl min-h-[120px] font-mono" />
                <button onClick={() => saveSiteSetting('faq', adminEditingSetting === 'faq' ? adminSettingValue : (adminSiteSettings.find(s => s.key === 'faq')?.value || ''))} className="btn-primary px-4 py-2 text-xs mt-3 flex items-center gap-1.5"><Save className="w-3 h-3" />Simpan FAQ</button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {adminTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#f1f5f9]">Pengaturan Situs</h2>
              <p className="text-xs text-[#888888]">Kelola pengaturan global situs</p>
            </div>
            <Card className="bg-[#141414] border-[#262626] rounded-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold text-[#f1f5f9] mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#b4f050]" />Tambah Pengaturan Baru</h3>
                <div className="flex gap-3">
                  <Input placeholder="key_name" value={adminEditingSetting === '__new__' ? adminSettingValue.split('|||')[0] || '' : ''} onChange={e => { setAdminEditingSetting('__new__'); setAdminSettingValue(e.target.value + '|||' + (adminSettingValue.split('|||')[1] || '')) }} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] text-sm rounded-xl flex-1" />
                  <Input placeholder="value" value={adminEditingSetting === '__new__' ? adminSettingValue.split('|||')[1] || '' : ''} onChange={e => { setAdminEditingSetting('__new__'); setAdminSettingValue((adminSettingValue.split('|||')[0] || '') + '|||' + e.target.value) }} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] text-sm rounded-xl flex-1" />
                  <button onClick={() => { const parts = adminSettingValue.split('|||'); if (parts[0] && parts[1]) saveSiteSetting(parts[0], parts[1]) }} className="btn-primary px-4 py-2 text-xs flex-shrink-0"><Plus className="w-3 h-3" /></button>
                </div>
              </CardContent>
            </Card>
            {adminSiteSettings.length === 0 ? (
              <Card className="bg-[#141414] border-[#262626] rounded-xl"><CardContent className="py-12 text-center">
                <Target className="w-12 h-12 text-[#262626] mx-auto mb-3" />
                <h3 className="text-sm font-bold text-[#f1f5f9] mb-1">Belum Ada Pengaturan</h3>
                <p className="text-xs text-[#888888]">Tambahkan pengaturan situs</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {adminSiteSettings.map(setting => (
                  <Card key={setting.id} className="bg-[#141414] border-[#262626] rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#b4f050] font-mono mb-0.5">{setting.key}</div>
                          <div className="text-sm text-[#f1f5f9] truncate">{setting.value}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#888888] hover:text-[#b4f050]" onClick={() => { setAdminEditingSetting(setting.key); setAdminSettingValue(setting.value) }}><Eye className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-[#ef4444] hover:bg-[#ef4444]/10" onClick={() => deleteSiteSetting(setting.key)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                      {adminEditingSetting === setting.key && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-[#262626]">
                          <Input value={adminSettingValue} onChange={e => setAdminSettingValue(e.target.value)} className="bg-[#0a0a0a] border-[#262626] text-[#f1f5f9] text-sm rounded-xl flex-1" />
                          <button onClick={() => saveSiteSetting(setting.key, adminSettingValue)} className="btn-primary px-3 py-2 text-xs"><Save className="w-3 h-3" /></button>
                          <Button variant="ghost" onClick={() => setAdminEditingSetting('')} className="text-[#888888] text-xs px-3">Batal</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[#262626] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-[10px] text-[#64748b]">8Bit Tournament — Admin Panel</div>
      </footer>
    </div>
  )
}
