import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, LockKeyhole, RefreshCw } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/solutions/caisse'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// Only the vault balance exists in the application today: one figure,
// recomputed by the database after every deposit or withdrawal, read-only
// for agents. It is net deposits in all currencies, not a physical count.
const FEATURES = [
  {
    icon: <RefreshCw size={18} />,
    title: 'Recalcul automatique',
    description:
      'Le solde est recalculé par la base de données après chaque dépôt ou retrait, sans double saisie ni calcul séparé.',
  },
  {
    icon: <LockKeyhole size={18} />,
    title: 'Non modifiable à la main',
    description:
      'Aucun agent ne peut modifier le solde du coffre depuis l’application : seul le calcul de la base de données le met à jour.',
  },
  {
    icon: <Clock size={18} />,
    title: 'Dernière mise à jour visible',
    description:
      'La date du dernier recalcul est affichée avec le solde, pour savoir sur quel chiffre on travaille.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Un solde de coffre que personne ne saisit à la main">
        <p>
          <span className="cf-tag cf-tag-green">Disponible aujourd’hui</span>
        </p>
        <p>
          Dans CoopFinance, le solde du coffre n’est pas un chiffre que l’on recopie en fin
          de journée : la base de données le recalcule après chaque dépôt ou retrait
          enregistré sur les comptes des membres. L’équipe consulte le solde actuel, la date
          de sa dernière mise à jour et sa variation par rapport à un solde de référence.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="caisse-module">
        <h2 id="caisse-module">Ce que fait le module aujourd’hui</h2>
        <FeatureGrid items={FEATURES} />
      </section>

      <section className="cf-block" aria-labelledby="caisse-limites">
        <h2 id="caisse-limites">Ce qui n’est pas encore disponible</h2>
        <div className="cf-card-muted cf-prose">
          <p>
            <span className="cf-tag cf-tag-amber">Pas encore disponible</span>
          </p>
          <p>Le module se limite aujourd’hui au solde du coffre. Il ne propose pas :</p>
          <ul>
            <li>l’ouverture et la clôture de caisse par agent ;</li>
            <li>les transferts entre caisse et coffre ;</li>
            <li>un solde par devise : le coffre est un seul chiffre, toutes devises confondues ;</li>
            <li>l’historique des mouvements du coffre ni le contrôle des écarts ;</li>
            <li>les alertes de seuil.</li>
          </ul>
          <p>
            Le chiffre affiché correspond aux dépôts moins les retraits enregistrés : il ne
            remplace pas le comptage physique de la caisse. Les opérations du bureau de change
            ne le modifient pas.
          </p>
        </div>
      </section>

      <Section title="Ce qui entoure le coffre aujourd’hui">
        <p>
          Les dépôts et retraits au guichet, avec leur reçu de 80 mm et le relevé de compte
          A4, sont présentés sur la{' '}
          <Link href="/solutions/epargne">page consacrée à l’épargne</Link>. Si la gestion
          des caisses est importante pour votre coopérative,{' '}
          <Link href="/contact">parlez-nous de votre organisation</Link>.
        </p>
      </Section>
    </PageShell>
  )
}
