'use client'
import * as React from 'react'
import { Download, Loader2 } from 'lucide-react'
import { type PdfReportConfig, DEFAULT_PDF_CONFIG, hexToRgb, urlToBase64 } from '@/lib/pdfConfig'
import {
  SHADCN, drawHeader, drawFooter, drawSectionHeading, drawStatCards,
} from '@/lib/pdf/shadcn-table'

export interface ReportRow {
  label:    string
  value:    string
  color?:   string   // hex, applied to value cell
  bold?:    boolean
  indent?:  boolean
}

export interface ReportSection {
  heading: string
  rows:    ReportRow[]
  /** Optional totals row rendered at the bottom with bold + accent rule */
  total?:  ReportRow
}

export interface ReportBadge {
  label: string
  value: string
  color: string   // hex
}

interface Props {
  title:    string
  subtitle?: string
  filename:  string
  sections:  ReportSection[]
  badges?:   ReportBadge[]
  config?:   PdfReportConfig
  /** Optional notes printed at the bottom of the last content page */
  notes?: string
}

async function generateReportPDF(
  title: string,
  subtitle: string | undefined,
  filename: string,
  sections: ReportSection[],
  badges: ReportBadge[],
  notes: string | undefined,
  cfg: PdfReportConfig,
) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210; const H = 297; const L = 13; const R = W - 13
  const TOTAL_W = R - L

  // Optional logo
  let logoBase64: string | null = null
  if (cfg.logoEnabled && cfg.logoUrl) {
    logoBase64 = await urlToBase64(cfg.logoUrl)
  }

  // ── Header (shadcn-style: white background + thin brand bar) ──
  let y = drawHeader(doc, {
    title,
    subtitle: subtitle ?? `Généré le ${new Date().toLocaleDateString('fr-HT')}`,
    brand: hexToRgb(cfg.headerColor),
    logoBase64,
  }, W)

  // ── Optional KPI strip ──
  if (badges.length > 0) {
    y = drawStatCards(doc, L, y, TOTAL_W, badges.map(b => ({
      label: b.label,
      value: b.value,
      accent: hexToRgb(b.color),
    })), { perRow: Math.min(badges.length, 4) })
    y += 4
  }

  // ── Sections (label / value rows, like a financial statement) ──
  const ensureRoom = (needed: number) => {
    if (y + needed > H - 18) {
      doc.addPage()
      y = 20
    }
  }

  for (const section of sections) {
    ensureRoom(14)
    y = drawSectionHeading(doc, L, y + 3, section.heading)

    for (const row of section.rows) {
      ensureRoom(7)
      // Label (slate-500, indent for sub-items)
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(...(row.bold ? SHADCN.foreground : SHADCN.mutedForeground))
      doc.text(row.label, L + (row.indent ? 4 : 0), y)

      // Value (right-aligned, optional accent color)
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal')
      if (row.color) {
        const [rr, rg, rb] = hexToRgb(row.color)
        doc.setTextColor(rr, rg, rb)
      } else {
        doc.setTextColor(...SHADCN.foreground)
      }
      doc.text(row.value, R, y, { align: 'right' })

      // Light bottom border (shadcn slate-200)
      doc.setDrawColor(...SHADCN.border)
      doc.setLineWidth(0.12)
      doc.line(L, y + 1.5, R, y + 1.5)
      y += 6
    }

    if (section.total) {
      ensureRoom(9)
      const t = section.total
      // Top separator (slate-300)
      doc.setDrawColor(...SHADCN.borderStrong)
      doc.setLineWidth(0.3)
      doc.line(L, y, R, y)
      // Muted background row
      doc.setFillColor(...SHADCN.muted)
      doc.rect(L, y, TOTAL_W, 7, 'F')
      y += 5
      // Bold totals
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...SHADCN.foreground)
      doc.text(t.label, L + 2, y)
      if (t.color) {
        const [rr, rg, rb] = hexToRgb(t.color)
        doc.setTextColor(rr, rg, rb)
      }
      doc.text(t.value, R - 2, y, { align: 'right' })
      y += 7
    } else {
      y += 4
    }
  }

  // ── Notes ──
  if (notes) {
    ensureRoom(14)
    y += 4
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(...SHADCN.mutedForeground)
    const wrapped = doc.splitTextToSize(notes, TOTAL_W)
    doc.text(wrapped, L, y)
  }

  // ── Footer (every page) ──
  drawFooter(doc, cfg.footerText || 'Document confidentiel', W, H)

  doc.save(filename)
}

export function ReportPdfButton({ title, subtitle, filename, sections, badges, config, notes }: Props) {
  const [exporting, setExporting] = React.useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      await generateReportPDF(title, subtitle, filename, sections, badges ?? [], notes, config ?? DEFAULT_PDF_CONFIG)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button type="button" onClick={handleExport} disabled={exporting}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity"
      style={{ background: '#C41E3A', color: '#fff', opacity: exporting ? 0.65 : 1 }}>
      {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      Exporter PDF
    </button>
  )
}
