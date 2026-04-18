'use client'
import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { updateLoanStatus } from '@/app/(dashboard)/tableau-de-bord/prets/actions'

const STATUSES = [
  { value: 'pending',   label: 'En attente', color: '#FCD34D', bg: 'rgba(234,179,8,0.12)'   },
  { value: 'active',    label: 'Actif',      color: '#4ADE80', bg: 'rgba(34,197,94,0.12)'   },
  { value: 'rejected',  label: 'Rejeté',     color: '#F87171', bg: 'rgba(239,68,68,0.12)'   },
  { value: 'closed',    label: 'Clôturé',    color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)' },
  { value: 'completed', label: 'Complété',   color: '#4ADE80', bg: 'rgba(34,197,94,0.12)'   },
  { value: 'defaulted', label: 'En défaut',  color: '#F87171', bg: 'rgba(239,68,68,0.12)'   },
]

interface Props {
  loanId: string
  currentStatus: string
}

export function LoanStatusSelect({ loanId, currentStatus }: Props) {
  const [status, setStatus]   = React.useState(currentStatus)
  const [open, setOpen]       = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError]     = React.useState<string | null>(null)
  const ref = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  async function handleSelect(newStatus: string) {
    if (newStatus === status) { setOpen(false); return }
    setOpen(false)
    setPending(true)
    setError(null)
    const result = await updateLoanStatus(loanId, newStatus)
    setPending(false)
    if (result?.error) { setError(result.error); return }
    setStatus(newStatus)
  }

  const current = STATUSES.find(s => s.value === status)
    ?? { value: status, label: status, color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(v => !v)}
        title={error ?? undefined}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-opacity"
        style={{
          background: current.bg,
          color: current.color,
          border: `1px solid ${current.color}40`,
          opacity: pending ? 0.6 : 1,
          cursor: pending ? 'wait' : 'pointer',
          minWidth: 90,
          justifyContent: 'space-between',
        }}
      >
        {pending ? <Loader2 size={10} className="animate-spin" /> : null}
        <span>{current.label}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
          <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-40 mt-1 w-36 rounded-xl overflow-hidden shadow-xl"
          style={{ background: '#161B27', border: '1px solid rgba(255,255,255,0.09)', right: 0 }}
        >
          {STATUSES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => handleSelect(s.value)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left transition-colors hover:bg-white/5"
              style={{ color: s.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              {s.label}
              {s.value === status && (
                <svg className="ml-auto" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4.2 7L8 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="absolute top-full mt-1 left-0 text-[10px] rounded px-2 py-1 whitespace-nowrap z-50"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
