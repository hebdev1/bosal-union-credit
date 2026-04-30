// Client-side PDF ticket generator for deposit / withdrawal receipts.
// Mirrors the visual language of ExchangeTicketPDF.ts but is dedicated to
// account operations (member-side print receipt).

import { urlToBase64 } from '@/lib/pdfConfig'

export interface TicketConfig {
  accent_color:        string   // brand accent (header band underline)
  received_color:      string   // deposit success / amount highlight color
  withdrawal_color?:   string   // withdrawal warn color (defaults to accent)
  header_color?:       string   // header band background
  header_text_color?:  string   // coop name color in header (defaults to accent)
  footer_text?:        string   // bottom bar text
  logo_url?:           string   // public URL of logo image
  logo_enabled?:       boolean  // whether to show the logo
}

export const DEFAULT_TX_TICKET_CONFIG: TicketConfig = {
  accent_color:     '#C41E3A',
  received_color:   '#22C55E',
  withdrawal_color: '#EF4444',
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

function hex(h: string): [number, number, number] {
  const c = h.replace('#', '')
  return [
    parseInt(c.slice(0, 2), 16) || 0,
    parseInt(c.slice(2, 4), 16) || 0,
    parseInt(c.slice(4, 6), 16) || 0,
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
  let y    = 0

  const isDeposit = ticket.transaction_type === 'deposit'

  const AC  = hex(config.accent_color)
  const RC  = hex(config.received_color)
  const WC  = hex(config.withdrawal_color ?? config.accent_color)
  const HC  = hex(config.header_color ?? '#0E0E12')
  const HTC = config.header_text_color ? hex(config.header_text_color) : AC
  const TC  = isDeposit ? RC : WC // amount color

  // ── Header band ────────────────────────────────────────────────────────
  doc.setFillColor(...HC)
  doc.rect(0, 0, W, 28, 'F')

  // Top accent stripe
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
  doc.setTextColor(160, 160, 170)
  doc.text(`OPÉRATION DE CAISSE  ·  REÇU CLIENT`, cx, y, { align: 'center' })

  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(110, 110, 120)
  doc.text(fDateTime(ticket.created_at), cx, y, { align: 'center' })

  // ── Big TYPE pill (Deposit / Retrait) ─────────────────────────────────
  y = 33
  // colored capsule
  doc.setFillColor(Math.round(TC[0] * 0.10), Math.round(TC[1] * 0.10), Math.round(TC[2] * 0.10))
  doc.roundedRect(cx - 18, y, 36, 7, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...TC)
  doc.text(TYPE_LABELS[ticket.transaction_type], cx, y + 4.8, { align: 'center' })

  // ── Reference (the "ticket number") ───────────────────────────────────
  y += 12
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(110, 110, 120)
  doc.text('RÉFÉRENCE', cx, y, { align: 'center' })

  y += 5.5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...AC)
  doc.text(ticket.reference, cx, y, { align: 'center' })

  // Underline
  y += 1.5
  doc.setDrawColor(...AC)
  doc.setLineWidth(0.5)
  const tw = doc.getTextWidth(ticket.reference) + 4
  doc.line(cx - tw / 2, y, cx + tw / 2, y)

  // Divider
  y += 6
  doc.setDrawColor(35, 35, 45)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 5

  // ── Info row helper ───────────────────────────────────────────────────
  function row(label: string, value: string, valueColor?: [number, number, number]) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(110, 110, 120)
    doc.text(label, L, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    if (valueColor) doc.setTextColor(...valueColor)
    else doc.setTextColor(225, 225, 230)
    doc.text(value, R, y, { align: 'right' })
    y += 6.5
  }

  // ── Member ────────────────────────────────────────────────────────────
  row('MEMBRE', `${ticket.member_first_name} ${ticket.member_last_name}`)
  row('N° MEMBRE', ticket.member_number)
  row('COMPTE',  ticket.account_number)
  row('TYPE',    ticket.account_type.toUpperCase())
  row('DEVISE',  ticket.currency)

  // Divider before amount
  doc.setDrawColor(35, 35, 45)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 4

  // ── AMOUNT highlight zone ─────────────────────────────────────────────
  y += 1
  doc.setFillColor(Math.round(TC[0] * 0.12), Math.round(TC[1] * 0.12), Math.round(TC[2] * 0.12))
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

  // ── Balances (before / after) ─────────────────────────────────────────
  row('SOLDE AVANT', fmt(ticket.balance_before, ticket.currency))
  row('SOLDE APRÈS', fmt(ticket.balance_after,  ticket.currency), TC)

  // ── Motif (optional) ──────────────────────────────────────────────────
  if (ticket.motif) {
    doc.setDrawColor(35, 35, 45)
    doc.setLineWidth(0.3)
    doc.line(L, y, R, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(110, 110, 120)
    doc.text('MOTIF', L, y)
    y += 3.5
    doc.setTextColor(180, 180, 190)
    const lines = doc.splitTextToSize(ticket.motif, R - L)
    doc.text(lines, L, y)
    y += lines.length * 3.5 + 3
  }

  // ── Agent + signature line ────────────────────────────────────────────
  doc.setDrawColor(35, 35, 45)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(110, 110, 120)
  doc.text('AGENT', L, y)
  doc.setTextColor(180, 180, 190)
  doc.text(ticket.agent_name, R, y, { align: 'right' })
  y += 8

  // Signature box
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(120, 120, 130)
  doc.text('SIGNATURE DU MEMBRE', L, y)
  y += 8
  doc.setDrawColor(80, 80, 90)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)

  // ── Footer band ───────────────────────────────────────────────────────
  doc.setFillColor(...AC)
  doc.rect(0, H - 5, W, 5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(255, 255, 255)
  const footerText = config.footer_text ?? 'Merci de votre confiance  ·  Conservez ce reçu'
  doc.text(footerText, cx, H - 1.5, { align: 'center' })

  doc.save(`recu-${ticket.reference}.pdf`)
}
