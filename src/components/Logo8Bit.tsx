export default function Logo8Bit({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} className={className} style={{ imageRendering: 'pixelated' }}>
      <defs>
        <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06d6a0" />
          <stop offset="100%" stopColor="#00b4d8" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="108" fill="#0a0e1a" />
      <rect x="24" y="24" width="464" height="464" rx="84" fill="none" stroke="url(#lg)" strokeWidth="4" opacity="0.15" />
      <rect x="160" y="90" width="52" height="52" fill="url(#lg)" />
      <rect x="216" y="90" width="52" height="52" fill="url(#lg)" />
      <rect x="272" y="90" width="52" height="52" fill="url(#lg)" />
      <rect x="104" y="142" width="52" height="52" fill="url(#lg)" />
      <rect x="328" y="142" width="52" height="52" fill="url(#lg)" />
      <rect x="104" y="198" width="52" height="52" fill="url(#lg)" />
      <rect x="328" y="198" width="52" height="52" fill="url(#lg)" />
      <rect x="160" y="254" width="52" height="52" fill="url(#lg)" />
      <rect x="216" y="254" width="52" height="52" fill="url(#lg)" />
      <rect x="272" y="254" width="52" height="52" fill="url(#lg)" />
      <rect x="104" y="310" width="52" height="52" fill="url(#lg)" />
      <rect x="328" y="310" width="52" height="52" fill="url(#lg)" />
      <rect x="104" y="366" width="52" height="52" fill="url(#lg)" />
      <rect x="328" y="366" width="52" height="52" fill="url(#lg)" />
      <rect x="160" y="422" width="52" height="52" fill="url(#lg)" />
      <rect x="216" y="422" width="52" height="52" fill="url(#lg)" />
      <rect x="272" y="422" width="52" height="52" fill="url(#lg)" />
    </svg>
  )
}
