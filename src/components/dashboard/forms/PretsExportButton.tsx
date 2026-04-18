'use client'
import * as React from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { type PdfReportConfig, DEFAULT_PDF_CONFIG, hexToRgb, urlToBase64 } from '@/lib/pdfConfig'

function fHTG(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fDate(d: string) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', active: 'Actif', completed: 'Complété',
  defaulted: 'En défaut', rejected: 'Rejeté', closed: 'Clôturé',
}

export interface LoanRow {
  id: string
  loan_number: string
  principal_amount: number
  interest_rate: number
  duration_months: number
  monthly_payment: number
  total_amount_due: number
  amount_paid: number
  status: string
  purpose: string | null
  created_at: string
  members: { first_name: string; last_name: string; member_number: string } | null
}

export interface RepaymentRow {
  id: string
  installment_no: number
  amount_due: number
  amount_paid: number
  due_date: string | null
  paid_at: string | null
  status: string
  loans: { loan_number: string; members: { first_name: string; last_name: string } | null } | null
}

interface Props {
  loans: LoanRow[]
  repayments: RepaymentRow[]
  config?: PdfReportConfig
}

async function generatePretsPDF(loans: LoanRow[], repayments: RepaymentRow[], cfg: PdfReportConfig = DEFAULT_PDF_CONFIG) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297; const L = 12; const R = W - 12

  const [hr, hg, hb] = hexToRgb(cfg.headerColor)
  const [ar, ag, ab] = hexToRgb(cfg.accentColor)

  // Header
  doc.setFillColor(hr, hg, hb)
  doc.rect(0, 0, W, 28, 'F')

  if (cfg.logoEnabled && cfg.logoUrl) {
    const logoData = await urlToBase64(cfg.logoUrl)
    if (logoData) { try { doc.addImage(logoData, L, 5, 20, 16) } catch { /* ignore */ } }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(ar, ag, ab)
  doc.text('PORTEFEUILLE DES PRÊTS', W / 2, 13, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-HT')} · ${loans.length} prêt(s)`, W / 2, 21, { align: 'center' })

  // Summary cards
  const actifs    = loans.filter(l => l.status === 'active')
  const pending   = loans.filter(l => l.status === 'pending')
  const totalCap  = loans.reduce((s, l) => s + Number(l.principal_amount), 0)
  const totalRem  = loans.reduce((s, l) => s + Number(l.amount_paid ?? 0), 0)
  const totalRepaid = repayments.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount_paid ?? 0), 0)

  let y = 36
  const cards = [
    { label: 'Total prêts',        value: String(loans.length),       color: [200,200,200] as [number,number,number] },
    { label: 'Actifs',             value: String(actifs.length),       color: [74,222,128]  as [number,number,number] },
    { label: 'En attente',         value: String(pending.length),      color: [252,211,77]  as [number,number,number] },
    { label: 'Capital prêté total',value: fHTG(totalCap),              color: [167,139,250] as [number,number,number] },
    { label: 'Capital remboursé',  value: fHTG(totalRem),              color: [96,165,250]  as [number,number,number] },
    { label: 'Remboursements OK',  value: fHTG(totalRepaid),           color: [74,222,128]  as [number,number,number] },
  ]
  cards.forEach((item, i) => {
    const col = i % 6
    const x = L + col * 46
    doc.setFillColor(20, 20, 26)
    doc.roundedRect(x, y - 5, 43, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...item.color)
    doc.text(item.value, x + 21, y + 2, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, x + 21, y + 7, { align: 'center' })
  })

  // ── Loans table ──
  y = 60
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(200, 200, 200)
  doc.text('Liste des prêts', L, y)
  y += 6

  const lHeaders = ['N° Prêt', 'Membre', 'Capital', 'Taux', 'Durée', 'Mensualité', 'Total dû', 'Remboursé', 'Objet', 'Statut', 'Date']
  const lColW    = [28, 42, 28, 16, 16, 26, 28, 26, 30, 22, 24]
  doc.setFillColor(18, 18, 24)
  doc.rect(L, y - 4, R - L, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  let cx = L + 2
  lHeaders.forEach((h, i) => { doc.text(h, cx, y); cx += lColW[i] })
  y += 6

  const STATUS_COLORS: Record<string, [number, number, number]> = {
    active:    [74, 222, 128], pending: [252, 211, 77], completed: [96, 165, 250],
    defaulted: [248, 113, 113], rejected: [180, 180, 180], closed: [140, 140, 140],
  }

  loans.forEach((l, idx) => {
    if (y > 192) { doc.addPage(); y = 15 }
    if (idx % 2 === 0) {
      doc.setFillColor(14, 14, 18)
      doc.rect(L, y - 3.5, R - L, 7, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const member = l.members
    const rembPct = l.total_amount_due > 0
      ? Math.round((Number(l.amount_paid ?? 0) / Number(l.total_amount_due)) * 100) : 0
    const vals = [
      l.loan_number,
      member ? `${member.first_name} ${member.last_name}` : '—',
      fHTG(Number(l.principal_amount)),
      `${Number(l.interest_rate).toFixed(1)}%`,
      `${l.duration_months}m`,
      fHTG(Number(l.monthly_payment)),
      fHTG(Number(l.total_amount_due)),
      `${rembPct}%`,
      (l.purpose ?? '—').substring(0, 14),
      STATUS_LABELS[l.status] ?? l.status,
      fDate(l.created_at),
    ]
    cx = L + 2
    vals.forEach((v, i) => {
      if (i === 9) doc.setTextColor(...(STATUS_COLORS[l.status] ?? [180, 180, 180]))
      else doc.setTextColor(180, 180, 180)
      doc.text(String(v), cx, y)
      cx += lColW[i]
    })
    y += 7
  })

  // ── Repayments table ──
  if (repayments.length > 0) {
    y += 8
    if (y > 160) { doc.addPage(); y = 15 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(200, 200, 200)
    doc.text('Historique des remboursements', L, y)
    y += 6

    const rHeaders = ['N° Prêt', 'Membre', 'Échéance', 'Montant dû', 'Montant payé', 'Date échéance', 'Date paiement', 'Statut']
    const rColW    = [30, 44, 18, 32, 32, 34, 34, 26]
    doc.setFillColor(18, 18, 24)
    doc.rect(L, y - 4, R - L, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    cx = L + 2
    rHeaders.forEach((h, i) => { doc.text(h, cx, y); cx += rColW[i] })
    y += 6

    repayments.forEach((r, idx) => {
      if (y > 192) { doc.addPage(); y = 15 }
      if (idx % 2 === 0) {
        doc.setFillColor(14, 14, 18)
        doc.rect(L, y - 3.5, R - L, 7, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const rColor: [number,number,number] =
        r.status === 'paid'   ? [74,222,128]   :
        r.status === 'late' || r.status === 'missed' ? [248,113,113] :
        [252,211,77]
      const rStatusLabel = r.status === 'paid' ? 'Payé' : r.status === 'late' ? 'En retard' : r.status === 'missed' ? 'Manqué' : 'En attente'
      const rVals = [
        r.loans?.loan_number ?? '—',
        r.loans?.members ? `${r.loans.members.first_name} ${r.loans.members.last_name}` : '—',
        `#${r.installment_no}`,
        fHTG(Number(r.amount_due)),
        r.amount_paid > 0 ? fHTG(Number(r.amount_paid)) : '—',
        r.due_date  ? fDate(r.due_date)  : '—',
        r.paid_at   ? fDate(r.paid_at)   : '—',
        rStatusLabel,
      ]
      cx = L + 2
      rVals.forEach((v, i) => {
        if (i === 7) doc.setTextColor(...rColor)
        else doc.setTextColor(180, 180, 180)
        doc.text(String(v), cx, y)
        cx += rColW[i]
      })
      y += 7
    })
  }

  doc.setFontSize(7)
  doc.setTextColor(60, 60, 60)
  doc.text(cfg.footerText, W / 2, 205, { align: 'center' })
  doc.save(`prets-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function PretsExportButton({ loans, repayments, config }: Props) {
  const [exporting, setExporting] = React.useState(false)

  async function handleExport() {
    setExporting(true)
    await generatePretsPDF(loans, repayments, config)
    setExporting(false)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting || loans.length === 0}
      className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-opacity"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'rgba(255,255,255,0.75)',
        opacity: (exporting || loans.length === 0) ? 0.5 : 1,
      }}
    >
      {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
      Exporter PDF
    </button>
  )
}
