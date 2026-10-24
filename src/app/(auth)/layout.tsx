import type { Metadata } from 'next'
import Link from 'next/link'
import { BosalBadge } from '@/components/brand/BosalLogo'

export const metadata: Metadata = {
  title: {
    default: 'Authentification',
    template: '%s — Bosal Credit Union',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ── Panneau gauche : branding ───────────────────────────────────── */}
      {/* Thème sombre conservé : c'est l'entrée du tableau de bord (thème
          sombre global, globals.css) et les pages enfants (login, inscription,
          mot de passe oublié, accès refusé) écrivent en blanc. Pas d'aria-hidden
          sur le panneau : il contient un lien focusable et du texte réel. */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #07080C 0%, #0D1018 60%, #14181F 100%)' }}
        aria-label="Présentation de l’espace de gestion"
      >
        {/* Grid bg subtil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
          aria-hidden="true"
        />

        {/* Accent glow */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,30,58,0.22) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* Logo */}
        <Link
          href="/"
          className="relative z-10 flex items-center gap-3 w-fit"
          aria-label="Bosal Credit Union, retour à l’accueil du site"
        >
          <BosalBadge size={40} />
          <span className="font-semibold text-base" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Bosal <span className="font-bold">Credit Union</span>
          </span>
        </Link>

        {/* Présentation centrale — description factuelle, sans témoignage */}
        <div className="relative z-10 space-y-4">
          <p
            className="text-2xl leading-snug font-display"
            style={{ color: 'rgba(255,255,255,0.92)' }}
          >
            Comptes membres, opérations de guichet, registre des prêts et bureau de change
            de la coopérative, dans un seul espace de travail.
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Chaque coopérative n&rsquo;accède qu&rsquo;à ses propres données.
          </p>
        </div>

        {/* Repères bas — faits vérifiables dans le produit */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { value: 'HTG · USD', label: 'Comptes membres' },
            { value: '4 devises', label: 'Change HTG · USD · CAD · DOP' },
            { value: '3 rôles', label: 'Admin · Gérant · Caissier' },
          ].map((stat) => (
            <div key={stat.label} className="space-y-1">
              <p
                className="text-lg font-semibold kpi-value"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.62)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Panneau droit : formulaire ──────────────────────────────────── */}
      <div
        className="flex flex-col min-h-dvh lg:min-h-0"
        style={{ background: '#07080C' }}
      >
        {/* Logo mobile uniquement */}
        <header className="lg:hidden flex items-center gap-3 px-6 pt-6 pb-0">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Bosal Credit Union, retour à l’accueil du site"
          >
            <BosalBadge size={32} />
            <span className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Bosal <span className="font-bold">Credit Union</span>
            </span>
          </Link>
        </header>

        {/* Contenu centré */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>

        {/* Footer minimal */}
        <footer className="pb-6 px-6">
          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
            © {new Date().getFullYear()} Bosal Credit Union · Tous droits réservés
          </p>
        </footer>
      </div>
    </div>
  )
}
