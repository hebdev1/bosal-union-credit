import { Users, Banknote, Landmark, TrendingUp, Vault, BarChart3, Shield, Network, Bell, FileSearch } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/fonctionnalites'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Tout ce dont votre coopérative a besoin">
        <p>
          Mache Kay BOSAL regroupe dans une seule plateforme toutes les opérations quotidiennes
          d’une coopérative haïtienne moderne — de l’ouverture d’un compte membre à la clôture
          journalière de la caisse.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <Users size={18} />, title: 'Gestion des membres', description: 'KYC, parts sociales, statut, documents — tout le dossier membre centralisé.' },
          { icon: <Banknote size={18} />, title: 'Comptes multi-devises', description: 'HTG, USD, CAD, DOP. Intérêts automatiques, relevés PDF signés.' },
          { icon: <Landmark size={18} />, title: 'Prêts & recouvrement', description: 'Cycle complet : demande, comité, décaissement, échéancier, relance.' },
          { icon: <TrendingUp size={18} />, title: 'Bureau de change', description: 'Taux quotidiens, tickets clients imprimables, marges consolidées.' },
          { icon: <Vault size={18} />, title: 'Caisse & coffre', description: 'Ouverture, transferts, clôture journée avec contrôle des écarts.' },
          { icon: <BarChart3 size={18} />, title: 'Rapports BRH', description: 'États financiers, exports Excel/PDF, indicateurs prudentiels prêts.' },
          { icon: <Shield size={18} />, title: 'Alertes fraude', description: 'Détection automatique des opérations suspectes et doublons.' },
          { icon: <Network size={18} />, title: 'Multi-agences', description: 'Consolidation financière sur plusieurs succursales sans effort.' },
          { icon: <Bell size={18} />, title: 'Notifications SMS', description: 'Confirmation de dépôt, rappel d’échéance, validation de change.' },
          { icon: <FileSearch size={18} />, title: 'Audit trail complet', description: 'Chaque action tracée, horodatée, exportable en cas de contrôle.' },
        ]}
      />
    </PageShell>
  )
}
