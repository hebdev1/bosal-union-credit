'use client'
import * as React from 'react'
import { Download, Loader2 } from 'lucide-react'
import { type PdfReportConfig, DEFAULT_PDF_CONFIG, hexToRgb, urlToBase64 } from '@/lib/pdfConfig'

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
  const W = 210; const L = 13; const R = W - 13; const PAGE_H = 297

  const [hr, hg, hb] = hexToRgb(cfg.headerColor)
  const [ar, ag, ab] = hexToRgb(cfg.accentColor)
  const [tr, tg, tb] = hexToRgb(cfg.textColor)

  // ── Header band ──
  doc.setFillColor(hr, hg, hb)
  doc.rect(0, 0, W, 30, 'F')

  if (cfg.logoEnabled && cfg.logoUrl) {
    const logoData = await urlToBase64(cfg.logoUrl)
    if (logoData) { try { doc.addImage(logoData, L, 6, 18, 18) } catch { /* ignore */ } }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(ar, ag, ab)
  doc.text(title.toUpperCase(), W / 2, 14, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text(subtitle ?? `Généré le ${new Date().toLocaleDateString('fr-HT')}`, W / 2, 21, { align: 'center' })

  let y = 40

  // ── Badges (optional KPI strip) ──
  if (badges.length > 0) {
    const cw = (R - L) / badges.length
    badges.forEach((b, i) => {
      const x = L + i * cw
      doc.setFillColor(245, 245, 247)
      doc.roundedRect(x + 1, y - 4, cw - 2, 16, 2, 2, 'F')
      const [br, bg, bb] = hexToRgb(b.color)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(br, bg, bb)
      doc.text(b.value, x + cw / 2, y + 2, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text(b.label, x + cw / 2, y + 8, { align: 'center' })
    })
    y += 22
  }

  // ── Sections ──
  const ensureRoom = (needed: number) => {
    if (y + needed > PAGE_H - 18) {
      doc.addPage()
      y = 20
    }
  }

  for (const section of sections) {
    ensureRoom(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(tr, tg, tb)
    doc.text(section.heading, L, y)
    doc.setDrawColor(ar, ag, ab)
    doc.setLineWidth(0.4)
    doc.line(L, y + 1.5, R, y + 1.5)
    y += 7

    for (const row of section.rows) {
      ensureRoom(7)
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal')
      doc.setFontSize(8)
      doc.setTextColor(110, 110, 110)
      doc.text(row.label, L + (row.indent ? 4 : 0), y)
      if (row.color) {
        const [rr, rg, rb] = hexToRgb(row.color)
        doc.setTextColor(rr, rg, rb)
      } else {
        doc.setTextColor(tr, tg, tb)
      }
      doc.setFont('helvetica', row.bold ? 'bold' : 'normal')
      doc.text(row.value, R, y, { align: 'right' })
      doc.setDrawColor(230, 230, 233)
      doc.setLineWidth(0.1)
      doc.line(L, y + 1.3, R, y + 1.3)
      y += 5.5
    }

    if (section.total) {
      ensureRoom(9)
      y += 1.5
      const t = section.total
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(tr, tg, tb)
      doc.text(t.label, L, y)
      if (t.color) {
        const [rr, rg, rb] = hexToRgb(t.color)
        doc.setTextColor(rr, rg, rb)
      }
      doc.text(t.value, R, y, { align: 'right' })
      doc.setDrawColor(ar, ag, ab)
      doc.setLineWidth(0.6)
      doc.line(L, y + 1.5, R, y + 1.5)
      y += 8
    } else {
      y += 4
    }
  }

  if (notes) {
    ensureRoom(12)
    y += 2
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(140, 140, 140)
    const wrapped = doc.splitTextToSize(notes, R - L)
    doc.text(wrapped, L, y)
  }

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(110, 110, 110)
    doc.text(cfg.footerText || 'Document confidentiel', L, PAGE_H - 8)
    doc.text(`Page ${p}/${pages}`, R, PAGE_H - 8, { align: 'right' })
  }

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
