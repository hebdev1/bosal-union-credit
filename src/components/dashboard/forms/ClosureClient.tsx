'use client'
import * as React from 'react'
import {
  BookCheck, AlertTriangle, Loader2, X, Download,
  ChevronDown, ChevronUp, Lock, Unlock, FileText,
} from 'lucide-react'
import { closeDay, type ClosureResult } from '@/app/(dashboard)/tableau-de-bord/cloture/actions'

/* ─── Types ───────────────────────────────────────────────────────────────── */
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

interface DailyClosing {
  id: string
  closing_date: string
  opening_balance: number
  closing_balance: number
  total_deposits: number
  total_withdrawals: number
  total_loan_disbursements: number
  total_loan_repayments: number
  total_exchange_in: number
  total_exchange_out: number
  total_fees_collected: number
  status: string
  closed_at: string | null
  notes: string | null
  agents?: { name: string } | null
}

interface Props {
  todayOpen: DailyClosing | null
  todayStats: TodayStats | null
  closings: DailyClosing[]
  coopName: string
  agentName: string
}

/* ─── Formatters (client-safe copies) ────────────────────────────────────── */
function fHTG(n: number | null | undefined) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fDate(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))
}

/* ─── PDF generator ───────────────────────────────────────────────────────── */
async function generateClosurePDF(data: ClosureResult) {
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const L = 15  // left margin
  const R = W - 15 // right edge
  const CW = R - L  // content width

  let y = 18

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(12, 12, 14)
  doc.rect(0, 0, W, 38, 'F')

  doc.setTextColor(196, 30, 58) // red accent
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('RAPPORT DE CLÔTURE JOURNALIÈRE', W / 2, y, { align: 'center' })
  y += 6
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  doc.text(data.coopName.toUpperCase(), W / 2, y, { align: 'center' })
  if (data.coopAddress) {
    y += 4.5
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(data.coopAddress, W / 2, y, { align: 'center' })
  }

  y = 46
  doc.setDrawColor(37, 42, 54)
  doc.line(L, y - 2, R, y - 2)

  // ── Meta info ─────────────────────────────────────────────────────────────
  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  const closingDateFmt = fDate(data.closingDate)
  const closedAtFmt = new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(data.closedAt))
  doc.text(`Date de clôture : ${closingDateFmt}`, L, y)
  doc.text(`Heure : ${closedAtFmt.split('à')[1]?.trim() ?? '—'}`, W / 2, y, { align: 'center' })
  doc.text(`Agent : ${data.agentName}`, R, y, { align: 'right' })

  y += 10

  // ── Section: Bilan financier ──────────────────────────────────────────────
  const drawSectionTitle = (title: string, yy: number) => {
    doc.setFillColor(17, 19, 24)
    doc.rect(L, yy - 5, CW, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(196, 30, 58)
    doc.text(title, L + 3, yy)
    return yy + 6
  }

  const drawRow = (label: string, value: string, yy: number, color?: [number, number, number], bold = false) => {
    doc.setDrawColor(26, 31, 46)
    doc.line(L, yy, R, yy)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(color ? color[0] : 160, color ? color[1] : 160, color ? color[2] : 160)
    doc.text(label, L + 3, yy + 4.5)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.text(value, R - 2, yy + 4.5, { align: 'right' })
    return yy + 7
  }

  y = drawSectionTitle('BILAN FINANCIER', y)
  y = drawRow('Solde d\'ouverture', fHTG(data.openingBalance), y, [200, 200, 200], true)
  y += 1
  y = drawRow(`Dépôts  (${data.depositCount} opération${data.depositCount !== 1 ? 's' : ''})`, `+ ${fHTG(data.totalDeposits)}`, y, [74, 222, 128])
  y = drawRow(`Retraits  (${data.withdrawalCount} opération${data.withdrawalCount !== 1 ? 's' : ''})`, `- ${fHTG(data.totalWithdrawals)}`, y, [248, 113, 113])
  y = drawRow(`Remboursements prêts  (${data.repaymentCount})`, `+ ${fHTG(data.totalLoanRepayments)}`, y, [96, 165, 250])
  y = drawRow(`Change entrant  (HTG reçus)`, `+ ${fHTG(data.totalExchangeIn)}`, y, [52, 211, 153])
  y = drawRow(`Change sortant  (HTG donnés)`, `- ${fHTG(data.totalExchangeOut)}`, y, [248, 113, 113])
  y += 1

  // Closing balance row (highlighted)
  doc.setFillColor(17, 19, 24)
  doc.rect(L, y, CW, 9, 'F')
  doc.setDrawColor(196, 30, 58)
  doc.line(L, y, R, y)
  doc.line(L, y + 9, R, y + 9)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('SOLDE DE CLÔTURE', L + 3, y + 6)
  doc.setTextColor(74, 222, 128)
  doc.text(fHTG(data.closingBalance), R - 2, y + 6, { align: 'right' })
  y += 14

  // ── Section: Statistiques ─────────────────────────────────────────────────
  if (y < 220) {
    y = drawSectionTitle('STATISTIQUES DU JOUR', y)
    const stats = [
      [`Dépôts`, String(data.depositCount)],
      [`Retraits`, String(data.withdrawalCount)],
      [`Ajustements`, String(data.adjustmentCount)],
      [`Remboursements prêts`, String(data.repaymentCount)],
      [`Opérations de change`, String(data.exchangeCount)],
    ]
    for (const [label, val] of stats) {
      y = drawRow(label, val, y)
    }
    y += 3
  }

  // ── Transactions du jour ───────────────────────────────────────────────────
  if (data.transactions.length > 0 && y < 200) {
    y = drawSectionTitle(`TRANSACTIONS DU JOUR  (${data.transactions.length})`, y)
    const TYPE_LABELS: Record<string, string> = { deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Virement', adjustment: 'Ajustement' }
    const maxTx = Math.min(data.transactions.length, Math.floor((250 - y) / 7))
    for (let i = 0; i < maxTx; i++) {
      const t = data.transactions[i]
      const label = `${TYPE_LABELS[t.type] ?? t.type}${t.reference ? ` — ${t.reference}` : ''}${t.motif ? ` · ${t.motif.slice(0, 30)}` : ''}`
      const isCredit = t.type === 'deposit'
      y = drawRow(label, `${isCredit ? '+' : '-'} ${fHTG(t.amount)}`, y, isCredit ? [74, 222, 128] : [248, 113, 113])
    }
    if (data.transactions.length > maxTx) {
      doc.setFontSize(7.5)
      doc.setTextColor(100, 100, 100)
      doc.text(`... et ${data.transactions.length - maxTx} autres transactions`, L + 3, y + 3)
      y += 6
    }
    y += 3
  }

  // ── Exchange summary ───────────────────────────────────────────────────────
  if (data.exchanges.length > 0 && y < 240) {
    y = drawSectionTitle(`OPÉRATIONS DE CHANGE  (${data.exchanges.length})`, y)
    const maxEx = Math.min(data.exchanges.length, Math.floor((265 - y) / 7))
    for (let i = 0; i < maxEx; i++) {
      const e = data.exchanges[i]
      y = drawRow(
        `${e.from} → ${e.to}  ${e.ticket ? `· ${e.ticket}` : ''}`,
        `${fHTG(e.given)} → ${fHTG(e.received)}`,
        y, [52, 211, 153]
      )
    }
    y += 3
  }

  // ── Notes ────────────────────────────────────────────────────────────────
  if (data.notes) {
    y = drawSectionTitle('NOTES', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(160, 160, 160)
    const lines = doc.splitTextToSize(data.notes, CW - 6)
    doc.text(lines, L + 3, y + 2)
    y += lines.length * 5 + 4
  }

  // ── Signatures ────────────────────────────────────────────────────────────
  const sigY = Math.max(y + 10, 255)
  doc.setDrawColor(60, 60, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  const col1 = L
  const col2 = W / 2 + 5
  doc.text('Signature de l\'agent :', col1, sigY)
  doc.line(col1, sigY + 12, col1 + 75, sigY + 12)
  doc.text(data.agentName, col1, sigY + 17)
  doc.text('Signature du superviseur :', col2, sigY)
  doc.line(col2, sigY + 12, col2 + 75, sigY + 12)

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFontSize(7)
  doc.setTextColor(60, 60, 60)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-HT')} — ${data.coopName}`, W / 2, 290, { align: 'center' })

  const fileName = `cloture-${data.closingDate}.pdf`
  doc.save(fileName)
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export function ClosureClient({ todayOpen, todayStats, closings, coopName, agentName }: Props) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [notes, setNotes]             = React.useState('')
  const [closing, setClosing]         = React.useState(false)
  const [error, setError]             = React.useState<string | null>(null)
  const [success, setSuccess]         = React.useState(false)
  const [expandedId, setExpandedId]   = React.useState<string | null>(null)

  // Estimate live closing balance
  const liveBalance = todayStats
    ? todayStats.openingBalance + todayStats.deposits - todayStats.withdrawals + todayStats.repayments + todayStats.exchangeIn - todayStats.exchangeOut
    : null

  async function handleClose() {
    setClosing(true)
    setError(null)
    const result = await closeDay(notes || undefined)
    setClosing(false)
    if ('error' in result) { setError(result.error); return }
    setConfirmOpen(false)
    setSuccess(true)
    await generateClosurePDF(result)
  }

  async function handleHistoryPDF(c: DailyClosing) {
    const partial: ClosureResult = {
      closingDate: c.closing_date,
      closedAt: c.closed_at ?? new Date().toISOString(),
      agentName: c.agents?.name ?? agentName,
      coopName,
      coopAddress: '',
      openingBalance: Number(c.opening_balance),
      totalDeposits: Number(c.total_deposits ?? 0),
      totalWithdrawals: Number(c.total_withdrawals ?? 0),
      totalLoanDisbursements: Number(c.total_loan_disbursements ?? 0),
      totalLoanRepayments: Number(c.total_loan_repayments ?? 0),
      totalExchangeIn: Number(c.total_exchange_in ?? 0),
      totalExchangeOut: Number(c.total_exchange_out ?? 0),
      totalFeesCollected: Number(c.total_fees_collected ?? 0),
      closingBalance: Number(c.closing_balance ?? 0),
      depositCount: 0,
      withdrawalCount: 0,
      adjustmentCount: 0,
      repaymentCount: 0,
      exchangeCount: 0,
      transactions: [],
      exchanges: [],
      notes: c.notes ?? undefined,
    }
    await generateClosurePDF(partial)
  }

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    open:      { label: 'Ouvert',  color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'   },
    closed:    { label: 'Fermé',   color: '#F87171', bg: 'rgba(239,68,68,0.10)'   },
    validated: { label: 'Validé',  color: '#60A5FA', bg: 'rgba(59,130,246,0.10)'  },
  }

  return (
    <div className="space-y-6">

      {/* ── Today's status card ── */}
      {todayOpen ? (
        <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid rgba(74,222,128,0.28)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1a1f2e' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.12)' }}>
                <Unlock size={17} style={{ color: '#4ADE80' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  Journée en cours —{' '}
                  {new Date(todayOpen.closing_date).toLocaleDateString('fr-HT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Solde d'ouverture : {fHTG(Number(todayOpen.opening_balance))}
                </p>
              </div>
            </div>
          </div>

          {/* Live stats */}
          {todayStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: '#1a1f2e' }}>
              {[
                { label: `Dépôts  (${todayStats.depositCount})`,       value: fHTG(todayStats.deposits),     color: '#4ADE80' },
                { label: `Retraits  (${todayStats.withdrawalCount})`,   value: fHTG(todayStats.withdrawals),  color: '#F87171' },
                { label: `Remboursements  (${todayStats.repaymentCount})`, value: fHTG(todayStats.repayments), color: '#60A5FA' },
                { label: `Change  (${todayStats.exchangeCount} op.)`,   value: fHTG(todayStats.exchangeIn - todayStats.exchangeOut), color: '#34D399' },
              ].map(s => (
                <div key={s.label} className="px-5 py-4" style={{ background: '#111318' }}>
                  <p className="text-base font-bold kpi-value" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Estimated closing balance */}
          {liveBalance !== null && (
            <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #1a1f2e' }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>Solde estimé à la clôture</p>
              <p className="text-sm font-bold kpi-value" style={{ color: '#4ADE80' }}>{fHTG(liveBalance)}</p>
            </div>
          )}

          {/* Clôturer button — bottom / last */}
          {!success && (
            <div className="px-6 py-4" style={{ borderTop: '1px solid #1a1f2e' }}>
              <button
                type="button"
                onClick={() => { setConfirmOpen(true); setError(null) }}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-opacity"
                style={{ background: '#C41E3A', color: '#fff' }}
              >
                <Lock size={15} />
                Clôturer la journée
              </button>
            </div>
          )}
        </div>
      ) : success ? (
        <div className="rounded-xl px-6 py-5 flex items-center gap-3"
          style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <BookCheck size={18} style={{ color: '#4ADE80' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#4ADE80' }}>Journée clôturée avec succès</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Le rapport PDF a été téléchargé automatiquement. La nouvelle journée est ouverte.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-5 flex items-center justify-between gap-4"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <div className="flex items-center gap-3">
            <BookCheck size={17} style={{ color: '#FCD34D' }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Aucune journée ouverte. La prochaine journée s&apos;ouvrira automatiquement lors de la prochaine clôture.
            </p>
          </div>
        </div>
      )}

      {/* ── Historique détaillé ── */}
      <section aria-label="Historique des clôtures">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Historique des clôtures
          </h3>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {closings.filter(c => c.status === 'closed' || c.status === 'validated').length} journée{closings.filter(c => c.status !== 'open').length !== 1 ? 's' : ''} clôturée{closings.filter(c => c.status !== 'open').length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: '#111318', border: '1px solid #252A36' }}>
          {closings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <FileText size={22} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 10 }} />
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>Aucune clôture enregistrée</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.22)' }}>Les clôtures journalières apparaîtront ici</p>
            </div>
          ) : closings.map((c, idx) => {
            const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.open
            const net = Number(c.closing_balance ?? 0) - Number(c.opening_balance ?? 0)
            const isExpanded = expandedId === c.id
            const isClosed = c.status === 'closed' || c.status === 'validated'
            return (
              <div key={c.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #1a1f2e' }}>
                {/* Row header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                  style={{ background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {new Date(c.closing_date).toLocaleDateString('fr-HT', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      Ouv. {fHTG(Number(c.opening_balance))}
                      {isClosed ? ` → Clôt. ${fHTG(Number(c.closing_balance))}` : ''}
                      {c.agents?.name ? ` · ${c.agents.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isClosed && (
                      <p className="text-sm font-semibold kpi-value hidden sm:block"
                        style={{ color: net >= 0 ? '#4ADE80' : '#F87171' }}>
                        {net >= 0 ? '+' : ''}{fHTG(net)}
                      </p>
                    )}
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    {isExpanded ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.30)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.30)' }} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid #1a1f2e' }}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                      {[
                        { label: 'Dépôts',         value: fHTG(Number(c.total_deposits ?? 0)),             color: '#4ADE80' },
                        { label: 'Retraits',        value: fHTG(Number(c.total_withdrawals ?? 0)),          color: '#F87171' },
                        { label: 'Rembours. prêts', value: fHTG(Number(c.total_loan_repayments ?? 0)),      color: '#60A5FA' },
                        { label: 'Change net',      value: fHTG(Number(c.total_exchange_in ?? 0) - Number(c.total_exchange_out ?? 0)), color: '#34D399' },
                        { label: 'Change entrant',  value: fHTG(Number(c.total_exchange_in ?? 0)),          color: '#34D399' },
                        { label: 'Change sortant',  value: fHTG(Number(c.total_exchange_out ?? 0)),         color: '#F87171' },
                        { label: 'Solde ouverture', value: fHTG(Number(c.opening_balance)),                 color: 'rgba(255,255,255,0.70)' },
                        { label: 'Solde clôture',   value: fHTG(Number(c.closing_balance ?? 0)),            color: 'rgba(255,255,255,0.95)' },
                      ].map(k => (
                        <div key={k.label} className="rounded-xl px-4 py-3"
                          style={{ background: '#0F1117', border: '1px solid #1a1f2e' }}>
                          <p className="text-sm font-bold kpi-value" style={{ color: k.color }}>{k.value}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>{k.label}</p>
                        </div>
                      ))}
                    </div>

                    {c.notes && (
                      <p className="text-xs px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.55)', border: '1px solid #1a1f2e' }}>
                        <span style={{ color: 'rgba(255,255,255,0.30)' }}>Notes : </span>{c.notes}
                      </p>
                    )}

                    {isClosed && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleHistoryPDF(c)}
                          className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.65)', border: '1px solid #252A36' }}
                        >
                          <Download size={12} />
                          Télécharger PDF
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Confirmation modal ── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.80)' }}
          onClick={e => { if (e.target === e.currentTarget && !closing) setConfirmOpen(false) }}
        >
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#111318', border: '1px solid #252A36' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1a1f2e' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <AlertTriangle size={16} style={{ color: '#F87171' }} />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    Clôturer la journée
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {todayOpen && new Date(todayOpen.closing_date).toLocaleDateString('fr-HT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {!closing && (
                <button type="button" onClick={() => setConfirmOpen(false)}
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Warning */}
              <div className="rounded-xl px-4 py-3.5 space-y-2"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <p className="text-sm font-semibold" style={{ color: '#F87171' }}>
                  ⚠️  Cette action mettra fin à la journée
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Toutes les opérations du jour seront figées. Un rapport PDF sera généré et téléchargé automatiquement.
                  Une nouvelle journée démarrera automatiquement avec le solde de clôture comme solde d'ouverture.
                </p>
              </div>

              {/* Estimated closing balance */}
              {liveBalance !== null && (
                <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ background: '#0F1117', border: '1px solid #252A36' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Solde de clôture estimé</p>
                  <p className="text-base font-bold kpi-value" style={{ color: '#4ADE80' }}>{fHTG(liveBalance)}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Notes de clôture <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optionnel)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Observations, incidents du jour…"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: '#0F1117', border: '1px solid #252A36', color: 'rgba(255,255,255,0.75)' }}
                />
              </div>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setConfirmOpen(false)} disabled={closing}
                  className="flex-1 h-10 rounded-lg text-sm font-medium"
                  style={{ background: 'transparent', border: '1px solid #252A36', color: 'rgba(255,255,255,0.55)', opacity: closing ? 0.5 : 1 }}>
                  Annuler
                </button>
                <button type="button" onClick={handleClose} disabled={closing}
                  className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium"
                  style={{ background: '#C41E3A', color: '#fff', opacity: closing ? 0.7 : 1 }}>
                  {closing ? (
                    <><Loader2 size={14} className="animate-spin" /> Clôture en cours…</>
                  ) : (
                    <><Lock size={14} /> Confirmer la clôture</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
