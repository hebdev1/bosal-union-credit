import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/cgu'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section>
        <p className="text-[13px] text-white/40">Dernière mise à jour : 15 avril 2026</p>
      </Section>

      <Section title="1. Objet">
        <p>
          Les présentes Conditions Générales d’Utilisation (CGU) encadrent l’utilisation de la
          plateforme Bosal Credit Union par les coopératives d’épargne et de crédit haïtiennes
          ainsi que leurs agents autorisés.
        </p>
      </Section>

      <Section title="2. Accès au service">
        <p>
          L’accès à Bosal Credit Union est réservé aux coopératives disposant d’un compte validé par
          notre équipe. Chaque agent reçoit des identifiants personnels qu’il s’engage à ne pas
          partager.
        </p>
      </Section>

      <Section title="3. Obligations de l’utilisateur">
        <p>
          L’utilisateur s’engage à : saisir des informations exactes, ne pas contourner les
          contrôles de sécurité, signaler sans délai toute compromission de ses identifiants, et
          respecter la réglementation BRH applicable à son activité.
        </p>
      </Section>

      <Section title="4. Propriété intellectuelle">
        <p>
          La plateforme, son code source, ses interfaces et sa marque « Bosal Credit Union » sont
          protégés. Toute reproduction non autorisée est interdite. Les données saisies par la
          coopérative lui appartiennent et sont exportables à tout moment.
        </p>
      </Section>

      <Section title="5. Responsabilité">
        <p>
          Bosal Credit Union met tout en œuvre pour garantir la disponibilité et la sécurité du
          service. Toutefois, notre responsabilité ne saurait être engagée en cas de mauvaise
          utilisation, d’indisponibilité ponctuelle (voir <a href="/statut" style={{ color: '#C41E3A' }} className="underline underline-offset-4">statut</a>)
          ou de force majeure.
        </p>
      </Section>

      <Section title="6. Résiliation">
        <p>
          La coopérative peut résilier à tout moment sans préavis. Ses données sont exportées et
          conservées pendant 90 jours après la résiliation, puis supprimées.
        </p>
      </Section>

      <Section title="7. Droit applicable">
        <p>
          Les présentes CGU sont régies par le droit haïtien. Tout litige relève de la compétence
          des tribunaux de Port-au-Prince.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Pour toute question, contactez-nous via <a href="/contact" style={{ color: '#C41E3A' }} className="underline underline-offset-4">le formulaire</a> ou
          à l’adresse legal@bosal-credit-union.ht.
        </p>
      </Section>
    </PageShell>
  )
}
