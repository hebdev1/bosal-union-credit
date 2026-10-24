import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function InteriorHero({
  kicker,
  title,
  text,
}: {
  kicker: string
  title: string
  text: string
}) {
  return (
    <section className="interior-hero">
      <div className="public-shell">
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  )
}

export function PublicCallout() {
  return (
    <section className="public-callout">
      <div className="public-shell">
        <div>
          <span>PRÊT À MODERNISER VOTRE INSTITUTION ?</span>
          <h2>Transformez votre gestion financière, dès aujourd’hui.</h2>
          <p>Découvrez CoopFinance lors d’une démonstration avec notre équipe.</p>
        </div>
        <Link href="/contact">
          Planifier une démonstration <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
