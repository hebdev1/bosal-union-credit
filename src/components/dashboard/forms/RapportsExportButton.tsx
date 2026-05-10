'use client'
import * as React from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import {
  drawHeader, drawFooter, drawSectionHeading, drawStatCards, drawTable,
  statusToBadgeVariant, type Cell,
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
  const W = 210; const H = 297; const L = 13; const R = W - 13
  const TOTAL_W = R - L

  // ── Header ──
  let y = drawHeader(doc, {
    title: 'Rapport général',
    subtitle: `Synthèse complète des activités · ${new Date().toLocaleDateString('fr-HT')}`,
  }, W)

  // ── KPI cards ──
  y = drawStatCards(doc, L, y, TOTAL_W, [
    { label: 'Total dépôts',      value: fHTG(d.totalDeposits),                          accent: [22, 101, 52]  },
    { label: 'Total retraits',    value: fHTG(d.totalWithdrawals),                       accent: [185, 28, 28] },
    { label: 'Flux net',          value: fHTG(d.totalDeposits - d.totalWithdrawals),     accent: d.totalDeposits >= d.totalWithdrawals ? [22, 101, 52] : [185, 28, 28] },
    { label: 'Capital prêté',     value: fHTG(d.totalLoans),                             accent: [91, 33, 182] },
    { label: 'Capital remboursé', value: fHTG(d.totalRepaid),                            accent: [29, 78, 216] },
    { label: 'Prêts en défaut',   value: String(d.defaulted),                            accent: d.defaulted > 0 ? [185, 28, 28] : [22, 101, 52] },
    { label: 'Membres actifs',    value: String(d.membersActive),                        accent: [29, 78, 216] },
    { label: 'Opérations change', value: String(d.exchangeCount),                        accent: [22, 101, 52] },
  ], { perRow: 4 })
  y += 4

  const onNewPage = (dd: typeof doc): number => { dd.addPage(); return 20 }

  // ── Transaction breakdown ──
  const txTotal = d.txBreakdown.reduce((s, t) => s + t.count, 0)
  if (d.txBreakdown.length > 0) {
    y = drawSectionHeading(doc, L, y + 2, 'Répartition des transactions')
    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 20,
      onNewPage,
      columns: [
        { header: 'Type',          width: 50 },
        { header: 'Opérations',    width: 28, align: 'right' },
        { header: '%',             width: 18, align: 'right' },
        { header: 'Montant total', width: 50, align: 'right' },
      ],
      rows: d.txBreakdown.map(t => {
        const pct = txTotal > 0 ? Math.round((t.count / txTotal) * 100) : 0
        return [
          { kind: 'badge', label: t.label, variant: statusToBadgeVariant(t.type) } as Cell,
          String(t.count),
          `${pct}%`,
          { kind: 'strong', text: fHTG(t.total) },
        ]
      }),
      footer: [
        { kind: 'strong', text: 'Total' },
        String(txTotal),
        '100%',
        { kind: 'strong', text: fHTG(d.txBreakdown.reduce((s, t) => s + t.total, 0)) },
      ],
    })
    y += 6
  }

  // ── Loan portfolio ──
  if (d.loansByStatus.length > 0) {
    y = drawSectionHeading(doc, L, y, 'Portefeuille prêts par statut')
    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 20,
      onNewPage,
      columns: [
        { header: 'Statut',        width: 60 },
        { header: 'Nombre',        width: 28, align: 'right' },
        { header: 'Capital total', width: 60, align: 'right' },
      ],
      rows: d.loansByStatus.map(s => [
        { kind: 'badge', label: s.label, variant: statusToBadgeVariant(s.status) } as Cell,
        String(s.count),
        { kind: 'strong', text: fHTG(s.amount) },
      ]),
      footer: [
        { kind: 'strong', text: 'Total' },
        String(d.loansByStatus.reduce((s, l) => s + l.count, 0)),
        { kind: 'strong', text: fHTG(d.loansByStatus.reduce((s, l) => s + l.amount, 0)) },
      ],
    })
    y += 6
  }

  // ── Bureau de change pairs ──
  if (d.pairs.length > 0) {
    if (y > H - 60) { doc.addPage(); y = 20 }
    y = drawSectionHeading(doc, L, y, 'Bureau de change — Répartition par paire')
    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 20,
      onNewPage,
      columns: [
        { header: 'Paire',          width: 30 },
        { header: 'Opérations',     width: 24, align: 'right' },
        { header: 'Montant donné',  width: 45, align: 'right' },
        { header: 'Montant reçu',   width: 45, align: 'right' },
      ],
      rows: d.pairs.map(p => [
        { kind: 'strong', text: `${p.fromCcy} → ${p.toCcy}` } as Cell,
        String(p.count),
        p.fromCcy === 'USD' ? fUSD(p.given)    : fHTG(p.given),
        p.toCcy   === 'USD' ? fUSD(p.received) : fHTG(p.received),
      ]),
    })
  }

  // ── Exchange detail (on a new page) ──
  if (d.exchDetail.length > 0) {
    doc.addPage()
    y = drawHeader(doc, {
      title: 'Détail des opérations de change',
      subtitle: `${d.exchDetail.length} opération(s) listée(s)`,
    }, W)
    y += 4
    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 20,
      onNewPage,
      columns: [
        { header: 'Ticket',         width: 24 },
        { header: 'Client',         width: 36 },
        { header: 'De',             width: 12, align: 'center' },
        { header: 'Vers',           width: 12, align: 'center' },
        { header: 'Donné',          width: 26, align: 'right' },
        { header: 'Taux',           width: 16, align: 'right' },
        { header: 'Reçu',           width: 26, align: 'right' },
        { header: 'Agent',          width: 24 },
        { header: 'Date',           width: 28 },
      ],
      rows: d.exchDetail.map(t => [
        { kind: 'mono', text: t.ticket_number ?? '—' } as Cell,
        `${t.client_first_name} ${t.client_last_name}`.substring(0, 18),
        { kind: 'badge', label: t.from_currency, variant: 'info' },
        { kind: 'badge', label: t.to_currency,   variant: 'info' },
        t.from_currency === 'USD' ? fUSD(Number(t.amount_given)) : fHTG(Number(t.amount_given)),
        { kind: 'muted', text: Number(t.rate_applied).toFixed(4) },
        { kind: 'strong', text: t.to_currency === 'USD' ? fUSD(Number(t.amount_received)) : fHTG(Number(t.amount_received)) },
        { kind: 'muted', text: (t.agents?.name ?? '—').substring(0, 14) },
        { kind: 'muted', text: fDate(t.created_at).substring(0, 16) },
      ]),
    })
  }

  drawFooter(doc, `Document généré le ${new Date().toLocaleDateString('fr-HT')} · Bosal Credit Union`, W, H)
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
