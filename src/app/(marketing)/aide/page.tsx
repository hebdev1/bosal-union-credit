import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/aide'
const p = getPage(SLUG)!
export const metadata: Metadata = { title: p.title, description: p.description }

interface Faq {
  q: string
  a: ReactNode
}

// Every answer describes the application as it works today (checked against
// the code on 23 October 2026). Menu and button names are the app's own.
const GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: 'Opérations au guichet',
    items: [
      {
        q: 'Comment enregistrer un dépôt ou un retrait ?',
        a: (
          <>
            <p>
              Ouvrez la fiche du compte (menu <strong>Comptes</strong>, puis le compte concerné) et
              cliquez sur <strong>Dépôt</strong> ou <strong>Retrait</strong>. Indiquez le montant et,
              si besoin, un motif, puis validez.
            </p>
            <p>
              Le compte doit être actif, et un retrait supérieur au solde est refusé. Le solde est
              recalculé par la base de données dès l’enregistrement. Un double clic sur le même
              formulaire n’enregistre l’opération qu’une seule fois.
            </p>
          </>
        ),
      },
      {
        q: 'Comment imprimer le reçu d’une opération ?',
        a: (
          <>
            <p>
              Après chaque dépôt ou retrait enregistré depuis la fiche du compte, un reçu PDF au
              format ticket de 80 mm est téléchargé automatiquement : il suffit de l’ouvrir et de
              l’imprimer. Il indique la référence de l’opération, le membre, le compte, le montant,
              le solde avant et après, le motif et l’agent, avec une zone pour la signature du
              membre.
            </p>
            <p>
              Pour le réimprimer plus tard, ouvrez la fiche du compte : chaque dépôt ou retrait de
              l’historique a un bouton <strong>Réimprimer le reçu</strong> (icône d’imprimante).
              Sur un reçu réimprimé depuis l’historique, les soldes indiqués sont le solde actuel du
              compte et l’agent est celui qui réimprime.
            </p>
          </>
        ),
      },
      {
        q: 'Comment obtenir un relevé de compte ?',
        a: (
          <p>
            Sur la fiche du compte, le bouton <strong>Relevé PDF</strong> produit un relevé au format
            A4 des opérations affichées. Pour un relevé partiel, filtrez d’abord par type d’opération
            ou recherchez une référence. La fiche affiche les 200 dernières opérations du compte.
          </p>
        ),
      },
      {
        q: 'Comment saisir une opération passée, reprise d’un registre papier ?',
        a: (
          <>
            <p>
              Menu <strong>Transactions</strong>, bouton <strong>Saisir transaction</strong>, puis
              mode <strong>Historique</strong>. Choisissez le membre, le compte, le type (dépôt ou
              retrait), le montant et la date réelle de l’opération, qui ne peut pas être dans le
              futur. Seuls les membres et les comptes actifs sont proposés.
            </p>
            <p>
              L’opération reçoit une référence qui commence par <strong>HIST</strong>, et la date à
              laquelle vous l’avez saisie reste enregistrée à part. Les saisies faites depuis cette
              fenêtre ne contrôlent pas le solde, afin de pouvoir reconstituer des registres
              incomplets : vérifiez vos montants avant de valider. Aucun reçu n’est téléchargé au
              moment de la saisie.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Comptes et membres',
    items: [
      {
        q: 'Comment ouvrir un compte ?',
        a: (
          <>
            <p>
              Le membre doit d’abord être enregistré et actif (menu <strong>Membres</strong>).
              Ensuite, menu{' '}
              <strong>Comptes</strong>, bouton <strong>Nouveau compte</strong> : choisissez le membre,
              saisissez le numéro de compte (par exemple CPT-001), le type de compte, la devise (HTG
              ou USD) et, si besoin, un solde initial, enregistré comme un dépôt d’ouverture.
            </p>
            <p>
              Le type de compte sert d’étiquette : il ne change pas le fonctionnement du compte, et
              aucun intérêt n’est calculé automatiquement.
            </p>
          </>
        ),
      },
      {
        q: 'Comment fermer un compte ?',
        a: (
          <>
            <p>
              La fermeture est réservée à l’administrateur et au gérant : menu{' '}
              <strong>Comptes</strong>, bouton <strong>Fermer</strong> sur la ligne du compte, puis
              confirmation.
            </p>
            <p>
              Sur un compte en gourdes, des frais de fermeture de 200 HTG sont prélevés sous forme de
              retrait, dans la limite du solde disponible. Un compte en dollars est fermé sans frais.
              Une fois fermé, le compte n’accepte plus de dépôt ni de retrait depuis sa fiche.
            </p>
          </>
        ),
      },
      {
        q: 'Pourquoi un membre est-il passé au statut « suspendu » ?',
        a: (
          <>
            <p>
              Chaque jour, CoopFinance suspend automatiquement les membres actifs sans activité
              enregistrée depuis un nombre de jours défini (30 par défaut). L’administrateur ou le
              gérant règle ce seuil dans <strong>Paramètres</strong>, onglet Finance, section
              « Inactivité des membres » (0 désactive la règle), et peut y lancer la vérification
              immédiatement avec le bouton <strong>Exécuter maintenant</strong>.
            </p>
            <p>
              Un membre suspendu n’apparaît plus dans les listes de choix des pages Comptes, Prêts
              et Transactions, et une nouvelle opération ne le réactive pas : l’administrateur ou le
              gérant peut changer son statut depuis la fiche du membre.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Change, prêts et caisse',
    items: [
      {
        q: 'Comment définir les taux de change ?',
        a: (
          <>
            <p>
              C’est réservé à l’administrateur et au gérant : menu <strong>Bureau de change</strong>,
              bouton <strong>Nouveau taux</strong>. Choisissez la devise de départ et la devise
              d’arrivée parmi HTG, USD, CAD et DOP, puis le taux (combien d’unités de la devise
              d’arrivée pour 1 unité de la devise de départ). L’option « Désactiver le taux
              précédent pour cette paire », activée par défaut, remplace le taux en vigueur.
            </p>
            <p>
              Chaque sens de conversion a son propre taux : pour acheter et vendre des dollars,
              enregistrez un taux USD → HTG et un taux HTG → USD.
            </p>
          </>
        ),
      },
      {
        q: 'Comment enregistrer une opération de change ?',
        a: (
          <>
            <p>
              Tout agent peut le faire : menu <strong>Bureau de change</strong>, bouton{' '}
              <strong>Nouvelle opération</strong>. Saisissez le prénom et le nom du client,
              choisissez le taux à appliquer et le montant donné : le montant à remettre est calculé
              à partir du taux.
            </p>
            <p>
              Un ticket PDF de 80 mm est téléchargé automatiquement et peut être réimprimé.
              L’historique affiche les 100 opérations les plus récentes et s’exporte en CSV et en
              PDF. Les opérations de change ne sont liées ni aux comptes des membres, ni au solde de
              la caisse.
            </p>
          </>
        ),
      },
      {
        q: 'Comment fonctionne le suivi des prêts ?',
        a: (
          <>
            <p>
              Le menu <strong>Prêts</strong> tient le registre des prêts : montant, taux, durée,
              échéancier calculé automatiquement à taux fixe (flat), puis saisie des remboursements
              échéance par échéance.
            </p>
            <p>
              Le changement de statut (approbation, rejet…) est réservé à l’administrateur et au
              gérant. À partir de 100 000, la personne qui a saisi le prêt ne peut pas l’approuver
              elle-même. L’approbation ne verse aucun fonds et les remboursements ne mouvementent ni
              les comptes ni la caisse : le registre des prêts est tenu à part des soldes.
            </p>
          </>
        ),
      },
      {
        q: 'Que montrent les pages Caisse et Alertes fraude ?',
        a: (
          <>
            <p>
              <strong>Caisse</strong> affiche le solde du coffre, recalculé par la base de données
              après chaque opération enregistrée sur un compte. C’est un chiffre unique, toutes
              devises confondues ; l’ouverture et la clôture de caisse ne sont pas disponibles.
            </p>
            <p>
              <strong>Alertes fraude</strong> liste, en lecture seule, les opérations signalées
              automatiquement : nombreuses opérations en peu de temps, opérations en dehors des
              heures habituelles, montants élevés ou ronds. Ces alertes ne bloquent aucune
              opération.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Accès et rôles',
    items: [
      {
        q: 'Qui peut faire quoi ?',
        a: (
          <>
            <ul>
              <li>
                <strong>Caissier</strong> : création des membres et des comptes, dépôts et retraits,
                saisies historiques, opérations de change, saisie des prêts et des remboursements.
              </li>
              <li>
                <strong>Gérant</strong> (« Gestionnaire » ou « Manager » selon les écrans) : tout ce
                que fait le
                caissier, plus le statut des membres, la fermeture des comptes, les taux de change,
                le statut des prêts, les paramètres et la règle d’inactivité.
              </li>
              <li>
                <strong>Administrateur</strong> : tout ce que fait le gérant, plus le statut des
                agents et les coordonnées de la coopérative.
              </li>
            </ul>
            <p>
              Tous les agents voient les mêmes écrans : les droits sont vérifiés au moment de
              l’enregistrement, par le serveur et par la base de données. Une action non autorisée
              est refusée avec un message.
            </p>
          </>
        ),
      },
      {
        q: 'Comment ajouter un nouvel agent ?',
        a: (
          <p>
            La création et l’invitation d’agents ne se font pas encore depuis l’application :{' '}
            <Link href="/contact">écrivez-nous via le formulaire de contact</Link>. Un administrateur
            peut en revanche modifier le statut d’un agent dans <strong>Paramètres</strong>, par
            exemple pour le suspendre : l’agent suspendu perd alors l’accès aux données de la
            coopérative.
          </p>
        ),
      },
      {
        q: 'J’ai oublié mon mot de passe. Que faire ?',
        a: (
          <p>
            Sur la <Link href="/login">page de connexion</Link>, cliquez sur{' '}
            <strong>Mot de passe oublié ?</strong> et saisissez votre adresse e-mail : vous recevrez
            un lien pour choisir un nouveau mot de passe.
          </p>
        ),
      },
      {
        q: 'Peut-on utiliser CoopFinance sur téléphone, hors ligne ou en créole ?',
        a: (
          <>
            <p>
              L’application s’ouvre dans un navigateur et demande une connexion Internet : il n’y a
              pas de mode hors ligne. Elle est pensée pour un écran d’ordinateur : sur un écran de
              moins de 1 024 pixels de large, la navigation ne propose que Accueil, Membres,
              Transactions, Change et Paramètres.
            </p>
            <p>L’interface est uniquement en français pour le moment.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Données et assistance',
    items: [
      {
        q: 'Où sont hébergées nos données ?',
        a: (
          <>
            <p>
              Aux États-Unis. La base de données est hébergée par Supabase (PostgreSQL sur AWS,
              région us-east-1) et l’application par Vercel (région iad1). Les connexions sont
              chiffrées (HTTPS), les données sont chiffrées au repos et la base est sauvegardée
              chaque jour.
            </p>
            <p>
              Chaque coopérative ne voit que ses propres données : cette séparation, comme la
              vérification des rôles, est appliquée dans la base de données elle-même. Plus de
              détails sur la page <Link href="/securite">Sécurité</Link>.
            </p>
          </>
        ),
      },
      {
        q: 'Peut-on exporter nos données ?',
        a: (
          <>
            <p>En partie :</p>
            <ul>
              <li>
                <strong>Transactions</strong> : CSV et PDF des opérations affichées dans le journal
                (choisissez d’abord la période et le type), qui porte sur les 500 opérations les
                plus récentes ;
              </li>
              <li>
                <strong>Prêts</strong> : CSV de la liste des prêts, PDF des prêts et des
                remboursements ;
              </li>
              <li>
                <strong>Bureau de change</strong> : CSV et PDF de l’historique, qui porte sur les 100
                opérations les plus récentes ;
              </li>
              <li>
                <strong>Comptes</strong> : relevé PDF depuis la fiche de chaque compte.
              </li>
            </ul>
            <p>
              Les fichiers CSV s’ouvrent directement dans Excel. Il n’existe pas encore d’export de
              la liste des membres ou des comptes, ni d’import de fichiers.
            </p>
          </>
        ),
      },
      {
        q: 'Les membres reçoivent-ils un SMS ou un e-mail ?',
        a: (
          <p>
            Non. CoopFinance n’envoie ni SMS, ni message WhatsApp, ni e-mail aux membres, et les
            membres n’ont pas d’accès à l’application. Le reçu imprimé est le justificatif remis au
            membre.
          </p>
        ),
      },
      {
        q: 'Comment obtenir de l’aide ?',
        a: (
          <p>
            <Link href="/contact">Écrivez-nous via le formulaire de contact</Link> en précisant la
            page concernée, l’heure et le message affiché. N’y indiquez jamais de mot de passe ni de
            données personnelles de membres.
          </p>
        ),
      },
    ],
  },
]

function FaqItem({ q, a }: Faq) {
  return (
    <details className="group rounded-[14px] border border-[#e5eaf1] bg-white open:bg-[#f8fafc]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[14px] px-5 py-4 text-[15px] font-semibold leading-snug text-[#0b1736] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] [&::-webkit-details-marker]:hidden">
        <span>{q}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="flex-none text-[#6c7b90] transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-3 px-5 pb-5">{a}</div>
    </details>
  )
}

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section>
        <p>
          Les réponses ci-dessous décrivent CoopFinance tel qu’il fonctionne aujourd’hui ; les noms
          de menus et de boutons sont ceux de l’application. Pour une vue d’ensemble des modules,
          consultez la page <Link href="/fonctionnalites">Fonctionnalités</Link>.
        </p>
        <p>
          Vous ne trouvez pas votre réponse ?{' '}
          <Link href="/contact">Écrivez-nous via le formulaire de contact</Link>.
        </p>
      </Section>

      {GROUPS.map(group => (
        <Section key={group.title} title={group.title}>
          {group.items.map(item => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </Section>
      ))}
    </PageShell>
  )
}
