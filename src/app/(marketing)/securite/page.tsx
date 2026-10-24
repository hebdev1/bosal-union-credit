import type { Metadata } from 'next'
import { Building2, FileCheck2, LockKeyhole, ReceiptText, ShieldCheck, UserX } from 'lucide-react'
import { InteriorHero, PublicCallout } from '@/components/marketing/coopfinance/Sections'

export const metadata: Metadata = {
  title: 'Sécurité',
  description:
    'Isolation des données par coopérative, rôles, journal d’audit, chiffrement et sauvegardes quotidiennes.',
}

// Each item describes a control that is in place in the application.
const CONTROLS = [
  {
    icon: LockKeyhole,
    title: 'Contrôles d’accès',
    text: 'Administrateur, gérant, caissier : chaque rôle n’a accès qu’aux actions qui lui reviennent, vérifiées jusque dans la base de données.',
  },
  {
    icon: Building2,
    title: 'Séparation des institutions',
    text: 'Les données de chaque coopérative restent strictement isolées : un agent ne voit jamais celles d’une autre institution.',
  },
  {
    icon: FileCheck2,
    title: 'Traçabilité',
    text: 'Les actions sensibles sont enregistrées dans un journal d’audit, avec leur auteur et leur horodatage.',
  },
  {
    icon: ShieldCheck,
    title: 'Protection des données',
    text: 'Connexions chiffrées, données chiffrées au repos et sauvegardes quotidiennes de la base.',
  },
  {
    icon: ReceiptText,
    title: 'Opérations fiables',
    text: 'Protection contre la double saisie, soldes des comptes recalculés par la base à chaque opération et référence imprimée sur chaque reçu.',
  },
  {
    icon: UserX,
    title: 'Accès révocables',
    text: 'Un agent suspendu perd immédiatement l’accès aux données de la coopérative.',
  },
]

export default function SecurityPage() {
  return (
    <>
      <InteriorHero
        kicker="SÉCURITÉ & CONFIANCE"
        title="Vos données financières exigent le plus haut niveau d’attention."
        text="CoopFinance intègre la sécurité, la séparation des données et la traçabilité au cœur de chaque opération."
      />
      <section className="public-section security-section">
        <div className="public-shell security-grid">
          {CONTROLS.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={24} aria-hidden="true" />
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="public-shell compliance-panel">
          <div>
            <span>APPROCHE RESPONSABLE</span>
            <h2>La conformité est un processus, pas une promesse automatique.</h2>
          </div>
          <p>
            CoopFinance fournit les outils : rôles et exports CSV et PDF de vos
            opérations ; les actions sensibles sont en outre enregistrées dans un
            journal d’audit. Chaque institution reste responsable de l’adaptation
            à sa juridiction et à ses obligations réglementaires.
          </p>
        </div>
      </section>
      <PublicCallout />
    </>
  )
}
