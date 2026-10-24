import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/cgu'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

function DraftNotice() {
  return (
    <div className="cf-block">
      <div className="cf-card-muted cf-prose" role="note">
        <p>
          <strong>Version de travail — à faire valider par un juriste.</strong>
        </p>
        <p>
          Dernière mise à jour : <time dateTime="2026-10-23">23 octobre 2026</time>
        </p>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <DraftNotice />

      <Section title="1. Objet">
        <p>
          Les présentes conditions générales d’utilisation (les « conditions ») encadrent
          l’utilisation de CoopFinance, une application de gestion en ligne destinée aux
          coopératives financières (la « coopérative ») et à leurs agents. Elles s’appliquent
          aussi au site public de CoopFinance et à son formulaire de contact.
        </p>
        <p>
          Dans ce document, « CoopFinance » ou « nous » désigne le prestataire qui fournit
          l’application.
        </p>
      </Section>

      <Section title="2. Le service">
        <p>
          CoopFinance est un outil de travail interne, utilisé par les agents de la coopérative.
          Il permet notamment de :
        </p>
        <ul>
          <li>tenir le registre des membres et de leurs comptes, en gourdes et en dollars américains ;</li>
          <li>
            enregistrer les dépôts et les retraits au guichet avec un reçu PDF, et reprendre
            l’historique des registres papier ;
          </li>
          <li>tenir un registre des prêts, avec échéancier et saisie des versements ;</li>
          <li>
            enregistrer les opérations du bureau de change (gourde, dollar américain, dollar
            canadien et peso dominicain) ;
          </li>
          <li>consulter des alertes de fraude et exporter certaines données en CSV ou en PDF.</li>
        </ul>
        <p>
          La description à jour figure sur la page{' '}
          <Link href="/fonctionnalites">Fonctionnalités</Link>. L’application est disponible en
          français et fonctionne uniquement en ligne : une connexion internet est nécessaire. Les
          membres de la coopérative n’y ont pas accès, et elle ne leur envoie aucun message (SMS,
          WhatsApp ou e-mail).
        </p>
      </Section>

      <Section title="3. Accès et identifiants">
        <p>
          L’application est réservée aux agents d’une coopérative cliente dont l’accès a été
          activé par CoopFinance. Créer un compte en ligne ne donne pas, à lui seul, accès aux
          données d’une coopérative.
        </p>
        <p>
          Chaque agent reçoit un rôle (administrateur, gérant ou caissier) défini à la demande de
          la coopérative. Il se connecte avec son adresse e-mail et un mot de passe personnel,
          qu’il s’engage à garder confidentiel et à ne pas partager. Toute perte ou utilisation non
          autorisée de ses identifiants doit nous être signalée sans délai.
        </p>
        <p>
          L’administrateur de la coopérative peut suspendre un agent : l’agent suspendu perd
          immédiatement l’accès aux données.
        </p>
      </Section>

      <Section title="4. Obligations de la coopérative et de ses agents">
        <p>La coopérative et ses agents s’engagent à :</p>
        <ul>
          <li>saisir des informations exactes et vérifier les opérations enregistrées ;</li>
          <li>informer leurs membres que leurs données sont gérées avec CoopFinance ;</li>
          <li>respecter la réglementation applicable à leur activité ;</li>
          <li>
            ne pas chercher à contourner les contrôles de sécurité ni à accéder aux données d’une
            autre coopérative ;
          </li>
          <li>utiliser l’application uniquement pour la gestion de la coopérative.</li>
        </ul>
      </Section>

      <Section title="5. Données de la coopérative">
        <p>
          Les données saisies dans l’application (membres, comptes, opérations, prêts, opérations
          de change) appartiennent à la coopérative, qui reste responsable de leur exactitude et de
          leur traitement à l’égard de ses membres. CoopFinance les traite pour son compte,
          uniquement pour fournir le service, et ne les vend pas.
        </p>
        <p>
          Certaines données peuvent être exportées directement depuis l’application : les
          transactions, les prêts et les opérations de change au format CSV, les relevés de compte
          au format PDF. La coopérative peut demander une copie des autres données via le{' '}
          <Link href="/contact">formulaire de contact</Link>.
        </p>
        <p>
          Les reçus, relevés et exports produits par l’application sont des outils de gestion : ils
          ne remplacent ni la comptabilité de la coopérative, ni ses déclarations réglementaires.
        </p>
        <p>
          Le traitement des données personnelles est détaillé dans la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="6. Hébergement">
        <p>
          Les données sont hébergées aux États-Unis : la base de données chez Supabase
          (PostgreSQL, sur l’infrastructure d’Amazon Web Services, région us-east-1) et
          l’application chez Vercel (région iad1). Les données de la coopérative sont donc
          conservées hors d’Haïti.
        </p>
      </Section>

      <Section title="7. Disponibilité et sécurité">
        <p>
          Nous appliquons les mesures de sécurité décrites sur la page{' '}
          <Link href="/securite">Sécurité</Link>. Aucune disponibilité minimale n’est garantie à ce
          jour : le service peut être interrompu, notamment pour maintenance, en cas d’incident
          chez un hébergeur ou de coupure de la connexion internet.
        </p>
      </Section>

      <Section title="8. Conditions financières">
        <p>
          Les conditions commerciales (formule, prix, accompagnement) sont convenues avec chaque
          coopérative, sur devis : voir la page <Link href="/tarifs">Tarifs</Link>. Aucun paiement
          n’est effectué en ligne.
        </p>
      </Section>

      <Section title="9. Responsabilité">
        <p>
          CoopFinance n’est pas responsable des erreurs de saisie, des décisions prises par la
          coopérative à partir des données de l’application, des conséquences d’un partage
          d’identifiants, ni des interruptions causées par des tiers (hébergeurs, fournisseurs
          d’accès à internet) ou par un cas de force majeure.
        </p>
      </Section>

      <Section title="10. Propriété intellectuelle">
        <p>
          L’application, son code, ses interfaces et la marque CoopFinance sont protégés. Toute
          reproduction ou réutilisation sans autorisation est interdite. Le logo et les textes que
          la coopérative ajoute à ses reçus restent sa propriété.
        </p>
      </Section>

      <Section title="11. Suspension et fin du service">
        <p>
          La coopérative peut cesser d’utiliser CoopFinance à tout moment en nous prévenant via le
          formulaire de contact. Nous pouvons suspendre un accès en cas d’utilisation contraire aux
          présentes conditions ou de risque pour la sécurité des données.
        </p>
        <p>
          À la fin du service, la coopérative peut demander une copie de ses données, puis leur
          suppression, comme indiqué dans la politique de confidentialité.
        </p>
      </Section>

      <Section title="12. Modification des conditions">
        <p>
          Ces conditions peuvent évoluer. La date de dernière mise à jour figure en haut de cette
          page, et les coopératives clientes sont informées des changements importants.
        </p>
      </Section>

      <Section title="13. Droit applicable">
        <p>Les présentes conditions sont soumises au droit haïtien.</p>
      </Section>

      <Section title="14. Contact">
        <p>
          Pour toute question sur ces conditions, écrivez-nous via le{' '}
          <Link href="/contact">formulaire de contact</Link>.
        </p>
      </Section>
    </PageShell>
  )
}
