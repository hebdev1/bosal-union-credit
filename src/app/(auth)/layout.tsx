import type { Metadata } from 'next'
import Link from 'next/link'
import { BosalBadge } from '@/components/brand/BosalLogo'

export const metadata: Metadata = {
  title: {
    default: 'Authentification',
    template: '%s — Mache Kay BOSAL',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ── Panneau gauche : branding ───────────────────────────────────── */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #07080C 0%, #0D1018 60%, #14181F 100%)' }}
        aria-hidden="true"
      >
        {/* Grid bg subtil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Accent glow */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,30,58,0.22) 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 w-fit">
          <BosalBadge size={40} />
          <span className="font-semibold text-base" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Mache Kay <span className="font-bold">BOSAL</span>
          </span>
        </Link>

        {/* Témoignage central */}
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-4">
            <p
              className="text-2xl leading-snug font-display italic"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              &ldquo;La force de l&rsquo;union, la rigueur du crédit — Mache Kay BOSAL,
              pensée pour la coopérative haïtienne moderne.&rdquo;
            </p>
            <footer className="space-y-0.5">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Jean-Baptiste Moreau
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Directeur Général, Coopérative Bosal
              </p>
            </footer>
          </blockquote>
        </div>

        {/* Stats bas */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { value: '12 000+', label: 'Membres actifs' },
            { value: '4 devises', label: 'HTG · USD · CAD · DOP' },
            { value: '99.9 %', label: 'Disponibilité' },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p
                className="text-lg font-semibold kpi-value"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panneau droit : formulaire ──────────────────────────────────── */}
      <div
        className="flex flex-col min-h-dvh lg:min-h-0"
        style={{ background: '#07080C' }}
      >
        {/* Logo mobile uniquement */}
        <div className="lg:hidden flex items-center gap-3 px-6 pt-6 pb-0">
          <Link href="/" className="flex items-center gap-2.5">
            <BosalBadge size={32} />
            <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Mache Kay <span className="font-bold">BOSAL</span>
            </span>
          </Link>
        </div>

        {/* Contenu centré */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>

        {/* Footer minimal */}
        <p className="text-center text-xs pb-6 px-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
          © {new Date().getFullYear()} Mache Kay BOSAL · Tous droits réservés
        </p>
      </div>
    </div>
  )
}
