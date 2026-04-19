'use client'
import * as React from 'react'
import { ArrowLeftRight, X, Loader2, Printer } from 'lucide-react'
import { createExchangeTransaction } from '@/app/(dashboard)/tableau-de-bord/bureau-de-change/actions'
import { generateExchangeTicketPDF, type TicketData, type TicketConfig, DEFAULT_CONFIG } from './ExchangeTicketPDF'

const INPUT = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.85)' }
const LABEL = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

interface Rate { id: string; from_currency: string; to_currency: string; rate: number }

export function CreateExchangeModal({
  rates,
  ticketConfig = DEFAULT_CONFIG,
  coopName  = 'Bosal Credit Union',
  agentName = '—',
}: {
  rates: Rate[]
  ticketConfig?: TicketConfig
  coopName?: string
  agentName?: string
}) {
  const [open, setOpen]             = React.useState(false)
  const [pending, setPending]       = React.useState(false)
  const [error, setError]           = React.useState<string | null>(null)
  const [selectedRate, setSelectedRate] = React.useState<Rate | null>(rates[0] ?? null)
  const [amountGiven, setAmountGiven]   = React.useState('')
  // After success: show ticket confirmation
  const [lastTicket, setLastTicket] = React.useState<TicketData | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)

  const amountReceived = selectedRate && amountGiven
    ? (Number(amountGiven) * Number(selectedRate.rate)).toFixed(2)
    : '—'

  function handleRateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const r = rates.find(r => r.id === e.target.value) ?? null
    setSelectedRate(r)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createExchangeTransaction(new FormData(e.currentTarget))
    setPending(false)
    if ('error' in result) { setError(result.error); return }

    // Auto-generate ticket PDF immediately
    await generateExchangeTicketPDF(result.ticket, ticketConfig)

    // Show success state with ticket data
    setLastTicket(result.ticket)
    formRef.current?.reset()
    setAmountGiven('')
    setSelectedRate(rates[0] ?? null)
  }

  function handleClose() {
    setOpen(false)
    setLastTicket(null)
    setError(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#C41E3A', color: '#fff' }}
      >
        <ArrowLeftRight size={15} aria-hidden="true" />
        Nouvelle opération
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.70)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>

            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {lastTicket ? 'Opération enregistrée' : 'Nouvelle opération de change'}
              </h2>
              <button type="button" onClick={handleClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <X size={16} />
              </button>
            </div>

            {/* ── Success / reprint screen ── */}
            {lastTicket ? (
              <div className="px-6 py-6 space-y-4">
                {/* Ticket preview card */}
                <div className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.25)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold" style={{ color: '#4ADE80' }}>
                      {lastTicket.ticket_number}
                    </span>
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Intl.DateTimeFormat('fr-HT', { hour: '2-digit', minute: '2-digit' })
                        .format(new Date(lastTicket.created_at))}
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
                    {lastTicket.client_first_name} {lastTicket.client_last_name}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#F87171' }}>
                      {new Intl.NumberFormat('fr-HT', { style: 'currency', currency: lastTicket.from_currency, minimumFractionDigits: 2 })
                        .format(lastTicket.amount_given)}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>→</span>
                    <span className="font-bold" style={{ color: '#4ADE80' }}>
                      {new Intl.NumberFormat('fr-HT', { style: 'currency', currency: lastTicket.to_currency, minimumFractionDigits: 2 })
                        .format(lastTicket.amount_received)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  Le ticket PDF a été téléchargé automatiquement.
                </p>

                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => generateExchangeTicketPDF(lastTicket, ticketConfig)}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.75)' }}>
                    <Printer size={14} />
                    Réimprimer
                  </button>
                  <button type="button"
                    onClick={() => setLastTicket(null)}
                    className="flex-1 h-9 rounded-lg text-sm font-medium"
                    style={{ background: '#C41E3A', color: '#fff' }}>
                    Nouvelle opération
                  </button>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Client */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL} style={LABEL_STYLE}>Prénom client *</label>
                    <input name="client_first_name" required className={INPUT} style={INPUT_STYLE} placeholder="Jean" />
                  </div>
                  <div>
                    <label className={LABEL} style={LABEL_STYLE}>Nom client *</label>
                    <input name="client_last_name" required className={INPUT} style={INPUT_STYLE} placeholder="Dupont" />
                  </div>
                </div>

                {/* Rate selector */}
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Taux de change *</label>
                  <select name="exchange_rate_id" required className={INPUT} style={INPUT_STYLE}
                    onChange={handleRateChange}
                    defaultValue={rates[0]?.id ?? ''}>
                    {rates.length === 0 && <option value="">Aucun taux disponible</option>}
                    {rates.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.from_currency} → {r.to_currency} @ {Number(r.rate).toFixed(4)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hidden fields */}
                <input type="hidden" name="from_currency" value={selectedRate?.from_currency ?? ''} />
                <input type="hidden" name="to_currency" value={selectedRate?.to_currency ?? ''} />
                <input type="hidden" name="rate_applied" value={selectedRate?.rate ?? ''} />

                {/* Amount */}
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>
                    Montant donné ({selectedRate?.from_currency ?? '—'}) *
                  </label>
                  <input name="amount_given" type="number" min="0.01" step="0.01" required
                    value={amountGiven}
                    onChange={e => setAmountGiven(e.target.value)}
                    className={INPUT} style={INPUT_STYLE} placeholder="0.00" />
                </div>

                {/* Preview */}
                {selectedRate && amountGiven && (
                  <div className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.20)' }}>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>Montant reçu</span>
                    <span className="text-sm font-semibold kpi-value" style={{ color: '#4ADE80' }}>
                      {amountReceived} {selectedRate.to_currency}
                    </span>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Notes (optionnel)</label>
                  <input name="notes" className={INPUT} style={INPUT_STYLE} placeholder="Remarques..." />
                </div>

                {error && (
                  <p className="text-xs rounded-lg px-3 py-2"
                    style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={handleClose}
                    className="h-9 px-4 rounded-lg text-sm font-medium"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.60)' }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={pending || rates.length === 0}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium"
                    style={{ background: '#C41E3A', color: '#fff', opacity: (pending || rates.length === 0) ? 0.7 : 1 }}>
                    {pending && <Loader2 size={14} className="animate-spin" />}
                    Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
