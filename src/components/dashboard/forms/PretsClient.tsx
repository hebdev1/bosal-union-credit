'use client'
import * as React from 'react'
import { Calendar } from 'lucide-react'
import { DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { LoanStatusSelect } from '@/components/dashboard/forms/LoanStatusSelect'
import { PretsExportButton } from '@/components/dashboard/forms/PretsExportButton'
import { type PdfReportConfig } from '@/lib/pdfConfig'

function formatHTG(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function formatDate(d: string) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
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

function filterByDate<T extends { created_at: string }>(
  rows: T[], preset: DatePreset, from: string, to: string
): T[] {
  const { start, end } = getDateBounds(preset, from, to)
  if (!start && !end) return rows
  return rows.filter(r => {
    const d = new Date(r.created_at)
    if (start && d < start) return false
    if (end   && d > end)   return false
    return true
  })
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props {
  loans: any[]
  repayments: any[]
  lateCount: number
  reportConfig?: PdfReportConfig
}

export function PretsClient({ loans, repayments, lateCount, reportConfig }: Props) {
  const [datePreset, setDatePreset] = React.useState<DatePreset>('all')
  const [dateFrom,   setDateFrom]   = React.useState('')
  const [dateTo,     setDateTo]     = React.useState('')

  // Repayments have their own date filter
  const [repDatePreset, setRepDatePreset] = React.useState<DatePreset>('all')
  const [repDateFrom,   setRepDateFrom]   = React.useState('')
  const [repDateTo,     setRepDateTo]     = React.useState('')

  function handlePreset(p: DatePreset) { setDatePreset(p); setDateFrom(''); setDateTo('') }
  function handleRepPreset(p: DatePreset) { setRepDatePreset(p); setRepDateFrom(''); setRepDateTo('') }

  const filteredLoans = React.useMemo(
    () => filterByDate(loans, datePreset, dateFrom, dateTo),
    [loans, datePreset, dateFrom, dateTo]
  )
  const filteredRepayments = React.useMemo(
    () => filterByDate(repayments, repDatePreset, repDateFrom, repDateTo),
    [repayments, repDatePreset, repDateFrom, repDateTo]
  )

  const filteredLateCount = filteredRepayments.filter(
    (r: any) => r.status === 'late' || r.status === 'missed'
  ).length

  return (
    <>
      {/* Liste des prêts */}
      <section aria-label="Liste des prêts">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Liste des prêts
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={13} style={{ color: 'rgba(255,255,255,0.30)' }} />
            <div className="flex items-center gap-1 rounded-xl p-1"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
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
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', color: dateFrom ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setDatePreset('all') }}
              className="h-7 rounded-lg px-2 text-xs outline-none"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', color: dateTo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }} />
            <PretsExportButton loans={filteredLoans} repayments={filteredRepayments} config={reportConfig} />
          </div>
        </div>
        <DataCard>
          {filteredLoans.length === 0 ? (
            <EmptyState
              title={datePreset === 'today' ? "Aucun prêt aujourd'hui" : 'Aucun prêt'}
              description={datePreset === 'today' ? 'Les prêts créés aujourd\'hui apparaîtront ici' : 'Cliquez sur "Nouveau prêt" pour en créer un.'}
            />
          ) : (
            <Table headers={['N° Prêt', 'Membre', 'Capital', 'Taux', 'Durée', 'Mensualité', 'Remboursé', 'Objet', 'Statut', 'Date']}>
              {filteredLoans.map((l: any) => {
                const member = l.members
                const rembPercent = l.total_amount_due > 0
                  ? Math.round((Number(l.amount_paid ?? 0) / Number(l.total_amount_due)) * 100)
                  : 0
                return (
                  <TR key={l.id}>
                    <TD mono>{l.loan_number}</TD>
                    <TD>
                      {member ? (
                        <div>
                          <p className="font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{member.member_number}</p>
                        </div>
                      ) : '—'}
                    </TD>
                    <TD>
                      <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.90)' }}>
                        {formatHTG(Number(l.principal_amount))}
                      </span>
                    </TD>
                    <TD mono>{Number(l.interest_rate).toFixed(1)} %</TD>
                    <TD mono>{l.duration_months} mois</TD>
                    <TD>{formatHTG(Number(l.monthly_payment))}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full"
                            style={{
                              width: `${rembPercent}%`,
                              background: rembPercent >= 80 ? '#4ADE80' : rembPercent >= 40 ? '#FCD34D' : '#C41E3A',
                            }} />
                        </div>
                        <span className="text-xs kpi-value" style={{ color: 'rgba(255,255,255,0.55)' }}>{rembPercent}%</span>
                      </div>
                    </TD>
                    <TD>{l.purpose ?? '—'}</TD>
                    <TD><LoanStatusSelect loanId={l.id} currentStatus={l.status} /></TD>
                    <TD>{formatDate(l.created_at)}</TD>
                  </TR>
                )
              })}
            </Table>
          )}
        </DataCard>
      </section>

      {/* Historique des remboursements */}
      <section aria-label="Historique des remboursements">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Historique des remboursements
            </h3>
            {filteredLateCount > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.20)' }}>
                {filteredLateCount} en retard / manqué{filteredLateCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={13} style={{ color: 'rgba(255,255,255,0.30)' }} />
            <div className="flex items-center gap-1 rounded-xl p-1"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              {DATE_PRESETS.map(p => (
                <button key={p.key} type="button" onClick={() => handleRepPreset(p.key)}
                  className="px-3 h-7 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: repDatePreset === p.key ? 'rgba(255,255,255,0.07)' : 'transparent',
                    color:      repDatePreset === p.key ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input type="date" value={repDateFrom} onChange={e => { setRepDateFrom(e.target.value); setRepDatePreset('all') }}
              className="h-7 rounded-lg px-2 text-xs outline-none"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', color: repDateFrom ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
            <input type="date" value={repDateTo} onChange={e => { setRepDateTo(e.target.value); setRepDatePreset('all') }}
              className="h-7 rounded-lg px-2 text-xs outline-none"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', color: repDateTo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }} />
          </div>
        </div>
        <DataCard>
          {filteredRepayments.length === 0 ? (
            <EmptyState
              title={repDatePreset === 'today' ? "Aucun remboursement aujourd'hui" : 'Aucun remboursement enregistré'}
              description={repDatePreset === 'today' ? undefined : 'Les échéances apparaîtront ici une fois créées.'}
            />
          ) : (
            <Table headers={['N° Prêt', 'Membre', 'Échéance', 'Montant dû', 'Montant payé', 'Date échéance', 'Date paiement', 'Statut']}>
              {filteredRepayments.map((r: any) => {
                const loan   = r.loans
                const member = loan?.members
                const isLate = r.status === 'late' || r.status === 'missed'
                return (
                  <TR key={r.id}>
                    <TD mono>{loan?.loan_number ?? '—'}</TD>
                    <TD>
                      {member
                        ? <span style={{ color: 'rgba(255,255,255,0.85)' }}>{member.first_name} {member.last_name}</span>
                        : '—'
                      }
                    </TD>
                    <TD mono>#{r.installment_no}</TD>
                    <TD>
                      <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.80)' }}>
                        {formatHTG(Number(r.amount_due))}
                      </span>
                    </TD>
                    <TD>
                      <span className="font-semibold kpi-value"
                        style={{ color: r.status === 'paid' ? '#4ADE80' : isLate ? '#F87171' : 'rgba(255,255,255,0.60)' }}>
                        {r.amount_paid > 0 ? formatHTG(Number(r.amount_paid)) : '—'}
                      </span>
                    </TD>
                    <TD>{r.due_date  ? formatDate(r.due_date)  : '—'}</TD>
                    <TD>{r.paid_at   ? formatDate(r.paid_at)   : '—'}</TD>
                    <TD>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          background: r.status === 'paid' ? 'rgba(34,197,94,0.10)'  : isLate ? 'rgba(239,68,68,0.10)' : 'rgba(234,179,8,0.10)',
                          color:      r.status === 'paid' ? '#4ADE80'               : isLate ? '#F87171'              : '#FCD34D',
                        }}>
                        {r.status === 'paid' ? 'Payé' : r.status === 'late' ? 'En retard' : r.status === 'missed' ? 'Manqué' : 'En attente'}
                      </span>
                    </TD>
                  </TR>
                )
              })}
            </Table>
          )}
        </DataCard>
      </section>
    </>
  )
}
