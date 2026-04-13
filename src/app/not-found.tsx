import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page introuvable — 404' }

export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#0C0C0E' }}
    >
      {/* Accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 50% 30%, rgba(196,30,58,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 space-y-6 max-w-sm">
        {/* Code */}
        <p
          className="text-8xl font-semibold kpi-value"
          style={{ color: 'rgba(196,30,58,0.25)', letterSpacing: '-0.04em' }}
          aria-hidden="true"
        >
          404
        </p>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Page introuvable
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
            La page que vous cherchez n&rsquo;existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tableau-de-bord"
            className="flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{ background: '#C41E3A', color: '#fff' }}
          >
            Tableau de bord
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center h-10 px-5 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{ borderColor: '#252A36', color: 'rgba(255,255,255,0.70)', background: 'transparent' }}
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
