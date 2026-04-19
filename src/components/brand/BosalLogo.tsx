'use client'
import * as React from 'react'

/**
 * Mache Kay BOSAL — logo mark (SVG recréation stylisée)
 * Figure musclée + forme nuage rouge avec texte "Mache Kay BOSAL"
 *
 * Variantes:
 *  - "mark"     : juste le symbole (figure + cloud) — pour sidebar, favicon
 *  - "wordmark" : texte "MACHE KAY BOSAL" en ligne, style moderne
 *  - "full"     : logo complet avec figure ET texte
 */

interface BosalLogoProps {
  variant?: 'mark' | 'wordmark' | 'full'
  size?: number
  className?: string
  /** Couleur principale du cloud / accent (défaut: brand red) */
  color?: string
  /** Couleur du texte/figure (défaut: blanc) */
  foreground?: string
}

export function BosalLogo({
  variant = 'mark',
  size = 32,
  className,
  color = '#C41E3A',
  foreground = '#FFFFFF',
}: BosalLogoProps) {
  if (variant === 'wordmark') {
    return (
      <span
        className={className}
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: size * 0.55,
          letterSpacing: '-0.02em',
          color: foreground,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span style={{ color }}>Mache Kay</span>
        <span style={{ fontStyle: 'normal', fontWeight: 800, letterSpacing: '0.02em' }}>BOSAL</span>
      </span>
    )
  }

  // "mark" — figure + cloud badge SVG
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Cloud shape (red blob) */}
      <path
        d="M10 40 C 6 40, 6 34, 12 33 C 10 28, 16 24, 22 27 C 24 22, 32 22, 34 27 C 40 24, 46 28, 44 33 C 50 34, 50 40, 46 40 C 48 44, 44 48, 38 46 C 36 51, 28 51, 26 46 C 22 48, 16 46, 14 43 C 10 44, 8 43, 10 40 Z"
        fill={color}
        stroke="#000"
        strokeWidth="1.5"
      />
      {/* Figure torse (silhouette stylisée) */}
      <g transform="translate(22, 4)">
        {/* Tête basculée arrière */}
        <ellipse cx="10" cy="5" rx="4" ry="3.5" fill="#111" />
        {/* Bras levés */}
        <path
          d="M8 6 C 6 4, 4 2, 6 1 L 8 2 Z M12 6 C 14 4, 16 2, 14 1 L 12 2 Z"
          fill="#111"
        />
        {/* Torse musclé (pectoraux + abdos stylisés) */}
        <path
          d="M4 10 C 3 14, 3 20, 5 26 L 15 26 C 17 20, 17 14, 16 10 C 14 8, 6 8, 4 10 Z"
          fill="#111"
        />
        {/* Ligne centre torse */}
        <line x1="10" y1="12" x2="10" y2="24" stroke="#FFF" strokeWidth="0.5" opacity="0.4" />
      </g>
      {/* Texte "BOSAL" sur le cloud */}
      <text
        x="28"
        y="43"
        fontFamily="Impact, 'Arial Black', sans-serif"
        fontSize="8"
        fontWeight="900"
        fill={foreground}
        textAnchor="middle"
        letterSpacing="0.04em"
      >
        BOSAL
      </text>
    </svg>
  )
}

/**
 * Variante compacte "badge" — figure stylisée dans un carré arrondi
 * Utilisée dans les petits espaces (sidebar collapsed, avatar, etc.)
 */
export function BosalBadge({
  size = 32,
  color = '#C41E3A',
  className,
}: {
  size?: number
  color?: string
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 ${size * 0.7}px ${color}45, 0 2px 8px rgba(0,0,0,0.5)`,
        position: 'relative',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Figure musclée stylisée */}
      <svg width={size * 0.58} height={size * 0.78} viewBox="0 0 20 28" fill="none">
        {/* Tête inclinée */}
        <ellipse cx="10" cy="4" rx="3.2" ry="3" fill="#0A0A0A" />
        {/* Bras levés (forme triangulaire) */}
        <path d="M4 7 L 8 5 L 7 8 Z M16 7 L 12 5 L 13 8 Z" fill="#0A0A0A" />
        {/* Torse large */}
        <path
          d="M5 9 C 4 12, 4 18, 6 24 L 14 24 C 16 18, 16 12, 15 9 C 13 7, 7 7, 5 9 Z"
          fill="#0A0A0A"
        />
        {/* Highlights pectoraux */}
        <path
          d="M7 12 C 7 14, 9 14, 9.5 13 M10.5 13 C 11 14, 13 14, 13 12"
          stroke="#FFF"
          strokeWidth="0.4"
          opacity="0.3"
          fill="none"
        />
      </svg>
    </div>
  )
}
