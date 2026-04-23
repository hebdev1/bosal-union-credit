'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  MoonStar, Loader2, Check, X, AlertTriangle, Lock, Sunrise,
} from 'lucide-react'
import {
  closeDay, getTodayStats, openNewDay, type ClosureResult,
} from '@/app/(dashboard)/tableau-de-bord/cloture/actions'

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

function fHTG(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fDate(d: string) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}

/* ─── PDF generator ───────────────────────────────────────────────────────── */
async function generateClosurePDF(data: ClosureResult) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, L = 15, R = W - 15, CW = R - L
  let y = 18

  doc.setFillColor(12, 12, 14); doc.rect(0, 0, W, 38, 'F')
  doc.setTextColor(196, 30, 58); doc.setFont('helvetica', 'bold'); doc.setFontSize(15)
  doc.text('RAPPORT DE CLÔTURE JOURNALIÈRE', W / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(9); doc.setTextColor(180, 180, 180)
  doc.text(data.coopName.toUpperCase(), W / 2, y, { align: 'center' })
  if (data.coopAddress) {
    y += 4.5; doc.setFontSize(8); doc.setTextColor(120, 120, 120)
    doc.text(data.coopAddress, W / 2, y, { align: 'center' })
  }

  y = 46
  doc.setDrawColor(37, 42, 54); doc.line(L, y - 2, R, y - 2)

  doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
  const closedAtFmt = new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(data.closedAt))
  doc.text(`Date : ${fDate(data.closingDate)}`, L, y)
  doc.text(`Heure : ${closedAtFmt.split('à')[1]?.trim() ?? '—'}`, W / 2, y, { align: 'center' })
  doc.text(`Agent : ${data.agentName}`, R, y, { align: 'right' })
  y += 10

  const section = (title: string, yy: number) => {
    doc.setFillColor(17, 19, 24); doc.rect(L, yy - 5, CW, 8, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(196, 30, 58)
    doc.text(title, L + 3, yy)
    return yy + 6
  }
  const row = (label: string, value: string, yy: number, color?: [number, number, number], bold = false) => {
    doc.setDrawColor(26, 31, 46); doc.line(L, yy, R, yy)
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(9)
    doc.setTextColor(color ? color[0] : 160, color ? color[1] : 160, color ? color[2] : 160)
    doc.text(label, L + 3, yy + 4.5)
    doc.text(value, R - 2, yy + 4.5, { align: 'right' })
    return yy + 7
  }

  y = section('BILAN FINANCIER', y)
  y = row('Solde d\'ouverture', fHTG(data.openingBalance), y, [200, 200, 200], true)
  y += 1
  y = row(`Dépôts (${data.depositCount})`, `+ ${fHTG(data.totalDeposits)}`, y, [74, 222, 128])
  y = row(`Retraits (${data.withdrawalCount})`, `- ${fHTG(data.totalWithdrawals)}`, y, [248, 113, 113])
  y = row(`Remboursements (${data.repaymentCount})`, `+ ${fHTG(data.totalLoanRepayments)}`, y, [96, 165, 250])
  y = row('Change entrant', `+ ${fHTG(data.totalExchangeIn)}`, y, [52, 211, 153])
  y = row('Change sortant', `- ${fHTG(data.totalExchangeOut)}`, y, [248, 113, 113])
  y += 1

  doc.setFillColor(17, 19, 24); doc.rect(L, y, CW, 9, 'F')
  doc.setDrawColor(196, 30, 58); doc.line(L, y, R, y); doc.line(L, y + 9, R, y + 9)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255)
  doc.text('SOLDE DE CLÔTURE', L + 3, y + 6)
  doc.setTextColor(74, 222, 128)
  doc.text(fHTG(data.closingBalance), R - 2, y + 6, { align: 'right' })
  y += 14

  if (data.notes) {
    y = section('NOTES', y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(160, 160, 160)
    const lines = doc.splitTextToSize(data.notes, CW - 6)
    doc.text(lines, L + 3, y + 2)
    y += lines.length * 5 + 4
  }

  doc.setFontSize(7); doc.setTextColor(60, 60, 60)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-HT')} — ${data.coopName}`, W / 2, 290, { align: 'center' })

  doc.save(`cloture-${data.closingDate}.pdf`)
}

