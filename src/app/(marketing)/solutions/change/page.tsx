import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, FileDown, Globe2, History, Receipt, TrendingUp } from 'lucide-react'
import { PageShell, Section, FeatureGrid, Steps } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/change'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// Every statement on this page describes the exchange counter as it works
// in the application today (rates per pair set by admin/manager, amount
// derived by the database from the rate row, 80 mm ticket, 100-row history).
const FEATURES = [
  {
    icon: <Globe2 size={18} />,
    title: 'Quatre devises',
    description:
      'Gourde (HTG), dollar américain (USD), dollar canadien (CAD) et peso dominicain (DOP), dans le sens de conversion de votre choix dès qu’un taux est enregistré pour ce sens.',
  },
  {
    icon: <TrendingUp size={18} />,
    title: 'Des taux fixés par paire de devises',
    description:
      'Un administrateur ou un gérant enregistre le taux de chaque paire et peut le changer à tout moment ; par défaut, le nouveau taux retire l’ancien. Chaque sens a son propre taux, par exemple USD → HTG et HTG → USD.',
  },
  {
    icon: <Calculator size={18} />,
    title: 'Montant calculé par la base',
    description:
      'Le montant remis au client est égal au montant qu’il apporte multiplié par le taux en vigueur. La base de données reprend elle-même le taux : il ne peut pas être modifié depuis le formulaire, et un taux retiré n’est plus accepté.',
  },
  {
    icon: <Receipt size={18} />,
    title: 'Ticket client de 80 mm',
    description:
      'Chaque opération produit un ticket PDF au format 80 mm portant une référence : date et heure, client, devises, taux appliqué, montants et agent, avec le logo de votre coopérative s’il est configuré.',
  },
  {
    icon: <History size={18} />,
    title: 'Historique et réimpression',
    description:
      'Les 100 dernières opérations restent affichées avec l’agent qui les a saisies, et chaque ticket peut être réimprimé. Taux et opérations sont aussi inscrits au journal d’audit.',
  },
  {
    icon: <FileDown size={18} />,
    title: 'Exports CSV et PDF',
    description: 'Les opérations affichées s’exportent en CSV, lisible dans Excel, et en PDF.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Le change au guichet, sans calcul à la main">
        <p>
          <span className="cf-tag cf-tag-green">Disponible aujourd’hui</span>
        </p>
        <p>
          Le bureau de change de CoopFinance enregistre les opérations faites au guichet
          pour des clients de passage. L’agent choisit le taux en vigueur, saisit le montant
          ainsi que le prénom et le nom du client : le montant à remettre est calculé et le
          ticket est prêt à imprimer.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="change-module">
        <h2 id="change-module">Ce que fait le module aujourd’hui</h2>
        <FeatureGrid items={FEATURES} />
      </section>

      <section className="cf-block" aria-labelledby="change-deroulement">
        <h2 id="change-deroulement">Comment se déroule une opération</h2>
        <Steps
          items={[
            {
              title: 'Le taux est fixé',
              description:
                'Un administrateur ou un gérant enregistre le taux de la paire, par exemple USD → HTG, et peut retirer l’ancien taux.',
            },
            {
              title: 'L’agent saisit l’opération',
              description:
                'Il choisit le taux en vigueur, indique le montant apporté par le client ainsi que son prénom et son nom.',
            },
            {
              title: 'Le ticket est remis au client',
              description:
                'Le montant à remettre est calculé, l’opération est enregistrée et le ticket de 80 mm est téléchargé pour impression.',
            },
          ]}
        />
      </section>

      <section className="cf-block" aria-labelledby="change-limites">
        <h2 id="change-limites">Bon à savoir</h2>
        <div className="cf-card-muted cf-prose">
          <p>À ce jour, le bureau de change :</p>
          <ul>
            <li>ne calcule pas de marge entre un taux d’achat et un taux de vente ;</li>
            <li>ne tient pas de stock par devise et ne modifie pas le solde du coffre ;</li>
            <li>n’est pas relié aux comptes des membres ;</li>
            <li>n’enregistre pas la pièce d’identité du client, seulement son prénom et son nom.</li>
          </ul>
          <p>
            Pour voir le module sur un cas concret,{' '}
            <Link href="/contact">demandez une démonstration</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  )
}
