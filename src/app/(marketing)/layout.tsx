import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PublicHeader } from '@/components/marketing/coopfinance/PublicHeader'
import { PublicFooter } from '@/components/marketing/coopfinance/PublicFooter'
import './coopfinance.css'

const inter = Inter({
  variable: '--font-cf',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CoopFinance — Plateforme de gestion pour coopératives',
    template: '%s — CoopFinance',
  },
  description:
    'CoopFinance : membres, épargne, crédits, caisse, bureau de change et rapports pour les coopératives financières haïtiennes.',
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`cf-site ${inter.variable}`}>
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
