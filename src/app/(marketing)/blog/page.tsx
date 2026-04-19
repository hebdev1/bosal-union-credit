import Link from 'next/link'
import { PageShell, Section } from '@/components/marketing/PageShell'
import { getPage } from '@/lib/marketing-pages'

const SLUG = '/blog'
const p = getPage(SLUG)!
export const metadata = { title: p.title, description: p.description }

const POSTS = [
  {
    date: '2026-04-10',
    category: 'Produit',
    title: 'Pourquoi nous avons rebrandé en Mache Kay BOSAL',
    excerpt: 'Une nouvelle identité qui reflète notre engagement envers la coopérative haïtienne : plus claire, plus forte, plus ancrée.',
  },
  {
    date: '2026-03-22',
    category: 'Coopératives',
    title: 'Gérer le portefeuille à risque (PAR) dans une coopérative',
    excerpt: 'Bonnes pratiques pour suivre, prévenir et réduire les impayés dans les coopératives d’épargne et de crédit haïtiennes.',
  },
  {
    date: '2026-03-05',
    category: 'Réglementation',
    title: 'Les indicateurs prudentiels BRH expliqués',
    excerpt: 'Quels ratios la Banque de la République d’Haïti suit-elle pour les COOPEC ? Guide pratique pour les directeurs.',
  },
  {
    date: '2026-02-14',
    category: 'Étude de cas',
    title: 'Comment une coopérative de Jacmel a doublé ses membres en 12 mois',
    excerpt: 'Digitalisation, proximité humaine et SMS : le retour d’expérience d’une COOPEC du Sud-Est.',
  },
  {
    date: '2026-01-30',
    category: 'Produit',
    title: 'Nouveauté — devise DOP pour la frontière dominicaine',
    excerpt: 'Les coopératives du Nord-Est et du Plateau Central peuvent désormais servir leurs membres transfrontaliers.',
  },
]

export default function Page() {
  return (
    <PageShell slug={SLUG}>
      <Section title="Actualités et analyses">
        <p>
          Le blog de Mache Kay BOSAL — actualités produit, bonnes pratiques coopératives,
          études de cas haïtiennes et analyse du secteur.
        </p>
      </Section>

      <div className="mt-8 space-y-3">
        {POSTS.map(post => (
          <Link key={post.title} href="#"
            className="group block rounded-xl p-6 border transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(196,30,58,0.12)', color: '#E11D48' }}>{post.category}</span>
              <time className="text-[11.5px] text-white/35" dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('fr-HT', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </div>
            <h3 className="text-[18px] font-semibold text-white/90 group-hover:text-white leading-tight">
              {post.title}
            </h3>
            <p className="mt-2 text-[13.5px] text-white/50 leading-relaxed">
              {post.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
