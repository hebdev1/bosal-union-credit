'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check, AlertCircle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { recordLoanRepayment } from '@/app/(dashboard)/tableau-de-bord/prets/actions'
import { formatHTG, formatDate } from '@/lib/formatters'
import { isFinalLoanStatus, isFinalInstallmentStatus, finalLoanStatusLabel } from '@/lib/loans/finality'

export type ScheduleRow = {
  period: number
  payment: number
  principal: number
  interest: number
  balance: number
}

export type RepaymentRecord = {
  installment_no: number
  amount_paid: number | null
  amount_due: number | null
  due_date: string | null
  paid_at: string | null
  status: string | null
}

type Status = 'pending' | 'partial' | 'paid' | 'late'

function statusFor(amountPaid: number, amountDue: number, dueDate: string): Status {
  if (amountPaid <= 0) {
    return new Date(dueDate) < new Date(new Date().toDateString()) ? 'late' : 'pending'
  }
  if (amountPaid >= amountDue) return 'paid'
  return 'partial'
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'En attente', color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)' },
  partial: { label: 'Partiel',    color: '#FCD34D',                bg: 'rgba(252,211,77,0.10)',  border: 'rgba(252,211,77,0.30)' },
  paid:    { label: 'Payé',       color: '#4ADE80',                bg: 'rgba(74,222,128,0.10)',  border: 'rgba(74,222,128,0.30)' },
  late:    { label: 'En retard',  color: '#F87171',                bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)' },
}

