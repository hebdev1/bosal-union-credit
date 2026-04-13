import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { DashboardHome } from '@/components/dashboard/DashboardHome'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function TableauDeBordPage() {
  const supabase = await createClient()

  // Fetch cooperative summary via RPC
  const [summaryResult, recentTxResult, fraudResult] = await Promise.allSettled([
    supabase.rpc('get_cooperative_summary'),
    supabase
      .from('transactions')
      .select('id, type, amount, currency, created_at, status')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('fraud_flags')
      .select('id, reason, risk_score, created_at, resolved_at')
      .is('resolved_at', null)
      .order('risk_score', { ascending: false })
      .limit(5),
  ])

  const summary =
    summaryResult.status === 'fulfilled' ? summaryResult.value.data : null
  const recentTx =
    recentTxResult.status === 'fulfilled' ? recentTxResult.value.data : []
  const fraudFlags =
    fraudResult.status === 'fulfilled' ? fraudResult.value.data : []

  return (
    <>
      <Header title="Tableau de bord" />
      <DashboardHome
        summary={summary}
        recentTransactions={recentTx ?? []}
        fraudFlags={fraudFlags ?? []}
      />
    </>
  )
}
