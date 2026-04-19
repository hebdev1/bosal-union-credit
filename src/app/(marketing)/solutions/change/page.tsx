import { ArrowLeftRight, Receipt, TrendingUp, Globe2, BarChart3, Printer } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/change'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Bureau de change professionnel">
        <p>
          HTG, USD, CAD, DOP — toutes les devises nécessaires à une coopérative haïtienne.
          Saisie du taux quotidien, conversion en direct, ticket client imprimé en 2 secondes.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <Globe2 size={18} />, title: '4 devises supportées', description: 'HTG · USD · CAD · DOP. Ajout de nouvelles devises sur demande.' },
          { icon: <TrendingUp size={18} />, title: 'Taux du jour', description: 'Saisie matinale, mise à jour en cours de journée si nécessaire.' },
          { icon: <ArrowLeftRight size={18} />, title: 'Achat & vente', description: 'Deux taux séparés par devise, marge automatiquement calculée.' },
          { icon: <Receipt size={18} />, title: 'Ticket client', description: 'Impression thermique ou PDF avec logo et signature électronique.' },
          { icon: <Printer size={18} />, title: 'Reçu double', description: 'Un pour le client, un pour la coopérative — archivage automatique.' },
          { icon: <BarChart3 size={18} />, title: 'Reporting des marges', description: 'Volumes journaliers, marges consolidées, comparatifs inter-agences.' },
        ]}
      />
    </PageShell>
  )
}
