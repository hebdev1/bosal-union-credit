import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { InteriorHero } from '@/components/marketing/coopfinance/Sections'

export const metadata: Metadata = {
  title: 'Tarification',
  description:
    'Trois formules dimensionnées selon vos membres et vos besoins. Proposition sur devis après un échange avec votre institution.',
}

// Every plan includes every module of the application (there is no
// per-plan gating in the product); plans differ by the service around it.
const PLANS = [
  {
    name: 'Essentiel',
    description: 'Pour les petites coopératives qui structurent leurs opérations.',
    price: 'Sur devis',
    features: [
      'Tous les modules de l’application',
      'Mise en place de votre coopérative par notre équipe',
      'Accès de vos agents par rôle : administrateur, gérant, caissier',
    ],
  },
  {
    name: 'Croissance',
    description: 'Pour les coopératives qui veulent reprendre leurs registres et former leurs équipes.',
    price: 'Sur devis',
    recommended: true,
    features: [
      'Tout ce qui est inclus dans Essentiel',
      'Aide à la saisie de votre historique',
      'Formation de vos équipes',
    ],
  },
  {
    name: 'Accompagnement',
    description: 'Pour les institutions qui veulent un déploiement sur mesure.',
    price: 'Personnalisé',
    features: [
      'Tout ce qui est inclus dans Croissance',
      'Paramétrage de vos reçus et de votre logo avec vous',
      'Accompagnement au déploiement sur mesure',
    ],
  },
]

export default function PricingPage() {
  return (
    <>
      <InteriorHero
        kicker="TARIFICATION SUR DEVIS"
        title="Une formule adaptée à votre institution."
        text="Chaque déploiement est dimensionné selon vos membres, vos agences et vos besoins. Parlez-nous de votre organisation pour recevoir une proposition claire."
      />
      <section className="public-section pricing-section">
        <div className="public-shell pricing-grid">
          {PLANS.map(plan => (
            <article
              className={plan.recommended ? 'pricing-card popular' : 'pricing-card'}
              key={plan.name}
            >
              {plan.recommended && <span className="popular-label">RECOMMANDÉ</span>}
              <h2>{plan.name}</h2>
              <p>{plan.description}</p>
              <strong>{plan.price}</strong>
              <small>Configuration selon vos besoins</small>
              <Link href="/contact">
                {plan.recommended ? 'Demander une démo' : 'Nous contacter'}{' '}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <ul>
                {plan.features.map(feature => (
                  <li key={feature}>
                    <Check size={14} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="public-shell pricing-note">
          <ShieldCheck size={20} aria-hidden="true" />
          <div>
            <strong>Toutes les formules incluent</strong>
            <span>
              Tous les modules de l’application (membres et comptes, guichet
              avec reçus PDF, registre des prêts, bureau de change, alertes de
              fraude, exports CSV et PDF), hébergement sécurisé, sauvegardes
              quotidiennes et mises à jour.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
