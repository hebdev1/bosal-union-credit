import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { formatHTG, formatUSD, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Rapports' }

const CURRENCY_COLORS: Record<string, string> = {
  HTG: '#C41E3A', USD: '#3B82F6', CAD: '#EF4444', DOP: '#22C55E',
}

function CurrencyTag({ code }: { code: string }) {
  const color = CURRENCY_COLORS[code] ?? '#888'
  return (
    <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold"
      style={{ background: `${color}20`, color, minWidth: 36 }}>
      {code}
    </span>
  )
}

export default async function RapportsPage() {
  const supabase = await createClient()

  const [txRes, loansRes, membersRes, exchangeRes, exchDetailRes] = await Promise.allSettled([
    supabase.from('transactions').select('transaction_type, amount, created_at'),
    supabase.from('loans').select('status, principal_amount, amount_paid, total_amount_due'),
    supabase.from('members').select('status, created_at'),
    supabase.from('exchange_transactions').select('amount_given, amount_received, from_currency, to_currency, created_at'),
    (supabase as any)
      .from('exchange_transactions')
      .select('id, client_first_name, client_last_name, from_currency, to_currency, amount_given, rate_applied, amount_received, ticket_number, created_at, agents(name)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const txs        = txRes.status === 'fulfilled'        ? (txRes.value.data ?? [])        : []
  const loans      = loansRes.status === 'fulfilled'     ? (loansRes.value.data ?? [])     : []
  const members    = membersRes.status === 'fulfilled'   ? (membersRes.value.data ?? [])   : []
  const exchanges  = exchangeRes.status === 'fulfilled'  ? (exchangeRes.value.data ?? [])  : []
  const exchDetail = exchDetailRes.status === 'fulfilled' ? (exchDetailRes.value.data ?? []) : []

  const totalDeposits    = txs.filter((t: any) => t.transaction_type === 'deposit').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const totalWithdrawals = txs.filter((t: any) => t.transaction_type === 'withdrawal').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const totalLoans       = loans.reduce((s: number, l: any) => s + Number(l.principal_amount), 0)
  const totalRepaid      = loans.reduce((s: number, l: any) => s + Number(l.amount_paid ?? 0), 0)
  const defaulted        = loans.filter((l: any) => l.status === 'defaulted').length
  const exchangeVol      = exchanges.reduce((s: number, e: any) => s + Number(e.amount_given), 0)
  const exchangeCount    = exchanges.length

  // Exchange pair breakdown
  type PairKey = string
  const pairMap = new Map<PairKey, { count: number; given: number; received: number; fromCcy: string; toCcy: string }>()
  for (const e of exchanges as any[]) {
    const key = `${e.from_currency}→${e.to_currency}`
    const existing = pairMap.get(key) ?? { count: 0, given: 0, received: 0, fromCcy: e.from_currency, toCcy: e.to_currency }
    pairMap.set(key, {
      ...existing,
      count: existing.count + 1,
      given: existing.given + Number(e.amount_given),
      received: existing.received + Number(e.amount_received),
    })
  }
  const pairs = Array.from(pairMap.entries()).sort((a, b) => b[1].count - a[1].count)

  const metrics = [
    { label: 'Total dépôts',             value: formatHTG(totalDeposits),    color: '#4ADE80' },
    { label: 'Total retraits',           value: formatHTG(totalWithdrawals), color: '#F87171' },
    { label: 'Flux net',                 value: formatHTG(totalDeposits - totalWithdrawals), color: totalDeposits >= totalWithdrawals ? '#4ADE80' : '#F87171' },
    { label: 'Capital prêté total',      value: formatHTG(totalLoans),       color: '#A78BFA' },
    { label: 'Capital remboursé',        value: formatHTG(totalRepaid),      color: '#60A5FA' },
    { label: 'Prêts en défaut',          value: String(defaulted),           color: defaulted > 0 ? '#F87171' : '#4ADE80' },
    { label: 'Membres actifs',           value: String(members.filter((m: any) => m.status === 'active').length), color: '#3B82F6' },
    { label: 'Transactions de change',   value: String(exchangeCount),       color: '#34D399' },
  ]

  return (
    <>
      <Header title="Rapports" />
      <PageShell title="Rapports" description="Synthèse complète des activités de la coopérative">

        {/* Global KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {metrics.map(m => (
            <div key={m.label} className="rounded-xl px-5 py-4"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <p className="text-xl font-bold kpi-value" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Transaction type breakdown */}
        <section aria-label="Répartition des transactions">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Répartition par type de transaction
          </h3>
          <DataCard>
            <div>
              {['deposit', 'withdrawal', 'transfer', 'adjustment'].map(type => {
                const typeTxs = (txs as any[]).filter(t => t.transaction_type === type)
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
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[type] }} />
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

        {/* Loan portfolio */}
        <section aria-label="Répartition des prêts">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Portefeuille prêts par statut
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['pending', 'active', 'completed', 'defaulted', 'rejected'].map(s => {
              const count  = (loans as any[]).filter(l => l.status === s).length
              const amount = (loans as any[]).filter(l => l.status === s).reduce((acc: number, l: any) => acc + Number(l.principal_amount), 0)
              const SCFG: Record<string, { label: string; color: string }> = {
                pending:   { label: 'En attente', color: '#FCD34D' },
                active:    { label: 'Actifs',      color: '#4ADE80' },
                completed: { label: 'Complétés',   color: '#60A5FA' },
                defaulted: { label: 'En défaut',   color: '#F87171' },
                rejected:  { label: 'Rejetés',     color: 'rgba(255,255,255,0.40)' },
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

        {/* ─── Bureau de change ─── */}
        <section aria-label="Rapport bureau de change">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Bureau de change
            </h3>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
              {exchangeCount} opération{exchangeCount !== 1 ? 's' : ''} · volume total {formatHTG(exchangeVol)}
            </span>
          </div>

          {/* Pair breakdown */}
          {pairs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {pairs.map(([key, data]) => (
                <div key={key} className="rounded-xl px-4 py-3.5 space-y-2"
                  style={{ background: '#111318', border: '1px solid #252A36' }}>
                  <div className="flex items-center gap-1.5">
                    <CurrencyTag code={data.fromCcy} />
                    <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10 }}>→</span>
                    <CurrencyTag code={data.toCcy} />
                  </div>
                  <div>
                    <p className="text-sm font-bold kpi-value" style={{ color: 'rgba(255,255,255,0.90)' }}>
                      {data.count} opération{data.count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {data.fromCcy === 'USD' ? formatUSD(data.given) : formatHTG(data.given)} donné{data.count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs" style={{ color: '#34D399' }}>
                      {data.toCcy === 'USD' ? formatUSD(data.received) : formatHTG(data.received)} reçu{data.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent exchange transactions table */}
          <DataCard>
            {exchDetail.length === 0 ? (
              <EmptyState title="Aucune opération de change" />
            ) : (
              <Table headers={['Ticket', 'Client', 'De', 'Vers', 'Montant donné', 'Taux', 'Montant reçu', 'Agent', 'Date']}>
                {(exchDetail as any[]).map(t => (
                  <TR key={t.id}>
                    <TD mono>{t.ticket_number}</TD>
                    <TD>
                      <span className="font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>
                        {t.client_first_name} {t.client_last_name}
                      </span>
                    </TD>
                    <TD><CurrencyTag code={t.from_currency} /></TD>
                    <TD><CurrencyTag code={t.to_currency} /></TD>
                    <TD>
                      <span className="font-semibold kpi-value" style={{ color: '#F87171' }}>
                        {t.from_currency === 'USD' ? formatUSD(Number(t.amount_given)) : formatHTG(Number(t.amount_given))}
                      </span>
                    </TD>
                    <TD mono>{Number(t.rate_applied).toFixed(4)}</TD>
                    <TD>
                      <span className="font-semibold kpi-value" style={{ color: '#4ADE80' }}>
                        {t.to_currency === 'USD' ? formatUSD(Number(t.amount_received)) : formatHTG(Number(t.amount_received))}
                      </span>
                    </TD>
                    <TD>{t.agents?.name ?? '—'}</TD>
                    <TD>{formatDate(t.created_at)}</TD>
                  </TR>
                ))}
              </Table>
            )}
          </DataCard>
          {exchDetail.length > 0 && (
            <p className="text-xs mt-2 text-right" style={{ color: 'rgba(255,255,255,0.22)' }}>
              50 opérations les plus récentes affichées
            </p>
          )}
        </section>

      </PageShell>
    </>
  )
}
