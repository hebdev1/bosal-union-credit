'use client'
import * as React from 'react'
import { Calendar, X, FileText, Receipt, ArrowRightLeft, Coins } from 'lucide-react'
import { DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'

function fHTG(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fDate(d: string) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}
function fDateTime(d: string) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}
function fTime(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

interface DailyClosing {
  id: string
  closing_date: string
  opening_balance: number
  closing_balance: number | null
  total_deposits: number | null
  total_withdrawals: number | null
  total_loan_repayments: number | null
  total_exchange_in: number | null
  total_exchange_out: number | null
  status: string
  closed_at: string | null
  notes: string | null
  agents: { name: string } | null
}

interface TodayStats {
  closingDate: string
  openingBalance: number
  deposits: number
  withdrawals: number
  repayments: number
  exchangeIn: number
  exchangeOut: number
  depositCount: number
  withdrawalCount: number
  adjustmentCount: number
  repaymentCount: number
  exchangeCount: number
}

interface DetailTx {
  id: string
  created_at: string
  transaction_type: string
  amount: number
  status: string
  reference: string | null
  motif: string | null
  account_number: string | null
  member_name: string | null
  currency: string | null
}

interface DetailExchange {
  id: string
  created_at: string
  from_currency: string
  to_currency: string
  amount_given: number
  amount_received: number
  rate_applied: number
  ticket_number: string | null
}

interface DetailRepayment {
  id: string
  created_at: string
  amount_paid: number
  status: string
  loan_number: string | null
  member_name: string | null
}

interface Props {
  closings: DailyClosing[]
  todayStats: TodayStats | null
  isOpen: boolean
  detailTransactions: DetailTx[]
  detailExchanges: DetailExchange[]
  detailRepayments: DetailRepayment[]
}

const TX_LABEL: Record<string, string> = {
  deposit: 'Dépôt',
  withdrawal: 'Retrait',
  transfer: 'Transfert',
  adjustment: 'Ajustement',
  loan_disbursement: 'Décaissement',
  loan_repayment: 'Remboursement',
}

const TX_COLOR: Record<string, string> = {
  deposit: '#4ADE80',
  withdrawal: '#F87171',
  transfer: '#60A5FA',
  adjustment: '#FCD34D',
  loan_disbursement: '#A78BFA',
  loan_repayment: '#34D399',
}

export function RapportsClient({
  closings,
  todayStats,
  isOpen,
  detailTransactions,
  detailExchanges,
  detailRepayments,
}: Props) {
  // Date filter applies to closing history + detail tables
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')

  const closedClosings = React.useMemo(
    () => closings.filter(c => c.status === 'closed'),
    [closings]
  )

  const filteredClosings = React.useMemo(() => {
    return closedClosings.filter(c => {
      if (dateFrom && c.closing_date < dateFrom) return false
      if (dateTo   && c.closing_date > dateTo)   return false
      return true
    })
  }, [closedClosings, dateFrom, dateTo])

  const within = React.useCallback((iso: string) => {
    const d = iso.slice(0, 10)
    if (dateFrom && d < dateFrom) return false
    if (dateTo   && d > dateTo)   return false
    return true
  }, [dateFrom, dateTo])

  const filteredTx  = React.useMemo(() => detailTransactions.filter(t => within(t.created_at)), [detailTransactions, within])
  const filteredEx  = React.useMemo(() => detailExchanges.filter(e => within(e.created_at)), [detailExchanges, within])
  const filteredRep = React.useMemo(() => detailRepayments.filter(r => within(r.created_at)), [detailRepayments, within])

  const estimatedClosing = todayStats
    ? todayStats.openingBalance
      + todayStats.deposits
      - todayStats.withdrawals
      + todayStats.repayments
      + todayStats.exchangeIn
      - todayStats.exchangeOut
    : 0

  return (
    <>
      {/* ── Today section ── */}
      {todayStats ? (
        <section aria-label="Journée en cours">
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Journée du {fDate(todayStats.closingDate)}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isOpen ? 'Journée en cours — utilisez le bouton « Clôturer » dans l\'entête pour la fermer.' : 'Journée clôturée'}
            </p>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {[
              { label: 'Solde ouverture',   value: fHTG(todayStats.openingBalance),   color: 'rgba(255,255,255,0.80)' },
              { label: `Dépôts (${todayStats.depositCount})`,     value: fHTG(todayStats.deposits),       color: '#4ADE80' },
              { label: `Retraits (${todayStats.withdrawalCount})`,  value: fHTG(todayStats.withdrawals),    color: '#F87171' },
              { label: `Remboursements (${todayStats.repaymentCount})`, value: fHTG(todayStats.repayments),     color: '#60A5FA' },
              { label: `Change (${todayStats.exchangeCount})`,     value: fHTG(todayStats.exchangeIn - todayStats.exchangeOut), color: '#FCD34D' },
              { label: 'Solde estimé',      value: fHTG(estimatedClosing),           color: estimatedClosing >= todayStats.openingBalance ? '#4ADE80' : '#F87171' },
            ].map(k => (
              <div key={k.label} className="rounded-xl px-4 py-3" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
                <p className="text-base font-bold kpi-value" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>{k.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-xl px-5 py-8 text-center" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Aucune journée ouverte
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
            La journée s&apos;ouvre automatiquement après une clôture.
          </p>
        </div>
      )}

      {/* ── Date filter (shared) ── */}
      <section aria-label="Filtres">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={13} style={{ color: 'rgba(255,255,255,0.30)' }} />
          <span className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.40)' }}>Période</span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="h-7 rounded-lg px-2 text-xs outline-none"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', color: dateFrom ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }}
          />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="h-7 rounded-lg px-2 text-xs outline-none"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', color: dateTo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }}
          />
          {(dateFrom || dateTo) && (
            <button type="button" onClick={() => { setDateFrom(''); setDateTo('') }}
              className="h-7 w-7 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </section>

      {/* ── Closing history ── */}
      <section aria-label="Historique des clôtures">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Historique des clôtures journalières
          </h3>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {filteredClosings.length} clôture{filteredClosings.length !== 1 ? 's' : ''}
          </span>
        </div>

        <DataCard>
          {filteredClosings.length === 0 ? (
            <EmptyState
              title="Aucune clôture"
              description={dateFrom || dateTo ? 'Aucune clôture dans cette période.' : 'Les clôtures journalières apparaîtront ici.'}
            />
          ) : (
            <Table headers={['Date', 'Sol. ouverture', 'Dépôts', 'Retraits', 'Remboursements', 'Change net', 'Sol. clôture', 'Clôturé par', 'Heure', 'Remarques']}>
              {filteredClosings.map(c => (
                <TR key={c.id}>
                  <TD mono>{fDate(c.closing_date)}</TD>
                  <TD>
                    <span className="kpi-value text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {fHTG(Number(c.opening_balance))}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-xs font-semibold" style={{ color: '#4ADE80' }}>
                      {fHTG(Number(c.total_deposits ?? 0))}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-xs font-semibold" style={{ color: '#F87171' }}>
                      {fHTG(Number(c.total_withdrawals ?? 0))}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-xs" style={{ color: '#60A5FA' }}>
                      {fHTG(Number(c.total_loan_repayments ?? 0))}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-xs" style={{ color: '#FCD34D' }}>
                      {fHTG(Number(c.total_exchange_in ?? 0) - Number(c.total_exchange_out ?? 0))}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-sm font-bold" style={{ color: Number(c.closing_balance ?? 0) >= Number(c.opening_balance) ? '#4ADE80' : '#F87171' }}>
                      {fHTG(Number(c.closing_balance ?? 0))}
                    </span>
                  </TD>
                  <TD>{c.agents?.name ?? '—'}</TD>
                  <TD mono>{c.closed_at ? fDateTime(c.closed_at) : '—'}</TD>
                  <TD>
                    {c.notes ? (
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
                        <FileText size={10} />
                        {c.notes.length > 30 ? c.notes.slice(0, 30) + '…' : c.notes}
                      </span>
                    ) : '—'}
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </DataCard>
      </section>

      {/* ── Détail des opérations ── */}
      <section aria-label="Détail des transactions">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 flex items-center justify-center rounded-md" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}>
            <Receipt size={12} />
          </span>
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Transactions <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>(90 derniers jours)</span>
          </h3>
          <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {filteredTx.length} opération{filteredTx.length !== 1 ? 's' : ''}
          </span>
        </div>
        <DataCard>
          {filteredTx.length === 0 ? (
            <EmptyState title="Aucune transaction" description="Aucune transaction dans la période sélectionnée." />
          ) : (
            <Table headers={['Date & heure', 'Type', 'Membre', 'Compte / Réf.', 'Motif', 'Montant', 'Statut']}>
              {filteredTx.map(t => (
                <TR key={t.id}>
                  <TD mono>{fTime(t.created_at)}</TD>
                  <TD>
                    <span className="text-xs font-semibold" style={{ color: TX_COLOR[t.transaction_type] ?? 'rgba(255,255,255,0.80)' }}>
                      {TX_LABEL[t.transaction_type] ?? t.transaction_type}
                    </span>
                  </TD>
                  <TD>{t.member_name ?? '—'}</TD>
                  <TD mono>{t.account_number ?? t.reference ?? '—'}</TD>
                  <TD>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {t.motif ? (t.motif.length > 40 ? t.motif.slice(0, 40) + '…' : t.motif) : '—'}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-xs font-semibold" style={{ color: TX_COLOR[t.transaction_type] ?? 'rgba(255,255,255,0.85)' }}>
                      {fHTG(t.amount)}
                    </span>
                  </TD>
                  <TD>
                    <span className="text-[10px] uppercase" style={{ color: t.status === 'completed' || t.status === 'approved' ? '#4ADE80' : t.status === 'pending' ? '#FCD34D' : 'rgba(255,255,255,0.45)' }}>
                      {t.status}
                    </span>
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </DataCard>
      </section>

      {/* ── Opérations de change ── */}
      <section aria-label="Opérations de change">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 flex items-center justify-center rounded-md" style={{ background: 'rgba(252,211,77,0.12)', color: '#FCD34D' }}>
            <ArrowRightLeft size={12} />
          </span>
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Opérations de change <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>(90 derniers jours)</span>
          </h3>
          <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {filteredEx.length} opération{filteredEx.length !== 1 ? 's' : ''}
          </span>
        </div>
        <DataCard>
          {filteredEx.length === 0 ? (
            <EmptyState title="Aucun change" description="Aucune opération de change dans la période sélectionnée." />
          ) : (
            <Table headers={['Date & heure', 'Ticket', 'Paire', 'Donné', 'Reçu', 'Taux']}>
              {filteredEx.map(e => (
                <TR key={e.id}>
                  <TD mono>{fTime(e.created_at)}</TD>
                  <TD mono>{e.ticket_number ?? '—'}</TD>
                  <TD>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
                      {e.from_currency} → {e.to_currency}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-xs font-semibold" style={{ color: '#F87171' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: e.from_currency, minimumFractionDigits: 2 }).format(e.amount_given)}
                    </span>
                  </TD>
                  <TD>
                    <span className="kpi-value text-xs font-semibold" style={{ color: '#4ADE80' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: e.to_currency, minimumFractionDigits: 2 }).format(e.amount_received)}
                    </span>
                  </TD>
                  <TD mono>{e.rate_applied.toFixed(4)}</TD>
                </TR>
              ))}
            </Table>
          )}
        </DataCard>
      </section>

      {/* ── Remboursements ── */}
      <section aria-label="Remboursements de prêt">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 flex items-center justify-center rounded-md" style={{ background: 'rgba(96,165,250,0.12)', color: '#60A5FA' }}>
            <Coins size={12} />
          </span>
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Remboursements de prêt <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>(90 derniers jours)</span>
          </h3>
          <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {filteredRep.length} opération{filteredRep.length !== 1 ? 's' : ''}
          </span>
        </div>
        <DataCard>
          {filteredRep.length === 0 ? (
            <EmptyState title="Aucun remboursement" description="Aucun remboursement dans la période sélectionnée." />
          ) : (
            <Table headers={['Date & heure', 'N° prêt', 'Emprunteur', 'Montant', 'Statut']}>
              {filteredRep.map(r => (
                <TR key={r.id}>
                  <TD mono>{fTime(r.created_at)}</TD>
                  <TD mono>{r.loan_number ?? '—'}</TD>
                  <TD>{r.member_name ?? '—'}</TD>
                  <TD>
                    <span className="kpi-value text-xs font-semibold" style={{ color: '#60A5FA' }}>
                      {fHTG(r.amount_paid)}
                    </span>
                  </TD>
                  <TD>
                    <span className="text-[10px] uppercase" style={{ color: r.status === 'paid' ? '#4ADE80' : 'rgba(255,255,255,0.45)' }}>
                      {r.status}
                    </span>
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </DataCard>
      </section>
    </>
  )
}
