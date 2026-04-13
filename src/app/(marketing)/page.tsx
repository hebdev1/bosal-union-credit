import { Landmark, ArrowRight, Shield, Zap, Globe, BarChart3, Users, Lock } from 'lucide-react'
import { LinkButton, AnchorButton } from '@/components/ui/link-button'

const FEATURES = [
  {
    icon: Users,
    title: 'Gestion des membres',
    description: "Onboarding complet, profils détaillés, comptes multi-devises et suivi de l'historique.",
    accent: false,
  },
  {
    icon: BarChart3,
    title: 'Tableau de bord en temps réel',
    description: 'KPIs financiers, graphiques de transactions et alertes fraude en direct.',
    accent: true,
  },
  {
    icon: Globe,
    title: 'Bureau de change intégré',
    description: 'Taux configurables HTG / USD / CAD / DOP, tickets horodatés, audit complet.',
    accent: false,
  },
  {
    icon: Zap,
    title: 'Transactions instantanées',
    description: 'Dépôts, retraits, virements et remboursements de prêts en quelques secondes.',
    accent: false,
  },
  {
    icon: Shield,
    title: 'Sécurité bancaire',
    description: 'RLS multi-tenant, audit logs complets, détection de fraude automatisée.',
    accent: false,
  },
  {
    icon: Lock,
    title: 'Accès par rôles',
    description: 'Permissions granulaires : admin, manager, caissier. Contrôle total des accès.',
    accent: false,
  },
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
  { n: '03', title: 'Gérez les opérations',      desc: "Dépôts, prêts, change, caisse — tout depuis une interface unifiée." },
]

