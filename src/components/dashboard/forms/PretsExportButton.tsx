'use client'
import * as React from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { type PdfReportConfig, DEFAULT_PDF_CONFIG, hexToRgb, urlToBase64 } from '@/lib/pdfConfig'
import {
  drawHeader, drawFooter, drawSectionHeading, drawStatCards, drawTable,
  statusToBadgeVariant, SHADCN,
  type Cell,
} from '@/lib/pdf/shadcn-table'

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
  const W = 297; const H = 210; const L = 12; const R = W - 12
  const TOTAL_W = R - L

  let logoBase64: string | null = null
  if (cfg.logoEnabled && cfg.logoUrl) {
    logoBase64 = await urlToBase64(cfg.logoUrl)
  }

  // ── Header ──
  let y = drawHeader(doc, {
    title: 'Portefeuille des prêts',
    subtitle: `Généré le ${new Date().toLocaleDateString('fr-HT')} · ${loans.length} prêt(s)`,
    brand: hexToRgb(cfg.headerColor),
    logoBase64,
  }, W)

  // ── KPI cards ──
  const actifs       = loans.filter(l => l.status === 'active')
  const pending      = loans.filter(l => l.status === 'pending')
  const totalCap     = loans.reduce((s, l) => s + Number(l.principal_amount), 0)
  const totalRem     = loans.reduce((s, l) => s + Number(l.amount_paid ?? 0), 0)
  const totalRepaid  = repayments.filter(r => r.status === 'paid').reduce((s, r) => s + Number(r.amount_paid ?? 0), 0)

  y = drawStatCards(doc, L, y, TOTAL_W, [
    { label: 'Total prêts',         value: String(loans.length) },
    { label: 'Actifs',              value: String(actifs.length),  accent: [22, 101, 52]   },
    { label: 'En attente',          value: String(pending.length), accent: [161, 98, 7]    },
    { label: 'Capital prêté total', value: fHTG(totalCap),         accent: [91, 33, 182]   },
    { label: 'Capital remboursé',   value: fHTG(totalRem),         accent: [29, 78, 216]   },
    { label: 'Remboursements OK',   value: fHTG(totalRepaid),      accent: [22, 101, 52]   },
  ], { perRow: 6 })
  y += 6

  // ── Loans table ──
  y = drawSectionHeading(doc, L, y, 'Liste des prêts')

  const onNewPage = (d: typeof doc): number => { d.addPage(); return 20 }

  y = drawTable(doc, {
    x: L, y, totalWidth: TOTAL_W,
    pageBottomY: H - 16,
    onNewPage,
    columns: [
      { header: 'N° Prêt',     width: 24 },
      { header: 'Membre',      width: 36 },
      { header: 'Capital',     width: 24, align: 'right'  },
      { header: 'Taux',        width: 14, align: 'right'  },
      { header: 'Durée',       width: 14, align: 'right'  },
      { header: 'Mensualité',  width: 24, align: 'right'  },
      { header: 'Total dû',    width: 24, align: 'right'  },
      { header: 'Remb.',       width: 14, align: 'right'  },
      { header: 'Objet',       width: 28 },
      { header: 'Statut',      width: 22, align: 'center' },
      { header: 'Date',        width: 22 },
    ],
    rows: loans.map(l => {
      const member = l.members
      const rembPct = l.total_amount_due > 0
        ? Math.round((Number(l.amount_paid ?? 0) / Number(l.total_amount_due)) * 100)
        : 0
      return [
        { kind: 'mono',  text: l.loan_number } as Cell,
        member ? `${member.first_name} ${member.last_name}` : '—',
        fHTG(Number(l.principal_amount)),
        `${Number(l.interest_rate).toFixed(1)}%`,
        `${l.duration_months}m`,
        fHTG(Number(l.monthly_payment)),
        fHTG(Number(l.total_amount_due)),
        `${rembPct}%`,
        (l.purpose ?? '—').substring(0, 22),
        { kind: 'badge', label: STATUS_LABELS[l.status] ?? l.status, variant: statusToBadgeVariant(l.status) },
        { kind: 'muted', text: fDate(l.created_at) },
      ]
    }),
  })

  // ── Repayments table ──
  if (repayments.length > 0) {
    y += 8
    if (y > H - 40) { doc.addPage(); y = 20 }
    y = drawSectionHeading(doc, L, y, 'Historique des remboursements')

    const totalDue  = repayments.reduce((s, r) => s + Number(r.amount_due  ?? 0), 0)
    const totalPaid = repayments.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0)

    y = drawTable(doc, {
      x: L, y, totalWidth: TOTAL_W,
      pageBottomY: H - 16,
      onNewPage,
      columns: [
        { header: 'N° Prêt',       width: 28 },
        { header: 'Membre',        width: 42 },
        { header: 'Échéance',      width: 16, align: 'center' },
        { header: 'Montant dû',    width: 28, align: 'right'  },
        { header: 'Montant payé',  width: 28, align: 'right'  },
        { header: 'Date échéance', width: 28 },
        { header: 'Date paiement', width: 28 },
        { header: 'Statut',        width: 24, align: 'center' },
      ],
      rows: repayments.map(r => {
        const member = r.loans?.members
        const label  =
          r.status === 'paid'    ? 'Payé' :
          r.status === 'late'    ? 'En retard' :
          r.status === 'missed'  ? 'Manqué' :
          'En attente'
        return [
          { kind: 'mono',  text: r.loans?.loan_number ?? '—' } as Cell,
          member ? `${member.first_name} ${member.last_name}` : '—',
          { kind: 'mono', text: `#${r.installment_no}` },
          fHTG(Number(r.amount_due)),
          r.amount_paid > 0 ? fHTG(Number(r.amount_paid)) : { kind: 'muted', text: '—' },
          r.due_date ? { kind: 'muted', text: fDate(r.due_date) } : { kind: 'muted', text: '—' },
          r.paid_at  ? { kind: 'muted', text: fDate(r.paid_at)  } : { kind: 'muted', text: '—' },
          { kind: 'badge', label, variant: statusToBadgeVariant(r.status) },
        ]
      }),
      footer: [
        { kind: 'strong', text: 'Total' },
        '',
        '',
        fHTG(totalDue),
        fHTG(totalPaid),
        '',
        '',
        '',
      ],
    })
  }

  drawFooter(doc, cfg.footerText || 'Document confidentiel · Bosal Credit Union', W, H)
  doc.save(`prets-${new Date().toISOString().slice(0, 10)}.pdf`)
  // suppress unused warning when SHADCN isn't directly referenced
  void SHADCN
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
