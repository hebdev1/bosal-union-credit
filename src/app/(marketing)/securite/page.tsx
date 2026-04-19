import { Lock, Key, Database, FileSearch, UserCheck, AlertTriangle, ShieldCheck, Server } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/securite'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="La sécurité, en fondation — pas en option">
        <p>
          Une coopérative gère l’argent de ses membres. Chez Mache Kay BOSAL, la sécurité est
          intégrée à chaque couche : du chiffrement au niveau du disque jusqu’au contrôle d’accès
          par rôle, en passant par l’audit de chaque transaction.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <Lock size={18} />, title: 'Chiffrement AES-256', description: 'Toutes les données sont chiffrées au repos et en transit (TLS 1.3).' },
          { icon: <Key size={18} />, title: 'Authentification 2FA', description: 'Double facteur obligatoire pour les gestionnaires et administrateurs.' },
          { icon: <UserCheck size={18} />, title: 'Rôles & permissions', description: 'Contrôle granulaire : agent, comptable, gestionnaire, directeur.' },
          { icon: <FileSearch size={18} />, title: 'Audit trail complet', description: 'Chaque création, modification ou suppression est horodatée et tracée.' },
          { icon: <Database size={18} />, title: 'Sauvegardes quotidiennes', description: 'Backup automatique chiffré, restauration ponctuelle possible sur 30 jours.' },
          { icon: <AlertTriangle size={18} />, title: 'Détection de fraude', description: 'Alertes automatiques sur opérations inhabituelles, doublons, dépassements.' },
          { icon: <ShieldCheck size={18} />, title: 'Conformité BRH', description: 'Indicateurs prudentiels et rapports adaptés à la réglementation haïtienne.' },
          { icon: <Server size={18} />, title: 'Hébergement redondé', description: 'Infrastructure haute disponibilité avec bascule automatique en cas d’incident.' },
        ]}
      />

      <Section title="Transparence totale">
        <p>
          Le <a href="/statut" style={{ color: '#C41E3A' }} className="underline underline-offset-4">statut système</a> public
          et la page <a href="/confidentialite" style={{ color: '#C41E3A' }} className="underline underline-offset-4">confidentialité</a> détaillent
          comment vos données sont traitées, stockées et protégées.
        </p>
      </Section>
    </PageShell>
  )
}
