import { Heart, Target, Globe2 } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/a-propos'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Renforcer la coopérative haïtienne par la technologie">
        <p>
          Bosal Credit Union est née d’un constat simple : les coopératives haïtiennes portent
          une partie immense de l’économie du pays, mais sont souvent équipées d’outils hérités,
          lents et coûteux. Notre équipe, basée à Port-au-Prince, conçoit un logiciel qui parle
          leur langue, respecte leurs pratiques et amplifie leur impact.
        </p>
        <p>
          Le nom ? <em>Bosal Credit Union</em> — <em>Bosal</em> évoque la force tranquille et la
          solidité qui tiennent la coopérative debout, tandis que <em>Credit Union</em> affirme
          notre mission : unir les membres autour d’un crédit juste, transparent et coopératif.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <Heart size={18} />, title: 'Humain d’abord', description: 'Nous accompagnons chaque coopérative individuellement, sans hotline impersonnelle.' },
          { icon: <Target size={18} />, title: 'Précision financière', description: 'Les chiffres justes, à la gourde près, en temps réel. Aucun à-peu-près.' },
          { icon: <Globe2 size={18} />, title: 'Ancré en Haïti', description: 'Équipe haïtienne, serveurs conformes BRH, interfaces en français et créole.' },
        ]}
      />

      <Section title="L’équipe">
        <p>
          Ingénieurs logiciels, anciens directeurs de coopératives, experts en conformité
          financière et designers — une équipe mixte qui croit que la technologie doit servir
          les humains, pas l’inverse.
        </p>
      </Section>
    </PageShell>
  )
}
