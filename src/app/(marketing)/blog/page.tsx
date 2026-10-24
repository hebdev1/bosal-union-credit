import type { Metadata } from 'next'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { PageShell } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/blog'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

// No article has been published yet: this page stays an honest notice
// (no placeholder posts) until the first real article exists.
export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <section className="cf-block" aria-labelledby="blog-empty-title">
        <div className="cf-card-muted">
          <div className="flex flex-col items-center px-2 py-8 text-center sm:px-8">
            <span className="cf-feature-item-icon" aria-hidden="true">
              <Newspaper size={20} />
            </span>
            <h2
              id="blog-empty-title"
              className="text-[24px] font-semibold leading-tight tracking-[-0.6px] text-[#0b1736]"
            >
              Aucun article publié pour le moment
            </h2>
            <div className="cf-prose mt-4 max-w-[560px]">
              <p>
                Le blog de CoopFinance n’a encore publié aucun article. Plutôt que d’afficher
                des contenus d’exemple, cette page restera vide jusqu’à la première publication.
              </p>
              <p>
                En attendant, découvrez <Link href="/fonctionnalites">ce que fait l’application</Link>,
                suivez <Link href="/changelog">l’historique des mises à jour</Link> ou{' '}
                <Link href="/contact">écrivez-nous</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
