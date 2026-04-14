'use client'
import * as React from 'react'
import { TrendingUp, X, Loader2, ArrowRight } from 'lucide-react'
import { createExchangeRate } from '@/app/(dashboard)/tableau-de-bord/bureau-de-change/actions'

const INPUT = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: '#0F1117', border: '1px solid #252A36', color: 'rgba(255,255,255,0.85)' }
const LABEL = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

const CURRENCIES = ['HTG', 'USD', 'CAD', 'DOP']
const CURRENCY_COLORS: Record<string, string> = {
  HTG: '#C41E3A', USD: '#3B82F6', CAD: '#EF4444', DOP: '#22C55E',
}

export function CreateRateModal() {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fromCcy, setFromCcy] = React.useState('USD')
  const [toCcy, setToCcy] = React.useState('HTG')
  const [rate, setRate] = React.useState('')
  const [replace, setReplace] = React.useState(true)
  const formRef = React.useRef<HTMLFormElement>(null)

  // Preview: "1 USD = X HTG"
  const rateNum = parseFloat(rate)
  const preview = !isNaN(rateNum) && rateNum > 0
    ? `1 ${fromCcy} = ${rateNum.toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${toCcy}`
    : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('replace_previous', replace ? 'true' : 'false')
      await createExchangeRate(fd)
      formRef.current?.reset()
      setRate('')
      setOpen(false)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Erreur inconnue')
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
        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.80)', border: '1px solid #252A36' }}
      >
        <TrendingUp size={14} aria-hidden="true" />
        Nouveau taux
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#111318', border: '1px solid #252A36' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1a1f2e' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(52,211,153,0.12)' }}>
                  <TrendingUp size={14} style={{ color: '#34D399' }} />
                </div>
                <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Nouveau taux de change
                </h2>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg p-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                <X size={15} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Pair selector */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Paire de devises *</label>
                <div className="flex items-center gap-2">
                  <select
                    name="from_currency"
                    value={fromCcy}
                    onChange={e => setFromCcy(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-2 text-sm font-bold outline-none"
                    style={{ ...INPUT_STYLE, color: CURRENCY_COLORS[fromCcy] ?? '#fff' }}
                    required
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c} style={{ color: CURRENCY_COLORS[c] ?? '#fff' }}>{c}</option>
                    ))}
                  </select>

                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
                  </div>

                  <select
                    name="to_currency"
                    value={toCcy}
                    onChange={e => setToCcy(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-2 text-sm font-bold outline-none"
                    style={{ ...INPUT_STYLE, color: CURRENCY_COLORS[toCcy] ?? '#fff' }}
                    required
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c} style={{ color: CURRENCY_COLORS[c] ?? '#fff' }}>{c}</option>
                    ))}
                  </select>
                </div>
                {fromCcy === toCcy && (
                  <p className="text-xs mt-1" style={{ color: '#F87171' }}>
                    Les devises source et cible doivent être différentes.
                  </p>
                )}
              </div>

              {/* Rate input */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>
                  Taux * <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>
                    (1 {fromCcy} vaut combien de {toCcy} ?)
                  </span>
                </label>
                <input
                  name="rate"
                  type="number"
                  min="0.000001"
                  step="any"
                  required
                  placeholder="ex: 131.50"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  className={INPUT}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Live preview */}
              {preview && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                  style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
                  <TrendingUp size={13} style={{ color: '#34D399', flexShrink: 0 }} />
                  <p className="text-sm font-semibold kpi-value" style={{ color: '#34D399' }}>{preview}</p>
                </div>
              )}

              {/* Replace previous toggle */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={replace}
                    onChange={e => setReplace(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-9 h-5 rounded-full transition-colors"
                    style={{ background: replace ? '#C41E3A' : '#252A36' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                      style={{
                        background: '#fff',
                        left: replace ? '18px' : '2px',
                        transition: 'left 150ms',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    Désactiver le taux précédent pour cette paire
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    Le nouveau taux remplacera le taux actif pour {fromCcy} → {toCcy}
                  </p>
                </div>
              </label>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ background: 'transparent', border: '1px solid #252A36', color: 'rgba(255,255,255,0.55)' }}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending || fromCcy === toCcy}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ background: '#C41E3A', color: '#fff', opacity: (pending || fromCcy === toCcy) ? 0.65 : 1 }}
                >
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  Enregistrer le taux
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
