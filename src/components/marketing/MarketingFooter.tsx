import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import { BosalBadge } from '@/components/brand/BosalLogo'

const FOOTER_LINKS = {
  Produit: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Comment ça marche', href: '#how-it-works' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Sécurité', href: '/securite' },
    { label: 'Mises à jour', href: '/changelog' },
  ],
  Solutions: [
    { label: "Coopératives d'épargne", href: '/solutions/epargne' },
    { label: 'Gestion de prêts', href: '/solutions/prets' },
    { label: 'Bureau de change', href: '/solutions/change' },
    { label: 'Caisse & coffre', href: '/solutions/caisse' },
    { label: 'Multi-agences', href: '/solutions/agences' },
  ],
  Ressources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/api-reference' },
    { label: "Centre d'aide", href: '/aide' },
    { label: 'Statut système', href: '/statut' },
    { label: 'Blog', href: '/blog' },
  ],
  Entreprise: [
    { label: 'À propos', href: '/a-propos' },
    { label: 'Contact', href: '/contact' },
    { label: 'Partenaires', href: '/partenaires' },
    { label: "Conditions d'utilisation", href: '/cgu' },
    { label: 'Confidentialité', href: '/confidentialite' },
  ],
}

// SVG social icons inline — lucide ne les a pas dans cette version
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const SOCIAL_LINKS = [
  { Icon: XIcon,        href: '#', label: 'X (Twitter)' },
  { Icon: FacebookIcon, href: '#', label: 'Facebook' },
  { Icon: LinkedInIcon, href: '#', label: 'LinkedIn' },
]

export function MarketingFooter() {
  return (
    <footer role="contentinfo" className="border-t border-[#252A36] bg-[#0C0C0E]">
      {/* Main grid */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand — 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Link
              href="/"
              className="group flex items-center gap-2.5 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] rounded-md"
              aria-label="Mache Kay BOSAL — Accueil"
            >
              <BosalBadge size={36} />
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white leading-tight">Mache Kay <span className="font-bold">BOSAL</span></span>
                <span className="text-[11px] text-white/35 tracking-[0.02em]">Core Banking · Haïti</span>
              </div>
            </Link>

            <p className="text-[13px] text-white/45 leading-relaxed max-w-[260px]">
              La force de l&apos;union, la rigueur du crédit. Plateforme de gestion financière pour coopératives haïtiennes.
            </p>

            <address className="not-italic flex flex-col gap-2">
              <a
                href="mailto:contact@bosalunion.ht"
                className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/70 transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] rounded w-fit"
              >
                <Mail className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                contact@bosalunion.ht
              </a>
              <a
                href="tel:+50936000000"
                className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/70 transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] rounded w-fit"
              >
                <Phone className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
                +509 36 00 00 00
              </a>
              <span className="flex items-start gap-2 text-[12px] text-white/40">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
                Port-au-Prince, Haïti
              </span>
            </address>

            <div className="flex items-center gap-1.5" role="list" aria-label="Réseaux sociaux">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  role="listitem"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#252A36] text-white/35 hover:text-white/80 hover:border-[#363D52] hover:bg-white/5 transition-all duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A]"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="flex flex-col gap-4">
              <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-white/25">
                {section}
              </h3>
              <ul role="list" className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] text-white/45 hover:text-white/80 transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] rounded leading-snug"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#252A36]/60">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/25 text-center sm:text-left">
            © {new Date().getFullYear()} Mache Kay BOSAL. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#252A36] text-[11px] text-white/30">
              <svg className="h-3 w-3 text-[#22C55E]" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 1.5A6.5 6.5 0 1 0 14.5 8 6.508 6.508 0 0 0 8 1.5ZM6.354 10.354l-2-2a.5.5 0 0 1 .707-.707L6.5 9.086l4.146-4.147a.5.5 0 1 1 .708.707l-4.5 4.5a.5.5 0 0 1-.5.208Z" />
              </svg>
              SSL 256-bit
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#252A36] text-[11px] text-white/30">
              <svg className="h-3 w-3 text-[#3B82F6]" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              Données chiffrées
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#252A36] text-[11px] text-white/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
              99.9% uptime
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
