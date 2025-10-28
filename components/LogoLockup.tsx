import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

type LogoLockupProps = {
  markSrc: string
  markAlt?: string
  wordmarkAlt?: string
  className?: string
}

/**
 * LogoLockup
 * Implements a best-practice logo stack / lockup for the hero:
 * - horizontal lockup for wide screens
 * - stacked (icon above wordmark) for medium screens
 * - icon-only for small screens
 *
 * This keeps the same assets but presents them responsively with
 * accessible alt text and proper clearspace.
 */
export default function LogoLockup({
  markSrc,
  markAlt = 'Ghosted logo',
  wordmarkAlt = 'Ghosted — lagswitch software',
  className = '',
}: LogoLockupProps) {
  // Use only the current Ghosted logo for both mark and wordmark
  return (
    <div className={`logo-lockup ${className}`.trim()}>
      {/* Horizontal: single logo (large screens) */}
      <Link href="/" className="logo-lockup--horizontal" aria-label={`${wordmarkAlt} — homepage`}>
        <Image src={markSrc} alt={markAlt} width={120} height={48} className="logo-mark" style={{ width: '120px', height: '48px' }} priority />
      </Link>

      {/* Stacked: single logo (medium screens) */}
      <Link href="/" className="logo-lockup--stacked" aria-label={`${wordmarkAlt} — homepage`}>
        <Image src={markSrc} alt={markAlt} width={88} height={88} className="logo-mark" style={{ width: '88px', height: '88px' }} priority />
      </Link>

      {/* Icon-only: for very small screens */}
      <Link href="/" className="logo-lockup--icon" aria-label={`${wordmarkAlt} — homepage`}>
        <Image src={markSrc} alt={markAlt} width={56} height={56} className="logo-mark" style={{ width: '56px', height: '56px' }} priority />
      </Link>
    </div>
  )
}
