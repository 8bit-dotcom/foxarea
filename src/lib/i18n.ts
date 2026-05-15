export type Lang = 'id' | 'en'

const translations: Record<string, Record<Lang, string>> = {
  // Nav
  'nav.beranda': { id: 'Beranda', en: 'Home' },
  'nav.fitur': { id: 'Fitur', en: 'Features' },
  'nav.caraKerja': { id: 'Cara Kerja', en: 'How It Works' },
  'nav.community': { id: 'Komunitas', en: 'Community' },
  'nav.faq': { id: 'FAQ', en: 'FAQ' },
  'nav.login': { id: 'Masuk', en: 'Login' },
  'nav.logout': { id: 'Keluar', en: 'Logout' },

  // Hero
  'hero.title': { id: 'FOXAREA', en: 'FOXAREA' },
  'hero.subtitle': { id: 'TOURNAMENT', en: 'TOURNAMENT' },
  'hero.desc': { id: 'Sistem hitung poin turnamen Free Fire otomatis. Upload screenshot, paste teks, atau input manual. AI baca otomatis, klasemen langsung update.', en: 'Automatic Free Fire tournament point calculator. Upload screenshots, paste text, or input manually. AI reads automatically, leaderboard updates instantly.' },
  'hero.cta': { id: 'Mulai Sekarang', en: 'Start Now' },

  // Features
  'feature.aiScanner': { id: 'AI Scanner', en: 'AI Scanner' },
  'feature.aiScannerDesc': { id: 'Upload screenshot, AI baca otomatis posisi & kill', en: 'Upload screenshot, AI reads placement & kills automatically' },
  'feature.copyPaste': { id: 'Copy Paste', en: 'Copy Paste' },
  'feature.copyPasteDesc': { id: 'Paste hasil match, langsung ke klasemen', en: 'Paste match results, instantly goes to leaderboard' },
  'feature.manualInput': { id: 'Manual Input', en: 'Manual Input' },
  'feature.manualInputDesc': { id: 'Input posisi & kill manual per tim', en: 'Input placement & kills manually per team' },
  'feature.realtimeKlasemen': { id: 'Real-time Klasemen', en: 'Real-time Leaderboard' },
  'feature.realtimeKlasemenDesc': { id: 'Leaderboard update otomatis setiap match', en: 'Leaderboard updates automatically after each match' },

  // Auth
  'auth.login': { id: 'Masuk', en: 'Login' },
  'auth.email': { id: 'Email', en: 'Email' },
  'auth.sendCode': { id: 'Kirim Kode', en: 'Send Code' },
  'auth.verifyCode': { id: 'Verifikasi Kode', en: 'Verify Code' },
  'auth.enterCode': { id: 'Masukkan 6 digit kode', en: 'Enter 6-digit code' },
  'auth.orDevLogin': { id: 'Atau login dev (tanpa email)', en: 'Or dev login (no email)' },
  'auth.back': { id: 'Kembali', en: 'Back' },

  // Toast
  'toast.loginSuccess': { id: 'Login berhasil!', en: 'Login successful!' },
  'toast.welcome': { id: 'Selamat datang', en: 'Welcome' },
  'toast.codeSent': { id: 'Kode terkirim!', en: 'Code sent!' },
  'toast.checkInbox': { id: 'Cek inbox email kamu', en: 'Check your email inbox' },
  'toast.devMode': { id: 'Mode Development', en: 'Development Mode' },
  'toast.codeSendFailed': { id: 'Gagal mengirim kode', en: 'Failed to send code' },
  'toast.emailRequired': { id: 'Email wajib diisi', en: 'Email is required' },
  'toast.emailInvalid': { id: 'Format email tidak valid', en: 'Invalid email format' },
  'toast.enterCode': { id: 'Masukkan kode verifikasi', en: 'Enter verification code' },
  'toast.code6Digit': { id: 'Kode harus 6 digit', en: 'Code must be 6 digits' },
  'toast.waitMoment': { id: 'Tunggu sebentar', en: 'Wait a moment' },
  'toast.invalidCode': { id: 'Kode tidak valid', en: 'Invalid code' },

  // Tournament
  'tournament.create': { id: 'Buat Turnamen', en: 'Create Tournament' },
  'tournament.name': { id: 'Nama Turnamen', en: 'Tournament Name' },
  'tournament.description': { id: 'Deskripsi', en: 'Description' },
  'tournament.maxTeams': { id: 'Maks Tim', en: 'Max Teams' },
  'tournament.matchCount': { id: 'Jumlah Match', en: 'Match Count' },
  'tournament.select': { id: 'Pilih Turnamen', en: 'Select Tournament' },
  'tournament.delete': { id: 'Hapus Turnamen', en: 'Delete Tournament' },
  'tournament.deleteConfirm': { id: 'Yakin hapus turnamen ini?', en: 'Are you sure to delete this tournament?' },

  // Team
  'team.add': { id: 'Tambah Tim', en: 'Add Team' },
  'team.name': { id: 'Nama Squad', en: 'Squad Name' },
  'team.tag': { id: 'Tag', en: 'Tag' },
  'team.nickname': { id: 'Nickname', en: 'Nickname' },
  'team.delete': { id: 'Hapus Tim', en: 'Delete Team' },
  'team.deleteConfirm': { id: 'Yakin hapus tim ini? Semua hasil match juga terhapus.', en: 'Delete this team? All match results will also be deleted.' },
  'team.bulkImport': { id: 'Import Massal', en: 'Bulk Import' },

  // Match
  'match.input': { id: 'Input Match', en: 'Input Match' },
  'match.results': { id: 'Hasil Match', en: 'Match Results' },
  'match.history': { id: 'Riwayat Match', en: 'Match History' },
  'match.aiScan': { id: 'AI Scan', en: 'AI Scan' },
  'match.pasteText': { id: 'Paste Teks', en: 'Paste Text' },

  // Leaderboard
  'leaderboard.title': { id: 'Klasemen', en: 'Leaderboard' },
  'leaderboard.rank': { id: '#', en: '#' },
  'leaderboard.squad': { id: 'Squad', en: 'Squad' },
  'leaderboard.pts': { id: 'PTS', en: 'PTS' },
  'leaderboard.kills': { id: 'Kill', en: 'Kill' },
  'leaderboard.avgPlace': { id: 'Avg', en: 'Avg' },

  // Seeding/Bracket
  'seeding.champion': { id: 'Juara', en: 'Champion' },
  'seeding.topSeed': { id: 'Top Seed', en: 'Top Seed' },
  'seeding.midSeed': { id: 'Mid Seed', en: 'Mid Seed' },
  'seeding.lowerSeed': { id: 'Lower Seed', en: 'Lower Seed' },
  'seeding.bottomSeed': { id: 'Bottom Seed', en: 'Bottom Seed' },
  'bracket.disclaimer': { id: 'Seeding berdasarkan klasemen saat ini. Bukan bracket resmi.', en: 'Seeding based on current leaderboard. Not an official bracket.' },

  // Footer
  'footer.madeWith': { id: 'Dibuat dengan', en: 'Made with' },
  'footer.forCommunity': { id: 'untuk komunitas Free Fire', en: 'for Free Fire community' },

  // Misc
  'misc.loading': { id: 'Memuat...', en: 'Loading...' },
  'misc.save': { id: 'Simpan', en: 'Save' },
  'misc.cancel': { id: 'Batal', en: 'Cancel' },
  'misc.confirm': { id: 'Konfirmasi', en: 'Confirm' },
  'misc.delete': { id: 'Hapus', en: 'Delete' },
  'misc.edit': { id: 'Edit', en: 'Edit' },
  'misc.close': { id: 'Tutup', en: 'Close' },
  'misc.backToTop': { id: 'Kembali ke atas', en: 'Back to top' },
  'misc.share': { id: 'Bagikan', en: 'Share' },
  'misc.download': { id: 'Unduh', en: 'Download' },
  'misc.undo': { id: 'Urungkan', en: 'Undo' },
  'misc.noData': { id: 'Belum ada data', en: 'No data yet' },

  // Why Free section
  'whyFree.title': { id: 'Kenapa Gratis?', en: 'Why Free?' },
  'whyFree.desc': { id: 'FoxArea 100% gratis dan selalu gratis. Dibuat oleh pemain Free Fire untuk komunitas, tanpa iklan, tanpa premium, tanpa batasan.', en: 'FoxArea is 100% free and always will be. Built by Free Fire players for the community, no ads, no premium, no limits.' },
  'whyFree.noAds': { id: 'Tanpa Iklan', en: 'No Ads' },
  'whyFree.noAdsDesc': { id: 'Zero iklan, zero popup, zero gangguan', en: 'Zero ads, zero popups, zero distractions' },
  'whyFree.noPremium': { id: 'Tanpa Premium', en: 'No Premium' },
  'whyFree.noPremiumDesc': { id: 'Semua fitur gratis untuk semua orang', en: 'All features free for everyone' },
  'whyFree.openSource': { id: 'Transparan', en: 'Transparent' },
  'whyFree.openSourceDesc': { id: 'Kode terbuka, data kamu milik kamu', en: 'Open code, your data belongs to you' },

  // FAQ
  'faq.title': { id: 'Pertanyaan Umum', en: 'FAQ' },
  'faq.q1': { id: 'Apakah benar-benar gratis?', en: 'Is it really free?' },
  'faq.a1': { id: 'Ya, 100% gratis tanpa biaya tersembunyi. Semua fitur bisa dipakai tanpa bayar.', en: 'Yes, 100% free with no hidden costs. All features can be used without payment.' },
  'faq.q2': { id: 'Data turnamen aman?', en: 'Is tournament data safe?' },
  'faq.a2': { id: 'Data tersimpan di database lokal dan hanya bisa diakses oleh admin turnamen.', en: 'Data is stored in a local database and can only be accessed by tournament admins.' },
  'faq.q3': { id: 'Bisa dipakai untuk game lain?', en: 'Can it be used for other games?' },
  'faq.a3': { id: 'Saat ini khusus Free Fire, tapi sistem poinnya bisa dicustom untuk game battle royale lainnya.', en: 'Currently for Free Fire only, but the point system can be customized for other battle royale games.' },
  'faq.q4': { id: 'Berapa maksimal tim?', en: 'What is the maximum number of teams?' },
  'faq.a4': { id: 'Default 12 tim, bisa diubah saat membuat turnamen hingga 25 tim.', en: 'Default 12 teams, can be changed when creating a tournament up to 25 teams.' },

  // Stats
  'stats.tournaments': { id: 'Turnamen', en: 'Tournaments' },
  'stats.teams': { id: 'Tim', en: 'Teams' },
  'stats.matches': { id: 'Match', en: 'Matches' },
  'stats.users': { id: 'Pengguna', en: 'Users' },
  'stats.title': { id: 'Dipercaya Komunitas', en: 'Trusted by Community' },

  // Testimonials
  'testimonials.title': { id: 'Kata Mereka', en: 'What They Say' },
  'testimonials.1.name': { id: 'Rizky Fauzan', en: 'Rizky Fauzan' },
  'testimonials.1.role': { id: 'Admin Turnamen, Jakarta', en: 'Tournament Admin, Jakarta' },
  'testimonials.1.text': { id: 'Gila sih, tinggal upload screenshot langsung kebaca semua. Nggak perlu lagi input manual satu-satu. Klasemen update real-time, jadi lebih fair dan transparan.', en: 'This is crazy, just upload a screenshot and it reads everything. No need to input manually one by one. Leaderboard updates real-time, so it\'s more fair and transparent.' },
  'testimonials.2.name': { id: 'Aldi Pratama', en: 'Aldi Pratama' },
  'testimonials.2.role': { id: 'Ketua Clan, Surabaya', en: 'Clan Leader, Surabaya' },
  'testimonials.2.text': { id: 'Dulu pake Excel ribet banget. Sekarang tinggal buat turnamen, tambah tim, input hasil — selesai! Gratis lagi. Buset.', en: 'Before, using Excel was so complicated. Now just create a tournament, add teams, input results — done! And it\'s free. Amazing.' },
  'testimonials.3.name': { id: 'Dian Safitri', en: 'Dian Safitri' },
  'testimonials.3.role': { id: 'Streamer FF, Bandung', en: 'FF Streamer, Bandung' },
  'testimonials.3.text': { id: 'Fitur share gambar klasemen keren banget. Langsung share ke IG story. Viewer pada penasaran terus ikut nonton turnamen kita.', en: 'The share leaderboard image feature is awesome. Just share to IG story. Viewers get curious and watch our tournaments.' },

  // Preview
  'preview.title': { id: 'Preview Klasemen', en: 'Leaderboard Preview' },
  'preview.desc': { id: 'Tampilan klasemen otomatis setelah input match. Semua terhitung otomatis.', en: 'Automatic leaderboard view after inputting matches. Everything calculated automatically.' },
  'preview.squad': { id: 'Squad', en: 'Squad' },
  'preview.pts': { id: 'PTS', en: 'PTS' },
  'preview.kill': { id: 'Kill', en: 'Kill' },

  // Champions
  'champions.title': { id: 'Hall of Fame', en: 'Hall of Fame' },
  'champions.subtitle': { id: 'Juara turnamen terakhir', en: 'Recent tournament champions' },

  // CTA
  'cta.title': { id: 'Siap Mulai Turnamen?', en: 'Ready to Start a Tournament?' },
  'cta.desc': { id: 'Buat turnamen, tambah tim, input hasil — semua gratis. Tidak perlu download, langsung pakai.', en: 'Create tournament, add teams, input results — all free. No download needed, just use it.' },
  'cta.button': { id: 'Buat Turnamen Sekarang', en: 'Create Tournament Now' },

  // PWA
  'pwa.install': { id: 'Install FoxArea', en: 'Install FoxArea' },
  'pwa.desc': { id: 'Akses lebih cepat langsung dari homescreen. Tanpa browser, tanpa loading.', en: 'Faster access right from homescreen. No browser, no loading.' },
  'pwa.installBtn': { id: 'Install App', en: 'Install App' },
  'pwa.dismiss': { id: 'Nanti saja', en: 'Later' },

  // Point System
  'points.title': { id: 'Sistem Poin', en: 'Point System' },
  'points.desc': { id: 'Sistem poin standar Free Fire. Posisi dan kill dihitung otomatis, bisa dicustom sesuai kebutuhan.', en: 'Standard Free Fire point system. Placement and kills calculated automatically, customizable as needed.' },
  'points.placement': { id: 'Poin Posisi', en: 'Placement Points' },
  'points.kill': { id: 'Poin Kill', en: 'Kill Points' },
  'points.killDesc': { id: 'Setiap kill = +1 poin (bisa diubah)', en: 'Each kill = +1 point (customizable)' },
  'points.custom': { id: 'Bisa diubah saat buat turnamen', en: 'Customizable when creating tournament' },

  // Comparison
  'compare.title': { id: 'FoxArea vs Cara Lama', en: 'FoxArea vs Old Way' },
  'compare.desc': { id: 'Bandingkan seberapa cepat dan mudah mengelola turnamen dengan FoxArea.', en: 'Compare how much faster and easier tournament management is with FoxArea.' },
  'compare.feature': { id: 'Fitur', en: 'Feature' },
  'compare.foxarea': { id: 'FoxArea', en: 'FoxArea' },
  'compare.excel': { id: 'Excel', en: 'Excel' },
  'compare.manual': { id: 'Manual', en: 'Manual' },
  'compare.autoCalc': { id: 'Hitung otomatis', en: 'Auto calculation' },
  'compare.aiScan': { id: 'AI scan screenshot', en: 'AI scan screenshots' },
  'compare.realtime': { id: 'Leaderboard real-time', en: 'Real-time leaderboard' },
  'compare.share': { id: 'Share gambar klasemen', en: 'Share leaderboard image' },
  'compare.export': { id: 'Export CSV/PNG', en: 'Export CSV/PNG' },
  'compare.multiMatch': { id: 'Multi-match tracking', en: 'Multi-match tracking' },
  'compare.price': { id: 'Harga', en: 'Price' },
  'compare.free': { id: 'Gratis', en: 'Free' },
  'compare.paid': { id: 'Bayar lisensi', en: 'Paid license' },
  'compare.free2': { id: 'Gratis (tapi ribet)', en: 'Free (but tedious)' },

  // What's New
  'whatsnew.title': { id: 'Fitur Terbaru', en: "What's New" },
  'whatsnew.badge': { id: 'BARU', en: 'NEW' },
  'whatsnew.1.title': { id: 'AI Scanner v2', en: 'AI Scanner v2' },
  'whatsnew.1.desc': { id: 'Akurasi baca screenshot ditingkatkan, support format baru FFWS 2025', en: 'Improved screenshot reading accuracy, supports new FFWS 2025 format' },
  'whatsnew.2.title': { id: 'Bracket & Seeding', en: 'Bracket & Seeding' },
  'whatsnew.2.desc': { id: 'Lihat seeding otomatis berdasarkan klasemen, visualisasi bracket turnamen', en: 'View automatic seeding based on leaderboard, tournament bracket visualization' },
  'whatsnew.3.title': { id: 'Dark & Light Mode', en: 'Dark & Light Mode' },
  'whatsnew.3.desc': { id: 'Pilih tema sesuai selera, mata tetap nyaman day atau night', en: 'Choose theme to your preference, comfortable for day or night' },
  'whatsnew.4.title': { id: 'Multi-Bahasa', en: 'Multi-Language' },
  'whatsnew.4.desc': { id: 'Bahasa Indonesia & English, lebih banyak bahasa segera hadir', en: 'Indonesian & English, more languages coming soon' },

  // Community Hub
  'community.title': { id: 'Gabung Komunitas', en: 'Join Community' },
  'community.desc': { id: 'Terhubung dengan ribuan pemain dan admin turnamen Free Fire. Diskusi, share tips, dan update terbaru.', en: 'Connect with thousands of Free Fire players and tournament admins. Discussions, tips sharing, and latest updates.' },

  // Milestone Badges
  'milestone.title': { id: 'Pencapaian Kami', en: 'Our Milestones' },
  'milestone.desc': { id: 'Angka-angka yang membuktikan komunitas terus bertumbuh. Dan kita baru mulai!', en: 'Numbers that prove our community keeps growing. And we\'re just getting started!' },
  'milestone.tournaments': { id: 'Turnamen Hosted', en: 'Tournaments Hosted' },
  'milestone.teams': { id: 'Tim Terdaftar', en: 'Teams Registered' },
  'milestone.matches': { id: 'Match Tracked', en: 'Matches Tracked' },
  'milestone.satisfaction': { id: 'Kepuasan User', en: 'User Satisfaction' },

  // Tournament Format Explorer
  'format.title': { id: 'Format Turnamen', en: 'Tournament Formats' },
  'format.desc': { id: 'Lihat perbandingan sistem poin antar format. Pilih yang paling cocok untuk turnamen kamu.', en: 'Compare point systems across formats. Pick the one that fits your tournament best.' },

  // Quick Demo
  'demo.title': { id: 'Coba Langsung', en: 'Try It Live' },
  'demo.desc': { id: 'Lihat cara kerja input match — pilih posisi dan kill, total poin otomatis!', en: 'See how match input works — pick placement and kills, total points auto-calculated!' },
  'demo.team': { id: 'Tim', en: 'Team' },
  'demo.placement': { id: 'Posisi', en: 'Placement' },
  'demo.kills': { id: 'Kill', en: 'Kills' },
  'demo.totalPts': { id: 'Total Poin', en: 'Total Points' },
  'demo.reset': { id: 'Reset', en: 'Reset' },

  // New features
  'feature.bracketElim': { id: 'Bracket Eliminasi', en: 'Elimination Bracket' },
  'feature.bracketElimDesc': { id: 'Clash Squad mode dengan bracket single elimination visual', en: 'Clash Squad mode with visual single elimination bracket' },
  'feature.regLink': { id: 'Link Registrasi Publik', en: 'Public Registration Link' },
  'feature.regLinkDesc': { id: 'Bagikan link biar tim bisa daftar sendiri tanpa admin', en: 'Share a link so teams can register themselves without admin' },
  'history.title': { id: 'Riwayat Turnamen', en: 'Tournament History' },
  'announcement.title': { id: 'Broadcast', en: 'Announcement' },
  'announcement.placeholder': { id: 'Tulis pengumuman...', en: 'Write an announcement...' },
  'announcement.send': { id: 'Kirim', en: 'Send' },
  'announcement.note': { id: 'Pengumuman akan tampil di bagian atas workspace semua peserta', en: 'Announcement will appear at the top of all participants\' workspace' },
  'regLink.title': { id: 'Link Registrasi Tim', en: 'Team Registration Link' },
  'regLink.desc': { id: 'Bagikan link ini ke tim yang mau daftar. Mereka bisa isi sendiri tanpa admin.', en: 'Share this link with teams who want to register. They can sign up without admin.' },
  'regLink.allow': { id: 'Izinkan tim daftar sendiri via link', en: 'Allow teams to self-register via link' },
  'regLink.copied': { id: 'Link tersalin!', en: 'Link copied!' },
  'export.pdf': { id: 'Cetak PDF', en: 'Print PDF' },
}

export function t(key: string, lang: Lang = 'id'): string {
  return translations[key]?.[lang] || translations[key]?.['id'] || key
}
