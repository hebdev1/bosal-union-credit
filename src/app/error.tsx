'use client'

import { useEffect } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to monitoring service in production
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#0C0C0E' }}
      role="alert"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 50% 30%, rgba(239,68,68,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 space-y-6 max-w-sm">
        {/* Icon */}
        <div
          className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.10)' }}
          aria-hidden="true"
        >
          <AlertTriangle size={26} style={{ color: '#F87171' }} />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Une erreur est survenue
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Un problème inattendu s&rsquo;est produit. Nos équipes en sont informées.
          </p>
          {error.digest && (
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.20)' }}>
              Ref : {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{ background: '#C41E3A', color: '#fff' }}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Réessayer
          </button>
          <a
            href="/"
            className="flex items-center justify-center h-10 px-5 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{ borderColor: '#252A36', color: 'rgba(255,255,255,0.70)', background: 'transparent' }}
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  )
}
