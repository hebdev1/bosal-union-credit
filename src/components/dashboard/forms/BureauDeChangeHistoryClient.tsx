'use client'
import * as React from 'react'
import { Calendar } from 'lucide-react'
import { DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { ExchangeTicketButton } from '@/components/dashboard/forms/ExchangeTicketButton'
import { BureauDeChangeExportButton } from '@/components/dashboard/forms/BureauDeChangeExportButton'
import { type TicketConfig } from '@/components/dashboard/forms/ExchangeTicketPDF'
import { type PdfReportConfig } from '@/lib/pdfConfig'

function formatHTG(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}
function formatDate(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

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

type DatePreset = 'today' | '7d' | '30d' | 'all'
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d',    label: '7 jours'    },
  { key: '30d',   label: '30 jours'   },
  { key: 'all',   label: 'Tout'       },
]

function getDateBounds(preset: DatePreset, from: string, to: string): { start: Date | null; end: Date | null } {
  const now = new Date()
  if (preset === 'today') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end:   new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
    }
  }
  if (preset === '7d')  return { start: new Date(Date.now() - 7  * 86400000), end: null }
  if (preset === '30d') return { start: new Date(Date.now() - 30 * 86400000), end: null }
  if (from || to) {
    return {
      start: from ? new Date(from) : null,
      end:   to   ? new Date(to + 'T23:59:59.999') : null,
    }
  }
  return { start: null, end: null }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  txs: any[]
  rates: any[]
  ticketConfig: TicketConfig
  reportConfig?: PdfReportConfig
  agentName: string
  coopName: string
}

export function BureauDeChangeHistoryClient({ txs, rates, ticketConfig, reportConfig, agentName, coopName }: Props) {
  const [datePreset, setDatePreset] = React.useState<DatePreset>('today')
  const [dateFrom,   setDateFrom]   = React.useState('')
  const [dateTo,     setDateTo]     = React.useState('')

  function handlePreset(p: DatePreset) { setDatePreset(p); setDateFrom(''); setDateTo('') }

  const filtered = React.useMemo(() => {
    const { start, end } = getDateBounds(datePreset, dateFrom, dateTo)
    if (!start && !end) return txs
    return txs.filter((t: any) => {
      const d = new Date(t.created_at)
      if (start && d < start) return false
      if (end   && d > end)   return false
      return true
    })
  }, [txs, datePreset, dateFrom, dateTo])

  return (
    <section aria-label="Historique des opérations de change">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Historique des opérations
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={13} style={{ color: 'rgba(255,255,255,0.30)' }} />
          <div className="flex items-center gap-1 rounded-xl p-1"
            style={{ background: '#111318', border: '1px solid #252A36' }}>
            {DATE_PRESETS.map(p => (
              <button key={p.key} type="button" onClick={() => handlePreset(p.key)}
                className="px-3 h-7 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: datePreset === p.key ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color:      datePreset === p.key ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setDatePreset('all') }}
            className="h-7 rounded-lg px-2 text-xs outline-none"
            style={{ background: '#111318', border: '1px solid #252A36', color: dateFrom ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setDatePreset('all') }}
            className="h-7 rounded-lg px-2 text-xs outline-none"
            style={{ background: '#111318', border: '1px solid #252A36', color: dateTo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }} />
          <BureauDeChangeExportButton txs={filtered} rates={rates} config={reportConfig} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {filtered.length} opération{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <DataCard>
        {filtered.length === 0 ? (
          <EmptyState
            title={datePreset === 'today' ? "Aucune opération aujourd'hui" : 'Aucune opération de change'}
            description={datePreset === 'today'
              ? 'Les opérations du jour apparaîtront ici'
              : 'Utilisez "Nouvelle opération" pour enregistrer un échange.'
            }
          />
        ) : (
          <Table headers={['Ticket', 'Client', 'De', 'Vers', 'Montant donné', 'Taux', 'Montant reçu', 'Agent', 'Date', '']}>
            {filtered.map((t: any) => (
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
  )
}
