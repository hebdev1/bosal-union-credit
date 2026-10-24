import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/confidentialite'
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

      <Section title="En bref">
        <ul>
          <li>Les données des membres sont saisies par leur coopérative, qui en reste responsable.</li>
          <li>Les données de l’application sont hébergées aux États-Unis, chez Supabase et Vercel.</li>
          <li>Aucune donnée n’est vendue ni utilisée à des fins publicitaires.</li>
          <li>Le site n’utilise ni cookie publicitaire ni outil de mesure d’audience.</li>
        </ul>
      </Section>

      <Section title="1. Qui est responsable ?">
        <ul>
          <li>
            <strong>Données des membres et de leurs opérations :</strong> elles sont saisies par la
            coopérative, qui est responsable de leur traitement. CoopFinance agit comme
            prestataire : nous les traitons pour le compte de la coopérative, selon ses
            instructions et uniquement pour fournir le service.
          </li>
          <li>
            <strong>Comptes des agents, journaux de sécurité et demandes de contact :</strong>{' '}
            CoopFinance est responsable de ces traitements.
          </li>
        </ul>
      </Section>

      <Section title="2. Données traitées">
        <ul>
          <li>
            <strong>Agents de la coopérative :</strong> nom, adresse e-mail, téléphone (facultatif),
            rôle, statut et coopérative de rattachement. Le mot de passe est conservé sous forme
            hachée par notre service d’authentification (Supabase), jamais en clair.
          </li>
          <li>
            <strong>Membres de la coopérative</strong>, saisis par ses agents : prénom, nom, numéro
            de membre, date de naissance et, si la coopérative les renseigne, téléphone, e-mail,
            adresse et profession ; comptes et soldes ; dépôts, retraits et autres opérations ;
            prêts, échéanciers et versements ; statut du membre ; score de crédit et niveau de
            risque calculés par l’application.
          </li>
          <li>
            <strong>Personnes qui créent un compte en ligne sans être agents :</strong> prénom, nom
            et adresse e-mail ; le mot de passe est conservé sous forme hachée. Un tel compte ne
            donne accès à aucune donnée tant que notre équipe ne l’a pas rattaché à une coopérative.
          </li>
          <li>
            <strong>Clients du bureau de change :</strong> prénom et nom, montants, devises et taux
            de chaque opération.
          </li>
          <li>
            <strong>Journal d’audit :</strong> les actions sensibles (par exemple la création d’un
            membre, un changement de statut ou la fermeture d’un compte), avec leur auteur, leur
            date et leur heure.
          </li>
          <li>
            <strong>Formulaire de contact :</strong> nom, adresse e-mail, institution, type
            d’organisation et nombre approximatif de membres (ces deux derniers sont facultatifs),
            message et date d’envoi.
          </li>
          <li>
            <strong>Données techniques :</strong> nos hébergeurs peuvent enregistrer des journaux
            techniques (adresse IP, date et heure, requête) nécessaires à la sécurité et au
            fonctionnement du service.
          </li>
        </ul>
      </Section>

      <Section title="3. Pourquoi ces données sont utilisées">
        <ul>
          <li>
            permettre aux agents de tenir les registres de la coopérative, d’enregistrer les
            opérations et de produire les reçus, relevés et exports ;
          </li>
          <li>
            sécuriser le service : connexion, contrôle des rôles, séparation des coopératives,
            journal d’audit et alertes de fraude ;
          </li>
          <li>répondre aux demandes envoyées par le formulaire de contact.</li>
        </ul>
        <p>Nous ne vendons aucune donnée et ne les utilisons pas à des fins publicitaires.</p>
      </Section>

      <Section title="4. Traitements automatiques">
        <p>
          À partir des opérations, l’application signale automatiquement certaines situations à
          vérifier : opérations nombreuses en peu de temps, montants élevés ou ronds, opérations
          enregistrées en dehors de certaines heures. Ces alertes ne bloquent aucune opération et n’entraînent aucune décision : elles
          sont seulement consultées par les agents. L’application calcule aussi, pour chaque membre,
          un score de crédit indicatif (de 0 à 1 000, avec un niveau de risque) à partir de ses
          paiements et remboursements, du nombre de ses opérations et de son ancienneté ; il est
          affiché aux agents sur la fiche du membre et ne déclenche aucune décision automatique.
        </p>
        <p>
          La seule règle automatique qui modifie le statut d’un membre est la suspension des membres sans
          activité depuis une durée fixée par la coopérative (30 jours par défaut). La coopérative
          peut modifier cette durée ainsi que le statut d’un membre.
        </p>
      </Section>

      <Section title="5. Hébergement et prestataires">
        <ul>
          <li>
            <strong>Supabase :</strong> base de données (PostgreSQL) et authentification des agents,
            sur l’infrastructure d’Amazon Web Services, région us-east-1 (États-Unis). Supabase
            envoie aussi les e-mails de réinitialisation du mot de passe.
          </li>
          <li>
            <strong>Vercel :</strong> hébergement de l’application et du site public, région iad1
            (États-Unis).
          </li>
          <li>
            <strong>Resend :</strong> lorsque cette option est activée, envoi à notre équipe d’une
            copie par e-mail des demandes reçues par le formulaire de contact.
          </li>
        </ul>
        <p>
          Les données sont donc hébergées aux États-Unis, hors d’Haïti. Elles ne sont communiquées
          à aucun autre tiers, sauf obligation légale.
        </p>
      </Section>

      <Section title="6. Sécurité">
        <p>Les mesures suivantes sont en place aujourd’hui :</p>
        <ul>
          <li>connexions chiffrées (HTTPS) ;</li>
          <li>données chiffrées au repos et sauvegardées chaque jour par notre hébergeur de base de données ;</li>
          <li>séparation des données de chaque coopérative, appliquée par la base de données elle-même ;</li>
          <li>droits de chaque rôle (administrateur, gérant, caissier) vérifiés par le serveur et par la base de données ;</li>
          <li>accès coupé immédiatement pour un agent suspendu ;</li>
          <li>journal d’audit des actions sensibles.</li>
        </ul>
        <p>
          L’authentification à deux facteurs n’est pas encore disponible. Plus de détails sur la
          page <Link href="/securite">Sécurité</Link>.
        </p>
      </Section>

      <Section title="7. Durée de conservation">
        <ul>
          <li>
            <strong>Données de la coopérative</strong> (agents, membres, opérations) : conservées
            tant que la coopérative utilise le service. Aucune suppression automatique n’est
            programmée.
          </li>
          <li>
            <strong>À la fin du service :</strong> la coopérative peut demander une copie de ses
            données, puis leur suppression. Il lui appartient de conserver auparavant les documents
            qu’exigent ses propres obligations légales. Les sauvegardes sont effacées selon le
            cycle de conservation de notre hébergeur.
          </li>
          <li>
            <strong>Demandes de contact :</strong> conservées pour assurer le suivi de nos
            échanges. Vous pouvez demander leur suppression à tout moment.
          </li>
        </ul>
      </Section>

      <Section title="8. Vos droits">
        <p>
          Vous pouvez demander l’accès à vos données, leur rectification ou leur suppression, dans
          les limites prévues par la loi applicable.
        </p>
        <ul>
          <li>
            <strong>Vous êtes membre d’une coopérative :</strong> adressez-vous à votre
            coopérative, qui est responsable de vos données. CoopFinance l’aidera à répondre à
            votre demande.
          </li>
          <li>
            <strong>Vous êtes agent, ou vous avez utilisé le formulaire de contact :</strong>{' '}
            écrivez-nous via le <Link href="/contact">formulaire de contact</Link>.
          </li>
        </ul>
      </Section>

      <Section title="9. Cookies">
        <p>
          Le site public n’utilise ni cookie publicitaire ni outil de mesure d’audience.
          L’application utilise uniquement les cookies nécessaires à la connexion des agents
          (session d’authentification).
        </p>
      </Section>

      <Section title="10. Modifications">
        <p>
          Cette politique peut évoluer. La date de dernière mise à jour figure en haut de cette
          page.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Pour toute question ou demande liée à vos données, utilisez le{' '}
          <Link href="/contact">formulaire de contact</Link>. Merci de ne transmettre aucune
          donnée financière dans votre message.
        </p>
      </Section>
    </PageShell>
  )
}
