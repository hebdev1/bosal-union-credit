// Client-side PDF ticket generator for deposit / withdrawal receipts.
// 80mm × 175mm thermal-printer format. Designed to render on the WHITE
// background of a thermal printer, so every body color is a print-safe
// slate scale that survives photocopy / fax / cheap toner. Every visible
// hue is wired to the agent's saved ticket settings (category='pdf').

import { urlToBase64 } from '@/lib/pdfConfig'

export interface TicketConfig {
  accent_color:        string   // brand stripe + reference + footer band
  received_color:      string   // deposit amount block accent
  withdrawal_color?:   string   // withdrawal amount block accent (defaults to red)
  header_color?:       string   // header band background
  header_text_color?:  string   // coop name color in header (auto-contrast if absent)
  text_color?:         string   // body value text color (defaults to slate-900)
  footer_text?:        string   // bottom bar text
  logo_url?:           string   // public URL of logo image
  logo_enabled?:       boolean  // whether to show the logo
}

export const DEFAULT_TX_TICKET_CONFIG: TicketConfig = {
  accent_color:     '#C41E3A',
  received_color:   '#16A34A',
  withdrawal_color: '#DC2626',
  header_color:     '#0E0E12',
  text_color:       '#0F172A',
}

export interface TicketData {
  reference:         string
  transaction_type:  'deposit' | 'withdrawal'
  amount:            number
  motif:             string | null
  created_at:        string
  account_number:    string
  account_type:      string
  currency:          string
  balance_before:    number
  balance_after:     number
  member_first_name: string
  member_last_name:  string
  member_number:     string
  agent_name:        string
  coop_name:         string
}

const TYPE_LABELS: Record<TicketData['transaction_type'], string> = {
  deposit:    'DÉPÔT',
  withdrawal: 'RETRAIT',
}

function fmt(n: number, ccy: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: ccy || 'HTG', minimumFractionDigits: 2,
  }).format(n)
}

