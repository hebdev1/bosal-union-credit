// Client-side PDF ticket generator for bureau de change receipts

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
  const locales: Record<string, string> = { USD: 'en-US', HTG: 'fr-HT', CAD: 'fr-CA', DOP: 'es-DO' }
  return new Intl.NumberFormat(locales[ccy] ?? 'fr-HT', {
    style: 'currency', currency: ccy, minimumFractionDigits: 2,
  }).format(n)
}

function fDateTime(iso: string) {
  return new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export async function generateExchangeTicketPDF(ticket: TicketData) {
  const { default: jsPDF } = await import('jspdf')

  // Receipt format: 80mm wide, ~155mm tall
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 155] })
  const W = 80
  const cx = W / 2
  let y = 8

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 14)
  doc.rect(0, 0, W, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(196, 30, 58)
  doc.text(ticket.coop_name.toUpperCase(), cx, y + 1, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(120, 120, 120)
  doc.text('BUREAU DE CHANGE', cx, y + 6, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('REÇU DE CHANGE', cx, y + 13, { align: 'center' })
  y = 26

  // ── Ticket number ─────────────────────────────────────────────────────────
  doc.setFillColor(30, 30, 38)
  doc.roundedRect(4, y - 4, W - 8, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(196, 30, 58)
  doc.text('N° TICKET', cx, y + 1, { align: 'center' })
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(ticket.ticket_number, cx, y + 6.5, { align: 'center' })
  y += 14

  // ── Date ──────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(130, 130, 130)
  doc.text(fDateTime(ticket.created_at), cx, y, { align: 'center' })
  y += 5

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(40, 40, 50)
  doc.setLineWidth(0.3)
  doc.line(4, y, W - 4, y)
  y += 4

  // ── Client ────────────────────────────────────────────────────────────────
  doc.setFontSize(6)
  doc.setTextColor(100, 100, 110)
  doc.text('CLIENT', 5, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(220, 220, 230)
  doc.text(`${ticket.client_first_name} ${ticket.client_last_name}`, 5, y + 4.5)
  y += 10

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(40, 40, 50)
  doc.line(4, y, W - 4, y)
  y += 5

  // ── Exchange detail ───────────────────────────────────────────────────────
  // Given row
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(100, 100, 110)
  doc.text('MONTANT DONNÉ', 5, y)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(248, 113, 113)
  doc.text(fmt(ticket.amount_given, ticket.from_currency), W - 5, y + 4, { align: 'right' })
  y += 8

  // Rate row
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(100, 100, 110)
  doc.text('TAUX APPLIQUÉ', 5, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(180, 180, 190)
  doc.text(
    `1 ${ticket.from_currency} = ${Number(ticket.rate_applied).toFixed(4)} ${ticket.to_currency}`,
    W - 5, y + 4, { align: 'right' },
  )
  y += 8

  // Received row — highlighted
  doc.setFillColor(20, 60, 35)
  doc.roundedRect(4, y - 3, W - 8, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(100, 200, 130)
  doc.text('MONTANT REÇU', 7, y + 1)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(74, 222, 128)
  doc.text(fmt(ticket.amount_received, ticket.to_currency), W - 7, y + 7.5, { align: 'right' })
  y += 16

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (ticket.notes) {
    doc.setDrawColor(40, 40, 50)
    doc.line(4, y, W - 4, y)
    y += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 110)
    doc.text('NOTES', 5, y)
    doc.setTextColor(170, 170, 180)
    const wrapped = doc.splitTextToSize(ticket.notes, W - 10)
    doc.text(wrapped, 5, y + 4)
    y += 4 + wrapped.length * 3.5
  }

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(40, 40, 50)
  doc.line(4, y, W - 4, y)
  y += 4

  // ── Agent ─────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(100, 100, 110)
  doc.text('AGENT', 5, y)
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 190)
  doc.text(ticket.agent_name, W - 5, y, { align: 'right' })
  y += 6

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 14)
  doc.rect(0, y, W, 20, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(80, 80, 90)
  doc.text('Merci de votre confiance', cx, y + 5, { align: 'center' })
  doc.text('Conservez ce reçu comme preuve de transaction', cx, y + 9, { align: 'center' })
  doc.setTextColor(60, 60, 70)
  doc.text(ticket.coop_name, cx, y + 14, { align: 'center' })

  doc.save(`ticket-${ticket.ticket_number}.pdf`)
}
