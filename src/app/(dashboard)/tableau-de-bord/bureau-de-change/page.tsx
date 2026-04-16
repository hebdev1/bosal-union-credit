import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { CreateExchangeModal } from '@/components/dashboard/forms/CreateExchangeModal'
import { CreateRateModal } from '@/components/dashboard/forms/CreateRateModal'
import { BureauDeChangeExportButton } from '@/components/dashboard/forms/BureauDeChangeExportButton'
import { ExchangeTicketButton } from '@/components/dashboard/forms/ExchangeTicketButton'
import { type TicketConfig, DEFAULT_CONFIG } from '@/components/dashboard/forms/ExchangeTicketPDF'
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

  // Get cooperative name for ticket reprints
  const { data: { user } } = await supabase.auth.getUser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agentRow } = user ? await (supabase as any)
    .from('agents').select('cooperative_id, name').eq('id', user.id).single() : { data: null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coopRow } = agentRow ? await (supabase as any)
    .from('cooperatives').select('name').eq('id', agentRow.cooperative_id).single() : { data: null }
  const coopName  = (coopRow as any)?.name  ?? 'Bosal Union Crédit'
  const agentName = (agentRow as any)?.name ?? '—'

  // Fetch ticket color settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ticketSettings } = await (supabase as any)
    .from('app_settings')
    .select('key, value')
    .in('key', ['ticket_accent_color', 'ticket_received_color'])
  const settingMap: Record<string, string> = {}
  for (const s of (ticketSettings ?? [])) settingMap[s.key] = String(s.value).replace(/"/g, '')
  const ticketConfig: TicketConfig = {
    accent_color:   settingMap['ticket_accent_color']   || DEFAULT_CONFIG.accent_color,
    received_color: settingMap['ticket_received_color'] || DEFAULT_CONFIG.received_color,
  }

  const [ratesRes, txRes] = await Promise.allSettled([
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
  ])

  const rates = (ratesRes.status === 'fulfilled' ? (ratesRes.value.data ?? []) : []) as any[]
  const txs   = (txRes.status === 'fulfilled'   ? (txRes.value.data ?? [])   : []) as any[]

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
              style={{ background: '#111318', border: '1px solid #252A36' }}>
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
                  style={{ background: '#111318', border: '1px solid rgba(52,211,153,0.18)' }}>
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

        {/* ── Historique des opérations ── */}
        <section aria-label="Historique des opérations de change">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Historique des opérations
            </h3>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {txs.length} opération{txs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <DataCard>
            {txs.length === 0 ? (
              <EmptyState title="Aucune opération de change" description='Utilisez "Nouvelle opération" pour enregistrer un échange.' />
            ) : (
              <Table headers={['Ticket', 'Client', 'De', 'Vers', 'Montant donné', 'Taux', 'Montant reçu', 'Agent', 'Date', '']}>
                {txs.map(t => (
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
                    <TD>
                      <ExchangeTicketButton
                        config={ticketConfig}
                        ticket={{
                          ticket_number:     t.ticket_number ?? '—',
                          client_first_name: t.client_first_name,
                          client_last_name:  t.client_last_name,
                          from_currency:     t.from_currency,
                          to_currency:       t.to_currency,
                          amount_given:      Number(t.amount_given),
                          rate_applied:      Number(t.rate_applied),
                          amount_received:   Number(t.amount_received),
                          notes:             t.notes ?? null,
                          created_at:        t.created_at,
                          agent_name:        t.agents?.name ?? agentName,
                          coop_name:         coopName,
                        }}
                      />
                    </TD>
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
