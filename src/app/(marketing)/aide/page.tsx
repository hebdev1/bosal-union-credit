import Link from 'next/link'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/aide'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const FAQ = [
  {
    q: 'Combien de temps faut-il pour déployer Bosal Credit Union ?',
    a: 'En moyenne 5 à 7 jours ouvrables : création du compte, import des membres, formation des agents. Plus de détails sur la page Comment ça marche.',
  },
  {
    q: 'Mes données sont-elles hébergées en Haïti ?',
    a: 'Nos serveurs principaux sont dans un datacenter certifié en Amérique du Nord avec sauvegardes quotidiennes. Un hébergement local est possible sur la formule Entreprise.',
  },
  {
    q: 'Puis-je importer mes membres depuis un fichier Excel ?',
    a: 'Oui — nous fournissons un template CSV, et notre équipe vous assiste pour le rapprochement automatique des doublons.',
  },
  {
    q: 'Comment fonctionne le support ?',
    a: 'Email pour toutes les formules, chat en direct pour Croissance, et téléphone prioritaire avec chargé de compte dédié pour Entreprise.',
  },
  {
    q: 'Bosal Credit Union est-il conforme à la BRH ?',
    a: 'Oui. Les indicateurs prudentiels, les rapports mensuels et la piste d’audit sont conçus pour répondre aux exigences de la Banque de la République d’Haïti.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui. Aucun engagement de durée. Vos données sont exportables à tout moment au format CSV et PDF.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Questions fréquentes">
        <p>
          Vous ne trouvez pas votre réponse ? Consultez la <Link href="/docs" style={{ color: '#C41E3A' }} className="underline underline-offset-4">documentation</Link> complète
          ou <Link href="/contact" style={{ color: '#C41E3A' }} className="underline underline-offset-4">contactez notre équipe</Link>.
        </p>
      </Section>

      <div className="mt-6 space-y-3">
        {FAQ.map(item => (
          <details key={item.q} className="group rounded-xl border overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3 text-[14.5px] font-medium text-white/90 hover:bg-white/[0.02]">
              <span>{item.q}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="flex-shrink-0 text-white/40 transition-transform group-open:rotate-180" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <div className="px-5 pb-4 text-[13.5px] text-white/55 leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </PageShell>
  )
}
