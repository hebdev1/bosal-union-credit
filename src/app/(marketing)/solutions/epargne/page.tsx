import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowDownUp,
  CircleDashed,
  CopyCheck,
  FileText,
  History,
  PiggyBank,
  ReceiptText,
  Tags,
  UserX,
} from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/epargne'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// Savings as the application handles them today. No interest is accrued
// and account types are labels only, so neither is presented otherwise.
const FEATURES = [
  {
    icon: <PiggyBank size={18} />,
    title: 'Comptes en gourdes ou en dollars',
    description:
      'Chaque compte est ouvert en HTG ou en USD, avec le numéro que vous lui attribuez et, si besoin, un dépôt d’ouverture.',
  },
  {
    icon: <Tags size={18} />,
    title: '11 types de compte',
    description:
      'Épargne, dépôt à terme, compte jeune, compte courant… Le type sert à classer le compte ; il ne modifie pas son fonctionnement.',
  },
  {
    icon: <ArrowDownUp size={18} />,
    title: 'Dépôts et retraits au guichet',
    description:
      'Depuis la fiche du compte : l’opération n’est acceptée que sur un compte actif, et le solde est vérifié avant chaque retrait.',
  },
  {
    icon: <ReceiptText size={18} />,
    title: 'Reçu PDF 80 mm',
    description:
      'Référence, membre, compte, montant, solde avant et après, motif, agent et case de signature du membre. Réimprimable depuis la fiche du compte ; sur un reçu réimprimé, les deux soldes indiqués sont le solde actuel du compte.',
  },
  {
    icon: <FileText size={18} />,
    title: 'Relevé de compte',
    description: 'Relevé PDF au format A4 reprenant les dernières opérations du compte.',
  },
  {
    icon: <History size={18} />,
    title: 'Reprise des registres papier',
    description:
      'Le mode « historique » enregistre les opérations passées à leur date d’origine, marquées pour rester distinctes de celles du jour.',
  },
  {
    icon: <CopyCheck size={18} />,
    title: 'Pas de double enregistrement',
    description:
      'Un double clic ou une connexion coupée n’enregistre pas deux fois le même dépôt ou le même retrait.',
  },
  {
    icon: <UserX size={18} />,
    title: 'Membres inactifs',
    description:
      'Une règle quotidienne suspend les membres sans activité depuis le nombre de jours que vous fixez.',
  },
]

const NOT_YET = [
  'Calcul et versement des intérêts',
  'Parts sociales et dividendes',
  'Notifications SMS ou e-mail des opérations',
  'Accès en ligne des membres à leurs comptes',
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="L’épargne de vos membres, tenue au guichet">
        <p>
          CoopFinance tient les comptes de vos membres et enregistre chaque dépôt
          et chaque retrait, avec un reçu à la clé. Le solde du compte et le
          montant du coffre sont recalculés par la base de données après chaque
          dépôt ou retrait.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="cf-savings-title">
        <h2 id="cf-savings-title">Ce que vous pouvez faire aujourd’hui</h2>
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
