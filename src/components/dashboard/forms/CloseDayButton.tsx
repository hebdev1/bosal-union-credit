'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MoonStar, Loader2, Check, X, AlertTriangle, Lock } from 'lucide-react'
import { closeDay, getTodayStats, type ClosureResult } from '@/app/(dashboard)/tableau-de-bord/cloture/actions'

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

/* ─── PDF generator (same layout as the removed page) ───────────────────── */
async function generateClosurePDF(data: ClosureResult) {
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const L = 15
  const R = W - 15
  const CW = R - L

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
  doc.text(`Date de clôture : ${fDate(data.closingDate)}`, L, y)
  doc.text(`Heure : ${closedAtFmt.split('à')[1]?.trim() ?? '—'}`, W / 2, y, { align: 'center' })
  doc.text(`Agent : ${data.agentName}`, R, y, { align: 'right' })
  y += 10

  const drawSectionTitle = (title: string, yy: number) => {
    doc.setFillColor(17, 19, 24); doc.rect(L, yy - 5, CW, 8, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(196, 30, 58)
    doc.text(title, L + 3, yy)
    return yy + 6
  }
  const drawRow = (label: string, value: string, yy: number, color?: [number, number, number], bold = false) => {
    doc.setDrawColor(26, 31, 46); doc.line(L, yy, R, yy)
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(9)
    doc.setTextColor(color ? color[0] : 160, color ? color[1] : 160, color ? color[2] : 160)
    doc.text(label, L + 3, yy + 4.5)
    doc.text(value, R - 2, yy + 4.5, { align: 'right' })
    return yy + 7
  }

  y = drawSectionTitle('BILAN FINANCIER', y)
  y = drawRow('Solde d\'ouverture', fHTG(data.openingBalance), y, [200, 200, 200], true)
  y += 1
  y = drawRow(`Dépôts  (${data.depositCount})`, `+ ${fHTG(data.totalDeposits)}`, y, [74, 222, 128])
  y = drawRow(`Retraits  (${data.withdrawalCount})`, `- ${fHTG(data.totalWithdrawals)}`, y, [248, 113, 113])
  y = drawRow(`Remboursements prêts  (${data.repaymentCount})`, `+ ${fHTG(data.totalLoanRepayments)}`, y, [96, 165, 250])
  y = drawRow('Change entrant (HTG reçus)', `+ ${fHTG(data.totalExchangeIn)}`, y, [52, 211, 153])
  y = drawRow('Change sortant (HTG donnés)', `- ${fHTG(data.totalExchangeOut)}`, y, [248, 113, 113])
  y += 1

  doc.setFillColor(17, 19, 24); doc.rect(L, y, CW, 9, 'F')
  doc.setDrawColor(196, 30, 58); doc.line(L, y, R, y); doc.line(L, y + 9, R, y + 9)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255)
  doc.text('SOLDE DE CLÔTURE', L + 3, y + 6)
  doc.setTextColor(74, 222, 128)
  doc.text(fHTG(data.closingBalance), R - 2, y + 6, { align: 'right' })
  y += 14

  if (data.notes) {
    y = drawSectionTitle('NOTES', y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(160, 160, 160)
    const lines = doc.splitTextToSize(data.notes, CW - 6)
    doc.text(lines, L + 3, y + 2)
    y += lines.length * 5 + 4
  }

  const sigY = Math.max(y + 10, 255)
  doc.setDrawColor(60, 60, 60); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 120, 120)
  doc.text('Signature de l\'agent :', L, sigY)
  doc.line(L, sigY + 12, L + 75, sigY + 12)
  doc.text(data.agentName, L, sigY + 17)
  doc.text('Signature du superviseur :', W / 2 + 5, sigY)
  doc.line(W / 2 + 5, sigY + 12, W / 2 + 80, sigY + 12)

  doc.setFontSize(7); doc.setTextColor(60, 60, 60)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-HT')} — ${data.coopName}`, W / 2, 290, { align: 'center' })

  doc.save(`cloture-${data.closingDate}.pdf`)
}

