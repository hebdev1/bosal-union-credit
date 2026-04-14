import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { ClosureClient } from '@/components/dashboard/forms/ClosureClient'
import { getTodayStats } from './actions'

export const metadata: Metadata = { title: 'Clôture journée' }

export default async function CloturePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agentRes, closingsRes, coopRes, todayStats] = await Promise.all([
    user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('agents').select('name, cooperative_id').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('daily_closings')
      .select('*, agents(name)')
      .order('closing_date', { ascending: false })
      .limit(90),
    user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any).from('agents').select('cooperative_id').eq('id', user.id).single().then(async (r: any) => {
          if (!r.data) return { data: null }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (supabase as any).from('cooperatives').select('name').eq('id', r.data.cooperative_id).single()
        })
      : Promise.resolve({ data: null }),
    getTodayStats(),
  ])

  const closings  = ((closingsRes.data ?? []) as any[])
  const agentName = (agentRes as any)?.data?.name ?? 'Agent'
  const coopName  = (coopRes as any)?.data?.name  ?? 'Coopérative'
  const todayOpen = closings.find((c: any) => c.status === 'open') ?? null

  return (
    <>
      <Header title="Clôture journée" />
      <PageShell
        title="Clôture journalière"
        description="Bilan quotidien · génération PDF · historique complet"
      >
        <ClosureClient
          todayOpen={todayOpen}
          todayStats={todayStats}
          closings={closings}
          coopName={coopName}
          agentName={agentName}
        />
      </PageShell>
    </>
  )
}
