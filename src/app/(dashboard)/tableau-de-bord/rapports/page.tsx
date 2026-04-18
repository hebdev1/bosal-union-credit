import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { RapportsClient } from '@/components/dashboard/forms/RapportsClient'
import { getTodayStats } from '@/app/(dashboard)/tableau-de-bord/cloture/actions'
import { formatHTG } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Rapports' }

export default async function RapportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agentRow } = user ? await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single() : { data: null }

  const cooperativeId = (agentRow as any)?.cooperative_id

  const [closingsRes, todayStats, globalTxRes, globalLoanRes, globalMembersRes] = await Promise.allSettled([
    cooperativeId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any)
          .from('daily_closings')
          .select('id, closing_date, opening_balance, closing_balance, total_deposits, total_withdrawals, total_loan_repayments, total_exchange_in, total_exchange_out, status, closed_at, notes, agents:closed_by(name)')
          .eq('cooperative_id', cooperativeId)
          .order('closing_date', { ascending: false })
          .limit(365)
      : Promise.resolve({ data: [] }),
    getTodayStats(),
    supabase.from('transactions').select('transaction_type, amount'),
    supabase.from('loans').select('status, principal_amount, amount_paid'),
    supabase.from('members').select('status'),
  ])

  const closings   = closingsRes.status === 'fulfilled' ? ((closingsRes.value as any).data ?? []) : []
  const todayS     = todayStats.status === 'fulfilled' ? todayStats.value : null
  const allTxs     = globalTxRes.status === 'fulfilled' ? (globalTxRes.value.data ?? []) : []
  const allLoans   = globalLoanRes.status === 'fulfilled' ? (globalLoanRes.value.data ?? []) : []
  const allMembers = globalMembersRes.status === 'fulfilled' ? (globalMembersRes.value.data ?? []) : []

  const isOpen = (closings as any[]).some((c: any) => c.status === 'open')

  // Global KPIs (all-time)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalDeposits    = (allTxs as any[]).filter((t: any) => t.transaction_type === 'deposit').reduce((s: number, t: any) => s + Number(t.amount), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalWithdrawals = (allTxs as any[]).filter((t: any) => t.transaction_type === 'withdrawal').reduce((s: number, t: any) => s + Number(t.amount), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeLoans      = (allLoans as any[]).filter((l: any) => l.status === 'active').length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeMembers    = (allMembers as any[]).filter((m: any) => m.status === 'active').length

  return (
    <>
      <Header title="Rapports" />
      <PageShell
        title="Rapports & Clôtures"
        description={`${(closings as any[]).filter((c: any) => c.status === 'closed').length} journée${(closings as any[]).filter((c: any) => c.status === 'closed').length !== 1 ? 's' : ''} clôturée${(closings as any[]).filter((c: any) => c.status === 'closed').length !== 1 ? 's' : ''}`}
      >
        {/* Global KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total dépôts',   value: formatHTG(totalDeposits),    color: '#4ADE80' },
            { label: 'Total retraits', value: formatHTG(totalWithdrawals),  color: '#F87171' },
            { label: 'Prêts actifs',   value: String(activeLoans),          color: '#A78BFA' },
            { label: 'Membres actifs', value: String(activeMembers),        color: '#60A5FA' },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-xl font-bold kpi-value" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        <RapportsClient
          closings={closings as any[]}
          todayStats={todayS}
          isOpen={isOpen}
        />
      </PageShell>
    </>
  )
}
