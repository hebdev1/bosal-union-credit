import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/confidentialite'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section>
        <p className="text-[13px] text-white/40">Dernière mise à jour : 15 avril 2026</p>
      </Section>

      <Section title="Vos données vous appartiennent">
        <p>
          Cette politique décrit comment Bosal Credit Union collecte, utilise et protège les
          informations personnelles des coopératives utilisatrices et de leurs membres.
        </p>
      </Section>

      <Section title="1. Données collectées">
        <p>
          Nous collectons uniquement les données nécessaires au fonctionnement du service :
          identité des agents (nom, email, rôle), informations des membres de la coopérative
          (KYC, comptes, transactions) et données techniques (journaux de connexion, IP).
        </p>
      </Section>

      <Section title="2. Finalités du traitement">
        <p>
          Les données sont traitées exclusivement pour : fournir le service, assurer sa
          sécurité, répondre aux obligations légales (BRH, lutte anti-blanchiment) et améliorer
          la plateforme de manière agrégée et anonymisée.
        </p>
      </Section>

      <Section title="3. Partage des données">
        <p>
          Nous ne vendons ni ne louons aucune donnée. Les seuls tiers susceptibles d’accéder
          sont : notre hébergeur (chiffrement au repos), notre prestataire SMS (numéros
          uniquement, jamais les contenus bancaires) et les autorités compétentes sur
          réquisition judiciaire.
        </p>
      </Section>

      <Section title="4. Sécurité">
        <p>
          Chiffrement AES-256 au repos, TLS 1.3 en transit, authentification 2FA, audit trail
          complet. Voir <a href="/securite" style={{ color: '#C41E3A' }} className="underline underline-offset-4">notre page sécurité</a> pour plus de détails.
        </p>
      </Section>

      <Section title="5. Vos droits">
        <p>
          Vous pouvez à tout moment : accéder à vos données, les rectifier, les exporter au format
          CSV/PDF, ou demander leur suppression (90 jours après la résiliation du contrat).
          Contact : privacy@bosal-credit-union.ht.
        </p>
      </Section>

      <Section title="6. Conservation">
        <p>
          Les données actives sont conservées tant que la coopérative utilise le service.
          Après résiliation : 90 jours pour export, puis suppression définitive, sauf obligations
          légales de conservation (archives comptables BRH).
        </p>
      </Section>

      <Section title="7. Cookies">
        <p>
          Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement
          (authentification, préférences de langue). Aucun cookie publicitaire ni tracking tiers.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Délégué à la protection des données : privacy@bosal-credit-union.ht — ou
          via <a href="/contact" style={{ color: '#C41E3A' }} className="underline underline-offset-4">le formulaire de contact</a>.
        </p>
      </Section>
    </PageShell>
  )
}
