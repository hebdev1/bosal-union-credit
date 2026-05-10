'use client'
import * as React from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { type PdfReportConfig, DEFAULT_PDF_CONFIG, hexToRgb, urlToBase64 } from '@/lib/pdfConfig'
import {
  drawHeader, drawFooter, drawSectionHeading, drawStatCards, drawTable,
  type Cell,
} from '@/lib/pdf/shadcn-table'

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
  const W = 297; const H = 210; const L = 12; const R = W - 12
  const TOTAL_W = R - L

  let logoBase64: string | null = null
  if (cfg.logoEnabled && cfg.logoUrl) {
    logoBase64 = await urlToBase64(cfg.logoUrl)
  }

  // ── Header ──
  let y = drawHeader(doc, {
    title: 'Rapport bureau de change',
    subtitle: `Généré le ${new Date().toLocaleDateString('fr-HT')} · ${txs.length} opération(s)`,
    brand: hexToRgb(cfg.headerColor),
    logoBase64,
  }, W)

  // ── KPI cards ──
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

  y = drawStatCards(doc, L, y, TOTAL_W, [
    { label: 'Taux actifs',          value: String(activeRates.length),   accent: [22, 101, 52] },
    { label: 'Taux archivés',        value: String(inactiveRates.length), accent: [100, 116, 139] },
    { label: 'Total opérations',     value: String(txs.length) },
    { label: 'Volume total échangé', value: fHTG(totalGiven),             accent: [22, 101, 52] },
  ], { perRow: 4 })
  y += 4

  const onNewPage = (d: typeof doc): number => { d.addPage(); return 20 }

  // ── Taux actifs ──
  if (activeRates.length > 0) {
    y = drawSectionHeading(doc, L, y + 2, 'Taux de change actifs')
    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 16,
      onNewPage,
      columns: [
        { header: 'De',         width: 16, align: 'center' },
        { header: 'Vers',       width: 16, align: 'center' },
        { header: 'Taux',       width: 60 },
        { header: 'Défini par', width: 50 },
        { header: 'Date',       width: 30 },
      ],
      rows: activeRates.map(r => [
        { kind: 'badge', label: r.from_currency, variant: 'info' } as Cell,
        { kind: 'badge', label: r.to_currency,   variant: 'info' },
        { kind: 'strong', text: `1 ${r.from_currency} = ${Number(r.rate).toLocaleString('en-US', { minimumFractionDigits: 4 })} ${r.to_currency}` },
        r.agents?.name ?? '—',
        { kind: 'muted', text: fDateShort(r.created_at) },
      ]),
    })
    y += 6
  }

  // ── Pair statistics ──
  if (pairs.length > 0) {
    y = drawSectionHeading(doc, L, y, 'Statistiques par paire')
    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 16,
      onNewPage,
      columns: [
        { header: 'Paire',        width: 30 },
        { header: 'Opérations',   width: 24, align: 'right' },
        { header: 'Total donné',  width: 50, align: 'right' },
        { header: 'Total reçu',   width: 50, align: 'right' },
      ],
      rows: pairs.map(p => [
        { kind: 'strong', text: `${p.from} → ${p.to}` } as Cell,
        String(p.count),
        p.from === 'USD' ? fUSD(p.given)    : fHTG(p.given),
        p.to   === 'USD' ? fUSD(p.received) : fHTG(p.received),
      ]),
      footer: [
        { kind: 'strong', text: 'Total' },
        String(pairs.reduce((s, p) => s + p.count, 0)),
        fHTG(pairs.filter(p => p.from !== 'USD').reduce((s, p) => s + p.given, 0))
          + (pairs.some(p => p.from === 'USD') ? ' + ' + fUSD(pairs.filter(p => p.from === 'USD').reduce((s, p) => s + p.given, 0)) : ''),
        fHTG(pairs.filter(p => p.to !== 'USD').reduce((s, p) => s + p.received, 0))
          + (pairs.some(p => p.to === 'USD') ? ' + ' + fUSD(pairs.filter(p => p.to === 'USD').reduce((s, p) => s + p.received, 0)) : ''),
      ],
    })
    y += 6
  }

  // ── Detailed transactions ──
  if (txs.length > 0) {
    if (y > H - 40) { doc.addPage(); y = 20 }
    y = drawSectionHeading(doc, L, y, 'Historique détaillé des opérations')
    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 16,
      onNewPage,
      columns: [
        { header: 'Ticket',         width: 24 },
        { header: 'Client',         width: 38 },
        { header: 'De',             width: 14, align: 'center' },
        { header: 'Vers',           width: 14, align: 'center' },
        { header: 'Montant donné',  width: 28, align: 'right' },
        { header: 'Taux',           width: 18, align: 'right' },
        { header: 'Montant reçu',   width: 28, align: 'right' },
        { header: 'Notes',          width: 28 },
        { header: 'Agent',          width: 26 },
        { header: 'Date',           width: 28 },
      ],
      rows: txs.map(t => [
        { kind: 'mono', text: t.ticket_number ?? '—' } as Cell,
        `${t.client_first_name} ${t.client_last_name}`.substring(0, 20),
        { kind: 'badge', label: t.from_currency, variant: 'info' },
        { kind: 'badge', label: t.to_currency,   variant: 'info' },
        t.from_currency === 'USD' ? fUSD(Number(t.amount_given))    : fHTG(Number(t.amount_given)),
        { kind: 'muted', text: Number(t.rate_applied).toFixed(4) },
        { kind: 'strong', text: t.to_currency === 'USD' ? fUSD(Number(t.amount_received)) : fHTG(Number(t.amount_received)) },
        { kind: 'muted', text: (t.notes ?? '—').substring(0, 18) },
        { kind: 'muted', text: (t.agents?.name ?? '—').substring(0, 18) },
        { kind: 'muted', text: fDate(t.created_at).substring(0, 16) },
      ]),
    })
  }

  drawFooter(doc, cfg.footerText || 'Document confidentiel · Bosal Credit Union', W, H)
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
