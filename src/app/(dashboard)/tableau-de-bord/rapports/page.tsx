import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { RapportsClient } from '@/components/dashboard/forms/RapportsClient'
import { formatHTG } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Rapports' }

export default async function RapportsPage() {
  const supabase = await createClient()

  // Window for detailed operation tables: last 90 days
  const since = new Date(); since.setDate(since.getDate() - 90)
  const sinceIso = since.toISOString()

  const [
    globalTxRes,
    globalLoanRes,
    globalMembersRes,
    detailTxRes,
    detailExRes,
    detailRepRes,
  ] = await Promise.allSettled([
    supabase.from('transactions').select('transaction_type, amount'),
    supabase.from('loans').select('status, principal_amount, amount_paid'),
    supabase.from('members').select('status'),
    // Detailed operations (last 90 d)
    supabase
      .from('transactions')
      .select('id, created_at, transaction_type, amount, status, reference, motif, accounts(account_number, currency, members(first_name, last_name))')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('exchange_transactions')
      .select('id, created_at, from_currency, to_currency, amount_given, amount_received, rate_applied, ticket_number')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('loan_repayments')
      .select('id, created_at, amount_paid, status, loans(loan_number, members(first_name, last_name))')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  const allTxs     = globalTxRes.status === 'fulfilled' ? (globalTxRes.value.data ?? []) : []
  const allLoans   = globalLoanRes.status === 'fulfilled' ? (globalLoanRes.value.data ?? []) : []
  const allMembers = globalMembersRes.status === 'fulfilled' ? (globalMembersRes.value.data ?? []) : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTx = detailTxRes.status === 'fulfilled' ? ((detailTxRes.value as any).data ?? []) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEx = detailExRes.status === 'fulfilled' ? ((detailExRes.value as any).data ?? []) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRep = detailRepRes.status === 'fulfilled' ? ((detailRepRes.value as any).data ?? []) : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailTransactions = rawTx.map((t: any) => {
    const acct = Array.isArray(t.accounts) ? t.accounts[0] : t.accounts
    const member = acct ? (Array.isArray(acct.members) ? acct.members[0] : acct.members) : null
    return {
      id: t.id,
      created_at: t.created_at,
      transaction_type: t.transaction_type,
      amount: Number(t.amount ?? 0),
      status: t.status,
      reference: t.reference ?? null,
      motif: t.motif ?? null,
      account_number: acct?.account_number ?? null,
      currency: acct?.currency ?? null,
      member_name: member ? `${member.first_name} ${member.last_name}` : null,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailExchanges = rawEx.map((e: any) => ({
    id: e.id,
    created_at: e.created_at,
    from_currency: e.from_currency,
    to_currency: e.to_currency,
    amount_given: Number(e.amount_given ?? 0),
    amount_received: Number(e.amount_received ?? 0),
    rate_applied: Number(e.rate_applied ?? 0),
    ticket_number: e.ticket_number ?? null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailRepayments = rawRep.map((r: any) => {
    const loan = Array.isArray(r.loans) ? r.loans[0] : r.loans
    const member = loan ? (Array.isArray(loan.members) ? loan.members[0] : loan.members) : null
    return {
      id: r.id,
      created_at: r.created_at,
      amount_paid: Number(r.amount_paid ?? 0),
      status: r.status,
      loan_number: loan?.loan_number ?? null,
      member_name: member ? `${member.first_name} ${member.last_name}` : null,
    }
  })

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
        title="Rapports"
        description="Détail complet des opérations (90 derniers jours)"
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
          detailTransactions={detailTransactions}
          detailExchanges={detailExchanges}
          detailRepayments={detailRepayments}
        />
      </PageShell>
    </>
  )
}
