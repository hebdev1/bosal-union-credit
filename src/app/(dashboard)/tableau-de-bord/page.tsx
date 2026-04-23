import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { DashboardHome } from '@/components/dashboard/DashboardHome'

export const metadata: Metadata = { title: 'Tableau de bord' }

export default async function TableauDeBordPage() {
  const supabase = await createClient()

  // Analytics window: last 365 days (client filters down to 7/30/90).
  const fallbackStart = new Date(); fallbackStart.setDate(fallbackStart.getDate() - 365)
  const analyticsStartIso = fallbackStart.toISOString()

  const [
    summaryRes,
    membersRes,
    accountsRes,
    vaultRes,
    loansRes,
    ratesRes,
    recentTxRes,
    fraudRes,
    analyticsTxRes,
    analyticsExchangesRes,
    analyticsLoansRes,
  ] = await Promise.allSettled([
    supabase.rpc('get_cooperative_summary'),
    supabase.from('members').select('id, status').eq('status', 'active'),
    supabase.from('accounts').select('id, balance, currency, status').eq('status', 'active'),
    supabase.from('cash_vault').select('current_balance, opening_balance, last_updated').limit(1).single(),
    supabase.from('loans').select('id, principal_amount, amount_paid, status').in('status', ['active', 'pending']),
    supabase
      .from('exchange_rates')
      .select('from_currency, to_currency, rate, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('transactions')
      .select('id, transaction_type, amount, status, created_at, accounts(account_number, currency, members(first_name, last_name))')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('fraud_flags')
      .select('id, rule_triggered, severity, created_at, transaction_id')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('transactions')
      .select('transaction_type, amount, status, created_at')
      .gte('created_at', analyticsStartIso),
    supabase
      .from('exchange_transactions')
      .select('from_currency, to_currency, amount_given, rate_applied, created_at')
      .gte('created_at', analyticsStartIso),
    supabase
      .from('loans')
      .select('status, principal_amount, created_at')
      .gte('created_at', analyticsStartIso),
  ])

  const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value.data?.[0] ?? null) : null
  const members = membersRes.status === 'fulfilled' ? (membersRes.value.data ?? []) : []
  const accounts = accountsRes.status === 'fulfilled' ? (accountsRes.value.data ?? []) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vault = vaultRes.status === 'fulfilled' ? (vaultRes.value.data as any) : null
  const loans = loansRes.status === 'fulfilled' ? (loansRes.value.data ?? []) : []
  const rates = ratesRes.status === 'fulfilled' ? (ratesRes.value.data ?? []) : []
  const recentTx = recentTxRes.status === 'fulfilled' ? (recentTxRes.value.data ?? []) : []
  const fraudFlags = fraudRes.status === 'fulfilled' ? (fraudRes.value.data ?? []) : []
  const analyticsTx        = analyticsTxRes.status === 'fulfilled' ? (analyticsTxRes.value.data ?? []) : []
  const analyticsExchanges = analyticsExchangesRes.status === 'fulfilled' ? (analyticsExchangesRes.value.data ?? []) : []
  const analyticsLoans     = analyticsLoansRes.status === 'fulfilled' ? (analyticsLoansRes.value.data ?? []) : []

  // Compute totals client-side from fetched data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBalanceHTG = accounts
    .filter((a: any) => a.currency === 'HTG')
    .reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalBalanceUSD = accounts
    .filter((a: any) => a.currency === 'USD')
    .reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeLoansTotal = loans
    .filter((l: any) => l.status === 'active')
    .reduce((s: number, l: any) => s + Number(l.principal_amount ?? 0) - Number(l.amount_paid ?? 0), 0)

  return (
    <>
      <Header title="Tableau de bord" />
      <DashboardHome
        summary={summary}
        activeMembers={members.length}
        totalBalanceHTG={totalBalanceHTG}
        totalBalanceUSD={totalBalanceUSD}
        vaultBalance={vault?.current_balance ?? null}
        activeLoansTotal={activeLoansTotal}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeLoansCount={loans.filter((l: any) => l.status === 'active').length}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exchangeRates={rates as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentTransactions={recentTx as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fraudFlags={fraudFlags as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyticsTx={analyticsTx as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyticsExchanges={analyticsExchanges as any[]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyticsLoans={analyticsLoans as any[]}
      />
    </>
  )
}
