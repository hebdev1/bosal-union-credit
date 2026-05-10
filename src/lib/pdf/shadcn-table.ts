/**
 * shadcn-style table primitives for jsPDF reports.
 *
 * Translates the look-and-feel of the shadcn <Table /> + <Badge /> components
 * to a print-friendly light theme, so every report PDF in this app shares the
 * same visual language as the dashboard UI.
 *
 * Used ONLY by report generators (rapports). Ticket PDFs intentionally keep
 * their own minimal layout — see TransactionTicketPDF.ts / ExchangeTicketPDF.ts.
 */

import type jsPDF from 'jspdf'

type RGB = readonly [number, number, number]

/* ── Light theme tokens (mirrors shadcn defaults) ───────────────────────── */
export const SHADCN = {
  background:      [255, 255, 255] as RGB,
  foreground:      [15,  23,  42]  as RGB, // slate-900
  mutedForeground: [100, 116, 139] as RGB, // slate-500
  muted:           [241, 245, 249] as RGB, // slate-100
  mutedHover:      [248, 250, 252] as RGB, // slate-50
  border:          [226, 232, 240] as RGB, // slate-200
  borderStrong:    [203, 213, 225] as RGB, // slate-300
  primary:         [37,  99,  235] as RGB, // blue-600
  brand:           [196, 30,  58]  as RGB, // bosal red
}

/* ── Badge variants (light appearance, matches Badge component) ─────────── */
export const BADGE_VARIANTS = {
  primary:     { bg: [219, 234, 254] as RGB, fg: [29,  78,  216] as RGB }, // blue-100  / blue-700
  secondary:   { bg: [241, 245, 249] as RGB, fg: [51,  65,  85]  as RGB }, // slate-100 / slate-700
  success:     { bg: [220, 252, 231] as RGB, fg: [22,  101, 52]  as RGB }, // green-100 / green-800
  warning:     { bg: [254, 249, 195] as RGB, fg: [161, 98,  7]   as RGB }, // yellow-100 / yellow-700
  info:        { bg: [237, 233, 254] as RGB, fg: [91,  33,  182] as RGB }, // violet-100 / violet-700
  destructive: { bg: [254, 226, 226] as RGB, fg: [185, 28,  28]  as RGB }, // red-100  / red-700
  outline:     { bg: [255, 255, 255] as RGB, fg: [51,  65,  85]  as RGB }, // white   / slate-700
} as const

export type BadgeVariant = keyof typeof BADGE_VARIANTS

/* ── Cell types ─────────────────────────────────────────────────────────── */
export type Align = 'left' | 'right' | 'center'

export interface Column {
  header:  string
  width:   number        // mm — relative weights; auto-scaled to fit totalWidth
  align?:  Align         // default 'left'
}

export type Cell =
  | string
  | { kind: 'badge'; label: string; variant: BadgeVariant }
  | { kind: 'muted'; text: string }           // slate-500
  | { kind: 'mono';  text: string }           // courier — references / numbers
  | { kind: 'strong'; text: string }          // bold

/* ── Drawing primitives ─────────────────────────────────────────────────── */

/** Draws a section heading + optional subtitle above a table. */
export function drawSectionHeading(
  doc: jsPDF, x: number, y: number,
  title: string, subtitle?: string,
): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...SHADCN.foreground)
  doc.text(title, x, y)
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...SHADCN.mutedForeground)
    doc.text(subtitle, x, y + 4)
    return y + 8
  }
  return y + 5
}

/** Draws a row of compact "stat" cards (white bg, light border). */
export function drawStatCards(
  doc: jsPDF, x: number, y: number, totalWidth: number,
  cards: { label: string; value: string; accent?: RGB }[],
  options?: { perRow?: number; cardHeight?: number },
): number {
  const perRow     = options?.perRow ?? 4
  const cardHeight = options?.cardHeight ?? 16
  const gap        = 2
  const cardW      = (totalWidth - gap * (perRow - 1)) / perRow

  cards.forEach((card, i) => {
    const col = i % perRow
    const row = Math.floor(i / perRow)
    const cx  = x + col * (cardW + gap)
    const cy  = y + row * (cardHeight + gap)

    // Background + border (subtle)
    doc.setFillColor(...SHADCN.background)
    doc.setDrawColor(...SHADCN.border)
    doc.setLineWidth(0.2)
    doc.roundedRect(cx, cy, cardW, cardHeight, 1.2, 1.2, 'FD')

    // Value (large, bold)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...(card.accent ?? SHADCN.foreground))
    doc.text(card.value, cx + cardW / 2, cy + 7.5, { align: 'center' })

    // Label (small, muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(...SHADCN.mutedForeground)
    doc.text(card.label, cx + cardW / 2, cy + 12.5, { align: 'center' })
  })

  const rows = Math.ceil(cards.length / perRow)
  return y + rows * (cardHeight + gap)
}

