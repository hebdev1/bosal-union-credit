import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { CreateExchangeModal } from '@/components/dashboard/forms/CreateExchangeModal'
import { CreateRateModal } from '@/components/dashboard/forms/CreateRateModal'
import { BureauDeChangeHistoryClient } from '@/components/dashboard/forms/BureauDeChangeHistoryClient'
import { BureauDeChangeExportButton } from '@/components/dashboard/forms/BureauDeChangeExportButton'
import { buildPdfConfig, buildTicketConfig } from '@/lib/pdfConfig'
import { formatHTG, formatDate } from '@/lib/formatters'

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

  // Get cooperative name for ticket reprints
  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agentRow } = user ? await (supabase as any)
    .from('agents').select('cooperative_id, name').eq('id', user.id).single() : { data: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coopRow } = agentRow ? await (supabase as any)
    .from('cooperatives').select('name').eq('id', agentRow.cooperative_id).single() : { data: null }
  const coopName  = (coopRow as any)?.name  ?? 'Bosal Credit Union'
  const agentName = (agentRow as any)?.name ?? '—'

  const [ratesRes, txRes, pdfRes] = await Promise.allSettled([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('exchange_rates')
      .select('id, from_currency, to_currency, rate, is_active, created_at, agents(name)')
      .order('created_at', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('exchange_transactions')
      .select('id, client_first_name, client_last_name, from_currency, to_currency, amount_given, rate_applied, amount_received, ticket_number, notes, created_at, agents(name)')
      .order('created_at', { ascending: false })
      .limit(100),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('app_settings').select('key, value').eq('category', 'pdf'),
  ])

  const rates        = (ratesRes.status === 'fulfilled' ? (ratesRes.value.data ?? []) : []) as any[]
  const txs          = (txRes.status === 'fulfilled'   ? (txRes.value.data ?? [])   : []) as any[]
  const reportConfig = buildPdfConfig(((pdfRes as any).status === 'fulfilled' ? ((pdfRes as any).value.data ?? []) : []) as { key: string; value: unknown }[])
  const ticketConfig = buildTicketConfig(((pdfRes as any).status === 'fulfilled' ? ((pdfRes as any).value.data ?? []) : []) as { key: string; value: unknown }[])

  const activeRates       = rates.filter(r => r.is_active)
  const inactiveRates     = rates.filter(r => !r.is_active)
  const totalVolumeGiven  = txs.reduce((s, t) => s + Number(t.amount_given ?? 0), 0)

  return (
    <>
      <Header title="Bureau de change" />
      <PageShell
        title="Bureau de change"
        description={`${activeRates.length} taux actif${activeRates.length !== 1 ? 's' : ''} · ${txs.length} opération${txs.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-2">
            <BureauDeChangeExportButton txs={txs} rates={rates} />
            <CreateRateModal />
            <CreateExchangeModal
              ticketConfig={ticketConfig}
              coopName={coopName}
              agentName={agentName}
              rates={activeRates.map(r => ({
                id: r.id,
                from_currency: r.from_currency,
                to_currency: r.to_currency,
                rate: Number(r.rate),
              }))}
            />
          </div>
        }
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Taux actifs',            value: activeRates.length },
            { label: 'Taux archivés',          value: inactiveRates.length },
            { label: 'Opérations de change',   value: txs.length },
            { label: 'Volume total échangé',   value: formatHTG(totalVolumeGiven) },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* ── Taux actifs ── */}
        <section aria-label="Taux de change actifs">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Taux de change actifs
          </h3>
          {activeRates.length === 0 ? (
            <DataCard>
              <EmptyState
                title="Aucun taux configuré"
                description='Cliquez sur "Nouveau taux" pour définir vos premiers taux de change.'
              />
            </DataCard>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {activeRates.map(r => (
                <div key={r.id} className="rounded-xl p-4 space-y-3"
                  style={{ background: '#0D1018', border: '1px solid rgba(52,211,153,0.18)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CurrencyTag code={r.from_currency} />
                      <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10 }}>→</span>
                      <CurrencyTag code={r.to_currency} />
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
                      actif
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {Number(r.rate).toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      {formatDate(r.created_at)}
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

        {/* ── Historique des taux ── */}
        <section aria-label="Historique des taux de change">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Historique des taux
            </h3>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {rates.length} entrée{rates.length !== 1 ? 's' : ''} au total
            </span>
          </div>
          <DataCard>
            {rates.length === 0 ? (
              <EmptyState title="Aucun taux enregistré" />
            ) : (
              <Table headers={['De', 'Vers', 'Taux', 'Statut', 'Défini par', 'Date']}>
                {rates.map(r => (
                  <TR key={r.id}>
                    <TD><CurrencyTag code={r.from_currency} /></TD>
                    <TD><CurrencyTag code={r.to_currency} /></TD>
                    <TD>
                      <span className="font-semibold font-mono kpi-value" style={{ color: 'rgba(255,255,255,0.88)' }}>
                        {Number(r.rate).toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                    </TD>
                    <TD>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          background: r.is_active ? 'rgba(52,211,153,0.10)' : 'rgba(255,255,255,0.05)',
                          color:      r.is_active ? '#34D399'                : 'rgba(255,255,255,0.30)',
                        }}>
                        {r.is_active ? 'Actif' : 'Archivé'}
                      </span>
                    </TD>
                    <TD>{r.agents?.name ?? '—'}</TD>
                    <TD>{formatDate(r.created_at)}</TD>
                  </TR>
                ))}
              </Table>
            )}
          </DataCard>
        </section>

        <BureauDeChangeHistoryClient
          txs={txs}
          rates={rates}
          ticketConfig={ticketConfig}
          reportConfig={reportConfig}
          agentName={agentName}
          coopName={coopName}
        />
      </PageShell>
    </>
  )
}