const TESTIMONIALS = [
  {
    quote: "Bosal Union Credit a transformé notre façon de gérer les comptes. Nos membres apprécient la rapidité et la transparence des opérations.",
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

export default function LandingPage() {
  return (
    <div className="grid-bg">

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section
        className="relative min-h-[calc(100dvh-60px)] flex items-center pt-[60px]"
        aria-labelledby="hero-heading"
      >
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-[#C41E3A]/8 blur-[120px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[1280px] px-5 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Copy */}
            <div className="flex flex-col gap-6 lg:gap-8">
              <div className="w-fit">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111318] border border-[#252A36] text-[12px] text-white/55 tracking-[0.01em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C41E3A] animate-pulse" aria-hidden="true" />
                  Plateforme core banking · Haïti
                </span>
              </div>

              <h1
                id="hero-heading"
                className="font-display text-[40px] sm:text-[52px] lg:text-[60px] leading-[1.08] tracking-[-0.03em] text-white"
              >
                La finance coopérative,{' '}
                <em className="not-italic text-[#C41E3A] font-display italic">repensée.</em>
              </h1>

              <p className="text-[16px] sm:text-[17px] text-white/55 leading-[1.7] max-w-[480px]">
                Gérez membres, prêts, dépôts et bureau de change depuis une
                plateforme sécurisée pensée pour les coopératives financières haïtiennes.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <LinkButton
                  href="/inscription"
                  size="lg"
                  className="h-12 px-6 bg-[#C41E3A] hover:bg-[#9B1530] text-white font-semibold shadow-[0_0_24px_rgba(196,30,58,0.30)] hover:shadow-[0_0_32px_rgba(196,30,58,0.45)] transition-all duration-[180ms] gap-2"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </LinkButton>
                <AnchorButton
                  href="#how-it-works"
                  variant="ghost"
                  size="lg"
                  className="h-12 px-5 border border-[#363D52] text-white/65 hover:text-white hover:bg-white/5 hover:border-[#4A5266] transition-all duration-[120ms]"
                >
                  Voir la démo
                </AnchorButton>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 mt-1">
                <div className="flex -space-x-2" aria-hidden="true">
                  {AVATARS.map(({ initials, bg }, i) => (
                    <span
                      key={initials}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0C0C0E] text-[10px] font-semibold text-white"
                      style={{ background: bg, zIndex: 3 - i }}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-white/40">
                  Utilisé par <span className="text-white/70 font-medium">12 coopératives</span> haïtiennes
                </p>
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div
                className="relative w-full max-w-[540px] rounded-2xl border border-[#252A36] bg-[#111318] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_80px_rgba(0,0,0,0.7)]"
                aria-label="Aperçu du tableau de bord Bosal Union Credit"
                role="img"
              >
                <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-[#C41E3A]/15 blur-3xl" aria-hidden="true" />

                {/* Fausse barre titre */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#252A36]" aria-hidden="true">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#EF4444]/70" />
                    <span className="h-3 w-3 rounded-full bg-[#F59E0B]/70" />
                    <span className="h-3 w-3 rounded-full bg-[#22C55E]/70" />
                  </div>
                  <span className="text-[11px] text-white/25 mx-auto">tableau-de-bord — Bosal Union Credit</span>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-2 mb-3" role="list" aria-label="Indicateurs clés">
                  {[
                    { label: 'Solde total',   value: '1,248,500 HTG', trend: '+4.2%',        color: '#22C55E' },
                    { label: 'Prêts actifs',  value: '34 prêts',      trend: '+2',            color: '#3B82F6' },
                    { label: 'Membres',       value: '127 actifs',    trend: '+3 ce mois',    color: '#8B5CF6' },
                    { label: 'Coffre',        value: '348,200 HTG',   trend: '82% capacité',  color: '#F59E0B' },
                  ].map(({ label, value, trend, color }) => (
                    <div key={label} role="listitem" className="rounded-xl bg-[#181D27] border border-[#252A36] p-3">
                      <p className="text-[10px] text-white/35 mb-1">{label}</p>
                      <p className="kpi-value text-[14px] font-bold text-white leading-tight">{value}</p>
                      <p className="text-[10px] mt-1" style={{ color }}>{trend}</p>
                    </div>
                  ))}
                </div>

                {/* Mini chart */}
                <div className="rounded-xl bg-[#181D27] border border-[#252A36] p-3" aria-hidden="true">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] text-white/45">Transactions — 30 derniers jours</span>
                    <div className="flex gap-1">
                      {['7j', '30j', '90j'].map((t, i) => (
                        <span key={t} className={`text-[10px] px-2 py-0.5 rounded-md ${i === 1 ? 'bg-[#252A36] text-white/70' : 'text-white/30'}`}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end gap-[2px] h-16">
                    {[40,65,45,80,55,90,70,85,60,95,75,88,50,78,92,68,82,58,74,96,63,87,72,91,66,79,84,57,93,71].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm min-w-0" style={{ height: `${h}%`, background: h > 80 ? '#C41E3A' : 'rgba(196,30,58,0.22)' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <section className="border-y border-[#252A36] bg-[#111318]/50" aria-label="Chiffres clés">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8 py-10">
          <dl className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#252A36]">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center py-6 px-4 gap-1">
                <dt className="kpi-value text-[32px] sm:text-[36px] font-bold text-white leading-none">{value}</dt>
                <dd className="text-[13px] text-white/45 text-center">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-[1280px] px-5 md:px-8 py-20 md:py-28" aria-labelledby="features-heading">
        <div className="text-center mb-14">
          <p className="text-[12px] tracking-[0.12em] uppercase text-[#C41E3A] font-medium mb-3">Fonctionnalités</p>
          <h2 id="features-heading" className="font-display text-[32px] sm:text-[40px] lg:text-[44px] tracking-[-0.02em] text-white leading-[1.15]">
            Tout ce dont votre<br className="hidden sm:block" /> coopérative a besoin
          </h2>
          <p className="text-[15px] text-white/45 mt-4 max-w-[480px] mx-auto leading-relaxed">
            Une plateforme complète, de l&apos;onboarding membre jusqu&apos;au rapport mensuel.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, accent }) => (
            <article
              key={title}
              className={`card-surface p-6 rounded-xl flex flex-col gap-4 transition-all duration-[180ms] hover:scale-[1.01]${accent ? ' border-[#C41E3A]/30' : ''}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? 'bg-[#C41E3A]/15' : 'bg-[#252A36]'}`} aria-hidden="true">
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

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="bg-[#111318]/40 border-y border-[#252A36]" aria-labelledby="how-heading">
        <div className="mx-auto max-w-[640px] px-5 md:px-8 py-20 md:py-28 text-center">
          <p className="text-[12px] tracking-[0.12em] uppercase text-[#C41E3A] font-medium mb-3">Démarrage rapide</p>
          <h2 id="how-heading" className="font-display text-[32px] sm:text-[38px] tracking-[-0.02em] text-white mb-14 leading-[1.2]">
            Opérationnel en 3 étapes
          </h2>
          <ol className="flex flex-col gap-0" aria-label="Étapes de démarrage">
            {STEPS.map(({ n, title, desc }, i) => (
              <li key={n} className="relative flex gap-5 text-left pb-10 last:pb-0">
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[#C41E3A]/25" aria-hidden="true" />
                )}
                <div className="relative flex-shrink-0 h-8 w-8 rounded-full bg-[#C41E3A] flex items-center justify-center text-[11px] font-bold font-mono text-white shadow-[0_0_12px_rgba(196,30,58,0.35)]" aria-hidden="true">
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

      {/* ─── TESTIMONIALS ─────────────────────────────────── */}
      <section id="testimonials" className="mx-auto max-w-[1280px] px-5 md:px-8 py-20 md:py-28" aria-labelledby="testimonials-heading">
        <div className="text-center mb-14">
          <p className="text-[12px] tracking-[0.12em] uppercase text-[#C41E3A] font-medium mb-3">Témoignages</p>
          <h2 id="testimonials-heading" className="font-display text-[32px] sm:text-[38px] tracking-[-0.02em] text-white leading-[1.2]">
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
                <p className="text-[14px] text-white/65 leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
              </blockquote>
              <figcaption className="flex items-center gap-3 mt-auto">
                <span className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold text-white flex-shrink-0" style={{ background: color }} aria-hidden="true">
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

      {/* ─── CTA FINAL ────────────────────────────────────── */}
      <section className="bg-[#C41E3A] relative overflow-hidden" aria-labelledby="cta-heading">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-5 md:px-8 py-20 md:py-24 text-center">
          <h2 id="cta-heading" className="font-display text-[32px] sm:text-[42px] lg:text-[48px] tracking-[-0.02em] text-white leading-[1.15] mb-5">
            Prêt à moderniser<br className="hidden sm:block" /> votre coopérative&nbsp;?
          </h2>
          <p className="text-[15px] text-white/75 max-w-[440px] mx-auto leading-relaxed mb-8">
            Rejoignez les coopératives haïtiennes qui font confiance à Bosal Union Credit.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LinkButton
              href="/inscription"
              size="lg"
              className="h-12 px-7 bg-white text-[#C41E3A] font-semibold hover:bg-white/92 transition-colors duration-[120ms] shadow-lg"
            >
              Commencer gratuitement
            </LinkButton>
            <LinkButton
              href="/contact"
              variant="ghost"
              size="lg"
              className="h-12 px-6 border border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-[120ms]"
            >
              Contacter l&apos;équipe
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  )
}
