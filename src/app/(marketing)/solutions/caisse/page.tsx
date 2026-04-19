import { Vault, BookCheck, ArrowLeftRight, AlertTriangle, LockKeyhole, Scale } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/caisse'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Caisse et coffre : contrôle total">
        <p>
          Chaque ouverture de caisse, chaque transfert vers le coffre, chaque clôture
          journalière — tracé, horodaté, réconcilié. La fin des écarts inexpliqués.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <LockKeyhole size={18} />, title: 'Ouverture de caisse', description: 'Fonds initial par devise, contrôle du supérieur hiérarchique.' },
          { icon: <ArrowLeftRight size={18} />, title: 'Transferts coffre', description: 'Mouvements caisse ↔ coffre avec double signature.' },
          { icon: <Vault size={18} />, title: 'Suivi du coffre', description: 'Solde en temps réel par devise, historique complet des entrées/sorties.' },
          { icon: <BookCheck size={18} />, title: 'Clôture journée', description: 'Réconciliation automatique, PV de clôture PDF, verrouillage des opérations.' },
          { icon: <Scale size={18} />, title: 'Contrôle des écarts', description: 'Détection immédiate des différences entre comptabilité et encaisse physique.' },
          { icon: <AlertTriangle size={18} />, title: 'Alerte sur seuils', description: 'Notification si la caisse dépasse un plafond défini (risque & sécurité).' },
        ]}
      />
    </PageShell>
  )
}
