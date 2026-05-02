import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { TransactionsClient } from '@/components/dashboard/ui/TransactionsClient'
import { AddTransactionForm } from '@/components/dashboard/forms/AddTransactionForm'
import { buildPdfConfig } from '@/lib/pdfConfig'
import { formatHTG } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Transactions' }

export default async function TransactionsPage() {
  const supabase = await createClient()

  const [{ data: transactions }, { data: pdfSettings }, { data: members }, { data: accounts }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, transaction_type, amount, motif, reference, status, created_at, transaction_date, accounts(account_number, currency, members(first_name, last_name))')
      .order('transaction_date', { ascending: false })
      .limit(500),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('app_settings').select('key, value').eq('category', 'pdf'),
    supabase
      .from('members')
      .select('id, first_name, last_name, member_number')
      .eq('status', 'active')
      .order('last_name', { ascending: true }),
    supabase
      .from('accounts')
      .select('id, account_number, currency, account_type, member_id')
      .eq('status', 'active')
      .order('account_number', { ascending: true }),
  ])

  const reportConfig = buildPdfConfig((pdfSettings ?? []) as { key: string; value: unknown }[])

  const rows        = (transactions ?? []) as any[]
  const deposits    = rows.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + Number(t.amount), 0)
  const withdrawals = rows.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0)
  const flux        = deposits - withdrawals

  return (
    <>
      <Header title="Transactions" />
      <PageShell
        title="Historique des transactions"
        description={`${rows.length} transaction${rows.length !== 1 ? 's' : ''} · saisie actuelle ou historique`}
        action={
          <AddTransactionForm
            members={(members ?? []) as { id: string; first_name: string; last_name: string; member_number: string }[]}
            accounts={(accounts ?? []) as { id: string; account_number: string; currency: string; account_type: string; member_id: string }[]}
          />
        }
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total opérations',  value: rows.length,         color: 'rgba(255,255,255,0.95)' },
            { label: 'Montant dépôts',    value: formatHTG(deposits),    color: '#4ADE80' },
            { label: 'Montant retraits',  value: formatHTG(withdrawals), color: '#F87171' },
            { label: 'Flux net',          value: formatHTG(flux),        color: flux >= 0 ? '#4ADE80' : '#F87171' },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Client-side filtered + searchable history */}
        <TransactionsClient transactions={rows} reportConfig={reportConfig} />
      </PageShell>
    </>
  )
}
