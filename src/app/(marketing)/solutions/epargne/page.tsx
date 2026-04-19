import { PiggyBank, Percent, FileText, Calculator, UsersRound, BellRing } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/epargne'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="L’épargne coopérative, simplifiée">
        <p>
          Gérez les comptes épargne de vos membres en quelques clics : ouverture, dépôts,
          retraits, calcul des intérêts selon le barème de votre coopérative, et relevés
          imprimables à tout moment.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <PiggyBank size={18} />, title: 'Comptes épargne multi-types', description: 'Épargne courante, à terme, projet — adaptés aux produits de votre coopérative.' },
          { icon: <Percent size={18} />, title: 'Intérêts calculés automatiquement', description: 'Barème configurable, capitalisation journalière ou mensuelle.' },
          { icon: <UsersRound size={18} />, title: 'Parts sociales suivies', description: 'Tenue automatique des parts sociales avec historique complet par membre.' },
          { icon: <FileText size={18} />, title: 'Relevés PDF', description: 'Export signé numériquement, au format standard des coopératives haïtiennes.' },
          { icon: <Calculator size={18} />, title: 'Simulateur d’intérêts', description: 'Montrez à vos membres, en temps réel, le rendement de leur épargne.' },
          { icon: <BellRing size={18} />, title: 'Notifications SMS', description: 'Confirmation de chaque dépôt, retrait et versement d’intérêts.' },
        ]}
      />
    </PageShell>
  )
}
