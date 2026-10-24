import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftRight, FileSpreadsheet, FileText, Landmark } from 'lucide-react'
import { FeatureGrid, PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/api-reference'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// The exports that exist in the application today (no public API).
const EXPORTS = [
  {
    icon: <FileSpreadsheet size={18} />,
    title: 'Transactions',
    description:
      'Export CSV et PDF des opérations affichées dans le journal, qui porte sur les 500 opérations les plus récentes.',
  },
  {
    icon: <Landmark size={18} />,
    title: 'Prêts',
    description: 'Export CSV de la liste des prêts ; export PDF des prêts et des remboursements.',
  },
  {
    icon: <ArrowLeftRight size={18} />,
    title: 'Bureau de change',
    description:
      'Export CSV et PDF de l’historique, qui porte sur les 100 opérations de change les plus récentes.',
  },
  {
    icon: <FileText size={18} />,
    title: 'Relevés de compte',
    description: 'Relevé PDF au format A4, depuis la fiche de chaque compte.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Pas d’API publique pour le moment">
        <p>
          CoopFinance s’utilise uniquement par son application web, réservée aux agents de la
          coopérative. Il n’existe aujourd’hui ni API publique, ni clé d’API, ni webhooks : aucune
          interface n’est proposée pour connecter un logiciel externe.
        </p>
      </Section>

      <section className="cf-block">
        <h2>Récupérer vos données</h2>
        <div className="cf-prose">
          <p>
            Pour exploiter vos données dans un autre outil, par exemple un tableur, utilisez les
            exports disponibles dans l’application :
          </p>
        </div>
        <FeatureGrid items={EXPORTS} />
        <div className="cf-prose mt-5">
          <p>
            Les fichiers CSV s’ouvrent directement dans Excel ou dans un autre tableur. L’export de
            la liste des membres ou des comptes et l’import de fichiers ne sont pas disponibles.
          </p>
        </div>
      </section>

      <Section title="Un besoin d’intégration ?">
        <p>
          Si votre coopérative doit relier CoopFinance à un autre outil,{' '}
          <Link href="/contact">décrivez-nous votre besoin via le formulaire de contact</Link>.
        </p>
      </Section>
    </PageShell>
  )
}
