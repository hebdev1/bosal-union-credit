import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard } from '@/components/dashboard/ui/DataTable'
import { BarChart3 } from 'lucide-react'
import { formatHTG } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Rapports' }

export default async function RapportsPage() {
  const supabase = await createClient()

  const [txRes, loansRes, membersRes, exchangeRes] = await Promise.allSettled([
    supabase.from('transactions').select('transaction_type, amount, created_at'),
    supabase.from('loans').select('status, principal_amount, amount_paid, total_amount_due'),
    supabase.from('members').select('status, created_at'),
    supabase.from('exchange_transactions').select('amount_given, amount_received, from_currency, to_currency, created_at'),
  ])

  const txs      = txRes.status === 'fulfilled'       ? (txRes.value.data ?? [])       : []
  const loans    = loansRes.status === 'fulfilled'    ? (loansRes.value.data ?? [])    : []
  const members  = membersRes.status === 'fulfilled'  ? (membersRes.value.data ?? [])  : []
  const exchanges = exchangeRes.status === 'fulfilled' ? (exchangeRes.value.data ?? []) : []

  const totalDeposits    = txs.filter((t: any) => t.transaction_type === 'deposit').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const totalWithdrawals = txs.filter((t: any) => t.transaction_type === 'withdrawal').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const totalLoans       = loans.reduce((s: number, l: any) => s + Number(l.principal_amount), 0)
  const totalRepaid      = loans.reduce((s: number, l: any) => s + Number(l.amount_paid ?? 0), 0)
  const defaulted        = loans.filter((l: any) => l.status === 'defaulted').length
  const exchangeVol      = exchanges.reduce((s: number, e: any) => s + Number(e.amount_given), 0)

  const metrics = [
    { label: 'Total dépôts',             value: formatHTG(totalDeposits),    color: '#4ADE80' },
    { label: 'Total retraits',           value: formatHTG(totalWithdrawals), color: '#F87171' },
    { label: 'Flux net',                 value: formatHTG(totalDeposits - totalWithdrawals), color: totalDeposits >= totalWithdrawals ? '#4ADE80' : '#F87171' },
    { label: 'Capital prêté total',      value: formatHTG(totalLoans),       color: '#A78BFA' },
    { label: 'Capital remboursé',        value: formatHTG(totalRepaid),      color: '#60A5FA' },
    { label: 'Prêts en défaut',         value: String(defaulted),           color: defaulted > 0 ? '#F87171' : '#4ADE80' },
    { label: 'Membres actifs',           value: String(members.filter((m: any) => m.status === 'active').length), color: '#3B82F6' },
    { label: 'Volume échangé (change)',  value: formatHTG(exchangeVol),      color: '#34D399' },
  ]

  return (
    <>
      <Header title="Rapports" />
      <PageShell title="Rapports" description="Synthèse des activités de la coopérative">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metrics.map(m => (
            <div key={m.label} className="rounded-xl px-5 py-4 transition-colors"
              style={{ background: '#111318', border: '1px solid #252A36' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#363D52')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#252A36')}>
              <p className="text-xl font-bold kpi-value" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Transactions by type breakdown */}
        <section aria-label="Répartition des transactions">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Répartition par type de transaction
          </h3>
          <DataCard>
            <div className="divide-y">
              {['deposit', 'withdrawal', 'transfer', 'adjustment'].map(type => {
                const typeTxs = txs.filter((t: any) => t.transaction_type === type)
                const total = typeTxs.reduce((s: number, t: any) => s + Number(t.amount), 0)
                const pct = txs.length > 0 ? Math.round((typeTxs.length / txs.length) * 100) : 0
                const labels: Record<string, string> = { deposit: 'Dépôts', withdrawal: 'Retraits', transfer: 'Virements', adjustment: 'Ajustements' }
                const colors: Record<string, string> = { deposit: '#4ADE80', withdrawal: '#F87171', transfer: '#60A5FA', adjustment: '#FCD34D' }
                return (
                  <div key={type} className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderTop: '1px solid #1a1f2e' }}>
                    <p className="w-28 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{labels[type]}</p>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#252A36' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[type] }} />
                      </div>
                    </div>
                    <p className="w-8 text-xs text-right" style={{ color: 'rgba(255,255,255,0.40)' }}>{pct}%</p>
                    <p className="w-12 text-xs text-right kpi-value" style={{ color: 'rgba(255,255,255,0.55)' }}>{typeTxs.length}</p>
                    <p className="w-32 text-right text-sm font-semibold kpi-value" style={{ color: colors[type] }}>
                      {formatHTG(total)}
                    </p>
                  </div>
                )
              })}
            </div>
          </DataCard>
        </section>

        {/* Loans status breakdown */}
        <section aria-label="Répartition des prêts">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Portefeuille prêts par statut
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['pending', 'active', 'completed', 'defaulted', 'rejected'].map(s => {
              const count = loans.filter((l: any) => l.status === s).length
              const amount = loans.filter((l: any) => l.status === s).reduce((acc: number, l: any) => acc + Number(l.principal_amount), 0)
              const SCFG: Record<string, { label: string; color: string; bg: string }> = {
                pending:   { label: 'En attente',  color: '#FCD34D', bg: 'rgba(234,179,8,0.10)'   },
                active:    { label: 'Actifs',       color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'   },
                completed: { label: 'Complétés',    color: '#60A5FA', bg: 'rgba(59,130,246,0.10)'  },
                defaulted: { label: 'En défaut',    color: '#F87171', bg: 'rgba(239,68,68,0.10)'   },
                rejected:  { label: 'Rejetés',      color: 'rgba(255,255,255,0.40)', bg: 'rgba(255,255,255,0.05)' },
              }
              const cfg = SCFG[s]
              return (
                <div key={s} className="rounded-xl px-4 py-4"
                  style={{ background: '#111318', border: `1px solid ${cfg.color}25` }}>
                  <p className="text-lg font-bold kpi-value" style={{ color: cfg.color }}>{count}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>{cfg.label}</p>
                  <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.30)' }}>{formatHTG(amount)}</p>
                </div>
              )
            })}
          </div>
        </section>
      </PageShell>
    </>
  )
}
