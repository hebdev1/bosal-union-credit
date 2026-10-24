import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/docs'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// No product documentation exists yet: point to the pages that do answer.
const NEXT_STEPS = [
  {
    href: '/aide',
    label: 'Ressources',
    title: 'Centre d’aide',
    text: 'Questions fréquentes sur le guichet, le change, les rôles et les données.',
  },
  {
    href: '/fonctionnalites',
    label: 'Produit',
    title: 'Fonctionnalités',
    text: 'Ce que l’application fait aujourd’hui, module par module.',
  },
  {
    href: '/contact',
    label: 'Entreprise',
    title: 'Contact',
    text: 'Une question précise ? Écrivez-nous via le formulaire de contact.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Documentation en préparation">
        <p>
          La documentation détaillée sera publiée prochainement. Les guides pas à pas destinés
          aux caissiers, aux gérants et aux administrateurs ne sont pas encore disponibles.
        </p>
        <p>
          En attendant, le centre d’aide répond aux questions les plus courantes, à partir de
          l’application telle qu’elle fonctionne aujourd’hui.
        </p>
      </Section>

      <section className="cf-block" aria-labelledby="docs-next-title">
        <h2 id="docs-next-title">Trouver une réponse dès maintenant</h2>
        <div className="cf-related-grid">
          {NEXT_STEPS.map(item => (
            <Link key={item.href} href={item.href} className="cf-related-card">
              <small>{item.label}</small>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
              <em>
                Ouvrir la page <ArrowRight size={12} aria-hidden="true" />
              </em>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