function fDateTime(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

type RGB = [number, number, number]

function hex(h: string): RGB {
  const c = (h || '').replace('#', '')
  if (c.length === 3) {
    return [
      parseInt(c[0] + c[0], 16) || 0,
      parseInt(c[1] + c[1], 16) || 0,
      parseInt(c[2] + c[2], 16) || 0,
    ]
  }
  return [
    parseInt(c.slice(0, 2), 16) || 0,
    parseInt(c.slice(2, 4), 16) || 0,
    parseInt(c.slice(4, 6), 16) || 0,
  ]
}

/** Perceived luminance 0–1. Used to detect colors that are too light to read on white. */
function luminance(c: RGB): number {
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255
}

/** Returns a darker version of `c` if it would be unreadable on a white bg. */
function darkenForWhiteBg(c: RGB, threshold = 0.62): RGB {
  if (luminance(c) <= threshold) return c
  // Scale down each channel so the colour is readable on white print.
  const k = threshold / Math.max(luminance(c), 0.0001)
  return [
    Math.round(c[0] * k),
    Math.round(c[1] * k),
    Math.round(c[2] * k),
  ]
}

/** Returns black or white depending on which has best contrast against `bg`. */
function autoContrastText(bg: RGB): RGB {
  return luminance(bg) > 0.55 ? [15, 23, 42] /* slate-900 */ : [255, 255, 255]
}

/** Tints a colour towards white by `t` (0–1). Used for soft fills. */
function tint(c: RGB, t: number): RGB {
  return [
    Math.round(c[0] + (255 - c[0]) * t),
    Math.round(c[1] + (255 - c[1]) * t),
    Math.round(c[2] + (255 - c[2]) * t),
  ]
}

export async function generateTransactionTicketPDF(
  ticket: TicketData,
  config: TicketConfig = DEFAULT_TX_TICKET_CONFIG,
) {
  const { default: jsPDF } = await import('jspdf')

  // 80mm × 175mm — standard thermal receipt format
  const W = 80
  const H = 175
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H] })
  const cx = W / 2
  const L  = 6
  const R  = W - L

  const isDeposit = ticket.transaction_type === 'deposit'

  /* ── Resolve every colour through the user config ──────────────────────── */
  // Header band: honour the saved bg + text colour. Auto-contrast if text not set.
  const HC  = hex(config.header_color ?? DEFAULT_TX_TICKET_CONFIG.header_color!)
  const HTC: RGB = config.header_text_color
    ? hex(config.header_text_color)
    : autoContrastText(HC)

  // Brand stripe + reference highlight: accent colour, darkened if too light for white.
  const AC_raw = hex(config.accent_color)
  const AC: RGB = darkenForWhiteBg(AC_raw)

  // Amount block colour (deposit → received, withdrawal → withdrawal).
  // Darkened so text is always readable on white print.
  const RC_raw = hex(config.received_color)
  const WC_raw = hex(config.withdrawal_color ?? '#DC2626')
  const TC: RGB = darkenForWhiteBg(isDeposit ? RC_raw : WC_raw)

  // Body text colour (slate-900 by default).
  const TXT: RGB = hex(config.text_color ?? '#0F172A')

  // Print-safe slate palette for labels / dividers / muted text on white paper.
  const LABEL:   RGB = [100, 116, 139] // slate-500 — labels
  const MUTED:   RGB = [148, 163, 184] // slate-400 — secondary text
  const DIVIDER: RGB = [203, 213, 225] // slate-300 — visible on photocopies

  let y = 0

  /* ── Header band ───────────────────────────────────────────────────────── */
  doc.setFillColor(...HC)
  doc.rect(0, 0, W, 28, 'F')

  // Top accent stripe (uses accent_color)
  doc.setFillColor(...AC)
  doc.rect(0, 0, W, 2.5, 'F')

  if (config.logo_enabled !== false && config.logo_url) {
    const logoData = await urlToBase64(config.logo_url)
    if (logoData) {
      try { doc.addImage(logoData, L, 4, 12, 10) } catch { /* ignore */ }
    }
  }

  y = 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...HTC)
  doc.text(ticket.coop_name.toUpperCase(), cx, y, { align: 'center' })

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  // Subtitle uses HTC at ~70% opacity by blending toward the header background
  const subtitleColor = tint(HTC, 0.35)
  doc.setTextColor(...subtitleColor)
  doc.text('OPÉRATION DE CAISSE  ·  REÇU CLIENT', cx, y, { align: 'center' })

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...HTC)
  doc.text(fDateTime(ticket.created_at), cx, y, { align: 'center' })

  /* ── Big TYPE pill (DÉPÔT / RETRAIT) ──────────────────────────────────── */
  y = 33
  // Tinted background based on the operation colour
  const pillBg = tint(TC, 0.85)
  doc.setFillColor(...pillBg)
  doc.roundedRect(cx - 18, y, 36, 7, 1.5, 1.5, 'F')
  doc.setDrawColor(...TC)
  doc.setLineWidth(0.3)
  doc.roundedRect(cx - 18, y, 36, 7, 1.5, 1.5, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TC)
  doc.text(TYPE_LABELS[ticket.transaction_type], cx, y + 4.8, { align: 'center' })

  /* ── Reference (the "ticket number") ──────────────────────────────────── */
  y += 12
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...LABEL)
  doc.text('RÉFÉRENCE', cx, y, { align: 'center' })

  y += 5.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...AC)
  doc.text(ticket.reference, cx, y, { align: 'center' })

  // Underline in accent
  y += 1.5
  doc.setDrawColor(...AC)
  doc.setLineWidth(0.5)
  const tw = doc.getTextWidth(ticket.reference) + 4
  doc.line(cx - tw / 2, y, cx + tw / 2, y)

  // Divider (slate-300 — visible on print)
  y += 6
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 5

  /* ── Info row helper ──────────────────────────────────────────────────── */
  function row(label: string, value: string, valueColor: RGB = TXT) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...LABEL)
    doc.text(label, L, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...valueColor)
    doc.text(value, R, y, { align: 'right' })
    y += 6.5
  }

  /* ── Member ───────────────────────────────────────────────────────────── */
  row('MEMBRE',    `${ticket.member_first_name} ${ticket.member_last_name}`)
  row('N° MEMBRE', ticket.member_number)
  row('COMPTE',    ticket.account_number)
  row('TYPE',      ticket.account_type.toUpperCase())
  row('DEVISE',    ticket.currency)

  // Divider before amount
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 4

  /* ── AMOUNT highlight zone ────────────────────────────────────────────── */
  y += 1
  // Soft tint of the operation colour (≈85% toward white) — always readable
  doc.setFillColor(...tint(TC, 0.88))
  doc.roundedRect(L - 1, y - 5, R - L + 2, 16, 1.5, 1.5, 'F')
  doc.setDrawColor(...TC)
  doc.setLineWidth(0.4)
  doc.roundedRect(L - 1, y - 5, R - L + 2, 16, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...TC)
  doc.text(isDeposit ? 'MONTANT REÇU' : 'MONTANT REMIS', L + 1, y + 1)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...TC)
  const sign = isDeposit ? '+' : '−'
  doc.text(`${sign} ${fmt(ticket.amount, ticket.currency)}`, R - 1, y + 8, { align: 'right' })
  y += 19

  /* ── Balances (before / after) ────────────────────────────────────────── */
  row('SOLDE AVANT', fmt(ticket.balance_before, ticket.currency))
  row('SOLDE APRÈS', fmt(ticket.balance_after,  ticket.currency), TC)

  /* ── Motif (optional) ─────────────────────────────────────────────────── */
  if (ticket.motif) {
    doc.setDrawColor(...DIVIDER)
    doc.setLineWidth(0.3)
    doc.line(L, y, R, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...LABEL)
    doc.text('MOTIF', L, y)
    y += 3.5
    doc.setTextColor(...TXT)
    const lines = doc.splitTextToSize(ticket.motif, R - L)
    doc.text(lines, L, y)
    y += lines.length * 3.5 + 3
  }

  /* ── Agent + signature line ───────────────────────────────────────────── */
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...LABEL)
  doc.text('AGENT', L, y)
  doc.setTextColor(...TXT)
  doc.setFont('helvetica', 'bold')
  doc.text(ticket.agent_name, R, y, { align: 'right' })
  y += 8

  // Signature box
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...LABEL)
  doc.text('SIGNATURE DU MEMBRE', L, y)
  y += 8
  doc.setDrawColor(...MUTED)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)

  /* ── Footer band ──────────────────────────────────────────────────────── */
  doc.setFillColor(...AC)
  doc.rect(0, H - 5, W, 5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  // Footer text always white-on-accent (auto-contrast)
  const footerTextColor = autoContrastText(AC)
  doc.setTextColor(...footerTextColor)
  const footerText = config.footer_text ?? 'Merci de votre confiance  ·  Conservez ce reçu'
  doc.text(footerText, cx, H - 1.5, { align: 'center' })

  doc.save(`recu-${ticket.reference}.pdf`)
}
