import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, FileCheck2, ShieldCheck, UserCog } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/agences'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// Multi-branch management does not exist in the application: this page says
// so plainly and describes only what is available today.
const TODAY = [
  {
    icon: <Building2 size={18} />,
    title: 'Un espace par coopérative',
    description:
      'Membres, comptes, transactions, prêts et bureau de change de votre coopérative sont réunis dans un même espace.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Données isolées',
    description:
      'L’isolation des données de chaque coopérative est appliquée par la base de données : un agent n’accède qu’aux données de sa propre coopérative.',
  },
  {
    icon: <UserCog size={18} />,
    title: 'Trois rôles',
    description:
      'Administrateur, gérant et caissier : les droits de chaque rôle sont vérifiés par le serveur et par la base de données.',
  },
  {
    icon: <FileCheck2 size={18} />,
    title: 'Journal d’audit',
    description:
      'Les actions sensibles sont enregistrées avec leur auteur et leur horodatage. Ce journal n’est pas encore consultable depuis l’application.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Où en est la gestion multi-agences">
        <p>
          <span className="cf-tag cf-tag-amber">En préparation</span>
        </p>
        <p>
          La gestion de plusieurs agences n’est pas encore disponible dans CoopFinance. Il
          n’est pas possible aujourd’hui de créer des agences, de répartir les agents ou les
          membres entre succursales, de transférer des fonds d’une agence à l’autre, ni de
          produire des rapports consolidés par agence.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="agences-aujourdhui">
        <h2 id="agences-aujourdhui">Ce qui existe aujourd’hui</h2>
        <div className="cf-prose">
          <p>
            <span className="cf-tag cf-tag-green">Disponible aujourd’hui</span>
          </p>
          <p>
            CoopFinance gère une coopérative comme un seul ensemble, sans découpage par
            agence.
          </p>
        </div>
        <FeatureGrid items={TODAY} />
      </section>

      <Section title="Votre coopérative a plusieurs points de service ?">
        <p>
          Parlez-nous de votre organisation : nombre d’agences, façon dont les caisses et les
          rapports sont tenus aujourd’hui. Nous vous dirons franchement ce que CoopFinance
          peut faire pour vous dès maintenant.
        </p>
        <p>
          <Link href="/contact">Présenter votre organisation</Link>
        </p>
      </Section>
    </PageShell>
  )
}