export function CloseDayButton() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [stats, setStats] = React.useState<TodayStats | null>(null)
  const [loadingStats, setLoadingStats] = React.useState(false)
  const [hasOpenDay, setHasOpenDay] = React.useState<boolean | null>(null)

  // Close-day state
  const [notes, setNotes] = React.useState('')
  const [closing, setClosing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  // Open-day state (when no open day exists)
  const [openingBalance, setOpeningBalance] = React.useState('')
  const [opening, setOpening] = React.useState(false)

  const refreshStats = React.useCallback(async () => {
    setLoadingStats(true)
    const s = await getTodayStats()
    setStats(s)
    setHasOpenDay(Boolean(s))
    setLoadingStats(false)
  }, [])

  // Load once on mount so the button reflects real state
  React.useEffect(() => {
    refreshStats()
  }, [refreshStats])

  function openModal() {
    setError(null); setSuccess(false); setNotes(''); setOpeningBalance('')
    setModalOpen(true)
    refreshStats()
  }

  async function handleClose() {
    setClosing(true); setError(null)
    const result = await closeDay(notes || undefined)
    setClosing(false)
    if ('error' in result) { setError(result.error); return }
    setSuccess(true)
    try { await generateClosurePDF(result) } catch { /* swallow pdf errors */ }
    setTimeout(() => {
      setModalOpen(false); setSuccess(false)
      refreshStats()
      router.refresh()
    }, 1600)
  }

  async function handleOpenDay() {
    const n = Number(openingBalance.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0) {
      setError('Saisissez un solde d\'ouverture valide (≥ 0)')
      return
    }
    setOpening(true); setError(null)
    const res = await openNewDay(n)
    setOpening(false)
    if (res && 'error' in res) { setError(res.error); return }
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      refreshStats()
      router.refresh()
    }, 1000)
  }

  const liveBalance = stats
    ? stats.openingBalance + stats.deposits - stats.withdrawals + stats.repayments + stats.exchangeIn - stats.exchangeOut
    : null

  // ─── Button in header ─────────────────────────────────────────────────────
  const isOpen = hasOpenDay === true
  const btnLabel = hasOpenDay === null ? '…' : isOpen ? 'Clôturer' : 'Ouvrir journée'
  const btnIcon = hasOpenDay === false
    ? <Sunrise size={12} />
    : <MoonStar size={12} />
  const btnColor = hasOpenDay === false
    ? { bg: 'rgba(74,222,128,0.10)', fg: '#4ADE80', border: 'rgba(74,222,128,0.24)' }
    : { bg: 'rgba(196,30,58,0.10)', fg: '#E8314F', border: 'rgba(196,30,58,0.24)' }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label={btnLabel}
        className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-medium transition-colors flex-shrink-0"
        style={{
          background: btnColor.bg,
          color: btnColor.fg,
          border: `1px solid ${btnColor.border}`,
        }}
      >
        {btnIcon}
        <span className="hidden sm:inline whitespace-nowrap">{btnLabel}</span>
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.80)' }}
          onClick={e => { if (e.target === e.currentTarget && !closing && !opening) setModalOpen(false) }}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden my-auto"
            style={{
              background: '#0D1018',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isOpen ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.12)' }}>
                  {isOpen
                    ? <AlertTriangle size={16} style={{ color: '#F87171' }} />
                    : <Sunrise size={16} style={{ color: '#4ADE80' }} />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    {isOpen ? 'Clôturer la journée' : 'Ouvrir une nouvelle journée'}
                  </h2>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {loadingStats ? 'Chargement…'
                      : stats?.closingDate ? fDate(stats.closingDate)
                      : 'Aucune journée ouverte'}
                  </p>
                </div>
              </div>
              {!closing && !opening && !success && (
                <button type="button" onClick={() => setModalOpen(false)}
                  aria-label="Fermer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Body (scrollable) */}
            <div className="px-4 sm:px-6 py-5 space-y-4 overflow-y-auto" style={{ minHeight: 0 }}>
              {loadingStats && hasOpenDay === null ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <Loader2 size={14} className="animate-spin" />
                  Chargement de l&apos;état de la journée…
                </div>
              ) : isOpen ? (
                <>
                  <div className="rounded-xl px-4 py-3.5"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#F87171' }}>
                      Action irréversible
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Le rapport PDF sera téléchargé automatiquement. Une nouvelle journée s&apos;ouvrira avec le solde de clôture comme solde d&apos;ouverture.
                    </p>
                  </div>

                  {stats && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                      {[
                        { label: 'Solde d\'ouverture',                  value: fHTG(stats.openingBalance),       color: 'rgba(255,255,255,0.75)' },
                        { label: `Dépôts (${stats.depositCount})`,     value: '+' + fHTG(stats.deposits),       color: '#4ADE80' },
                        { label: `Retraits (${stats.withdrawalCount})`, value: '-' + fHTG(stats.withdrawals),    color: '#F87171' },
                        { label: `Remb. (${stats.repaymentCount})`,    value: '+' + fHTG(stats.repayments),     color: '#60A5FA' },
                        { label: 'Change entrant',                     value: '+' + fHTG(stats.exchangeIn),     color: '#34D399' },
                        { label: 'Change sortant',                     value: '-' + fHTG(stats.exchangeOut),    color: '#F87171' },
                      ].map((r, i) => (
                        <div key={r.label}
                          className="flex items-center justify-between px-3 sm:px-4 py-2.5 gap-3"
                          style={{
                            background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                          }}>
                          <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.50)' }}>{r.label}</span>
                          <span className="text-xs font-semibold kpi-value whitespace-nowrap" style={{ color: r.color }}>{r.value}</span>
                        </div>
                      ))}
                      {liveBalance !== null && (
                        <div className="flex items-center justify-between px-3 sm:px-4 py-3 gap-3"
                          style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.82)' }}>Solde estimé</span>
                          <span className="text-sm sm:text-base font-bold kpi-value whitespace-nowrap" style={{ color: '#4ADE80' }}>
                            {fHTG(liveBalance)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      Notes <span style={{ color: 'rgba(255,255,255,0.28)' }}>(optionnel)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      disabled={closing || success}
                      placeholder="Observations, incidents du jour…"
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.80)',
                        opacity: closing || success ? 0.6 : 1,
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl px-4 py-3.5"
                    style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.20)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#4ADE80' }}>
                      Démarrer une nouvelle journée
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Saisissez le solde d&apos;ouverture de caisse pour ouvrir la journée du jour. Toutes les opérations effectuées seront rattachées à cette session.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      Solde d&apos;ouverture (HTG)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={openingBalance}
                      onChange={e => setOpeningBalance(e.target.value)}
                      disabled={opening || success}
                      placeholder="0.00"
                      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.80)',
                        opacity: opening || success ? 0.6 : 1,
                      }}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                  {error}
                </p>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2"
                  style={{ background: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.22)' }}>
                  <Check size={13} />
                  <span className="text-xs">{isOpen ? 'Journée clôturée · PDF téléchargé' : 'Journée ouverte'}</span>
                </div>
              )}
            </div>

            {/* Footer (sticky on mobile) */}
            <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={closing || opening || success || loadingStats}
                className="flex-1 h-10 rounded-lg text-sm font-medium"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.60)',
                  opacity: closing || opening || success ? 0.5 : 1,
                }}>
                {success ? 'Fermer' : 'Annuler'}
              </button>
              {isOpen ? (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={closing || success || !stats || loadingStats}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
                  style={{ background: '#C41E3A', color: '#fff', opacity: closing || success ? 0.75 : 1 }}>
                  {closing ? (<><Loader2 size={14} className="animate-spin" /> Clôture…</>)
                   : success ? (<><Check size={14} /> Clôturé</>)
                   : (<><Lock size={14} /> Confirmer</>)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenDay}
                  disabled={opening || success || loadingStats || !openingBalance}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
                  style={{ background: '#4ADE80', color: '#0B1220', opacity: opening || success ? 0.75 : 1 }}>
                  {opening ? (<><Loader2 size={14} className="animate-spin" /> Ouverture…</>)
                   : success ? (<><Check size={14} /> Ouverte</>)
                   : (<><Sunrise size={14} /> Ouvrir</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