export function CloseDayButton() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = React.useState(false)
  const [notes, setNotes] = React.useState('')
  const [closing, setClosing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState<TodayStats | null>(null)
  const [success, setSuccess] = React.useState(false)

  async function openModal() {
    setError(null)
    setSuccess(false)
    setNotes('')
    setModalOpen(true)
    const s = await getTodayStats()
    setStats(s)
  }

  async function handleClose() {
    setClosing(true); setError(null)
    const result = await closeDay(notes || undefined)
    setClosing(false)
    if ('error' in result) { setError(result.error); return }
    setSuccess(true)
    try { await generateClosurePDF(result) } catch { /* ignore pdf errors */ }
    setTimeout(() => {
      setModalOpen(false)
      setSuccess(false)
      router.refresh()
    }, 1600)
  }

  const liveBalance = stats
    ? stats.openingBalance + stats.deposits - stats.withdrawals + stats.repayments + stats.exchangeIn - stats.exchangeOut
    : null

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
        style={{
          background: 'rgba(196,30,58,0.10)',
          color: '#E8314F',
          border: '1px solid rgba(196,30,58,0.24)',
        }}
        title="Clôturer la journée"
      >
        <MoonStar size={12} />
        <span className="hidden sm:inline">Clôturer</span>
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.80)' }}
          onClick={e => { if (e.target === e.currentTarget && !closing) setModalOpen(false) }}
        >
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
          >
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <AlertTriangle size={16} style={{ color: '#F87171' }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>Clôturer la journée</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {stats?.closingDate ? fDate(stats.closingDate) : '…'}
                  </p>
                </div>
              </div>
              {!closing && !success && (
                <button type="button" onClick={() => setModalOpen(false)} style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl px-4 py-3.5"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#F87171' }}>Cette action est irréversible</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Le rapport PDF sera téléchargé automatiquement. Une nouvelle journée s&apos;ouvre avec le solde de clôture comme solde d&apos;ouverture.
                </p>
              </div>

              {stats && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                  {[
                    { label: 'Solde d\'ouverture',              value: fHTG(stats.openingBalance), color: 'rgba(255,255,255,0.70)' },
                    { label: `Dépôts (${stats.depositCount})`,  value: '+' + fHTG(stats.deposits),      color: '#4ADE80' },
                    { label: `Retraits (${stats.withdrawalCount})`, value: '-' + fHTG(stats.withdrawals), color: '#F87171' },
                    { label: `Remboursements (${stats.repaymentCount})`, value: '+' + fHTG(stats.repayments), color: '#60A5FA' },
                    { label: 'Change entrant',                  value: '+' + fHTG(stats.exchangeIn),    color: '#34D399' },
                    { label: 'Change sortant',                  value: '-' + fHTG(stats.exchangeOut),   color: '#F87171' },
                  ].map((r, i) => (
                    <div key={r.label} className="flex items-center justify-between px-4 py-2.5"
                      style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                               borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.label}</span>
                      <span className="text-xs font-semibold kpi-value" style={{ color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                  {liveBalance !== null && (
                    <div className="flex items-center justify-between px-4 py-3"
                      style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>Solde de clôture estimé</span>
                      <span className="text-base font-bold kpi-value" style={{ color: '#4ADE80' }}>{fHTG(liveBalance)}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Notes <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optionnel)</span>
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
                    color: 'rgba(255,255,255,0.75)',
                    opacity: closing || success ? 0.6 : 1,
                  }}
                />
              </div>

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
                  <span className="text-xs">Journée clôturée · PDF téléchargé</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)} disabled={closing || success}
                  className="flex-1 h-10 rounded-lg text-sm font-medium"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: 'rgba(255,255,255,0.55)',
                    opacity: closing || success ? 0.5 : 1,
                  }}>
                  Annuler
                </button>
                <button type="button" onClick={handleClose} disabled={closing || success || !stats}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
                  style={{ background: '#C41E3A', color: '#fff', opacity: closing || success ? 0.75 : 1 }}>
                  {closing ? (<><Loader2 size={14} className="animate-spin" /> Clôture…</>)
                   : success ? (<><Check size={14} /> Clôturé</>)
                   : (<><Lock size={14} /> Confirmer</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