/** Add `n` months to an ISO date and return YYYY-MM-DD. */
function addMonthsISO(baseISO: string, n: number): string {
  const d = new Date(baseISO)
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

function RepaymentRow({
  loanId,
  row,
  existing,
  dueDate,
  loanLocked,
  onSaved,
}: {
  loanId: string
  row: ScheduleRow
  existing: RepaymentRecord | undefined
  dueDate: string
  loanLocked: boolean
  onSaved: () => void
}) {
  const initialAmount = existing?.amount_paid != null ? Number(existing.amount_paid) : 0
  const [value, setValue] = React.useState<string>(initialAmount > 0 ? String(initialAmount) : '')
  const [lastSaved, setLastSaved] = React.useState<number>(initialAmount)
  const [saving, setSaving] = React.useState(false)

  // Sync local state when server prop changes (after revalidation)
  React.useEffect(() => {
    setValue(initialAmount > 0 ? String(initialAmount) : '')
    setLastSaved(initialAmount)
  }, [initialAmount])

  const numericValue = Number(value || 0)
  const isDirty = Math.abs(numericValue - lastSaved) > 0.0001
  const status: Status = statusFor(numericValue || 0, row.payment, dueDate)
  const meta = STATUS_META[status]
  // A row is sealed when the loan itself is final OR when this installment
  // is already fully paid (server-truth, not optimistic).
  const installmentSealed = isFinalInstallmentStatus(existing?.status)
  const sealed = loanLocked || installmentSealed

  async function save() {
    if (saving || sealed) return
    if (!isDirty) return
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      toast.error('Montant invalide.')
      return
    }
    if (numericValue > row.payment * 5) {
      // Soft sanity guard: more than 5x the monthly is almost certainly a typo
      const ok = window.confirm(
        `Le montant ${formatHTG(numericValue)} dépasse largement la mensualité (${formatHTG(row.payment)}). Confirmer ?`
      )
      if (!ok) return
    }
    setSaving(true)
    const res = await recordLoanRepayment({
      loanId,
      installmentNo: row.period,
      amountPaid: numericValue,
      amountDue: row.payment,
      dueDate,
    })
    setSaving(false)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    setLastSaved(numericValue)
    toast.success(
      res.closed
        ? `Versement #${row.period} enregistré · Prêt soldé !`
        : `Versement #${row.period} enregistré (${formatHTG(numericValue)})`
    )
    // Trigger server-component re-render so the hero KPIs / progress bar /
    // member-profile encours all reflect the new amount automatically.
    onSaved()
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    }
  }

  return (
    <div
      className="grid grid-cols-12 gap-3 px-5 py-3 items-center"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <p className="col-span-1 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>
        {row.period}
      </p>
      <p className="col-span-2 text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {formatDate(dueDate)}
      </p>
      <p className="col-span-2 text-sm font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.85)' }}>
        {formatHTG(row.payment)}
      </p>
      <p className="col-span-1 text-sm kpi-value" style={{ color: 'rgba(252,211,77,0.85)' }}>
        {formatHTG(row.interest)}
      </p>
      <p className="col-span-1 text-sm kpi-value" style={{ color: 'rgba(74,222,128,0.85)' }}>
        {formatHTG(row.principal)}
      </p>

      {/* Editable amount paid */}
      <div className="col-span-3 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKey}
            placeholder="0.00"
            disabled={saving || sealed}
            readOnly={sealed}
            title={
              installmentSealed ? 'Versement soldé — verrouillé'
              : loanLocked      ? 'Prêt verrouillé — saisie interdite'
              : undefined
            }
            className="w-full rounded-lg px-2.5 py-1.5 text-sm font-semibold kpi-value outline-none transition-colors"
            style={{
              background: sealed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${
                sealed   ? 'rgba(255,255,255,0.06)'
                : isDirty ? 'rgba(252,211,77,0.45)'
                : 'rgba(255,255,255,0.10)'
              }`,
              color:
                sealed && numericValue > 0 ? 'rgba(74,222,128,0.65)'
                : numericValue > 0         ? '#4ADE80'
                : 'rgba(255,255,255,0.85)',
              cursor: sealed ? 'not-allowed' : undefined,
            }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none flex items-center gap-1"
            style={{ color: 'rgba(255,255,255,0.30)' }}>
            {sealed && <Lock size={9} aria-hidden style={{ color: 'rgba(74,222,128,0.65)' }} />}
            HTG
          </span>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || sealed || !isDirty}
          title={
            installmentSealed ? 'Versement déjà soldé'
            : loanLocked      ? 'Prêt verrouillé'
            : isDirty         ? 'Enregistrer'
            : 'Aucune modification'
          }
          className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: sealed
              ? 'rgba(255,255,255,0.03)'
              : isDirty ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.05)',
            color: sealed
              ? 'rgba(255,255,255,0.30)'
              : isDirty ? '#4ADE80' : 'rgba(255,255,255,0.55)',
            border: `1px solid ${
              sealed ? 'rgba(255,255,255,0.06)'
              : isDirty ? 'rgba(74,222,128,0.30)'
              : 'rgba(255,255,255,0.10)'
            }`,
            cursor: !sealed && isDirty && !saving ? 'pointer' : undefined,
          }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> :
           sealed ? <Lock size={13} aria-hidden /> :
                    <Check size={13} />}
        </button>
      </div>

      {/* Status pill */}
      <div className="col-span-2 flex justify-end">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
          {installmentSealed && <Lock size={9} aria-hidden />}
          {!installmentSealed && status === 'late' && <AlertCircle size={10} aria-hidden />}
          {meta.label}
        </span>
      </div>
    </div>
  )
}

export function LoanScheduleClient({
  loanId,
  schedule,
  repayments,
  baseDate,
  loanStatus,
}: {
  loanId: string
  schedule: ScheduleRow[]
  repayments: RepaymentRecord[]
  baseDate: string
  loanStatus: string | null
}) {
  const router = useRouter()
  const loanLocked = isFinalLoanStatus(loanStatus)

  const byInstallment = React.useMemo(() => {
    const m = new Map<number, RepaymentRecord>()
    for (const r of repayments) m.set(r.installment_no, r)
    return m
  }, [repayments])

  const totalPaid = React.useMemo(
    () => repayments.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0),
    [repayments],
  )
  const totalDue = schedule.reduce((s, r) => s + r.payment, 0)
  const remaining = Math.max(totalDue - totalPaid, 0)

  // Pull fresh data from the server after a successful save so the hero
  // KPIs / progress bar / member-profile encours all update automatically.
  const handleSaved = React.useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
      {/* Loan-level lock banner */}
      {loanLocked && (
        <div className="px-5 py-2.5 flex items-center gap-2 text-[11px]"
          style={{ background: 'rgba(74,222,128,0.06)', borderBottom: '1px solid rgba(74,222,128,0.18)', color: 'rgba(255,255,255,0.75)' }}>
          <Lock size={12} style={{ color: '#4ADE80' }} aria-hidden />
          <span>
            <span style={{ color: '#4ADE80', fontWeight: 600 }}>Prêt {finalLoanStatusLabel(loanStatus)}</span>
            {' · '}échéancier verrouillé en lecture seule. Aucune modification de versement n&apos;est possible.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="grid grid-cols-12 gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.04)' }}>
        <p className="col-span-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>#</p>
        <p className="col-span-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Échéance</p>
        <p className="col-span-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Mensualité</p>
        <p className="col-span-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Intérêts</p>
        <p className="col-span-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Principal</p>
        <p className="col-span-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Montant versé</p>
        <p className="col-span-2 text-[11px] font-semibold uppercase tracking-wide text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Statut</p>
      </div>

      {/* Rows */}
      {schedule.map(row => {
        const dueDate = addMonthsISO(baseDate, row.period)
        return (
          <RepaymentRow
            key={row.period}
            loanId={loanId}
            row={row}
            existing={byInstallment.get(row.period)}
            dueDate={dueDate}
            loanLocked={loanLocked}
            onSaved={handleSaved}
          />
        )
      })}

      {/* Footer total */}
      <div className="grid grid-cols-12 gap-3 px-5 py-3 items-center"
        style={{ borderTop: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }}>
        <p className="col-span-3 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.50)' }}>
          Totaux
        </p>
        <p className="col-span-2 text-sm font-bold kpi-value" style={{ color: 'rgba(255,255,255,0.92)' }}>
          {formatHTG(totalDue)}
        </p>
        <p className="col-span-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {/* spacer */}
        </p>
        <p className="col-span-3 text-sm font-bold kpi-value" style={{ color: '#4ADE80' }}>
          {formatHTG(totalPaid)}
        </p>
        <p className="col-span-2 text-sm font-bold kpi-value text-right"
          style={{ color: remaining > 0 ? '#FCD34D' : '#4ADE80' }}>
          Reste {formatHTG(remaining)}
        </p>
      </div>
    </div>
  )
}
