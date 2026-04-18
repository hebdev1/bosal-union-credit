'use client'
import * as React from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { type PdfReportConfig, DEFAULT_PDF_CONFIG, hexToRgb, urlToBase64 } from '@/lib/pdfConfig'

function fHTG(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}
function fDate(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}
function fDateShort(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))
}

export interface ExchangeTx {
  id: string
  ticket_number: string | null
  client_first_name: string
  client_last_name: string
  from_currency: string
  to_currency: string
  amount_given: number
  rate_applied: number
  amount_received: number
  notes: string | null
  created_at: string
  agents: { name: string } | null
}

export interface ExchangeRate {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  is_active: boolean
  created_at: string
  agents: { name: string } | null
}

interface Props {
  txs: ExchangeTx[]
  rates: ExchangeRate[]
  config?: PdfReportConfig
}

async function generateBureauPDF(txs: ExchangeTx[], rates: ExchangeRate[], cfg: PdfReportConfig = DEFAULT_PDF_CONFIG) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297; const L = 12; const R = W - 12
  let y = 18

  const [hr, hg, hb] = hexToRgb(cfg.headerColor)
  const [ar, ag, ab] = hexToRgb(cfg.accentColor)

  // Header
  doc.setFillColor(hr, hg, hb)
  doc.rect(0, 0, W, 30, 'F')

  // Logo
  if (cfg.logoEnabled && cfg.logoUrl) {
    const logoData = await urlToBase64(cfg.logoUrl)
    if (logoData) {
      try { doc.addImage(logoData, L, 5, 20, 18) } catch { /* ignore */ }
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(ar, ag, ab)
  doc.text('RAPPORT BUREAU DE CHANGE', W / 2, y, { align: 'center' })
  y += 7
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-HT')} · ${txs.length} opération(s)`, W / 2, y, { align: 'center' })
  y = 42

  // Summary KPIs
  const totalGiven    = txs.reduce((s, t) => s + Number(t.amount_given), 0)
  const activeRates   = rates.filter(r => r.is_active)
  const inactiveRates = rates.filter(r => !r.is_active)

  // Pair breakdown
  const pairMap = new Map<string, { count: number; given: number; received: number; from: string; to: string }>()
  for (const t of txs) {
    const key = `${t.from_currency}→${t.to_currency}`
    const ex = pairMap.get(key) ?? { count: 0, given: 0, received: 0, from: t.from_currency, to: t.to_currency }
    pairMap.set(key, { ...ex, count: ex.count + 1, given: ex.given + Number(t.amount_given), received: ex.received + Number(t.amount_received) })
  }
  const pairs = Array.from(pairMap.values())

  const cards = [
    { label: 'Taux actifs',          value: String(activeRates.length),   color: [74,222,128]  as [number,number,number] },
    { label: 'Taux archivés',        value: String(inactiveRates.length), color: [180,180,180] as [number,number,number] },
    { label: 'Total opérations',     value: String(txs.length),           color: [200,200,200] as [number,number,number] },
    { label: 'Volume total échangé', value: fHTG(totalGiven),             color: [52,211,153]  as [number,number,number] },
  ]
  cards.forEach((item, i) => {
    const x = L + i * 66
    doc.setFillColor(20, 20, 26)
    doc.roundedRect(x, y - 5, 63, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...item.color)
    doc.text(item.value, x + 31, y + 2, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, x + 31, y + 7, { align: 'center' })
  })
  y += 20

  // ── Taux actifs ──
  if (activeRates.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(200, 200, 200)
    doc.text('Taux de change actifs', L, y); y += 5

    const rHeaders = ['De', 'Vers', 'Taux', 'Défini par', 'Date']
    const rColW    = [18, 18, 40, 48, 40]
    doc.setFillColor(18, 18, 24)
    doc.rect(L, y - 4, R - L / 2, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    let cx = L + 2
    rHeaders.forEach((h, i) => { doc.text(h, cx, y); cx += rColW[i] })
    y += 6

    activeRates.forEach((r, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(14, 14, 18)
        doc.rect(L, y - 3.5, R - L / 2, 7, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      cx = L + 2
      const vals = [
        r.from_currency, r.to_currency,
        `1 ${r.from_currency} = ${Number(r.rate).toLocaleString('en-US', { minimumFractionDigits: 4 })} ${r.to_currency}`,
        r.agents?.name ?? '—',
        fDateShort(r.created_at),
      ]
      vals.forEach((v, i) => {
        if (i < 2) doc.setTextColor(52, 211, 153)
        else if (i === 2) doc.setTextColor(252, 211, 77)
        else doc.setTextColor(180, 180, 180)
        doc.text(String(v), cx, y)
        cx += rColW[i]
      })
      y += 7
    })
    y += 6
  }

  // ── Pair stats ──
  if (pairs.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(200, 200, 200)
    doc.text('Statistiques par paire', L, y); y += 5

    doc.setFillColor(18, 18, 24)
    doc.rect(L, y - 4, R - L, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text('Paire', L + 2, y)
    doc.text('Opérations', L + 35, y)
    doc.text('Montant total donné', L + 80, y)
    doc.text('Montant total reçu', L + 155, y)
    y += 6

    pairs.forEach((p, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(14, 14, 18)
        doc.rect(L, y - 3.5, R - L, 7, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(52, 211, 153)
      doc.text(`${p.from} → ${p.to}`, L + 2, y)
      doc.setTextColor(180, 180, 180)
      doc.text(String(p.count), L + 35, y)
      doc.setTextColor(248, 113, 113)
      doc.text(p.from === 'USD' ? fUSD(p.given) : fHTG(p.given), L + 80, y)
      doc.setTextColor(74, 222, 128)
      doc.text(p.to === 'USD' ? fUSD(p.received) : fHTG(p.received), L + 155, y)
      y += 7
    })
    y += 6
  }

  // ── Transactions detail ──
  if (txs.length > 0) {
    if (y > 155) { doc.addPage(); y = 15 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(200, 200, 200)
    doc.text('Historique détaillé des opérations', L, y); y += 5

    const tHeaders = ['Ticket', 'Client', 'De', 'Vers', 'Montant donné', 'Taux appliqué', 'Montant reçu', 'Notes', 'Agent', 'Date']
    const tColW    = [24, 38, 14, 14, 30, 26, 30, 28, 30, 28]
    doc.setFillColor(18, 18, 24)
    doc.rect(L, y - 4, R - L, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    let cx2 = L + 2
    tHeaders.forEach((h, i) => { doc.text(h, cx2, y); cx2 += tColW[i] })
    y += 6

    txs.forEach((t, idx) => {
      if (y > 192) { doc.addPage(); y = 15 }
      if (idx % 2 === 0) {
        doc.setFillColor(14, 14, 18)
        doc.rect(L, y - 3.5, R - L, 7, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      const tVals = [
        t.ticket_number ?? '—',
        `${t.client_first_name} ${t.client_last_name}`.substring(0, 20),
        t.from_currency,
        t.to_currency,
        t.from_currency === 'USD' ? fUSD(Number(t.amount_given))    : fHTG(Number(t.amount_given)),
        Number(t.rate_applied).toFixed(4),
        t.to_currency   === 'USD' ? fUSD(Number(t.amount_received)) : fHTG(Number(t.amount_received)),
        (t.notes ?? '—').substring(0, 14),
        (t.agents?.name ?? '—').substring(0, 16),
        fDate(t.created_at).substring(0, 16),
      ]
      cx2 = L + 2
      tVals.forEach((v, i) => {
        if (i === 4) doc.setTextColor(248, 113, 113)
        else if (i === 6) doc.setTextColor(74, 222, 128)
        else if (i < 4) doc.setTextColor(52, 211, 153)
        else doc.setTextColor(180, 180, 180)
        doc.text(String(v), cx2, y)
        cx2 += tColW[i]
      })
      y += 7
    })
  }

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(7)
    doc.setTextColor(60, 60, 60)
    doc.text(`${cfg.footerText} · Page ${p}/${pages}`, W / 2, 205, { align: 'center' })
  }
  doc.save(`bureau-de-change-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function BureauDeChangeExportButton({ txs, rates, config }: Props) {
  const [exporting, setExporting] = React.useState(false)

  async function handleExport() {
    setExporting(true)
    await generateBureauPDF(txs, rates, config)
    setExporting(false)
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-opacity"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'rgba(255,255,255,0.75)',
        opacity: exporting ? 0.65 : 1,
      }}
    >
      {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
      Exporter PDF
    </button>
  )
}
