import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell, Section, Steps } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/statut'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// There is no monitoring yet: no uptime figures, no incident history.
const REPORT_STEPS = [
  {
    title: 'Vérifiez votre connexion',
    description:
      'Rechargez la page et, si possible, essayez depuis un autre réseau ou un autre appareil. L’application a besoin d’Internet : il n’y a pas de mode hors ligne.',
  },
  {
    title: 'Notez ce que vous constatez',
    description: 'La page concernée, l’heure, l’opération en cours et le message affiché à l’écran.',
  },
  {
    title: 'Écrivez-nous',
    description:
      'Envoyez ces informations via le formulaire de contact, sans jamais y indiquer de mot de passe ni de données personnelles de membres.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Pas de suivi public de disponibilité">
        <p>
          CoopFinance ne dispose pas encore d’un outil de surveillance publique. Cette page
          n’affiche donc ni taux de disponibilité, ni historique d’incidents : nous préférons ne pas
          publier de chiffres que nous ne mesurons pas.
        </p>
      </Section>

      <section className="cf-block">
        <h2>Signaler un problème</h2>
        <div className="cf-prose">
          <p>Si l’application ne s’ouvre pas, affiche une erreur ou semble bloquée :</p>
        </div>
        <Steps items={REPORT_STEPS} />
        <div className="cf-prose mt-5">
          <p>
            <Link href="/contact">Ouvrir le formulaire de contact</Link>
          </p>
        </div>
      </section>

      <Section title="Si une opération a été interrompue">
        <p>
          Si la connexion coupe pendant l’enregistrement d’un dépôt, d’un retrait ou d’une opération
          de change, consultez l’historique (fiche du compte ou page Bureau de change) avant de
          ressaisir : l’opération a peut-être déjà été enregistrée.
        </p>
        <p>
          Si le formulaire d’un dépôt ou d’un retrait est encore ouvert, vous pouvez le soumettre à
          nouveau sans le modifier : la même opération n’est enregistrée qu’une fois. En revanche, une nouvelle
          saisie crée une nouvelle opération, et les opérations de change n’ont pas cette
          protection.
        </p>
      </Section>

      <Section title="Hébergement">
        <p>
          CoopFinance repose sur deux prestataires, avec un hébergement aux États-Unis : Supabase
          pour la base de données (PostgreSQL sur AWS, région us-east-1) et Vercel pour
          l’application (région iad1). Un incident chez l’un d’eux peut rendre CoopFinance
          indisponible. Chacun publie l’état de son propre service :{' '}
          <a href="https://status.supabase.com">page de statut de Supabase</a> et{' '}
          <a href="https://www.vercel-status.com">page de statut de Vercel</a>.
        </p>
      </Section>
    </PageShell>
  )
}
