'use client'

import * as React from 'react'
import { ArrowRight, TrendingUp, Users, Shield, Zap, Globe, BarChart3, Lock, Banknote } from 'lucide-react'
import { LinkButton, AnchorButton } from '@/components/ui/link-button'
import { BosalBadge } from '@/components/brand/BosalLogo'

/* ─── Animated canvas background (glow rouge) ───────────────────────────── */
function HeroCanvas() {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    let raf = 0
    let t = 0
    const tick = () => {
      t += 0.006
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      // central soft red glow
      const center = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2)
      center.addColorStop(0, 'rgba(196,30,58,0.14)')
      center.addColorStop(0.45, 'rgba(196,30,58,0.05)')
      center.addColorStop(1, 'rgba(10,10,10,0)')
      ctx.fillStyle = center
      ctx.fillRect(0, 0, w, h)

      // 3 orbiting glows
      for (let i = 0; i < 3; i++) {
        const x = (Math.sin(t + i * 2.1) * 0.5 + 0.5) * w
        const y = (Math.cos(t * 0.75 + i * 1.7) * 0.5 + 0.5) * h
        const g = ctx.createRadialGradient(x, y, 0, x, y, 180)
        g.addColorStop(0, 'rgba(196,30,58,0.18)')
        g.addColorStop(1, 'rgba(196,30,58,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}

/* ─── KPI card for mockup ──────────────────────────────────────────────── */
function MockupKpi({ label, value, delta, positive = true }: {
  label: string; value: string; delta: string; positive?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-[#15181F] border border-white/8 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="text-[10px] font-medium text-white/45 uppercase tracking-wider">{label}</div>
          <div className="text-[17px] font-semibold tracking-tight text-white kpi-value">{value}</div>
        </div>
        <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
          <TrendingUp className="h-2.5 w-2.5" />
          {delta}
        </div>
      </div>
    </div>
  )
}

/* ─── Data ─────────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Users,        title: 'Gestion des membres',        description: "Onboarding complet, profils détaillés, comptes multi-devises et historique traçable.",                accent: false },
  { icon: BarChart3,    title: 'Tableau de bord live',        description: 'KPIs financiers temps réel, graphiques transactions et alertes fraude automatisées.',                accent: true  },
  { icon: Globe,        title: 'Bureau de change intégré',   description: 'Taux configurables HTG / USD / CAD / DOP, tickets horodatés, audit complet.',                          accent: false },
  { icon: Zap,          title: 'Transactions instantanées',   description: 'Dépôts, retraits, virements, remboursements de prêts en quelques secondes.',                           accent: false },
  { icon: Shield,       title: 'Sécurité bancaire',           description: 'RLS multi-tenant, audit logs complets, détection de fraude automatisée en continu.',                  accent: false },
  { icon: Lock,         title: 'Accès par rôles',              description: 'Permissions granulaires : admin, manager, caissier. Contrôle total sur chaque action.',               accent: false },
]

const STATS = [
  { value: '500+',  label: 'Membres gérés' },
  { value: '2M+',   label: 'HTG traités' },
  { value: '99.9%', label: 'Disponibilité' },
  { value: '4',     label: 'Devises' },
]

const STEPS = [
  { n: '01', title: 'Créez votre coopérative',  desc: 'Configurez votre espace en moins de 5 minutes. Importez vos membres existants.' },
  { n: '02', title: 'Ajoutez vos agents',        desc: 'Définissez les rôles et permissions de chaque collaborateur selon son poste.' },
  { n: '03', title: 'Gérez les opérations',      desc: "Dépôts, prêts, change, caisse — tout depuis une interface unifiée et sécurisée." },
]

const TESTIMONIALS = [
  {
    quote: "Mache Kay BOSAL a transformé notre façon de gérer les comptes. Nos membres apprécient la rapidité et la transparence des opérations.",
    name: 'Marie-Josée F.',
    role: 'Directrice, Coopérative Solèy',
    initials: 'MF',
    color: '#C41E3A',
  },
  {
    quote: "Le bureau de change intégré nous a permis d'éliminer tous les outils séparés. Tout est traçable, tout est auditable.",
    name: 'Jean-Baptiste M.',
    role: 'Gérant, Union Crédit Nord',
    initials: 'JM',
    color: '#3B82F6',
  },
]

const AVATARS = [
  { initials: 'BT', bg: '#C41E3A' },
  { initials: 'MJ', bg: '#3B82F6' },
  { initials: 'PC', bg: '#22C55E' },
]

/* ─── Main page ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="grid-bg">

      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="relative min-h-[calc(100dvh-60px)] overflow-hidden flex items-center pt-[60px]"
        aria-labelledby="hero-heading"
      >
        {/* Animated canvas + dots pattern */}
        <HeroCanvas />
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#C41E3A 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at center, var(--background), transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, var(--background), transparent)',
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto w-full max-w-[1280px] px-5 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── LEFT — Copy ──────────────────────────────────────── */}
            <div className="flex flex-col gap-7 animate-fade-in-up">
              {/* Eyebrow badge avec dot pulsant */}
              <div className="w-fit">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C41E3A]/10 border border-[#C41E3A]/25 backdrop-blur-sm text-[12px] font-medium text-[#FF6B7F] tracking-[0.01em]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C41E3A] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C41E3A]" />
                  </span>
                  Plateforme Core Banking · Haïti
                </span>
              </div>

              {/* Titre principal */}
              <h1
                id="hero-heading"
                className="font-display text-[44px] sm:text-[56px] lg:text-[68px] leading-[1.05] tracking-[-0.035em] text-white"
              >
                Mache Kay{' '}
                <em className="not-italic text-[#C41E3A] font-display italic relative inline-block">
                  BOSAL
                  <span className="absolute -bottom-2 left-0 right-0 h-1 bg-[#C41E3A]/30 blur-sm" aria-hidden="true" />
                </em>
                <br />
                <span className="text-white/60 text-[0.72em] font-normal">la force de la coopérative.</span>
              </h1>

              {/* Description */}
              <p className="text-[16px] sm:text-[17px] text-white/55 leading-[1.7] max-w-[520px]">
                Gérez membres, prêts, dépôts et bureau de change depuis une plateforme sécurisée
                pensée pour les coopératives financières haïtiennes modernes.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <LinkButton
                  href="/inscription"
                  size="lg"
                  className="h-12 px-7 bg-[#C41E3A] hover:bg-[#9B1530] text-white font-semibold rounded-full shadow-[0_0_32px_rgba(196,30,58,0.35)] hover:shadow-[0_0_40px_rgba(196,30,58,0.55)] transition-all duration-200 gap-2 group"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </LinkButton>
                <AnchorButton
                  href="#how-it-works"
                  variant="ghost"
                  size="lg"
                  className="h-12 px-6 border-2 border-white/12 text-white/75 hover:text-white hover:bg-white/5 hover:border-[#C41E3A]/60 rounded-full transition-all duration-200"
                >
                  Voir la démo
                </AnchorButton>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3.5 pt-2">
                <div className="flex -space-x-2" aria-hidden="true">
                  {AVATARS.map(({ initials, bg }, i) => (
                    <span
                      key={initials}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0A0A0A] text-[11px] font-semibold text-white shadow-md"
                      style={{ background: bg, zIndex: 3 - i }}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-white/45">
                  Utilisé par <span className="text-white/80 font-medium">12 coopératives</span> haïtiennes
                </p>
              </div>
            </div>

            {/* ── RIGHT — Dashboard mockup ────────────────────────── */}
            <div className="relative flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {/* Glow behind card */}
              <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-[#C41E3A]/20 blur-3xl opacity-60" aria-hidden="true" />

              <div
                className="relative w-full max-w-[560px] rounded-2xl border border-white/10 bg-[#0F1219] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_80px_rgba(0,0,0,0.8)]"
                aria-label="Aperçu du tableau de bord Mache Kay BOSAL"
                role="img"
              >
                {/* Titre bar */}
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/7">
                  <div>
                    <h3 className="text-[14px] font-semibold text-white leading-tight">Vue d&rsquo;ensemble</h3>
                    <p className="text-[11px] text-white/40 mt-0.5">Temps réel · Coopérative Solèy</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#C41E3A]/12 border border-[#C41E3A]/25 px-2.5 py-1 text-[10px] font-semibold text-[#FF6B7F] uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C41E3A] animate-pulse" />
                    Live
                  </span>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4" role="list" aria-label="Indicateurs clés">
                  <MockupKpi label="Solde total" value="1,248,500 HTG" delta="+4.2%" />
                  <MockupKpi label="Prêts actifs" value="34" delta="+2" />
                  <MockupKpi label="Membres" value="127" delta="+3" />
                  <MockupKpi label="Coffre" value="348,200 HTG" delta="82%" />
                </div>

                {/* Mini chart */}
                <div className="rounded-lg bg-[#15181F] border border-white/8 p-4" aria-hidden="true">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] font-medium text-white/60">Transactions hebdomadaires</p>
                      <p className="text-[10px] text-white/30 mt-0.5">30 derniers jours</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#C41E3A]">+23%</span>
                  </div>
                  <div className="flex items-end justify-between gap-1.5 h-20">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm transition-all hover:opacity-80"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, #C41E3A, ${h > 70 ? '#E8314F' : 'rgba(196,30,58,0.55)'})`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-white/25 mt-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <span key={d}>{d}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-y border-white/6 bg-[#0D1018]/50" aria-label="Chiffres clés">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-10">
          <dl className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center py-6 px-4 gap-1">
                <dt className="kpi-value text-[32px] sm:text-[40px] font-bold text-white leading-none tracking-tight">{value}</dt>
                <dd className="text-[13px] text-white/45 text-center mt-1">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ━━━ FEATURES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="mx-auto max-w-[1280px] px-5 md:px-8 py-20 md:py-28" aria-labelledby="features-heading">
        <div className="text-center mb-14">
          <p className="text-[12px] tracking-[0.14em] uppercase text-[#C41E3A] font-semibold mb-3">Fonctionnalités</p>
          <h2 id="features-heading" className="font-display text-[34px] sm:text-[42px] lg:text-[48px] tracking-[-0.025em] text-white leading-[1.1]">
            Tout ce dont votre<br className="hidden sm:block" /> coopérative a besoin
          </h2>
          <p className="text-[15px] text-white/45 mt-5 max-w-[500px] mx-auto leading-relaxed">
            Une plateforme complète, de l&apos;onboarding membre jusqu&apos;au rapport mensuel.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, accent }) => (
            <article
              key={title}
              className={`card-surface p-6 rounded-xl flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 ${accent ? 'border-[#C41E3A]/30' : ''}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? 'bg-[#C41E3A]/15 border border-[#C41E3A]/25' : 'bg-white/5 border border-white/10'}`} aria-hidden="true">
                <Icon className={`h-5 w-5 ${accent ? 'text-[#C41E3A]' : 'text-white/60'}`} strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-white mb-1.5">{title}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how-it-works" className="bg-[#0D1018]/40 border-y border-white/6" aria-labelledby="how-heading">
        <div className="mx-auto max-w-[640px] px-5 md:px-8 py-20 md:py-28 text-center">
          <p className="text-[12px] tracking-[0.14em] uppercase text-[#C41E3A] font-semibold mb-3">Démarrage rapide</p>
          <h2 id="how-heading" className="font-display text-[34px] sm:text-[40px] tracking-[-0.025em] text-white mb-14 leading-[1.15]">
            Opérationnel en 3 étapes
          </h2>
          <ol className="flex flex-col gap-0" aria-label="Étapes de démarrage">
            {STEPS.map(({ n, title, desc }, i) => (
              <li key={n} className="relative flex gap-5 text-left pb-10 last:pb-0">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gradient-to-b from-[#C41E3A]/40 to-transparent" aria-hidden="true" />
                )}
                <div
                  className="relative flex-shrink-0 h-8 w-8 rounded-full bg-[#C41E3A] flex items-center justify-center text-[11px] font-bold font-mono text-white shadow-[0_0_16px_rgba(196,30,58,0.45)]"
                  aria-hidden="true"
                >
                  {n}
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-white mb-1.5">{title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ━━━ TESTIMONIALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="testimonials" className="mx-auto max-w-[1280px] px-5 md:px-8 py-20 md:py-28" aria-labelledby="testimonials-heading">
        <div className="text-center mb-14">
          <p className="text-[12px] tracking-[0.14em] uppercase text-[#C41E3A] font-semibold mb-3">Témoignages</p>
          <h2 id="testimonials-heading" className="font-display text-[34px] sm:text-[40px] tracking-[-0.025em] text-white leading-[1.15]">
            Ce qu&apos;ils en disent
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[900px] mx-auto">
          {TESTIMONIALS.map(({ quote, name, role, initials, color }) => (
            <figure key={name} className="card-surface p-6 rounded-xl flex flex-col gap-5">
              <div className="flex gap-1" role="img" aria-label="5 étoiles sur 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-[#F59E0B]" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 1.5l1.65 3.35 3.7.54-2.68 2.6.63 3.68L8 9.75l-3.3 1.92.63-3.68L2.65 5.39l3.7-.54L8 1.5z" />
                  </svg>
                ))}
              </div>
              <blockquote>
                <p className="text-[14px] text-white/70 leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
              </blockquote>
              <figcaption className="flex items-center gap-3 mt-auto">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold text-white flex-shrink-0"
                  style={{ background: color }}
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <div>
                  <p className="text-[13px] font-medium text-white">{name}</p>
                  <p className="text-[12px] text-white/40">{role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ━━━ CTA FINAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#C41E3A] relative overflow-hidden" aria-labelledby="cta-heading">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-5 md:px-8 py-20 md:py-24 text-center">
          <div className="flex justify-center mb-6">
            <BosalBadge size={56} color="#FFFFFF" />
          </div>
          <h2 id="cta-heading" className="font-display text-[34px] sm:text-[44px] lg:text-[52px] tracking-[-0.025em] text-white leading-[1.1] mb-5">
            Prêt à moderniser<br className="hidden sm:block" /> votre coopérative&nbsp;?
          </h2>
          <p className="text-[15px] text-white/80 max-w-[460px] mx-auto leading-relaxed mb-8">
            Rejoignez les coopératives haïtiennes qui font confiance à Mache Kay BOSAL.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LinkButton
              href="/inscription"
              size="lg"
              className="h-12 px-7 bg-white text-[#C41E3A] font-semibold hover:bg-white/92 transition-colors duration-120 shadow-lg rounded-full"
            >
              Commencer gratuitement
            </LinkButton>
            <LinkButton
              href="/contact"
              variant="ghost"
              size="lg"
              className="h-12 px-6 border-2 border-white/35 text-white hover:bg-white/10 hover:border-white/60 rounded-full transition-all duration-120"
            >
              Contacter l&apos;équipe
            </LinkButton>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s ease-out both; }
      `}</style>
    </div>
  )
}
