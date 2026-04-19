import Link from 'next/link'
import { BookOpen, Rocket, Users, CreditCard, Landmark, Vault, BarChart3, Settings } from 'lucide-react'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/docs'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const CATEGORIES = [
  { icon: <Rocket size={18} />, title: 'Démarrage rapide', description: 'Installez, configurez et lancez votre première opération en 30 minutes.', href: '/comment-ca-marche' },
  { icon: <Users size={18} />, title: 'Gestion des membres', description: 'Ouverture de compte, KYC, parts sociales, documents justificatifs.', href: '/solutions/epargne' },
  { icon: <CreditCard size={18} />, title: 'Transactions', description: 'Dépôts, retraits, transferts, virements entre comptes.', href: '/fonctionnalites' },
  { icon: <Landmark size={18} />, title: 'Prêts', description: 'Demande, approbation, décaissement, recouvrement.', href: '/solutions/prets' },
  { icon: <Vault size={18} />, title: 'Caisse & clôture', description: 'Ouverture de caisse, transferts coffre, clôture journée.', href: '/solutions/caisse' },
  { icon: <BarChart3 size={18} />, title: 'Rapports', description: 'Rapports BRH, états financiers, exports Excel et PDF.', href: '/fonctionnalites' },
  { icon: <Settings size={18} />, title: 'Paramètres', description: 'Rôles, permissions, logos, paramétrage coopérative.', href: '/solutions/agences' },
  { icon: <BookOpen size={18} />, title: 'API & intégrations', description: 'Connectez vos outils externes via l’API REST.', href: '/api-reference' },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Une documentation pensée pour les équipes coopératives">
        <p>
          Guides pas-à-pas, tutoriels vidéo et références techniques — pour tous les profils :
          agent de caisse, comptable, gestionnaire, directeur. Besoin d’aide ? Consultez aussi
          le <Link href="/aide" style={{ color: '#C41E3A' }} className="underline underline-offset-4">centre d’aide</Link>.
        </p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
        {CATEGORIES.map(c => (
          <Link key={c.title} href={c.href}
            className="group rounded-xl p-5 border transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(196,30,58,0.10)', color: '#E11D48' }}>
                {c.icon}
              </div>
              <div>
                <p className="text-[14.5px] font-semibold text-white/90 group-hover:text-white">{c.title}</p>
                <p className="mt-1 text-[13px] text-white/50 leading-snug">{c.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
