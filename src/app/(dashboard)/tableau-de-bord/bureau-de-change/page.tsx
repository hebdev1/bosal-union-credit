import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { TrendingUp } from 'lucide-react'
import { formatHTG, formatUSD, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Bureau de change' }

const CURRENCY_COLORS: Record<string, string> = {
  HTG: '#C41E3A', USD: '#3B82F6', CAD: '#EF4444', DOP: '#22C55E',
}

function CurrencyTag({ code }: { code: string }) {
  const color = CURRENCY_COLORS[code] ?? '#666'
  return (
    <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[11px] font-bold kpi-value"
      style={{ background: `${color}20`, color, minWidth: 40 }}>
      {code}
    </span>
  )
}

export default async function BureauDeChangePage() {
  const supabase = await createClient()

  const [ratesRes, txRes] = await Promise.allSettled([
    supabase
      .from('exchange_rates')
      .select('id, from_currency, to_currency, rate, is_active, created_at, agents(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('exchange_transactions')
      .select('id, client_first_name, client_last_name, from_currency, to_currency, amount_given, rate_applied, amount_received, ticket_number, notes, created_at, agents(name)')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const rates = ratesRes.status === 'fulfilled' ? (ratesRes.value.data ?? []) : []
  const txs   = txRes.status === 'fulfilled'   ? (txRes.value.data ?? [])   : []

  const activeRates = rates.filter((r: any) => r.is_active)
  const totalVolumeGiven = txs.reduce((s: number, t: any) => s + Number(t.amount_given ?? 0), 0)

  return (
    <>
      <Header title="Bureau de change" />
      <PageShell
        title="Bureau de change"
        description={`${activeRates.length} taux actif${activeRates.length !== 1 ? 's' : ''} · ${txs.length} transaction${txs.length !== 1 ? 's' : ''}`}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Taux actifs', value: activeRates.length },
            { label: 'Transactions change', value: txs.length },
            { label: 'Volume total échangé', value: formatHTG(totalVolumeGiven) },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Active rates grid */}
        <section aria-label="Taux de change actifs">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>Taux de change actifs</h3>
          {activeRates.length === 0 ? (
            <DataCard>
              <EmptyState icon={TrendingUp} title="Aucun taux configuré" description="Définissez des taux de change pour commencer." />
            </DataCard>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {activeRates.map((r: any) => (
                <div key={r.id} className="rounded-xl p-4 space-y-3 transition-colors"
                  style={{ background: '#111318', border: '1px solid #252A36' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#363D52')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#252A36')}>
                  <div className="flex items-center gap-1.5">
                    <CurrencyTag code={r.from_currency} />
                    <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10 }}>→</span>
                    <CurrencyTag code={r.to_currency} />
                  </div>
                  <div>
                    <p className="text-lg font-bold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {Number(r.rate).toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      Mis à jour {formatDate(r.created_at)}
                    </p>
                  </div>
                  {r.agents && (
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      par {r.agents.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transactions history */}
        <section aria-label="Historique des opérations de change">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>Historique des opérations</h3>
          <DataCard>
            {txs.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Aucune opération de change" />
            ) : (
              <Table headers={['Ticket', 'Client', 'De', 'Vers', 'Montant donné', 'Taux', 'Montant reçu', 'Agent', 'Date']}>
                {txs.map((t: any) => (
                  <TR key={t.id}>
                    <TD mono>{t.ticket_number}</TD>
                    <TD>
                      <span className="font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
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
        </section>
      </PageShell>
    </>
  )
}
