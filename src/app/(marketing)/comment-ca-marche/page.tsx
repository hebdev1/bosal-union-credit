import { PageShell, Section, Steps } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/comment-ca-marche'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="De l’inscription au premier décaissement">
        <p>
          En moins d’une semaine, votre coopérative peut être pleinement opérationnelle sur
          Mache Kay BOSAL — sans interruption de service, sans migration complexe.
        </p>
      </Section>

      <Steps
        items={[
          { title: 'Création du compte coopérative', description: 'Inscription en ligne, validation de l’identité BRH, paramétrage du siège et des agences.' },
          { title: 'Import des membres existants', description: 'Template CSV fourni, import assisté, rapprochement automatique des doublons.' },
          { title: 'Formation des agents', description: 'Sessions vidéo ou en présentiel à Port-au-Prince — 2h par rôle (caisse, prêts, direction).' },
          { title: 'Ouverture de caisse & première opération', description: 'Dépôt, prêt, change : vos équipes sont autonomes dès le premier jour de production.' },
        ]}
      />

      <Section title="Un accompagnement humain, pas juste un logiciel">
        <p>
          Notre équipe à Port-au-Prince suit chaque coopérative de près : point hebdomadaire
          le premier mois, support téléphonique prioritaire, et retours produits intégrés dans
          le <a href="/changelog" style={{ color: '#C41E3A' }} className="underline underline-offset-4">changelog</a>.
        </p>
      </Section>
    </PageShell>
  )
}
