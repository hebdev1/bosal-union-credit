// Client-side PDF ticket generator for bureau de change receipts

export interface TicketConfig {
  accent_color:   string   // heading / ticket-number color
  received_color: string   // "montant reçu" highlight color
}

export const DEFAULT_CONFIG: TicketConfig = {
  accent_color:   '#C41E3A',
  received_color: '#22C55E',
}

export interface TicketData {
  ticket_number: string
  client_first_name: string
  client_last_name: string
  from_currency: string
  to_currency: string
  amount_given: number
  rate_applied: number
  amount_received: number
  notes: string | null
  created_at: string
  agent_name: string
  coop_name: string
}

function fmt(n: number, ccy: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: ccy, minimumFractionDigits: 2,
  }).format(n)
}

function fDateTime(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// Parse a hex color to [r,g,b]
function hex(h: string): [number, number, number] {
  const c = h.replace('#', '')
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ]
}

export async function generateExchangeTicketPDF(
  ticket: TicketData,
  config: TicketConfig = DEFAULT_CONFIG,
) {
  const { default: jsPDF } = await import('jspdf')

  const W = 80
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, 165] })
  const cx  = W / 2
  const L   = 6
  const R   = W - L
  let y     = 0

  const AC = hex(config.accent_color)
  const RC = hex(config.received_color)

  // ── Header block ─────────────────────────────────────────────────────────
  doc.setFillColor(14, 14, 18)
  doc.rect(0, 0, W, 28, 'F')

  // Accent bar at very top
  doc.setFillColor(...AC)
  doc.rect(0, 0, W, 2.5, 'F')

  y = 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...AC)
  doc.text(ticket.coop_name.toUpperCase(), cx, y, { align: 'center' })

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(160, 160, 170)
  doc.text('BUREAU DE CHANGE  ·  REÇU DE CHANGE', cx, y, { align: 'center' })

  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 110)
  doc.text(fDateTime(ticket.created_at), cx, y, { align: 'center' })

  // ── Ticket number ─────────────────────────────────────────────────────────
  y = 36
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(110, 110, 120)
  doc.text('N° TICKET', cx, y, { align: 'center' })

  y += 6
  doc.setFontSize(14)
  doc.setTextColor(...AC)
  doc.text(ticket.ticket_number, cx, y, { align: 'center' })

  // Underline
  y += 2
  doc.setDrawColor(...AC)
  doc.setLineWidth(0.5)
  const tw = doc.getTextWidth(ticket.ticket_number) + 4
  doc.line(cx - tw / 2, y, cx + tw / 2, y)

  // ── Divider ───────────────────────────────────────────────────────────────
  y += 6
  doc.setDrawColor(35, 35, 45)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 5

  // ── Client row ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(110, 110, 120)
  doc.text('CLIENT', L, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(230, 230, 235)
  doc.text(`${ticket.client_first_name} ${ticket.client_last_name}`, R, y, { align: 'right' })
  y += 7

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(35, 35, 45)
  doc.setLineWidth(0.3)
  doc.line(L, y, R, y)
  y += 6

  // ── Info rows helper ──────────────────────────────────────────────────────
  function row(label: string, value: string, valueColor?: [number,number,number]) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(110, 110, 120)
    doc.text(label, L, y)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    if (valueColor) doc.setTextColor(...valueColor)
    else doc.setTextColor(210, 210, 220)
    doc.text(value, R, y, { align: 'right' })
    y += 7
  }

  row('DEVISE DONNÉE',  ticket.from_currency)
  row('MONTANT DONNÉ',  fmt(ticket.amount_given, ticket.from_currency),  [230, 100, 100])
  row('TAUX APPLIQUÉ',
    `1 ${ticket.from_currency} = ${Number(ticket.rate_applied).toFixed(4)} ${ticket.to_currency}`)
  row('DEVISE REÇUE',   ticket.to_currency)

  // ── Montant reçu — highlighted ────────────────────────────────────────────
  y += 1
  doc.setFillColor(RC[0], RC[1], RC[2], 0.08)
  doc.setFillColor(Math.round(RC[0] * 0.12), Math.round(RC[1] * 0.12), Math.round(RC[2] * 0.12))
  doc.roundedRect(L - 1, y - 5, R - L + 2, 14, 1.5, 1.5, 'F')
  doc.setDrawColor(...RC)
  doc.setLineWidth(0.4)
  doc.roundedRect(L - 1, y - 5, R - L + 2, 14, 1.5, 1.5, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...RC)
  doc.text('MONTANT REÇU', L + 1, y + 1)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...RC)
  doc.text(fmt(ticket.amount_received, ticket.to_currency), R - 1, y + 7, { align: 'right' })
  y += 17

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (ticket.notes) {
    doc.setDrawColor(35, 35, 45)
    doc.setLineWidth(0.3)
    doc.line(L, y, R, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(110, 110, 120)
    doc.text('NOTES', L, y)
    y += 3.5
    doc.setTextColor(170, 170, 180)
    const lines = doc.splitTextToSize(ticket.notes, R - L)
    doc.text(lines, L, y)
    y += lines.length * 3.5 + 3
  }

  // ── Footer ────────────────────────────────────────────────────────────────
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

  // Bottom accent bar
  doc.setFillColor(...AC)
  doc.rect(0, 160, W, 5, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(255, 255, 255)
  doc.text('Merci de votre confiance  ·  Conservez ce reçu', cx, 163.5, { align: 'center' })

  doc.save(`ticket-${ticket.ticket_number}.pdf`)
}
