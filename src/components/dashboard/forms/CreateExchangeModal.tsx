'use client'
import * as React from 'react'
import { ArrowLeftRight, X, Loader2 } from 'lucide-react'
import { createExchangeTransaction } from '@/app/(dashboard)/tableau-de-bord/bureau-de-change/actions'

const INPUT = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: '#0F1117', border: '1px solid #252A36', color: 'rgba(255,255,255,0.85)' }
const LABEL = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

interface Rate { id: string; from_currency: string; to_currency: string; rate: number }

export function CreateExchangeModal({ rates }: { rates: Rate[] }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedRate, setSelectedRate] = React.useState<Rate | null>(rates[0] ?? null)
  const [amountGiven, setAmountGiven] = React.useState('')
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
    try {
      await createExchangeTransaction(new FormData(e.currentTarget))
      formRef.current?.reset()
      setAmountGiven('')
      setSelectedRate(rates[0] ?? null)
      setOpen(false)
    } catch (err: any) {
      setError(err.message ?? 'Erreur inconnue')
    } finally {
      setPending(false)
    }
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
            style={{ background: '#111318', border: '1px solid #252A36' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1a1f2e' }}>
              <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Nouvelle opération de change
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <X size={16} />
              </button>
            </div>

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

              {/* Hidden fields for currencies & rate */}
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
                <button type="button" onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ background: 'transparent', border: '1px solid #252A36', color: 'rgba(255,255,255,0.60)' }}>
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
          </div>
        </div>
      )}
    </>
  )
}
