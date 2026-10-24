import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Calculator,
  CalendarClock,
  CircleDashed,
  Download,
  Eye,
  FileSearch,
  ListChecks,
} from 'lucide-react'
import { PageShell, Section, FeatureGrid, Steps } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/prets'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// The loan module is a register: approval only changes the status, and
// repayments are recorded per instalment without moving money.
const STEPS = [
  {
    title: 'Saisie de la demande',
    description:
      'Un agent enregistre le prêt pour un membre et l’un de ses comptes : montant en gourdes, taux annuel, durée en mois et objet. Le prêt est créé « En attente ».',
  },
  {
    title: 'Ajustement si nécessaire',
    description:
      'Tant qu’il est en attente, le prêt peut être ajusté par l’agent qui l’a saisi, un gérant ou un administrateur. La mensualité et l’échéancier sont recalculés.',
  },
  {
    title: 'Décision',
    description:
      'Un administrateur ou un gérant approuve ou rejette le prêt. Les caissiers ne peuvent pas changer le statut d’un prêt.',
  },
  {
    title: 'Suivi des remboursements',
    description:
      'Une fois le prêt approuvé, l’agent enregistre sur la fiche du prêt le montant payé pour chaque échéance. Une échéance soldée est verrouillée, et le prêt passe à « Complété » une fois entièrement remboursé.',
  },
]

const FEATURES = [
  {
    icon: <Calculator size={18} />,
    title: 'Taux fixe (flat)',
    description:
      'Intérêts calculés sur le capital de départ : la mensualité et le total dû sont connus dès la saisie.',
  },
  {
    icon: <CalendarClock size={18} />,
    title: 'Échéancier mensuel',
    description: 'Une ligne par mois, avec la date et le montant de chaque échéance, sur la fiche du prêt.',
  },
  {
    icon: <ListChecks size={18} />,
    title: 'Statuts suivis',
    description:
      'En attente, Actif, Complété, En défaut, Rejeté. Un prêt complété, en défaut ou rejeté ne peut plus changer de statut.',
  },
  {
    icon: <Eye size={18} />,
    title: 'Principe des quatre yeux',
    description:
      'À partir d’un certain montant, la personne qui a saisi un prêt ne peut pas l’approuver elle-même.',
  },
  {
    icon: <Download size={18} />,
    title: 'Exports CSV et PDF',
    description:
      'Listes des prêts et des remboursements filtrables par période. Les prêts s’exportent en CSV ; prêts et remboursements, ensemble, en PDF.',
  },
  {
    icon: <FileSearch size={18} />,
    title: 'Traçabilité',
    description:
      'Création, ajustement, décision et remboursements sont inscrits au journal d’audit, avec leur auteur. Ce journal n’est pas encore consultable depuis l’application.',
  },
]

const NOT_YET = [
  'Décaissement des fonds sur le compte du membre',
  'Remboursements débités d’un compte ou versés au coffre',
  'Taux dégressif et pénalités de retard',
  'Comité de crédit à plusieurs approbateurs',
  'Rappels d’échéance par SMS',
  'Prêts dans une autre devise que la gourde',
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Un registre de prêts clair et traçable">
        <p>
          CoopFinance tient le registre des prêts de votre coopérative : demande,
          décision, échéancier et suivi des remboursements.
        </p>
        <p>
          <strong>À savoir :</strong> le versement des fonds et l’encaissement des
          remboursements se font en dehors du module de prêts. Ils ne
          mouvementent pas encore les comptes des membres ni le coffre.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="cf-loan-steps-title">
        <h2 id="cf-loan-steps-title">Le parcours d’un prêt</h2>
        <Steps items={STEPS} />
      </section>

      <section className="cf-block" aria-labelledby="cf-loan-features-title">
        <h2 id="cf-loan-features-title">Ce que vous pouvez faire aujourd’hui</h2>
        <FeatureGrid items={FEATURES} />
      </section>

      <section className="cf-block" aria-labelledby="cf-not-yet-title">
        <h2 id="cf-not-yet-title">Pas encore disponible</h2>
        <div className="cf-card-muted">
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {NOT_YET.map(item => (
              <li key={item} className="flex items-start gap-2 text-[13px] leading-[1.55] text-[#56657a]">
                <CircleDashed size={15} className="mt-[2px] shrink-0 text-[#6c7b90]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="cf-prose mt-4">
          <p>
            Vue d’ensemble de l’application :{' '}
            <Link href="/fonctionnalites">toutes les fonctionnalités</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  )
}
