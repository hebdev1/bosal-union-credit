import type { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { InteriorHero } from '@/components/marketing/coopfinance/Sections'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Présentez-nous votre institution : notre équipe vous répondra avec une démonstration adaptée.',
}

export default function ContactPage() {
  return (
    <>
      <InteriorHero
        kicker="PARLONS DE VOTRE PROJET"
        title="Voyez comment CoopFinance peut accompagner votre institution."
        text="Notre équipe vous répondra avec une démonstration adaptée à vos opérations, vos équipes et vos objectifs."
      />
      <section className="public-section contact-section">
        <div className="public-shell contact-grid">
          <div className="contact-details">
            <span className="section-kicker">NOUS CONTACTER</span>
            <h2>Construisons une solution à votre mesure.</h2>
            <p>
              Présentez-nous votre institution et vos principaux défis. Nous
              vous répondrons dès que possible.
            </p>
            <div>
              <span>
                <MapPin size={19} aria-hidden="true" />
              </span>
              <p>
                <small>Zone desservie</small>
                <strong>Haïti</strong>
              </p>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  )
}
