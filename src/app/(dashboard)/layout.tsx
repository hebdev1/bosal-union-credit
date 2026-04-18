import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { BottomNav } from '@/components/dashboard/BottomNav'
import { ThemeInjector } from '@/components/dashboard/ThemeInjector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth guard (belt-and-suspenders — middleware also guards)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch theme settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: themeRows } = await (supabase as any)
    .from('app_settings')
    .select('key, value')
    .eq('category', 'theme')

  const tm: Record<string, string> = {}
  for (const r of (themeRows ?? [])) tm[r.key] = String(r.value ?? '').replace(/^"|"$/g, '')

  const themeVars = {
    brandColor:     tm['brand_color']           || '#C41E3A',
    sidebarBg:      tm['sidebar_bg_color']       || '#080A0F',
    surfaceColor:   tm['surface_color']          || '#0D1018',
    borderColor:    tm['border_color']           || 'rgba(255,255,255,0.07)',
    textPrimary:    tm['text_primary_color']     || 'rgba(255,255,255,0.92)',
    textSecondary:  tm['text_secondary_color']   || 'rgba(255,255,255,0.42)',
    kpiValueColor:  tm['kpi_value_color']        || 'inherit',
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: '#07080C' }}>
      <ThemeInjector vars={themeVars} />

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