interface TableOptions {
  x:           number
  y:           number
  totalWidth:  number
  columns:     Column[]
  rows:        Cell[][]
  /** Optional footer row (e.g. totals). */
  footer?:     Cell[]
  /** Caption rendered under the table (e.g. "5 lignes affichées"). */
  caption?:    string
  /** Y coordinate that triggers a page break (default 200 portrait / 190 landscape). */
  pageBottomY?: number
  /** Called when paginating — must add a new page + return the new starting Y. */
  onNewPage?:  (doc: jsPDF) => number
  rowHeight?:      number   // mm, default 8
  headerHeight?:   number   // mm, default 9
  fontSize?:       number   // pt, default 8.5
  headerFontSize?: number   // pt, default 7.5
}

/** Computes column x-positions after scaling widths to fit totalWidth. */
function layout(columns: Column[], x: number, totalWidth: number): {
  xs: number[]; ws: number[]
} {
  const sum = columns.reduce((s, c) => s + c.width, 0)
  const scale = totalWidth / sum
  const xs: number[] = []
  const ws: number[] = []
  let cursor = x
  columns.forEach(c => {
    xs.push(cursor)
    const w = c.width * scale
    ws.push(w)
    cursor += w
  })
  return { xs, ws }
}

function cellAnchorX(col: Column, cellX: number, cellW: number, padding = 3): {
  x: number; align: Align
} {
  const align = col.align ?? 'left'
  if (align === 'right')  return { x: cellX + cellW - padding, align: 'right' }
  if (align === 'center') return { x: cellX + cellW / 2,        align: 'center' }
  return { x: cellX + padding, align: 'left' }
}

/** Paints a single cell (handles all Cell variants). */
function paintCell(
  doc: jsPDF, cell: Cell, col: Column,
  cellX: number, cellW: number, baselineY: number,
) {
  const { x: anchor, align } = cellAnchorX(col, cellX, cellW)

  if (typeof cell === 'string') {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SHADCN.foreground)
    doc.text(cell, anchor, baselineY, { align })
    return
  }
  if (cell.kind === 'muted') {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SHADCN.mutedForeground)
    doc.text(cell.text, anchor, baselineY, { align })
    return
  }
  if (cell.kind === 'mono') {
    doc.setFont('courier', 'normal')
    doc.setTextColor(...SHADCN.foreground)
    doc.text(cell.text, anchor, baselineY, { align })
    return
  }
  if (cell.kind === 'strong') {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...SHADCN.foreground)
    doc.text(cell.text, anchor, baselineY, { align })
    return
  }
  if (cell.kind === 'badge') {
    drawBadge(doc, { x: anchor, y: baselineY - 3.4, label: cell.label, variant: cell.variant, align })
    return
  }
}

/** Renders one shadcn-style data table. Returns the y after the table. */
export function drawTable(doc: jsPDF, opts: TableOptions): number {
  const {
    x, totalWidth, columns, rows,
    footer, caption,
    rowHeight       = 8,
    headerHeight    = 9,
    fontSize        = 8.5,
    headerFontSize  = 7.5,
    pageBottomY     = 200,
    onNewPage,
  } = opts

  let y = opts.y
  const { xs, ws } = layout(columns, x, totalWidth)

  /* ── Header (drawn once + after every page break) ─────────────────── */
  function drawHeader(): void {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(headerFontSize)
    doc.setTextColor(...SHADCN.mutedForeground)
    columns.forEach((c, i) => {
      const { x: anchor, align } = cellAnchorX(c, xs[i], ws[i])
      doc.text(c.header.toUpperCase(), anchor, y + headerHeight - 3.5, { align })
    })
    // bottom border
    doc.setDrawColor(...SHADCN.borderStrong)
    doc.setLineWidth(0.25)
    doc.line(x, y + headerHeight, x + totalWidth, y + headerHeight)
    y += headerHeight
  }
  drawHeader()

  /* ── Body rows ────────────────────────────────────────────────────── */
  doc.setFontSize(fontSize)

  rows.forEach((row, rIdx) => {
    if (y + rowHeight > pageBottomY && onNewPage) {
      y = onNewPage(doc)
      drawHeader()
      doc.setFontSize(fontSize)
    }
    const baselineY = y + rowHeight - 2.6
    row.forEach((cell, i) => {
      const col = columns[i]
      if (!col) return
      paintCell(doc, cell, col, xs[i], ws[i], baselineY)
    })

    // bottom border (not after the last row — matches `[&_tr:last-child]:border-0`)
    if (rIdx < rows.length - 1) {
      doc.setDrawColor(...SHADCN.border)
      doc.setLineWidth(0.15)
      doc.line(x, y + rowHeight, x + totalWidth, y + rowHeight)
    }
    y += rowHeight
  })

  /* ── Footer (totals) ──────────────────────────────────────────────── */
  if (footer && footer.length > 0) {
    // top separator
    doc.setDrawColor(...SHADCN.borderStrong)
    doc.setLineWidth(0.25)
    doc.line(x, y, x + totalWidth, y)
    // muted/50 fill
    doc.setFillColor(...SHADCN.muted)
    doc.rect(x, y, totalWidth, rowHeight, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fontSize)
    doc.setTextColor(...SHADCN.foreground)

    const baselineY = y + rowHeight - 2.6
    footer.forEach((cell, i) => {
      const col = columns[i] ?? columns[columns.length - 1]
      const cellX = xs[i] ?? xs[xs.length - 1]
      const cellW = ws[i] ?? ws[ws.length - 1]
      paintCell(doc, cell, col, cellX, cellW, baselineY)
    })
    y += rowHeight
  }

  /* ── Caption ──────────────────────────────────────────────────────── */
  if (caption) {
    y += 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...SHADCN.mutedForeground)
    doc.text(caption, x + totalWidth / 2, y + 3, { align: 'center' })
    y += 5
  }

  return y
}

