import type { Metadata } from 'next'
import { InteriorHero, PublicCallout } from '@/components/marketing/coopfinance/Sections'

export const metadata: Metadata = {
  title: 'À propos',
  description:
    'Notre mission : donner aux coopératives et caisses populaires haïtiennes des outils fiables pour grandir et servir leurs membres.',
}

const VALUES = [
  {
    n: '01',
    title: 'La confiance avant tout',
    text: 'Chaque choix de produit privilégie la sécurité, la traçabilité et la clarté.',
  },
  {
    n: '02',
    title: 'La proximité comme force',
    text: 'La technologie doit renforcer la relation humaine, jamais la remplacer.',
  },
  {
    n: '03',
    title: 'La clarté financière',
    text: 'Des informations compréhensibles permettent des décisions plus justes.',
  },
]

// Product facts only (verifiable in the application), no audience figures.
const FACTS = [
  { value: '3', label: 'rôles : administrateur, gérant, caissier' },
  { value: '4', label: 'devises au bureau de change' },
  { value: '2', label: 'devises de compte : gourde et dollar' },
  { value: '1', label: 'plateforme pour membres, crédits, caisse et rapports' },
]

export default function AboutPage() {
  return (
    <>
      <InteriorHero
        kicker="NOTRE MISSION"
        title="La finance de proximité mérite une technologie d’excellence."
        text="Nous construisons les outils qui permettent aux institutions financières locales de grandir, de mieux décider et de servir durablement leurs communautés."
      />
      <section className="public-section about-values">
        <div className="public-shell">
          <div className="about-intro">
            <div>
              <span className="section-kicker">POURQUOI COOPFINANCE</span>
              <h2>Une plateforme née d’une conviction simple.</h2>
            </div>
            <p>
              Les coopératives et caisses populaires jouent un rôle essentiel
              en Haïti. Pourtant, leurs équipes composent souvent avec des
              cahiers, des tableurs et des outils fragmentés. CoopFinance
              réunit rigueur financière, simplicité opérationnelle et
              expérience moderne.
            </p>
          </div>
          <div className="value-grid">
            {VALUES.map(value => (
              <article key={value.n}>
                <span>{value.n}</span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
          <div className="mission-panel">
            {FACTS.map(fact => (
              <div key={fact.label}>
                <strong>{fact.value}</strong>
                <span>{fact.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <PublicCallout />
    </>
  )
}
