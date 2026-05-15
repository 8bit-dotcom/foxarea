export default function LogoFoxArea({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left ear — sleek dark */}
      <path d="M120 200 L170 70 L230 190 Z" fill="#1F2937" />
      {/* Right ear */}
      <path d="M392 200 L342 70 L282 190 Z" fill="#1F2937" />
      {/* Inner left ear — warm gold accent */}
      <path d="M145 188 L172 108 L210 180 Z" fill="#2563EB" />
      {/* Inner right ear */}
      <path d="M367 188 L340 108 L302 180 Z" fill="#2563EB" />
      {/* Head — refined charcoal */}
      <path d="M90 220 L170 190 L256 210 L342 190 L422 220 L400 348 L256 408 L112 348 Z" fill="#1F2937" />
      {/* Forehead diamond — gold accent */}
      <path d="M256 198 L290 248 L256 298 L222 248 Z" fill="#2563EB" />
      {/* Left eye — clean white */}
      <path d="M162 248 L200 232 L216 258 L200 280 L168 274 Z" fill="#F9FAFB" />
      <path d="M185 250 L200 244 L208 258 L198 268 L183 262 Z" fill="#2563EB" />
      {/* Right eye */}
      <path d="M350 248 L312 232 L296 258 L312 280 L344 274 Z" fill="#F9FAFB" />
      <path d="M327 250 L312 244 L304 258 L314 268 L329 262 Z" fill="#2563EB" />
      {/* Snout — lighter shade */}
      <path d="M208 298 L256 320 L304 298 L292 348 L256 368 L220 348 Z" fill="#374151" />
      {/* Nose — deep black */}
      <path d="M244 342 L256 332 L268 342 L261 352 L251 352 Z" fill="#111827" />
      {/* Left fang — warm gold */}
      <path d="M222 352 L230 378 L240 352 Z" fill="#2563EB" />
      {/* Right fang */}
      <path d="M272 352 L280 378 L290 352 Z" fill="#2563EB" />
      {/* Left cheek whisker dots */}
      <circle cx="128" cy="248" r="3" fill="#374151" />
      <circle cx="118" cy="262" r="2.5" fill="#374151" />
      <circle cx="132" cy="275" r="2" fill="#374151" />
      {/* Right cheek whisker dots */}
      <circle cx="384" cy="248" r="3" fill="#374151" />
      <circle cx="394" cy="262" r="2.5" fill="#374151" />
      <circle cx="380" cy="275" r="2" fill="#374151" />
      {/* Left jaw accent — orange */}
      <path d="M112 348 L142 318 L168 348 L150 372 Z" fill="#2563EB" />
      {/* Right jaw accent */}
      <path d="M400 348 L370 318 L344 348 L362 372 Z" fill="#2563EB" />
    </svg>
  )
}
