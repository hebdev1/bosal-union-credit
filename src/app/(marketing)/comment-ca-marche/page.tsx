import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell, Section, Steps } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/comment-ca-marche'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// The onboarding as it happens today: no self-serve sign-up, no file import.
// The cooperative and its agents are set up by the CoopFinance team.
const STEPS = [
  {
    title: 'Demande de démonstration',
    description:
      'Vous nous présentez votre coopérative via le formulaire de contact. Nous vous répondons pour organiser une démonstration de l’application telle qu’elle est aujourd’hui.',
  },
  {
    title: 'Mise en place de votre coopérative',
    description:
      'Notre équipe crée l’espace de votre coopérative, ses paramètres et les accès de vos agents, chacun avec son rôle : administrateur, gérant ou caissier. Votre administrateur peut ensuite indiquer le nom, l’adresse et le téléphone de la coopérative et ajouter son logo ; le nom et le logo figurent sur les reçus.',
  },
  {
    title: 'Saisie des membres et des comptes',
    description:
      'Vos agents créent les fiches membres et ouvrent les comptes directement dans l’application : il n’y a pas d’import de fichier. Les opérations passées de vos registres papier peuvent être reportées en mode « historique », à leur date d’origine.',
  },
  {
    title: 'Opérations au quotidien',
    description:
      'Vos caissiers enregistrent les dépôts et les retraits et remettent un reçu PDF au membre. Le bureau de change, le registre des prêts, le tableau de bord et les rapports d’activité sont disponibles dès le départ.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Une mise en place faite avec vous">
        <p>
          CoopFinance n’a pas d’inscription en libre-service : un compte créé depuis
          la page de connexion ne donne accès à aucune donnée tant que notre équipe ne
          l’a pas rattaché à une coopérative. Chaque coopérative est mise en place par
          notre équipe, avec vous ; tout commence par une demande via le <Link href="/contact">formulaire de contact</Link>.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="cf-steps-title">
        <h2 id="cf-steps-title">Les quatre étapes</h2>
        <Steps items={STEPS} />
      </section>

      <Section title="Bon à savoir avant de démarrer">
        <ul>
          <li>
            CoopFinance s’utilise dans un navigateur web, avec une connexion
            Internet : il n’y a pas de mode hors ligne.
          </li>
          <li>
            Prévoyez un ordinateur : sur un écran de moins de 1024 pixels de
            large (téléphone, tablette), les comptes, les prêts, le coffre, les
            alertes de fraude et les rapports ne sont pas encore accessibles
            depuis le menu.
          </li>
          <li>L’interface est en français.</li>
          <li>
            Seuls vos agents se connectent : vos membres n’ont pas d’accès en
            ligne à leurs comptes.
          </li>
          <li>
            L’application et ses données sont hébergées aux États-Unis : la base
            de données PostgreSQL chez Supabase (AWS, région us-east-1),
            l’application chez Vercel (région iad1).{' '}
            <Link href="/securite">En savoir plus sur la sécurité</Link>.
          </li>
        </ul>
        <p>
          Pour le détail de ce que fait l’application, consultez la page{' '}
          <Link href="/fonctionnalites">Fonctionnalités</Link>.
        </p>
      </Section>
    </PageShell>
  )
}
