'use client'
import * as React from 'react'
import { FileDown, Loader2 } from 'lucide-react'

function fHTG(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}
function fDate(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

export interface RapportData {
  totalDeposits: number
  totalWithdrawals: number
  totalLoans: number
  totalRepaid: number
  defaulted: number
  membersActive: number
  exchangeCount: number
  exchangeVol: number
  txBreakdown: { type: string; label: string; count: number; total: number }[]
  loansByStatus: { status: string; label: string; count: number; amount: number }[]
  pairs: { key: string; fromCcy: string; toCcy: string; count: number; given: number; received: number }[]
  exchDetail: {
    id: string; ticket_number: string; client_first_name: string; client_last_name: string;
    from_currency: string; to_currency: string; amount_given: number; rate_applied: number;
    amount_received: number; created_at: string; agents: { name: string } | null
  }[]
}

interface Props { data: RapportData }

async function generateRapportsPDF(d: RapportData) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const L = 13; const R = W - 13
  let y = 18

  // Header
  doc.setFillColor(12, 12, 14)
  doc.rect(0, 0, W, 32, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(196, 30, 58)
  doc.text('RAPPORT GÉNÉRAL', W / 2, y, { align: 'center' })
  y += 7
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Synthèse complète des activités · ${new Date().toLocaleDateString('fr-HT')}`, W / 2, y, { align: 'center' })
  y = 42

  // ── KPI cards ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(200, 200, 200)
  doc.text('Indicateurs clés', L, y); y += 5

  const kpis = [
    { label: 'Total dépôts',      value: fHTG(d.totalDeposits),   color: [74,222,128]  as [number,number,number] },
    { label: 'Total retraits',    value: fHTG(d.totalWithdrawals), color: [248,113,113] as [number,number,number] },
    { label: 'Flux net',          value: fHTG(d.totalDeposits - d.totalWithdrawals), color: d.totalDeposits >= d.totalWithdrawals ? [74,222,128] as [number,number,number] : [248,113,113] as [number,number,number] },
    { label: 'Capital prêté',     value: fHTG(d.totalLoans),       color: [167,139,250] as [number,number,number] },
    { label: 'Capital remboursé', value: fHTG(d.totalRepaid),      color: [96,165,250]  as [number,number,number] },
    { label: 'Prêts en défaut',   value: String(d.defaulted),      color: d.defaulted > 0 ? [248,113,113] as [number,number,number] : [74,222,128] as [number,number,number] },
    { label: 'Membres actifs',    value: String(d.membersActive),  color: [59,130,246]  as [number,number,number] },
    { label: 'Opérations change', value: String(d.exchangeCount),  color: [52,211,153]  as [number,number,number] },
  ]
  const cols = 4
  const cw = (R - L) / cols
  kpis.forEach((k, i) => {
    const col = i % cols; const row = Math.floor(i / cols)
    const x = L + col * cw
    const ky = y + row * 18
    doc.setFillColor(18, 18, 24)
    doc.roundedRect(x + 1, ky - 4, cw - 3, 15, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...k.color)
    doc.text(k.value, x + cw / 2, ky + 3, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 100, 100)
    doc.text(k.label, x + cw / 2, ky + 8.5, { align: 'center' })
  })
  y += Math.ceil(kpis.length / cols) * 18 + 6

  // ── Transaction breakdown ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(200, 200, 200)
  doc.text('Répartition des transactions', L, y); y += 5

  const txColors: Record<string, [number,number,number]> = {
    deposit: [74,222,128], withdrawal: [248,113,113], transfer: [96,165,250], adjustment: [252,211,77]
  }
  const txTotal = d.txBreakdown.reduce((s, t) => s + t.count, 0)
  doc.setFillColor(18, 18, 24)
  doc.rect(L, y - 3, R - L, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text('Type', L + 2, y); doc.text('Opérations', L + 40, y); doc.text('%', L + 80, y); doc.text('Montant total', L + 100, y)
  y += 6

  d.txBreakdown.forEach((t, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(14, 14, 18)
      doc.rect(L, y - 3.5, R - L, 7, 'F')
    }
    const pct = txTotal > 0 ? Math.round((t.count / txTotal) * 100) : 0
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...(txColors[t.type] ?? [180,180,180]))
    doc.text(t.label, L + 2, y)
    doc.setTextColor(180, 180, 180)
    doc.text(String(t.count), L + 40, y)
    doc.text(`${pct}%`, L + 80, y)
    doc.setTextColor(...(txColors[t.type] ?? [180,180,180]))
    doc.text(fHTG(t.total), L + 100, y)
    y += 7
  })
  y += 4

  // ── Loan portfolio ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(200, 200, 200)
  doc.text('Portefeuille prêts par statut', L, y); y += 5

  const lColors: Record<string, [number,number,number]> = {
    pending: [252,211,77], active: [74,222,128], completed: [96,165,250],
    defaulted: [248,113,113], rejected: [180,180,180]
  }
  doc.setFillColor(18, 18, 24)
  doc.rect(L, y - 3, R - L, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text('Statut', L + 2, y); doc.text('Nombre', L + 55, y); doc.text('Capital total', L + 100, y)
  y += 6

  d.loansByStatus.forEach((s, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(14, 14, 18)
      doc.rect(L, y - 3.5, R - L, 7, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...(lColors[s.status] ?? [180,180,180]))
    doc.text(s.label, L + 2, y)
    doc.setTextColor(180, 180, 180)
    doc.text(String(s.count), L + 55, y)
    doc.text(fHTG(s.amount), L + 100, y)
    y += 7
  })
  y += 4

  // ── Bureau de change ──
  if (d.pairs.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(200, 200, 200)
    doc.text('Bureau de change — Répartition par paire', L, y); y += 5

    doc.setFillColor(18, 18, 24)
    doc.rect(L, y - 3, R - L, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text('Paire', L + 2, y); doc.text('Opérations', L + 40, y); doc.text('Montant donné', L + 80, y); doc.text('Montant reçu', L + 130, y)
    y += 6

    d.pairs.forEach((p, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(14, 14, 18)
        doc.rect(L, y - 3.5, R - L, 7, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(52, 211, 153)
      doc.text(`${p.fromCcy} → ${p.toCcy}`, L + 2, y)
      doc.setTextColor(180, 180, 180)
      doc.text(String(p.count), L + 40, y)
      doc.setTextColor(248, 113, 113)
      doc.text(p.fromCcy === 'USD' ? fUSD(p.given) : fHTG(p.given), L + 80, y)
      doc.setTextColor(74, 222, 128)
      doc.text(p.toCcy === 'USD' ? fUSD(p.received) : fHTG(p.received), L + 130, y)
      y += 7
    })
  }

  // ── Exchange detail table (new page) ──
  if (d.exchDetail.length > 0) {
    doc.addPage()
    y = 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(196, 30, 58)
    doc.text('Détail des opérations de change', W / 2, y, { align: 'center' }); y += 10

    const eHeaders = ['Ticket', 'Client', 'De', 'Vers', 'Donné', 'Taux', 'Reçu', 'Agent', 'Date']
    const eColW    = [22, 38, 14, 14, 28, 18, 28, 28, 32]
    doc.setFillColor(18, 18, 24)
    doc.rect(L, y - 4, R - L, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    let cx = L + 2
    eHeaders.forEach((h, i) => { doc.text(h, cx, y); cx += eColW[i] }); y += 6

    d.exchDetail.forEach((t, idx) => {
      if (y > 280) { doc.addPage(); y = 15 }
      if (idx % 2 === 0) {
        doc.setFillColor(14, 14, 18)
        doc.rect(L, y - 3.5, R - L, 7, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const eVals = [
        t.ticket_number ?? '—',
        `${t.client_first_name} ${t.client_last_name}`.substring(0, 20),
        t.from_currency,
        t.to_currency,
        t.from_currency === 'USD' ? fUSD(Number(t.amount_given)) : fHTG(Number(t.amount_given)),
        Number(t.rate_applied).toFixed(4),
        t.to_currency === 'USD' ? fUSD(Number(t.amount_received)) : fHTG(Number(t.amount_received)),
        (t.agents?.name ?? '—').substring(0, 16),
        fDate(t.created_at).substring(0, 16),
      ]
      cx = L + 2
      eVals.forEach((v, i) => {
        if (i === 4) doc.setTextColor(248, 113, 113)
        else if (i === 6) doc.setTextColor(74, 222, 128)
        else doc.setTextColor(180, 180, 180)
        doc.text(String(v), cx, y)
        cx += eColW[i]
      })
      y += 7
    })
  }

  doc.setFontSize(7)
  doc.setTextColor(60, 60, 60)
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-HT')} — Mache Kay BOSAL · Page ${p}/${pages}`, W / 2, 290, { align: 'center' })
  }
  doc.save(`rapport-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function RapportsExportButton({ data }: Props) {
  const [exporting, setExporting] = React.useState(false)

  async function handleExport() {
    setExporting(true)
    await generateRapportsPDF(data)
    setExporting(false)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-opacity"
      style={{
        background: '#C41E3A',
        color: '#fff',
        opacity: exporting ? 0.65 : 1,
      }}
    >
      {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
      Exporter PDF
    </button>
  )
}