/** Draws a single shadcn badge (light appearance, rounded-sm). */
export function drawBadge(
  doc: jsPDF, opts: { x: number; y: number; label: string; variant: BadgeVariant; align?: Align },
): void {
  const v = BADGE_VARIANTS[opts.variant]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.6)

  const padX = 2
  const labelW = doc.getTextWidth(opts.label) + padX * 2
  const h = 4.3

  let bx = opts.x
  if (opts.align === 'right')  bx = opts.x - labelW
  if (opts.align === 'center') bx = opts.x - labelW / 2

  doc.setFillColor(...v.bg)
  doc.roundedRect(bx, opts.y, labelW, h, 0.8, 0.8, 'F')

  doc.setTextColor(...v.fg)
  doc.text(opts.label, bx + labelW / 2, opts.y + h - 1.2, { align: 'center' })

  // Reset font to normal so subsequent text isn't bold
  doc.setFont('helvetica', 'normal')
}

/* ── Header + footer chrome shared across all reports ───────────────── */

export interface PageChromeOptions {
  title:    string
  subtitle?: string
  brand?:   RGB
  /** Optional logo (base64 PNG) printed in the top-left. */
  logoBase64?: string | null
}

/** Draws the title bar (white background + brand bar) at the top. */
export function drawHeader(
  doc: jsPDF, opts: PageChromeOptions, pageWidth: number,
): number {
  const brand = opts.brand ?? SHADCN.brand
  // White header — minimal, shadcn-style
  doc.setFillColor(...SHADCN.background)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Thin brand bar on top
  doc.setFillColor(...brand)
  doc.rect(0, 0, pageWidth, 2.5, 'F')

  // Logo (optional)
  let titleX = 14
  if (opts.logoBase64) {
    try { doc.addImage(opts.logoBase64, 13, 7, 16, 13); titleX = 33 } catch { /* ignore */ }
  }

  // Title — left aligned, dark text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...SHADCN.foreground)
  doc.text(opts.title, titleX, 14)

  // Subtitle — muted
  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SHADCN.mutedForeground)
    doc.text(opts.subtitle, titleX, 19.5)
  }

  // Separator below header
  doc.setDrawColor(...SHADCN.border)
  doc.setLineWidth(0.3)
  doc.line(13, 28, pageWidth - 13, 28)

  return 36
}

/** Draws the footer text on every page (page numbers + provided text). */
export function drawFooter(
  doc: jsPDF, text: string, pageWidth: number, pageHeight: number,
): void {
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    // Separator
    doc.setDrawColor(...SHADCN.border)
    doc.setLineWidth(0.2)
    doc.line(13, pageHeight - 12, pageWidth - 13, pageHeight - 12)
    // Text
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...SHADCN.mutedForeground)
    doc.text(text, 13, pageHeight - 7)
    doc.text(`Page ${p} / ${pages}`, pageWidth - 13, pageHeight - 7, { align: 'right' })
  }
}

/* ── Mapping helpers ─────────────────────────────────────────────────── */

/** Maps a domain status string to a badge variant for consistent colouring. */
export function statusToBadgeVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return 'secondary'
  switch (status) {
    // success
    case 'active': case 'paid': case 'completed': case 'deposit':
      return 'success'
    // warning
    case 'pending': case 'partial': case 'adjustment':
      return 'warning'
    // destructive
    case 'late': case 'missed': case 'defaulted': case 'rejected':
    case 'failed': case 'withdrawal': case 'cancelled': case 'frozen':
      return 'destructive'
    // info
    case 'transfer': case 'closed':
      return 'info'
    default:
      return 'secondary'
  }
}
