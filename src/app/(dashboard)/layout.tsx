import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BottomNav } from '@/components/dashboard/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth guard (belt-and-suspenders — middleware also guards)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: '#0C0C0E' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex lg:flex-shrink-0" style={{ height: '100dvh' }}>
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Page content with bottom padding for mobile nav */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-[56px] lg:pb-0"
          tabIndex={-1}
          aria-label="Contenu principal"
        >
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
