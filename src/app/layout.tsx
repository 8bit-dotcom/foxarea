import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoxArea Tournament - Free Fire Tournament Point Calculator",
  description: "Sistem hitung poin turnamen Free Fire otomatis. Kelola tim, catat hasil match, dan dapatkan leaderboard real-time dengan analisis AI.",
  keywords: ["Free Fire", "Tournament", "Point Calculator", "Leaderboard", "Esports", "FoxArea"],
  icons: { icon: [{ url: "/logo-foxarea.svg", type: "image/svg+xml" }, { url: "/logo-foxarea.png", type: "image/png", sizes: "1024x1024" }] },
  manifest: "/manifest.json",
  openGraph: {
    title: "FoxArea Tournament - Free Fire Tournament Point Calculator",
    description: "Sistem hitung poin turnamen Free Fire otomatis. Kelola tim, catat hasil match, dan dapatkan leaderboard real-time dengan analisis AI.",
    url: "https://foxarea.com",
    siteName: "FoxArea Tournament",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FoxArea Tournament - Free Fire Tournament Point Calculator",
    description: "Sistem hitung poin turnamen Free Fire otomatis dengan AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563EB" />
        <link rel="canonical" href="https://foxarea.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "FoxArea Tournament",
              description: "Sistem hitung poin turnamen Free Fire otomatis dengan AI",
              url: "https://foxarea.com",
              applicationCategory: "GameApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
