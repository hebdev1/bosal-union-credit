import Link from 'next/link'
import { Briefcase, Code2, Users } from 'lucide-react'
import { PageShell, Section, FeatureGrid } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/partenaires'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Rejoignez l’écosystème Mache Kay BOSAL">
        <p>
          Cabinets comptables, intégrateurs techniques, fédérations coopératives — nous
          construisons un réseau de partenaires qui partagent notre vision : moderniser le
          mouvement coopératif haïtien.
        </p>
      </Section>

      <FeatureGrid
        items={[
          { icon: <Briefcase size={18} />, title: 'Cabinets comptables', description: 'Accompagnez vos clients coopératifs avec une plateforme certifiée BRH et exports comptables.' },
          { icon: <Code2 size={18} />, title: 'Intégrateurs techniques', description: 'Connectez Mache Kay BOSAL à d’autres systèmes via notre API REST et webhooks.' },
          { icon: <Users size={18} />, title: 'Fédérations & réseaux', description: 'Bénéficiez de tarifs préférentiels pour les COOPEC membres de votre fédération.' },
        ]}
      />

      <Section title="Programme partenaire">
        <p>
          Commission sur les abonnements apportés, formation gratuite de votre équipe, co-marketing
          et accès prioritaire aux nouvelles fonctionnalités. <Link href="/contact" style={{ color: '#C41E3A' }}
          className="underline underline-offset-4">Discutons-en</Link>.
        </p>
      </Section>

      <Section title="Déjà intégré avec">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {['BRH Reporting', 'QuickBooks', 'MonCash API', 'Twilio SMS'].map(name => (
            <div key={name} className="rounded-xl p-5 border flex items-center justify-center text-[13px] font-medium text-white/65"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              {name}
            </div>
          ))}
        </div>
      </Section>
    </PageShell>
  )
}
