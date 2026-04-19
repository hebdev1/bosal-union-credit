import { Network, Building2, Users, BarChart3, Shield, GitMerge } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/agences'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Une coopérative, plusieurs agences — une seule plateforme">
        <p>
          Que vous gériez deux succursales ou vingt, Mache Kay BOSAL consolide les opérations,
          les membres et les finances sans sacrifier l’autonomie de chaque agence.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <Building2 size={18} />, title: 'Agences illimitées', description: 'Créez, renommez, désactivez vos points de service en toute autonomie.' },
          { icon: <Users size={18} />, title: 'Permissions par agence', description: 'Les agents d’une succursale ne voient que leur périmètre.' },
          { icon: <GitMerge size={18} />, title: 'Consolidation auto', description: 'Rapports financiers groupe + détails par agence, en un clic.' },
          { icon: <Network size={18} />, title: 'Transferts inter-agences', description: 'Déplacement de membres, comptes et fonds entre succursales.' },
          { icon: <BarChart3 size={18} />, title: 'Tableau de bord siège', description: 'Direction voit tout : chiffres, alertes, performance comparée.' },
          { icon: <Shield size={18} />, title: 'Audit centralisé', description: 'Piste d’audit globale pour contrôles internes et BRH.' },
        ]}
      />
    </PageShell>
  )
}
