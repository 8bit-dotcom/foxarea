import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Turnamen Tidak Ditemukan - 8Bit Tournament',
}

export default function TournamentNotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-5 text-center">
        {/* 404 Text */}
        <h1 className="pixel-font text-5xl sm:text-7xl font-black text-[#1f1f1f]">
          404
        </h1>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#1f1f1f] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#262626]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        {/* Message */}
        <div>
          <h2 className="pixel-font text-lg sm:text-xl font-black text-[#f1f5f9] mb-2">
            Turnamen Tidak Ditemukan
          </h2>
          <p className="text-sm text-[#64748b] max-w-[320px]">
            Klasemen yang kamu cari tidak tersedia atau sudah dihapus.
          </p>
        </div>

        {/* Back Link */}
        <a
          href="/"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#b4f050] to-[#8bc220] text-[#0a0a0a] hover:brightness-110 hover:-translate-y-0.5 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Beranda
        </a>

        {/* Footer Brand */}
        <p className="pixel-font text-[10px] text-[#262626] mt-4 tracking-wider">
          8BIT TOURNAMENT
        </p>
      </div>
    </div>
  )
}
