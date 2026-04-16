'use client'
import * as React from 'react'
import { Printer, Loader2 } from 'lucide-react'
import { generateExchangeTicketPDF, type TicketData, type TicketConfig, DEFAULT_CONFIG } from './ExchangeTicketPDF'

export function ExchangeTicketButton({
  ticket,
  config = DEFAULT_CONFIG,
}: {
  ticket: TicketData
  config?: TicketConfig
}) {
  const [loading, setLoading] = React.useState(false)

  async function handlePrint() {
    setLoading(true)
    await generateExchangeTicketPDF(ticket, config)
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={loading}
      title="Imprimer le ticket"
      className="inline-flex items-center justify-center rounded-lg transition-colors"
      style={{
        width: 28, height: 28,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid #252A36',
        color: 'rgba(255,255,255,0.50)',
        opacity: loading ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : <Printer size={13} />}
    </button>
  )
}
