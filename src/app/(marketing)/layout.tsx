import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MarketingNav />
      <main id="main-content" role="main" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </>
  )
}
