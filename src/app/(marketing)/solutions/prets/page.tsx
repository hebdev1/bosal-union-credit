import { ClipboardCheck, CalendarClock, Gavel, Calculator, BellRing, TrendingDown } from 'lucide-react'
import { PageShell, Section, FeatureGrid, Steps } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/prets'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Le cycle de prêt, de bout en bout">
        <p>
          Chaque prêt, de la demande à la dernière échéance, suivi dans une seule interface.
          Fini les tableurs Excel et les fichiers papier qui se perdent.
        </p>
      </Section>

      <Steps
        items={[
          { title: 'Demande du membre', description: 'Capture des informations, justificatifs uploadés, garanties renseignées.' },
          { title: 'Comité de crédit', description: 'Workflow d’approbation multi-niveaux avec commentaires et pièces jointes.' },
          { title: 'Décaissement', description: 'Crédit automatique du compte membre, génération du contrat PDF.' },
          { title: 'Recouvrement & relances', description: 'Échéancier automatique, alertes de retard, génération des rappels SMS.' },
        ]}
      />

      <FeatureGrid
        items={[
          { icon: <Calculator size={18} />, title: 'Simulateur intégré', description: 'Taux flat ou dégressif, mensualités calculées en temps réel.' },
          { icon: <ClipboardCheck size={18} />, title: 'Dossier numérique', description: 'Pièces jointes, garanties, commentaires centralisés par prêt.' },
          { icon: <Gavel size={18} />, title: 'Comité de crédit', description: 'Multi-approbateurs, traçabilité complète des décisions.' },
          { icon: <CalendarClock size={18} />, title: 'Échéancier auto', description: 'Génération instantanée avec capital, intérêts, solde restant.' },
          { icon: <BellRing size={18} />, title: 'Rappels SMS', description: '3 jours avant, jour J, et en cas de retard.' },
          { icon: <TrendingDown size={18} />, title: 'Suivi du PAR', description: 'Portefeuille à risque (30, 60, 90 jours) calculé en continu.' },
        ]}
      />
    </PageShell>
  )
}
