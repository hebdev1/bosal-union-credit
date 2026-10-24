import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeftRight,
  Check,
  CircleDashed,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/fonctionnalites'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// Every line below describes something the application does today
// (verified in src/app/(dashboard) and the database). No roadmap items here.
const MODULES: {
  icon: LucideIcon
  title: string
  summary: string
  items: string[]
  note?: string
}[] = [
  {
    icon: Users,
    title: 'Membres & comptes',
    summary: 'Le registre de vos membres et de leurs comptes, tenu par vos agents.',
    items: [
      'Fiche membre : identité, statut, comptes et prêts.',
      'Comptes ouverts en gourdes (HTG) ou en dollars (USD), avec un dépôt d’ouverture facultatif.',
      '11 types de compte pour les classer : épargne, dépôt à terme, compte jeune…',
      'Fermeture d’un compte réservée aux administrateurs et aux gérants.',
      'Suspension automatique des membres inactifs, après un délai que vous fixez.',
    ],
  },
  {
    icon: ReceiptText,
    title: 'Guichet',
    summary: 'Les dépôts et retraits du quotidien, avec un justificatif pour le membre.',
    items: [
      'Dépôts et retraits depuis la fiche du compte : compte actif exigé, solde vérifié avant chaque retrait.',
      'Reçu PDF au format 80 mm pour chaque dépôt ou retrait, réimprimable depuis la fiche du compte (le reçu réimprimé indique le solde actuel du compte).',
      'Relevé de compte PDF au format A4.',
      'Un dépôt ou un retrait validé deux fois (double clic, connexion coupée) n’est enregistré qu’une fois.',
      'Mode « historique » pour reporter vos registres papier à leur date d’origine.',
    ],
  },
  {
    icon: HandCoins,
    title: 'Prêts',
    summary: 'Le registre des prêts, de la demande au dernier remboursement.',
    items: [
      'Saisie d’une demande pour un membre : montant, taux, durée et objet.',
      'Approbation ou rejet par un administrateur ou un gérant.',
      'Échéancier mensuel calculé à taux fixe (flat).',
      'Enregistrement du paiement de chaque échéance ; le prêt est clôturé une fois soldé.',
      'Liste des prêts exportable en CSV ; prêts et remboursements exportables en PDF.',
    ],
    note: 'Le versement des fonds et l’encaissement des remboursements ne mouvementent pas encore les comptes ni le coffre.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Bureau de change',
    summary: 'Les opérations de change au comptoir, en quatre devises.',
    items: [
      'Gourde, dollar américain, dollar canadien et peso dominicain.',
      'Taux de change par paire de devises, fixés et mis à jour par un administrateur ou un gérant.',
      'Montant à remettre calculé à partir du taux enregistré.',
      'Ticket PDF au format 80 mm pour le client.',
      'Historique des opérations, exportable en CSV et en PDF.',
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'Coffre & suivi d’activité',
    summary: 'Une vue d’ensemble de l’activité de la coopérative.',
    items: [
      'Tableau de bord : membres actifs, soldes, coffre, encours des prêts, dernières opérations et graphiques.',
      'Montant du coffre recalculé par la base de données après chaque dépôt ou retrait.',
      'Rapports d’activité : totaux des dépôts et des retraits, détail des 90 derniers jours filtrable par date.',
      'Journal des transactions exportable en CSV et en PDF.',
    ],
    note: 'Le coffre est un montant unique, toutes devises confondues, affiché en consultation seule : il n’y a pas encore d’ouverture ni de clôture de caisse.',
  },
  {
    icon: ShieldCheck,
    title: 'Contrôle & administration',
    summary: 'Des accès séparés et une trace des actions sensibles.',
    items: [
      'Trois rôles (administrateur, gérant, caissier), vérifiés jusque dans la base de données.',
      'Données de chaque coopérative isolées dans la base de données.',
      'Alertes de fraude en consultation, classées par gravité : opérations répétées, horaires de nuit, montants élevés ou ronds.',
      'Journal d’audit des actions sensibles, avec leur auteur et leur date (pas encore consultable depuis l’application).',
      'Paramètres : nom, adresse, téléphone et logo de la coopérative, couleurs des documents PDF.',
    ],
  },
]

const NOT_YET = [
  'Notifications SMS, WhatsApp ou e-mail',
  'Calcul des intérêts sur l’épargne',
  'Parts sociales',
  'Décaissement de prêt relié aux comptes',
  'Ouverture et clôture de caisse',
  'Gestion de plusieurs agences',
  'Espace en ligne pour les membres',
  'API publique et import de fichiers',
  'Rapports réglementaires (BRH)',
  'Double authentification et mode hors ligne',
]

const HIGHLIGHTS = [
  'Interface en français',
  'Comptes en HTG et en USD',
  'Change HTG · USD · CAD · DOP',
  'Reçus et relevés PDF',
  '3 rôles d’agents',
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Ce que CoopFinance fait aujourd’hui">
        <p>
          CoopFinance est l’outil de travail des agents de votre coopérative :
          administrateurs, gérants et caissiers. Voici, module par module, ce que
          l’application fait aujourd’hui.
        </p>
        {/* Plain spans: the .cf-prose list rules would indent and stagger a <ul>. */}
        <div className="flex flex-wrap gap-2">
          {HIGHLIGHTS.map(item => (
            <span key={item} className="cf-tag">
              {item}
            </span>
          ))}
        </div>
      </Section>

      <section className="cf-block" aria-labelledby="cf-modules-title">
        <h2 id="cf-modules-title">Les modules</h2>
        <div className="grid gap-[14px] md:grid-cols-2">
          {MODULES.map(({ icon: Icon, title, summary, items, note }) => (
            <article key={title} className="cf-card flex flex-col">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#eff6ff] text-[#2563eb]"
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </span>
                <h3 className="text-[16px] font-semibold leading-tight tracking-[-0.2px] text-[#0b1736]">
                  {title}
                </h3>
              </div>
              <p className="mt-3 text-[13px] leading-[1.65] text-[#56657a]">{summary}</p>
              <ul className="mt-4 flex flex-col gap-2.5 border-t border-[#e5eaf1] pt-4">
                {items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-[13px] leading-[1.55] text-[#56657a]">
                    <Check size={15} className="mt-[2px] shrink-0 text-[#10b981]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {note && (
                <p className="mt-4 rounded-[10px] bg-[#f8fafc] px-3 py-2.5 text-[12.5px] leading-[1.55] text-[#56657a]">
                  <strong className="font-semibold text-[#0b1736]">À savoir : </strong>
                  {note}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="cf-block" aria-labelledby="cf-not-yet-title">
        <h2 id="cf-not-yet-title">Pas encore disponible</h2>
        <div className="cf-card-muted">
          <p className="text-[14px] leading-[1.7] text-[#56657a]">
            Pour éviter toute ambiguïté, voici ce que l’application ne fait pas
            aujourd’hui.
          </p>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {NOT_YET.map(item => (
              <li key={item} className="flex items-start gap-2 text-[13px] leading-[1.55] text-[#56657a]">
                <CircleDashed size={15} className="mt-[2px] shrink-0 text-[#6c7b90]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Section title="Voir l’application">
        <p>
          Le plus simple pour juger est de voir l’application en fonctionnement :{' '}
          <Link href="/contact">demandez une démonstration</Link>, ou découvrez{' '}
          <Link href="/comment-ca-marche">comment se passe la mise en place</Link>.
        </p>
      </Section>
    </PageShell>
  )
}
