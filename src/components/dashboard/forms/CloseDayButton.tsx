'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  MoonStar, Loader2, Check, X, AlertTriangle, Sunrise, ArrowRight,
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

  const [notes, setNotes] = React.useState('')
  const [closing, setClosing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const [openingBalance, setOpeningBalance] = React.useState('')
  const [opening, setOpening] = React.useState(false)

  const refreshStats = React.useCallback(async () => {
    setLoadingStats(true)
    const s = await getTodayStats()
    setStats(s)
    setHasOpenDay(Boolean(s))
    setLoadingStats(false)
  }, [])

  React.useEffect(() => { refreshStats() }, [refreshStats])

  function openModal() {
    setError(null); setSuccess(false); setNotes(''); setOpeningBalance('')
    setModalOpen(true)
    refreshStats()
  }

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (modalOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [modalOpen])

  async function handleClose() {
    setClosing(true); setError(null)
    const result = await closeDay(notes || undefined)
    setClosing(false)
    if ('error' in result) { setError(result.error); return }
    setSuccess(true)
    try { await generateClosurePDF(result) } catch { /* ignore */ }
    setTimeout(() => {
      setModalOpen(false); setSuccess(false)
      refreshStats()
      router.refresh()
    }, 1600)
  }

  async function handleOpenDay() {
    const n = Number(openingBalance.replace(',', '.'))
    if (!Number.isFinite(n) || n < 0) {
      setError('Solde d\'ouverture invalide')
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

  const isOpen = hasOpenDay === true
  const isUnknown = hasOpenDay === null

  return (
    <>
      {/* ─── Header trigger ───────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openModal}
        aria-label={isOpen ? 'Clôturer la journée' : 'Ouvrir une journée'}
        className="group relative inline-flex items-center gap-2 h-8 rounded-lg text-xs font-semibold transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40"
        style={{
          paddingLeft: 10, paddingRight: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          color: 'rgba(255,255,255,0.82)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
      >
        {/* Live status dot */}
        <span
          aria-hidden
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isUnknown ? 'rgba(255,255,255,0.25)' : isOpen ? '#4ADE80' : '#94A3B8',
            boxShadow: isOpen ? '0 0 0 3px rgba(74,222,128,0.15)' : 'none',
            flexShrink: 0,
          }}
        />
        <span className="hidden sm:inline whitespace-nowrap">
          {isUnknown ? 'Session' : isOpen ? 'Session ouverte' : 'Session fermée'}
        </span>
        <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.22)' }}>·</span>
        <span className="whitespace-nowrap" style={{ color: isOpen ? '#E8314F' : '#4ADE80' }}>
          {isOpen ? 'Clôturer' : 'Ouvrir'}
        </span>
      </button>

      {/* ─── Modal ────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="closeday-title"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(3,6,12,0.78)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget && !closing && !opening) setModalOpen(false) }}
        >
          <div
            className="w-full sm:max-w-[440px] flex flex-col animate-in"
            style={{
              background: 'linear-gradient(180deg, #12151E 0%, #0D1018 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '92vh',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
            }}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden" aria-hidden>
              <span style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Compact header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:pt-5 pb-3 flex-shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: isOpen ? '#E8314F' : '#4ADE80' }}>
                  {loadingStats ? 'Chargement' : isOpen ? 'Clôture de journée' : 'Ouverture de journée'}
                </p>
                <h2 id="closeday-title" className="text-[17px] font-bold mt-1 tracking-tight truncate"
                  style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {stats?.closingDate ? fDate(stats.closingDate) : new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}
                </h2>
              </div>
              {!closing && !opening && !success && (
                <button type="button" onClick={() => setModalOpen(false)}
                  aria-label="Fermer"
                  className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Hairline */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ minHeight: 0 }}>
              {loadingStats && hasOpenDay === null ? (
                <div className="flex items-center justify-center py-12 gap-2 text-sm"
                  style={{ color: 'rgba(255,255,255,0.50)' }}>
                  <Loader2 size={14} className="animate-spin" />
                  Chargement…
                </div>
              ) : isOpen ? (
                <>
                  {/* Hero: estimated closing balance */}
                  {stats && liveBalance !== null && (
                    <div className="rounded-2xl px-5 py-4"
                      style={{
                        background: 'linear-gradient(135deg, rgba(74,222,128,0.10) 0%, rgba(74,222,128,0.02) 100%)',
                        border: '1px solid rgba(74,222,128,0.18)',
                      }}>
                      <p className="text-[10px] uppercase tracking-[0.1em] font-semibold"
                        style={{ color: 'rgba(74,222,128,0.85)' }}>
                        Solde estimé à la clôture
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1.5 kpi-value tracking-tight"
                        style={{ color: '#4ADE80' }}>
                        {fHTG(liveBalance)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        <span>Ouverture {fHTG(stats.openingBalance)}</span>
                        <ArrowRight size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <span style={{ color: liveBalance >= stats.openingBalance ? '#4ADE80' : '#F87171' }}>
                          {liveBalance >= stats.openingBalance ? '+' : ''}{fHTG(liveBalance - stats.openingBalance)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2x2 operation summary */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Dépôts',        count: stats.depositCount,    value: stats.deposits,     color: '#4ADE80' },
                        { label: 'Retraits',       count: stats.withdrawalCount, value: stats.withdrawals,  color: '#F87171' },
                        { label: 'Remboursements', count: stats.repaymentCount,  value: stats.repayments,   color: '#60A5FA' },
                        { label: 'Change net',     count: stats.exchangeCount,   value: stats.exchangeIn - stats.exchangeOut, color: '#FCD34D' },
                      ].map(k => (
                        <div key={k.label} className="rounded-xl px-3 py-2.5"
                          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] uppercase tracking-wide font-medium"
                              style={{ color: 'rgba(255,255,255,0.40)' }}>{k.label}</p>
                            <span className="text-[10px] font-mono tabular-nums"
                              style={{ color: 'rgba(255,255,255,0.35)' }}>×{k.count}</span>
                          </div>
                          <p className="text-sm font-bold kpi-value tabular-nums truncate"
                            style={{ color: k.color }}>
                            {fHTG(k.value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5"
                      style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Remarques <span className="normal-case tracking-normal font-normal"
                        style={{ color: 'rgba(255,255,255,0.25)' }}>(optionnel)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      disabled={closing || success}
                      placeholder="Observations, incidents du jour…"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.85)',
                        opacity: closing || success ? 0.6 : 1,
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,30,58,0.40)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                    style={{ background: 'rgba(252,211,77,0.05)', border: '1px solid rgba(252,211,77,0.15)' }}>
                    <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#FCD34D' }} />
                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(252,211,77,0.85)' }}>
                      Action irréversible. Un rapport PDF sera téléchargé automatiquement.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl px-5 py-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(74,222,128,0.02) 100%)',
                      border: '1px solid rgba(74,222,128,0.18)',
                    }}>
                    <div className="flex items-center gap-2">
                      <Sunrise size={16} style={{ color: '#4ADE80' }} />
                      <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>
                        Démarrer une nouvelle session
                      </p>
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Saisissez le solde de caisse pour ouvrir la journée. Toutes les opérations seront rattachées à cette session jusqu&apos;à la prochaine clôture.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5"
                      style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Solde d&apos;ouverture
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={openingBalance}
                        onChange={e => setOpeningBalance(e.target.value)}
                        disabled={opening || success}
                        placeholder="0.00"
                        autoFocus
                        className="w-full rounded-xl pl-3 pr-14 py-3 text-lg font-semibold outline-none transition-colors tabular-nums"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'rgba(255,255,255,0.95)',
                          opacity: opening || success ? 0.6 : 1,
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.40)' }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium"
                        style={{ color: 'rgba(255,255,255,0.35)' }}>HTG</span>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
                  <AlertTriangle size={13} style={{ color: '#F87171' }} />
                  <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.22)' }}>
                  <Check size={13} style={{ color: '#4ADE80' }} />
                  <p className="text-xs font-medium" style={{ color: '#4ADE80' }}>
                    {isOpen ? 'Journée clôturée · PDF téléchargé' : 'Nouvelle journée ouverte'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="flex-shrink-0 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] sm:pb-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
              {isOpen ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={closing || opening || success}
                    className="h-11 px-4 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.60)',
                      opacity: closing || opening || success ? 0.4 : 1,
                    }}>
                    {success ? 'Fermer' : 'Annuler'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={closing || success || !stats || loadingStats}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                    style={{
                      background: success ? 'rgba(74,222,128,0.15)' : 'linear-gradient(180deg, #C41E3A 0%, #A51830 100%)',
                      color: success ? '#4ADE80' : '#fff',
                      boxShadow: success ? 'none' : '0 4px 12px rgba(196,30,58,0.30)',
                      opacity: closing ? 0.75 : 1,
                    }}>
                    {closing
                      ? (<><Loader2 size={15} className="animate-spin" /> Clôture…</>)
                      : success
                        ? (<><Check size={15} /> Clôturé</>)
                        : (<><MoonStar size={14} /> Clôturer la journée</>)}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={opening || success}
                    className="h-11 px-4 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.60)',
                      opacity: opening || success ? 0.4 : 1,
                    }}>
                    {success ? 'Fermer' : 'Annuler'}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenDay}
                    disabled={opening || success || loadingStats || !openingBalance}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40"
                    style={{
                      background: success ? 'rgba(74,222,128,0.15)' : 'linear-gradient(180deg, #4ADE80 0%, #22C55E 100%)',
                      color: success ? '#4ADE80' : '#0B1220',
                      boxShadow: success ? 'none' : '0 4px 12px rgba(74,222,128,0.25)',
                      opacity: opening ? 0.75 : (!openingBalance ? 0.5 : 1),
                    }}>
                    {opening
                      ? (<><Loader2 size={15} className="animate-spin" /> Ouverture…</>)
                      : success
                        ? (<><Check size={15} /> Ouverte</>)
                        : (<><Sunrise size={14} /> Ouvrir la journée</>)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
