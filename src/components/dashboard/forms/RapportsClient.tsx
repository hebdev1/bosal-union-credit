'use client'
import * as React from 'react'
import { MoonStar, Calendar, Loader2, Check, X, AlertTriangle, FileText, ChevronDown, ChevronRight, ArrowRightLeft, Receipt, Coins } from 'lucide-react'
import { closeDay } from '@/app/(dashboard)/tableau-de-bord/cloture/actions'
import { getSessionDetail, type SessionDetail } from '@/app/(dashboard)/tableau-de-bord/rapports/actions'
import { useRouter } from 'next/navigation'
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

interface Props {
  closings: DailyClosing[]
  todayStats: TodayStats | null
  isOpen: boolean
}

export function RapportsClient({ closings, todayStats, isOpen }: Props) {
  const router = useRouter()

  // Modal state
  const [showModal, setShowModal] = React.useState(false)
  const [notes, setNotes] = React.useState('')
  const [closingState, setClosingState] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [closingErr, setClosingErr] = React.useState('')

  // Date filter for history
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')

  // Per-session drill-down
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [detailCache, setDetailCache] = React.useState<Record<string, SessionDetail>>({})
  const [loadingId, setLoadingId] = React.useState<string | null>(null)
  const [detailError, setDetailError] = React.useState<Record<string, string>>({})

  async function toggleSession(id: string) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (detailCache[id]) return
    setLoadingId(id)
    const res = await getSessionDetail(id)
    setLoadingId(null)
    if ('error' in res) {
      setDetailError(prev => ({ ...prev, [id]: res.error }))
      return
    }
    setDetailCache(prev => ({ ...prev, [id]: res }))
  }

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

  async function handleCloseDay() {
    setClosingState('loading')
    const result = await closeDay(notes || undefined)
    if ('error' in result) {
      setClosingErr(result.error)
      setClosingState('error')
      return
    }
    setClosingState('success')
    setTimeout(() => {
      setShowModal(false)
      setNotes('')
      setClosingState('idle')
      router.refresh()
    }, 2200)
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Journée du {fDate(todayStats.closingDate)}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {isOpen ? 'Journée en cours' : 'Journée clôturée'}
              </p>
            </div>
            {isOpen && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
                style={{ background: 'rgba(196,30,58,0.12)', color: '#E8314F', border: '1px solid rgba(196,30,58,0.28)' }}
              >
                <MoonStar size={15} />
                Fermer la journée
              </button>
            )}
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
            La journée s'ouvre automatiquement après une clôture.
          </p>
        </div>
      )}

      {/* ── Closing history ── */}
      <section aria-label="Historique des clôtures">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Historique des clôtures journalières
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={13} style={{ color: 'rgba(255,255,255,0.30)' }} />
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
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="h-7 w-7 flex items-center justify-center rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)' }}
              >
                <X size={12} />
              </button>
            )}
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {filteredClosings.length} clôture{filteredClosings.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <DataCard>
          {filteredClosings.length === 0 ? (
            <EmptyState
              title="Aucune clôture"
              description={dateFrom || dateTo ? 'Aucune clôture dans cette période.' : 'Les clôtures journalières apparaîtront ici.'}
            />
          ) : (
            <Table headers={['', 'Date', 'Sol. ouverture', 'Dépôts', 'Retraits', 'Remboursements', 'Change net', 'Sol. clôture', 'Clôturé par', 'Heure', 'Remarques']}>
              {filteredClosings.map(c => {
                const netChange = (Number(c.closing_balance ?? 0)) - (Number(c.opening_balance))
                const isExpanded = expandedId === c.id
                const detail = detailCache[c.id]
                const err = detailError[c.id]
                return (
                  <React.Fragment key={c.id}>
                  <TR>
                    <TD>
                      <button
                        type="button"
                        onClick={() => toggleSession(c.id)}
                        aria-label={isExpanded ? 'Masquer le détail' : 'Afficher le détail'}
                        className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                        style={{ background: isExpanded ? 'rgba(196,30,58,0.15)' : 'rgba(255,255,255,0.04)', color: isExpanded ? '#E8314F' : 'rgba(255,255,255,0.55)' }}
                      >
                        {loadingId === c.id ? <Loader2 size={11} className="animate-spin" /> : isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                    </TD>
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
                      <span className="kpi-value text-sm font-bold" style={{ color: netChange >= 0 ? '#4ADE80' : '#F87171' }}>
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
                  {isExpanded && (
                    <tr style={{ background: 'rgba(255,255,255,0.015)' }}>
                      <td colSpan={11} style={{ padding: 0 }}>
                        <SessionDetailPanel detail={detail} loading={loadingId === c.id} error={err} />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                )
              })}
            </Table>
          )}
        </DataCard>
      </section>

      {/* ── Close day modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.70)' }}
            onClick={() => { if (closingState === 'idle') setShowModal(false) }}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md rounded-2xl"
            style={{ background: '#111520', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(196,30,58,0.14)', border: '1px solid rgba(196,30,58,0.25)' }}>
                <MoonStar size={17} style={{ color: '#E8314F' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Fermer la journée
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {todayStats ? fDate(todayStats.closingDate) : ''}
                </p>
              </div>
              {closingState === 'idle' && (
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ color: 'rgba(255,255,255,0.40)', background: 'rgba(255,255,255,0.05)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(252,211,77,0.07)', border: '1px solid rgba(252,211,77,0.20)' }}>
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#FCD34D' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#FCD34D' }}>
                  Cette action est <strong>irréversible</strong>. Vérifiez les chiffres ci-dessous avant de confirmer.
                </p>
              </div>

              {/* Stats summary */}
              {todayStats && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                  {[
                    { label: 'Solde d\'ouverture',  value: fHTG(todayStats.openingBalance),  color: 'rgba(255,255,255,0.70)' },
                    { label: `Dépôts (${todayStats.depositCount})`,      value: '+' + fHTG(todayStats.deposits),      color: '#4ADE80' },
                    { label: `Retraits (${todayStats.withdrawalCount})`,    value: '-' + fHTG(todayStats.withdrawals),    color: '#F87171' },
                    { label: `Remboursements (${todayStats.repaymentCount})`, value: '+' + fHTG(todayStats.repayments),    color: '#60A5FA' },
                    { label: `Change entrées`,       value: '+' + fHTG(todayStats.exchangeIn),   color: '#FCD34D' },
                    { label: `Change sorties`,       value: '-' + fHTG(todayStats.exchangeOut),  color: '#FCD34D' },
                  ].map((row, i) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-2.5"
                      style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{row.label}</span>
                      <span className="text-xs font-semibold kpi-value" style={{ color: row.color }}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>Solde de clôture estimé</span>
                    <span className="text-base font-bold kpi-value" style={{ color: estimatedClosing >= todayStats.openingBalance ? '#4ADE80' : '#F87171' }}>
                      {fHTG(estimatedClosing)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Remarques (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ajouter des informations supplémentaires sur cette journée…"
                  rows={3}
                  disabled={closingState !== 'idle'}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid #3B4260',
                    color: 'rgba(255,255,255,0.85)',
                    opacity: closingState !== 'idle' ? 0.5 : 1,
                  }}
                />
              </div>

              {/* Error message */}
              {closingState === 'error' && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
                  <X size={14} style={{ color: '#F87171' }} />
                  <p className="text-xs" style={{ color: '#F87171' }}>{closingErr || 'Erreur lors de la clôture'}</p>
                </div>
              )}

              {/* Success */}
              {closingState === 'success' && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.22)' }}>
                  <Check size={14} style={{ color: '#4ADE80' }} />
                  <p className="text-xs" style={{ color: '#4ADE80' }}>Journée clôturée avec succès !</p>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={closingState === 'loading' || closingState === 'success'}
                className="flex-1 h-10 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCloseDay}
                disabled={closingState !== 'idle'}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: closingState === 'success' ? 'rgba(74,222,128,0.15)' : '#C41E3A',
                  color: closingState === 'success' ? '#4ADE80' : '#fff',
                  opacity: closingState === 'loading' ? 0.7 : 1,
                }}
              >
                {closingState === 'loading' && <Loader2 size={14} className="animate-spin" />}
                {closingState === 'success' && <Check size={14} />}
                {closingState === 'idle' && <MoonStar size={14} />}
                {closingState === 'loading' ? 'Clôture en cours…' : closingState === 'success' ? 'Clôturé !' : 'Confirmer la clôture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
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

function fTime(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-HT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso))
}

function SessionDetailPanel({
  detail,
  loading,
  error,
}: {
  detail: SessionDetail | undefined
  loading: boolean
  error: string | undefined
}) {
  if (loading && !detail) {
    return (
      <div className="px-6 py-6 flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
        <Loader2 size={13} className="animate-spin" />
        Chargement du détail de la session…
      </div>
    )
  }
  if (error) {
    return (
      <div className="px-6 py-5 text-xs" style={{ color: '#F87171' }}>
        Erreur : {error}
      </div>
    )
  }
  if (!detail) return null

  const { transactions, exchanges, repayments } = detail
  const totalOps = transactions.length + exchanges.length + repayments.length

  if (totalOps === 0) {
    return (
      <div className="px-6 py-5 text-xs italic" style={{ color: 'rgba(255,255,255,0.40)' }}>
        Aucune opération enregistrée durant cette session.
      </div>
    )
  }

  const SectionTitle = ({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="w-6 h-6 flex items-center justify-center rounded-md" style={{ background: `${color}15`, color }}>
        {icon}
      </span>
      <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.70)', letterSpacing: '0.07em' }}>
        {label}
      </h4>
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>
        {count}
      </span>
    </div>
  )

  return (
    <div className="px-6 py-5 space-y-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {transactions.length > 0 && (
        <section>
          <SectionTitle icon={<Receipt size={12} />} label="Transactions" count={transactions.length} color="#4ADE80" />
          <div className="rounded-lg overflow-hidden" style={{ background: '#0B0E15', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-[90px_120px_1fr_1fr_120px_100px] gap-3 px-3 py-2 text-[10px] font-semibold uppercase"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
              <span>Heure</span><span>Type</span><span>Membre</span><span>Compte / Réf.</span><span className="text-right">Montant</span><span>Statut</span>
            </div>
            {transactions.map(t => (
              <div key={t.id} className="grid grid-cols-[90px_120px_1fr_1fr_120px_100px] gap-3 px-3 py-2 items-center text-xs"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>{fTime(t.created_at)}</span>
                <span className="font-semibold" style={{ color: TX_COLOR[t.transaction_type] ?? 'rgba(255,255,255,0.80)' }}>
                  {TX_LABEL[t.transaction_type] ?? t.transaction_type}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{t.member_name ?? '—'}</span>
                <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t.account_number ?? t.reference ?? '—'}
                </span>
                <span className="text-right font-semibold kpi-value" style={{ color: TX_COLOR[t.transaction_type] ?? 'rgba(255,255,255,0.85)' }}>
                  {fHTG(t.amount)}
                </span>
                <span className="text-[10px] uppercase" style={{ color: t.status === 'completed' || t.status === 'approved' ? '#4ADE80' : t.status === 'pending' ? '#FCD34D' : 'rgba(255,255,255,0.50)' }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {exchanges.length > 0 && (
        <section>
          <SectionTitle icon={<ArrowRightLeft size={12} />} label="Opérations de change" count={exchanges.length} color="#FCD34D" />
          <div className="rounded-lg overflow-hidden" style={{ background: '#0B0E15', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-[90px_110px_140px_140px_100px_1fr] gap-3 px-3 py-2 text-[10px] font-semibold uppercase"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
              <span>Heure</span><span>Ticket</span><span>Donné</span><span>Reçu</span><span>Taux</span><span>Paire</span>
            </div>
            {exchanges.map(e => (
              <div key={e.id} className="grid grid-cols-[90px_110px_140px_140px_100px_1fr] gap-3 px-3 py-2 items-center text-xs"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>{fTime(e.created_at)}</span>
                <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{e.ticket_number ?? '—'}</span>
                <span className="kpi-value" style={{ color: '#F87171' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: e.from_currency, minimumFractionDigits: 2 }).format(e.amount_given)}
                </span>
                <span className="kpi-value" style={{ color: '#4ADE80' }}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: e.to_currency, minimumFractionDigits: 2 }).format(e.amount_received)}
                </span>
                <span className="font-mono" style={{ color: 'rgba(255,255,255,0.70)' }}>{e.rate_applied.toFixed(4)}</span>
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{e.from_currency} → {e.to_currency}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {repayments.length > 0 && (
        <section>
          <SectionTitle icon={<Coins size={12} />} label="Remboursements de prêt" count={repayments.length} color="#60A5FA" />
          <div className="rounded-lg overflow-hidden" style={{ background: '#0B0E15', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-[90px_140px_1fr_140px_100px] gap-3 px-3 py-2 text-[10px] font-semibold uppercase"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
              <span>Heure</span><span>N° prêt</span><span>Emprunteur</span><span className="text-right">Montant</span><span>Statut</span>
            </div>
            {repayments.map(r => (
              <div key={r.id} className="grid grid-cols-[90px_140px_1fr_140px_100px] gap-3 px-3 py-2 items-center text-xs"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="font-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>{fTime(r.created_at)}</span>
                <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{r.loan_number ?? '—'}</span>
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>{r.member_name ?? '—'}</span>
                <span className="text-right font-semibold kpi-value" style={{ color: '#60A5FA' }}>{fHTG(r.amount_paid)}</span>
                <span className="text-[10px] uppercase" style={{ color: r.status === 'paid' ? '#4ADE80' : 'rgba(255,255,255,0.50)' }}>{r.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
