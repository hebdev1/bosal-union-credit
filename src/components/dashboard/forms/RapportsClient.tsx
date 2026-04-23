'use client'
import * as React from 'react'
import { Calendar, X, Receipt, ArrowRightLeft, Coins } from 'lucide-react'
import { DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'

function fHTG(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fTime(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
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

type TabId = 'tx' | 'ex' | 'rep'

/* ─── Main ─────────────────────────────────────────────────────────────── */
export function RapportsClient({
  detailTransactions,
  detailExchanges,
  detailRepayments,
}: Props) {
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')
  const [tab, setTab] = React.useState<TabId>('tx')

  const within = React.useCallback((iso: string) => {
    const d = iso.slice(0, 10)
    if (dateFrom && d < dateFrom) return false
    if (dateTo   && d > dateTo)   return false
    return true
  }, [dateFrom, dateTo])

  const filteredTx  = React.useMemo(() => detailTransactions.filter(t => within(t.created_at)), [detailTransactions, within])
  const filteredEx  = React.useMemo(() => detailExchanges.filter(e => within(e.created_at)), [detailExchanges, within])
  const filteredRep = React.useMemo(() => detailRepayments.filter(r => within(r.created_at)), [detailRepayments, within])

  const tabCount = { tx: filteredTx.length, ex: filteredEx.length, rep: filteredRep.length }

  return (
    <>
      {/* ── Date filter ─────────────────────────────────────────────────── */}
      <section aria-label="Filtre de période" className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-[0.1em] px-2.5 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.50)' }}>
          <Calendar size={11} />
          Période
        </div>
        <div className="flex items-center gap-1.5 rounded-lg p-1"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="h-7 rounded px-2 text-xs outline-none bg-transparent"
            style={{ color: dateFrom ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }}
          />
          <span style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="h-7 rounded px-2 text-xs outline-none bg-transparent"
            style={{ color: dateTo ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark' }}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button type="button" onClick={() => { setDateFrom(''); setDateTo('') }}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)' }}>
            <X size={11} /> Réinitialiser
          </button>
        )}
      </section>

      {/* ── Tabbed detail sections ──────────────────────────────────────── */}
      <section aria-label="Détail des opérations">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="text-[13px] font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Détail des opérations
            <span className="ml-2 text-[11px] font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>
              (90 derniers jours)
            </span>
          </h3>

          {/* Tabs */}
          <div className="inline-flex rounded-lg p-1"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { id: 'tx'  as const, label: 'Transactions', icon: Receipt,         color: '#4ADE80', count: tabCount.tx },
              { id: 'ex'  as const, label: 'Change',       icon: ArrowRightLeft,  color: '#FCD34D', count: tabCount.ex },
              { id: 'rep' as const, label: 'Remb. prêts',  icon: Coins,           color: '#60A5FA', count: tabCount.rep },
            ].map(t => {
              const active = tab === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-all"
                  style={{
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: active ? t.color : 'rgba(255,255,255,0.50)',
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  }}>
                  <Icon size={12} />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="tabular-nums text-[10px] px-1.5 rounded-full"
                    style={{ background: active ? `${t.color}22` : 'rgba(255,255,255,0.04)', color: active ? t.color : 'rgba(255,255,255,0.45)' }}>
                    {t.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <DataCard>
          {tab === 'tx' && (
            filteredTx.length === 0 ? (
              <EmptyState title="Aucune transaction" description="Aucune transaction dans la période sélectionnée." />
            ) : (
              <Table headers={['Date', 'Type', 'Membre', 'Compte / Réf.', 'Motif', 'Montant', 'Statut']}>
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
                      <span className="kpi-value text-xs font-semibold tabular-nums" style={{ color: TX_COLOR[t.transaction_type] ?? 'rgba(255,255,255,0.85)' }}>
                        {fHTG(t.amount)}
                      </span>
                    </TD>
                    <TD>
                      <span className="text-[10px] uppercase font-semibold tracking-wide"
                        style={{ color: t.status === 'completed' || t.status === 'approved' ? '#4ADE80' : t.status === 'pending' ? '#FCD34D' : 'rgba(255,255,255,0.45)' }}>
                        {t.status}
                      </span>
                    </TD>
                  </TR>
                ))}
              </Table>
            )
          )}

          {tab === 'ex' && (
            filteredEx.length === 0 ? (
              <EmptyState title="Aucun change" description="Aucune opération de change dans la période sélectionnée." />
            ) : (
              <Table headers={['Date', 'Ticket', 'Paire', 'Donné', 'Reçu', 'Taux']}>
                {filteredEx.map(e => (
                  <TR key={e.id}>
                    <TD mono>{fTime(e.created_at)}</TD>
                    <TD mono>{e.ticket_number ?? '—'}</TD>
                    <TD>
                      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {e.from_currency} → {e.to_currency}
                      </span>
                    </TD>
                    <TD>
                      <span className="kpi-value text-xs font-semibold tabular-nums" style={{ color: '#F87171' }}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: e.from_currency, minimumFractionDigits: 2 }).format(e.amount_given)}
                      </span>
                    </TD>
                    <TD>
                      <span className="kpi-value text-xs font-semibold tabular-nums" style={{ color: '#4ADE80' }}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: e.to_currency, minimumFractionDigits: 2 }).format(e.amount_received)}
                      </span>
                    </TD>
                    <TD mono>{e.rate_applied.toFixed(4)}</TD>
                  </TR>
                ))}
              </Table>
            )
          )}

          {tab === 'rep' && (
            filteredRep.length === 0 ? (
              <EmptyState title="Aucun remboursement" description="Aucun remboursement dans la période sélectionnée." />
            ) : (
              <Table headers={['Date', 'N° prêt', 'Emprunteur', 'Montant', 'Statut']}>
                {filteredRep.map(r => (
                  <TR key={r.id}>
                    <TD mono>{fTime(r.created_at)}</TD>
                    <TD mono>{r.loan_number ?? '—'}</TD>
                    <TD>{r.member_name ?? '—'}</TD>
                    <TD>
                      <span className="kpi-value text-xs font-semibold tabular-nums" style={{ color: '#60A5FA' }}>
                        {fHTG(r.amount_paid)}
                      </span>
                    </TD>
                    <TD>
                      <span className="text-[10px] uppercase font-semibold tracking-wide"
                        style={{ color: r.status === 'paid' ? '#4ADE80' : 'rgba(255,255,255,0.45)' }}>
                        {r.status}
                      </span>
                    </TD>
                  </TR>
                ))}
              </Table>
            )
          )}
        </DataCard>
      </section>
    </>
  )
}
