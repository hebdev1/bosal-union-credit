import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/changelog'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

type Kind = 'new' | 'improved' | 'fixed'

const KIND: Record<Kind, { label: string; className: string }> = {
  new:      { label: 'Nouveau',      className: 'cf-tag' },
  improved: { label: 'Amélioration', className: 'cf-tag cf-tag-green' },
  fixed:    { label: 'Correctif',    className: 'cf-tag cf-tag-amber' },
}

interface Month {
  id: string        // yyyy-mm, used for <time dateTime>
  label: string
  summary: string
  intro?: string
  items: { kind: Kind; text: string }[]
}

// Built from the real development history (git log), from the first commit
// (12 April 2026) to today. No version numbers: none were ever published.
// Features that were added and later removed are left out.
const MONTHS: Month[] = [
  {
    id: '2026-10',
    label: 'Octobre 2026',
    summary: 'Sécurité et fiabilité',
    intro:
      'À la suite d’un audit interne de la sécurité et de l’intégrité financière de l’application (15 octobre), les correctifs ont été mis en production le 20 octobre.',
    items: [
      { kind: 'improved', text: 'Contrôles d’accès renforcés dans la base de données : les droits de chaque rôle (administrateur, gérant, caissier) et la séparation entre coopératives sont vérifiés par la base elle-même.' },
      { kind: 'improved', text: 'Un agent suspendu perd immédiatement l’accès aux données. Un compte sans accès agent est dirigé vers une page « Accès refusé ».' },
      { kind: 'fixed', text: 'Protection contre la double saisie : un double clic sur un dépôt ou un retrait n’enregistre plus deux opérations.' },
      { kind: 'fixed', text: 'Bureau de change : les devises et le taux sont repris du taux choisi, ce qui corrige l’erreur qui empêchait d’enregistrer certaines opérations.' },
      { kind: 'fixed', text: 'Réinitialisation du mot de passe : le lien reçu par e-mail ouvre désormais une page pour choisir un nouveau mot de passe.' },
      { kind: 'fixed', text: 'Caisse : le montant du coffre est recalculé par la base de données après chaque dépôt ou retrait.' },
      { kind: 'fixed', text: 'Prêts : un prêt entièrement remboursé passe au statut « Complété », les versements ne sont acceptés que sur un prêt actif et l’échéancier correspond aux montants enregistrés.' },
      { kind: 'fixed', text: 'Le journal d’audit des actions sensibles et les alertes de fraude détectées par l’application sont désormais correctement enregistrés.' },
      { kind: 'improved', text: 'Mise à jour de sécurité des composants logiciels de l’application, dont Next.js.' },
    ],
  },
  {
    id: '2026-06',
    label: 'Juin 2026',
    summary: 'Recherche et justesse des soldes',
    items: [
      { kind: 'new', text: 'Recherche instantanée dans les listes de membres et de comptes.' },
      { kind: 'improved', text: 'Le dépôt d’ouverture d’un compte est enregistré comme une véritable opération de dépôt.' },
      { kind: 'fixed', text: 'Le solde d’un compte est toujours ajusté par l’addition ou la soustraction de chaque opération, jamais remplacé.' },
    ],
  },
  {
    id: '2026-05',
    label: 'Mai 2026',
    summary: 'Reprise de l’historique et documents PDF',
    items: [
      { kind: 'new', text: 'Saisie historique : enregistrement d’opérations passées avec leur date réelle, pour reprendre les registres papier.' },
      { kind: 'improved', text: 'Le solde d’un compte est calculé par la base de données à partir de ses opérations.' },
      { kind: 'improved', text: 'Mise en page unifiée des documents PDF (listes et relevés).' },
      { kind: 'fixed', text: 'Reçus : les paramètres choisis sont bien appliqués et le texte reste lisible à l’impression.' },
    ],
  },
  {
    id: '2026-04',
    label: 'Avril 2026',
    summary: 'Première version de l’application',
    intro: 'Premier enregistrement du code de l’application le 12 avril 2026 ; sa base de données avait été préparée en mars 2026.',
    items: [
      { kind: 'new', text: 'Première version de l’application pour les agents : tableau de bord, membres, comptes, transactions, prêts, bureau de change, caisse et paramètres.' },
      { kind: 'new', text: 'Paramètres de la coopérative : nom, adresse, téléphone, logo, couleurs et statut des agents.' },
      { kind: 'new', text: 'Bureau de change : création des taux, historique des opérations et ticket PDF pour chaque opération.' },
      { kind: 'new', text: 'Page de chaque compte avec ses opérations, relevé de compte en PDF, modification des informations du membre et fermeture de compte.' },
      { kind: 'new', text: 'Prêts : création, échéancier de remboursement, saisie des versements par échéance et page profil de l’emprunteur. Un statut final ne peut plus être modifié.' },
      { kind: 'new', text: 'Statut des membres modifiable et suspension automatique des membres inactifs après une durée réglable.' },
      { kind: 'new', text: 'Onze types de compte au choix.' },
      { kind: 'new', text: 'Dépôts et retraits au guichet, avec un reçu PDF de 80 mm généré à chaque opération.' },
      { kind: 'new', text: 'Exports CSV des transactions, des prêts et des opérations de change, et exports PDF des listes.' },
      { kind: 'new', text: 'Graphiques du tableau de bord avec filtres par période, et première version des alertes de fraude (consultation).' },
      { kind: 'improved', text: 'Personnalisation des documents PDF depuis les paramètres (logo, couleurs, certains textes).' },
      { kind: 'fixed', text: 'Montants des PDF correctement formatés ; le bureau de change affiche chaque montant dans sa devise.' },
    ],
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Ce qui a réellement changé">
        <p>
          Cette page retrace, mois par mois, les changements apportés à l’application depuis le
          premier enregistrement de son code. Elle est établie à partir de l’historique du code : pas de
          numéros de version, seulement des dates réelles.
        </p>
        <p>
          Chaque changement porte une étiquette : <span className={KIND.new.className}>{KIND.new.label}</span>{' '}
          <span className={KIND.improved.className}>{KIND.improved.label}</span>{' '}
          <span className={KIND.fixed.className}>{KIND.fixed.label}</span>. Pour savoir ce que
          l’application fait aujourd’hui, consultez la page{' '}
          <Link href="/fonctionnalites">Fonctionnalités</Link>.
        </p>
      </Section>

      <div className="cf-block flex flex-col gap-4">
        {MONTHS.slice(0, 1).map(month => <MonthCard key={month.id} month={month} />)}

        <section className="cf-card-muted" aria-labelledby="changelog-2026-07-09">
          <h2
            id="changelog-2026-07-09"
            className="text-[20px] font-semibold leading-tight tracking-[-0.4px] text-[#0b1736]"
          >
            Juillet à septembre 2026
          </h2>
          <p className="mt-2 text-[14px] leading-[1.7] text-[#56657a]">
            Aucune modification de l’application pendant cette période.
          </p>
        </section>

        {MONTHS.slice(1).map(month => <MonthCard key={month.id} month={month} />)}
      </div>
    </PageShell>
  )
}

function MonthCard({ month }: { month: Month }) {
  const headingId = `changelog-${month.id}`
  return (
    <section className="cf-card" aria-labelledby={headingId}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id={headingId}
          className="text-[20px] font-semibold leading-tight tracking-[-0.4px] text-[#0b1736]"
        >
          <time dateTime={month.id}>{month.label}</time>
        </h2>
        <p className="text-[13px] font-medium text-[#56657a]">{month.summary}</p>
      </header>
      {month.intro && (
        <p className="mt-3 text-[14px] leading-[1.7] text-[#56657a]">{month.intro}</p>
      )}
      <ul className="mt-4 flex flex-col gap-3 border-t border-[#e5eaf1] pt-4">
        {month.items.map(item => (
          <li key={item.text} className="flex flex-col items-start gap-1.5 sm:flex-row sm:gap-3">
            <span className={`${KIND[item.kind].className} min-w-[104px] shrink-0 justify-center sm:mt-0.5`}>
              {KIND[item.kind].label}
            </span>
            <span className="text-[14px] leading-[1.65] text-[#56657a]">{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
