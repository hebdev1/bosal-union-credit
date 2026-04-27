'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Calculator, Sliders, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { adjustLoan } from '@/app/(dashboard)/tableau-de-bord/prets/actions'
import { formatHTG } from '@/lib/formatters'

const INPUT       = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.88)' }
const LABEL       = 'block text-[11px] font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.42)' }

interface Props {
  loanId: string
  initialPrincipal: number
  initialInterestRate: number
  initialDurationMonths: number
  initialPurpose: string | null
  /**
   * When true, the form is gated open by the parent. When undefined / false,
   * the component renders its own header/toggle so it can be dropped inline.
   */
  alwaysOpen?: boolean
}

/**
 * Inline editor for `pending` loans with no repayments yet.
 * Recomputes mensualité / intérêts / total dû live, exactly like CreateLoanModal,
 * and submits to the `adjustLoan` server action.
 */
export function AdjustLoanForm({
  loanId,
  initialPrincipal,
  initialInterestRate,
  initialDurationMonths,
  initialPurpose,
  alwaysOpen,
}: Props) {
  const router = useRouter()
  const [open, setOpen]         = React.useState(!!alwaysOpen)
  const [pending, setPending]   = React.useState(false)
  const [error, setError]       = React.useState<string | null>(null)

  const [principal,    setPrincipal]    = React.useState(String(initialPrincipal))
  const [interestRate, setInterestRate] = React.useState(String(initialInterestRate))
  const [duration,     setDuration]     = React.useState(String(initialDurationMonths))
  const [purpose,      setPurpose]      = React.useState(initialPurpose ?? '')

  const principalNum = parseFloat(principal)
  const rateNum      = parseFloat(interestRate)
  const durationNum  = parseInt(duration, 10)

  const hasPreview =
    !isNaN(principalNum) && principalNum > 0 &&
    !isNaN(rateNum)      && rateNum >= 0 &&
    !isNaN(durationNum)  && durationNum > 0

  const totalInterest  = hasPreview ? principalNum * (rateNum / 100) * (durationNum / 12) : 0
  const totalAmountDue = hasPreview ? principalNum + totalInterest : 0
  const monthlyPayment = hasPreview ? totalAmountDue / durationNum   : 0

  const isDirty =
    Math.abs(principalNum   - initialPrincipal)      > 0.0001 ||
    Math.abs(rateNum        - initialInterestRate)   > 0.0001 ||
    durationNum             !== initialDurationMonths ||
    (purpose.trim() || null) !== (initialPurpose ?? null)

  function reset() {
    setPrincipal(String(initialPrincipal))
    setInterestRate(String(initialInterestRate))
    setDuration(String(initialDurationMonths))
    setPurpose(initialPurpose ?? '')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!hasPreview) {
      setError('Champs invalides.')
      return
    }
    setPending(true)
    setError(null)
    const res = await adjustLoan({
      loanId,
      principal:       principalNum,
      interestRate:    rateNum,
      durationMonths:  durationNum,
      purpose:         purpose.trim() || null,
    })
    setPending(false)
    if ('error' in res) {
      setError(res.error)
      toast.error(res.error)
      return
    }
    toast.success('Prêt ajusté · échéancier recalculé')
    router.refresh()
  }

  return (
    <div className="rounded-xl"
      style={{ background: 'rgba(252,211,77,0.04)', border: '1px solid rgba(252,211,77,0.18)' }}>
      {/* Header / toggle */}
      {!alwaysOpen && (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Sliders size={13} style={{ color: '#FCD34D' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Ajuster les conditions du prêt
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(252,211,77,0.10)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.25)' }}>
              avant approbation
            </span>
          </div>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {open ? '▴ replier' : '▾ déplier'}
          </span>
        </button>
      )}

      {(open || alwaysOpen) && (
        <form onSubmit={handleSubmit}
          className="px-4 pb-4 pt-1 space-y-4"
          style={{ borderTop: alwaysOpen ? undefined : '1px solid rgba(252,211,77,0.12)' }}>

          {alwaysOpen && (
            <div className="flex items-center gap-2 pt-3">
              <Sliders size={13} style={{ color: '#FCD34D' }} />
              <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Ajuster les conditions du prêt
              </p>
            </div>
          )}

          <p className="text-[11px] flex items-start gap-1.5"
            style={{ color: 'rgba(255,255,255,0.45)' }}>
            <AlertCircle size={11} style={{ color: '#FCD34D', flexShrink: 0, marginTop: 1 }} />
            <span>
              Modifications autorisées uniquement sur un prêt <span style={{ color: '#FCD34D' }}>en attente</span>,
              tant qu&apos;aucun versement n&apos;a été enregistré. La mensualité, les intérêts et le total dû
              seront recalculés automatiquement.
            </span>
          </p>

          {/* Capital */}
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Capital (HTG) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={principal}
              onChange={e => setPrincipal(e.target.value)}
              disabled={pending}
              className={INPUT}
              style={INPUT_STYLE}
            />
          </div>

          {/* Taux + Durée */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Taux annuel (%) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                disabled={pending}
                className={INPUT}
                style={INPUT_STYLE}
              />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Durée (mois) *</label>
              <input
                type="number"
                min="1"
                max="360"
                step="1"
                required
                value={duration}
                onChange={e => setDuration(e.target.value)}
                disabled={pending}
                className={INPUT}
                style={INPUT_STYLE}
              />
            </div>
          </div>

          {/* Objet */}
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Objet du prêt</label>
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              disabled={pending}
              placeholder="ex : Commerce, Logement, Agriculture…"
              className={INPUT}
              style={INPUT_STYLE}
            />
          </div>

          {/* Live preview */}
          {hasPreview && (
            <div className="rounded-xl p-3 space-y-2"
              style={{ background: 'rgba(196,30,58,0.05)', border: '1px solid rgba(196,30,58,0.18)' }}>
              <div className="flex items-center gap-1.5">
                <Calculator size={11} style={{ color: '#C41E3A' }} />
                <p className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Recalcul (taux flat)
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Mensualité',      value: formatHTG(monthlyPayment)  },
                  { label: 'Intérêts totaux', value: formatHTG(totalInterest)   },
                  { label: 'Total à rembourser', value: formatHTG(totalAmountDue) },
                ].map(item => (
                  <div key={item.label}
                    className="rounded-lg px-2.5 py-1.5"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-xs font-semibold kpi-value"
                      style={{ color: 'rgba(255,255,255,0.88)' }}>{item.value}</p>
                    <p className="text-[10px] mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.30)' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs rounded-lg px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={reset}
              disabled={pending || !isDirty}
              className="h-8 px-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={pending || !isDirty || !hasPreview}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: '#FCD34D',
                color: '#1F2937',
              }}
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {pending ? 'Enregistrement…' : 'Enregistrer l\'ajustement'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
