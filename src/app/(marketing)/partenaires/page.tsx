import type { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase, Code2, Users } from 'lucide-react'
import { PageShell, Section, FeatureGrid, Steps } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/partenaires'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// No integration and no formal partner programme exist today: this page only
// invites organisations that work with cooperatives to get in touch.
const AUDIENCES = [
  {
    icon: <Users size={18} />,
    title: 'Réseaux et fédérations',
    description:
      'Vous accompagnez plusieurs coopératives ? Présentez-nous leurs besoins : nous verrons ensemble si CoopFinance peut y répondre.',
  },
  {
    icon: <Briefcase size={18} />,
    title: 'Cabinets comptables',
    description:
      'Les transactions, les prêts et les opérations de change s’exportent aujourd’hui en CSV, et une partie des listes en PDF. CoopFinance ne tient ni plan comptable ni grand livre : dites-nous quels formats vous seraient utiles.',
  },
  {
    icon: <Code2 size={18} />,
    title: 'Intégrateurs techniques',
    description:
      'CoopFinance ne propose pas d’API publique ni de webhooks. Si vous avez un projet d’intégration, parlons-en.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Travaillons avec ceux qui accompagnent les coopératives">
        <p>
          CoopFinance s’adresse aux coopératives et caisses populaires haïtiennes. Nous
          souhaitons échanger avec les organisations qui les accompagnent au quotidien :
          réseaux et fédérations de coopératives, cabinets comptables et intégrateurs
          techniques.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="partenaires-profils">
        <h2 id="partenaires-profils">À qui s’adresse cette page</h2>
        <FeatureGrid items={AUDIENCES} />
      </section>

      <section className="cf-block" aria-labelledby="partenaires-transparence">
        <h2 id="partenaires-transparence">Pour être clairs</h2>
        <div className="cf-card-muted cf-prose">
          <p>À ce jour, CoopFinance n’a :</p>
          <ul>
            <li>
              aucune intégration avec un service tiers (paiement mobile, envoi de SMS,
              logiciel comptable, déclarations réglementaires) ;
            </li>
            <li>pas d’API publique ;</li>
            <li>pas de programme partenaire formalisé : ni commission, ni remise, ni certification.</li>
          </ul>
          <p>Nous préférons le dire ici plutôt que de vous le laisser découvrir plus tard.</p>
        </div>
      </section>

      <section className="cf-block" aria-labelledby="partenaires-contact">
        <h2 id="partenaires-contact">Prendre contact</h2>
        <Steps
          items={[
            {
              title: 'Présentez votre organisation',
              description:
                'Utilisez le formulaire de la page contact : qui vous êtes, les coopératives que vous accompagnez, ce que vous cherchez.',
            },
            {
              title: 'Échangeons sur votre projet',
              description:
                'Nous revenons vers vous pour comprendre vos besoins et vous dire ce qui est possible avec l’application telle qu’elle est.',
            },
            {
              title: 'Voyez l’application',
              description:
                'Si c’est pertinent, nous vous présentons CoopFinance lors d’une démonstration.',
            },
          ]}
        />
        <div className="cf-prose mt-5">
          <p>
            <Link href="/contact">Écrire à l’équipe CoopFinance</Link>
          </p>
        </div>
      </section>
    </PageShell>
  )
}
