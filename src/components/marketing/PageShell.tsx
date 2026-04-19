import Link from 'next/link'
import { ChevronRight, ArrowRight } from 'lucide-react'
import { getPage, getRelatedPages } from '@/lib/marketing-pages'
import { BosalBadge } from '@/components/brand/BosalLogo'

interface PageShellProps {
  slug: string
  children: React.ReactNode
}

export function PageShell({ slug, children }: PageShellProps) {
  const page = getPage(slug)
  const related = getRelatedPages(slug, 3)

  if (!page) {
    return <div className="text-white/60 p-12">Page introuvable</div>
  }

  return (
    <div style={{ background: '#07080C' }} className="min-h-dvh">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-5 md:px-8 overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,30,58,0.10) 0%, transparent 60%)' }}
        />
        {/* Grid bg */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at top, black 40%, transparent 80%)',
          }}
        />

        <div className="relative mx-auto max-w-[980px]">
          {/* Breadcrumbs */}
          <nav aria-label="Fil d’Ariane" className="mb-6">
            <ol className="flex items-center gap-1.5 text-[12px] text-white/40">
              <li>
                <Link href="/" className="hover:text-white/70 transition-colors">Accueil</Link>
              </li>
              <li aria-hidden="true"><ChevronRight size={12} /></li>
              <li>
                <span className="text-white/60">{page.eyebrow}</span>
              </li>
              <li aria-hidden="true"><ChevronRight size={12} /></li>
              <li>
                <span className="text-white/85">{page.title}</span>
              </li>
            </ol>
          </nav>

          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full border"
            style={{ borderColor: 'rgba(196,30,58,0.30)', background: 'rgba(196,30,58,0.07)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C41E3A' }} />
            <span className="text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: '#E11D48' }}>
              {page.eyebrow}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[44px] md:text-[56px] font-semibold tracking-[-0.03em] leading-[1.05] text-white">
            {page.title}
          </h1>

          {/* Description */}
          <p className="mt-5 max-w-[640px] text-[16px] md:text-[17px] leading-relaxed text-white/55">
            {page.description}
          </p>
        </div>
      </section>

      {/* ── Content slot ─────────────────────────────────── */}
      <section className="relative px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-[980px]">
          {children}
        </div>
      </section>

      {/* ── Related pages ────────────────────────────────── */}
      <section className="relative px-5 md:px-8 pb-20">
        <div className="mx-auto max-w-[980px]">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-white">
              Continuer l’exploration
            </h2>
            <Link href="/"
              className="text-[13px] text-white/45 hover:text-white/80 inline-flex items-center gap-1 transition-colors">
              Retour à l’accueil <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {related.map(p => (
              <Link
                key={p.slug}
                href={p.slug}
                className="group rounded-xl p-5 border transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.07)',
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.1em] text-white/35 mb-2">
                  {p.section}
                </p>
                <p className="text-[15px] font-medium text-white/90 group-hover:text-white">
                  {p.title}
                </p>
                <p className="mt-1.5 text-[12.5px] text-white/45 line-clamp-2 leading-snug">
                  {p.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium"
                  style={{ color: '#C41E3A' }}>
                  En savoir plus <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA footer ───────────────────────────────────── */}
      <section className="relative px-5 md:px-8 pb-24">
        <div className="mx-auto max-w-[980px] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{
            background: 'linear-gradient(135deg, rgba(196,30,58,0.08) 0%, rgba(196,30,58,0.02) 100%)',
            border: '1px solid rgba(196,30,58,0.20)',
          }}>
          <div className="flex items-center gap-4">
            <BosalBadge size={52} />
            <div>
              <p className="text-[18px] font-semibold text-white leading-tight">
                Prêt à moderniser votre coopérative ?
              </p>
              <p className="mt-1 text-[13px] text-white/50">
                Créez votre compte en 2 minutes — sans carte bancaire.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contact"
              className="h-11 px-5 inline-flex items-center rounded-full border text-[13px] font-medium text-white/85 hover:bg-white/5 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              Parler à un expert
            </Link>
            <Link href="/inscription"
              className="h-11 px-5 inline-flex items-center gap-2 rounded-full text-[13px] font-semibold text-white transition-all"
              style={{
                background: '#C41E3A',
                boxShadow: '0 0 24px rgba(196,30,58,0.35)',
              }}>
              Commencer gratuitement <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ─── Reusable content primitives ────────────────────────────── */

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      {title && (
        <h2 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-white mb-5">
          {title}
        </h2>
      )}
      <div className="text-[15px] leading-relaxed text-white/65 space-y-4">{children}</div>
    </section>
  )
}

export function FeatureGrid({
  items,
}: {
  items: { title: string; description: string; icon?: React.ReactNode }[]
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl p-5 border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          {item.icon && (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ background: 'rgba(196,30,58,0.10)', color: '#E11D48' }}>
              {item.icon}
            </div>
          )}
          <p className="text-[14.5px] font-semibold text-white/90">{item.title}</p>
          <p className="mt-1.5 text-[13px] text-white/50 leading-snug">{item.description}</p>
        </div>
      ))}
    </div>
  )
}

export function Steps({ items }: { items: { title: string; description: string }[] }) {
  return (
    <ol className="mt-6 space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4 rounded-xl p-5 border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[13px] font-semibold"
            style={{ background: 'rgba(196,30,58,0.12)', color: '#E11D48' }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white/90">{item.title}</p>
            <p className="mt-1 text-[13px] text-white/55 leading-relaxed">{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
