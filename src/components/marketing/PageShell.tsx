import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getPage, getRelatedPages } from '@/lib/marketing-pages'
import { InteriorHero, PublicCallout } from '@/components/marketing/coopfinance/Sections'

interface PageShellProps {
  slug: string
  children: React.ReactNode
}

/**
 * Shell of the secondary public pages (features, solutions, resources,
 * legal). Same visual language as the CoopFinance design: interior hero,
 * a readable content column, related pages and the shared call-out.
 */
export function PageShell({ slug, children }: PageShellProps) {
  const page = getPage(slug)
  const related = getRelatedPages(slug, 3)

  if (!page) {
    return <div className="public-shell cf-page-content">Page introuvable</div>
  }

  return (
    <>
      <InteriorHero kicker={page.eyebrow.toUpperCase()} title={page.title} text={page.description} />

      <section className="public-section cf-page-section">
        <div className="public-shell cf-page-content">{children}</div>
      </section>

      {related.length > 0 && (
        <section className="cf-related" aria-labelledby="cf-related-title">
          <div className="public-shell">
            <div className="cf-related-head">
              <h2 id="cf-related-title">Continuer l’exploration</h2>
              <Link href="/">
                Retour à l’accueil <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="cf-related-grid">
              {related.map(p => (
                <Link key={p.slug} href={p.slug} className="cf-related-card">
                  <small>{p.section}</small>
                  <strong>{p.title}</strong>
                  <span>{p.description}</span>
                  <em>
                    En savoir plus <ArrowRight size={12} aria-hidden="true" />
                  </em>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PublicCallout />
    </>
  )
}

/* ─── Reusable content primitives ────────────────────────────── */

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="cf-block">
      {title && <h2>{title}</h2>}
      <div className="cf-prose">{children}</div>
    </section>
  )
}

export function FeatureGrid({
  items,
}: {
  items: { title: string; description: string; icon?: React.ReactNode }[]
}) {
  return (
    <div className="cf-feature-list">
      {items.map((item, i) => (
        <div key={i} className="cf-feature-item">
          {item.icon && <span className="cf-feature-item-icon" aria-hidden="true">{item.icon}</span>}
          <strong>{item.title}</strong>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  )
}

export function Steps({ items }: { items: { title: string; description: string }[] }) {
  return (
    <ol className="cf-steps">
      {items.map((item, i) => (
        <li key={i}>
          <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
