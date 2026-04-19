import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/changelog'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const RELEASES = [
  {
    version: 'v2.4.0',
    date: '2026-04-15',
    highlights: [
      'Rebrand complet — nouvelle identité Mache Kay BOSAL',
      'Refonte de la landing et des pages marketing',
      'Amélioration des performances du tableau de bord (−40% de temps de chargement)',
    ],
  },
  {
    version: 'v2.3.0',
    date: '2026-03-02',
    highlights: [
      'Ajout de la devise DOP (peso dominicain) au bureau de change',
      'Export PDF signé numériquement pour les relevés de compte',
      'Nouveau rapport : analyse de cohorte des nouveaux membres',
    ],
  },
  {
    version: 'v2.2.0',
    date: '2026-01-18',
    highlights: [
      'Clôture journée multi-caisses avec réconciliation automatique',
      'Alertes fraude : détection des dépôts inhabituels',
      'API publique v1 avec authentification par clé',
    ],
  },
  {
    version: 'v2.1.0',
    date: '2025-11-28',
    highlights: [
      'Support multi-agences avec consolidation financière',
      'Notifications SMS pour membres (dépôts, échéances)',
      'Paramétrage complet du coopérative (logo, couleur, adresse)',
    ],
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Chaque mois, la plateforme s’améliore">
        <p>
          Suivez ici l’évolution de Mache Kay BOSAL. Vous avez une suggestion ?
          Écrivez-nous via le <a href="/contact" style={{ color: '#C41E3A' }} className="underline underline-offset-4">formulaire de contact</a>.
        </p>
      </Section>

      <div className="mt-8 space-y-4">
        {RELEASES.map(r => (
          <article key={r.version} className="rounded-xl p-6 border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <header className="flex items-baseline justify-between flex-wrap gap-2">
              <h3 className="text-[17px] font-semibold text-white">{r.version}</h3>
              <time className="text-[12px] text-white/40" dateTime={r.date}>
                {new Date(r.date).toLocaleDateString('fr-HT', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </header>
            <ul className="mt-4 space-y-2">
              {r.highlights.map(h => (
                <li key={h} className="flex gap-2 text-[13.5px] text-white/65 leading-relaxed">
                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#C41E3A' }} />
                  {h}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </PageShell>
  )
}
