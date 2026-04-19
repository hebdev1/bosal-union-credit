import Link from 'next/link'
import { Check } from 'lucide-react'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/tarifs'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const PLANS = [
  {
    name: 'Starter', price: '4 900', period: 'HTG / mois', tagline: 'Jusqu’à 500 membres',
    highlight: false,
    features: ['1 agence', 'Comptes HTG & USD', 'Prêts & échéanciers', 'Rapports mensuels', 'Support e-mail'],
  },
  {
    name: 'Croissance', price: '12 500', period: 'HTG / mois', tagline: 'Jusqu’à 3 000 membres',
    highlight: true,
    features: ['Jusqu’à 3 agences', '4 devises (HTG/USD/CAD/DOP)', 'Bureau de change', 'API & webhooks', 'Alertes fraude', 'Support prioritaire'],
  },
  {
    name: 'Entreprise', price: 'Sur devis', period: '', tagline: 'Multi-agences illimitées',
    highlight: false,
    features: ['Agences illimitées', 'SLA 99.9%', 'Intégrations sur mesure', 'Formation en présentiel', 'Chargé de compte dédié', 'Conformité BRH avancée'],
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Une formule par taille de coopérative">
        <p>Essai de 30 jours sur toutes les formules. Sans carte bancaire, sans engagement.</p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {PLANS.map(plan => (
          <div key={plan.name} className="rounded-2xl p-6 border flex flex-col"
            style={{
              background: plan.highlight ? 'linear-gradient(180deg, rgba(196,30,58,0.08) 0%, rgba(196,30,58,0.02) 100%)' : 'rgba(255,255,255,0.02)',
              borderColor: plan.highlight ? 'rgba(196,30,58,0.35)' : 'rgba(255,255,255,0.07)',
            }}>
            {plan.highlight && (
              <span className="self-start mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
                style={{ background: '#C41E3A', color: '#fff' }}>Populaire</span>
            )}
            <p className="text-[13px] text-white/50">{plan.tagline}</p>
            <p className="mt-1 text-[22px] font-semibold text-white">{plan.name}</p>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-[32px] font-semibold text-white">{plan.price}</span>
              {plan.period && <span className="text-[13px] text-white/45">{plan.period}</span>}
            </div>
            <ul className="mt-6 space-y-2.5 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-white/70">
                  <Check size={14} style={{ color: '#22C55E' }} className="mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={plan.name === 'Entreprise' ? '/contact' : '/inscription'}
              className="mt-6 h-10 flex items-center justify-center rounded-full text-[13px] font-semibold transition-all"
              style={{
                background: plan.highlight ? '#C41E3A' : 'transparent',
                color: plan.highlight ? '#fff' : 'rgba(255,255,255,0.85)',
                border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.15)',
              }}>
              {plan.name === 'Entreprise' ? 'Demander un devis' : 'Commencer'}
            </Link>
          </div>
        ))}
      </div>

      <Section title="Questions fréquentes">
        <p>
          Consultez notre <Link href="/aide" style={{ color: '#C41E3A' }} className="underline underline-offset-4">centre d’aide</Link> ou lisez les <Link href="/cgu" style={{ color: '#C41E3A' }} className="underline underline-offset-4">conditions d’utilisation</Link> pour en savoir plus.
        </p>
      </Section>
    </PageShell>
  )
}
