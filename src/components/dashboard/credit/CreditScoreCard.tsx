'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, TrendingUp, Calendar, Activity, Wallet, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { recalcMemberCreditScore } from '@/app/(dashboard)/tableau-de-bord/membres/actions'
import {
  COMPONENT_MAX, RISK_META, SCORE_MAX, riskFromTotal,
  type CreditScoreRow, type RiskLevel,
} from '@/lib/credit/types'

interface Props {
  memberId: string
  /** Existing row from the DB. Pass null when no score has been computed yet. */
  score: CreditScoreRow | null
  /** Compact variant — drops the explanatory components grid. */
  compact?: boolean
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.round(diffMs / 60_000)
  if (min < 1)   return "à l'instant"
  if (min < 60)  return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24)    return `il y a ${h} h`
  const d = Math.round(h / 24)
  if (d < 30)    return `il y a ${d} j`
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

/** Small SVG ring gauge (200×200), pure render, deterministic. */
function ScoreRing({ score, risk, size = 130 }: { score: number; risk: RiskLevel; size?: number }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const ratio = Math.max(0, Math.min(1, score / SCORE_MAX))
  const dash = c * ratio
  const meta = RISK_META[risk]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score ${score}/${SCORE_MAX}`}>
      <circle cx={size / 2} cy={size / 2} r={r}
        stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r}
        stroke={meta.color} strokeWidth={stroke} fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 600ms ease' }}
      />
      <text x="50%" y="46%" textAnchor="middle" fontSize={size * 0.26} fontWeight={700}
        fill="rgba(255,255,255,0.95)" fontFamily="JetBrains Mono, monospace">
        {score}
      </text>
      <text x="50%" y="64%" textAnchor="middle" fontSize={size * 0.085}
        fill="rgba(255,255,255,0.40)" fontFamily="DM Sans, sans-serif">
        / {SCORE_MAX}
      </text>
    </svg>
  )
}

interface ComponentMeta {
  key:   keyof typeof COMPONENT_MAX
  label: string
  desc:  string
  Icon:  React.ComponentType<{ size?: number }>
  color: string
  hint:  (s: CreditScoreRow) => string
}

const COMPONENTS: ComponentMeta[] = [
  {
    key: 'payment', label: 'Comportement de paiement',
    desc: 'Ratio des contributions payées à l’heure',
    Icon: Wallet, color: '#60A5FA',
    hint: s => s.payments_total > 0
      ? `${s.payments_on_time} / ${s.payments_total} à l’heure`
      : 'Aucune contribution enregistrée',
  },
  {
    key: 'repayment', label: 'Remboursement de prêt',
    desc: 'Versements honorés à la date d’échéance',
    Icon: TrendingUp, color: '#4ADE80',
    hint: s => s.loan_repayments_total > 0
      ? `${s.loan_repayments_on_time} / ${s.loan_repayments_total} à l’heure${
          s.total_late_days > 0 ? ` · ${s.total_late_days} j de retard` : ''
        }`
      : 'Aucun versement de prêt enregistré',
  },
  {
    key: 'activity', label: 'Activité',
    desc: '5 pts par transaction, plafonné à 200',
    Icon: Activity, color: '#FCD34D',
    hint: s => `${s.transactions_count} transaction${s.transactions_count !== 1 ? 's' : ''}`,
  },
  {
    key: 'stability', label: 'Stabilité (ancienneté)',
    desc: '≥ 12 mois : 100 · 6–11 mois : 70 · < 6 mois : 40',
    Icon: Calendar, color: '#A78BFA',
    hint: s => `${s.months_active} mois actif${s.months_active !== 1 ? 's' : ''}`,
  },
]

const COMPONENT_VALUE: Record<ComponentMeta['key'], (s: CreditScoreRow) => number> = {
  payment:   s => s.payment_score,
  repayment: s => s.repayment_score,
  activity:  s => s.activity_score,
  stability: s => s.stability_score,
}

export function CreditScoreCard({ memberId, score, compact = false }: Props) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  // Empty-state placeholder when the score hasn't been computed yet
  const display: CreditScoreRow = score ?? {
    member_id:                memberId,
    cooperative_id:           '',
    payment_score:            0,
    repayment_score:          0,
    activity_score:           0,
    stability_score:          0,
    total_score:              0,
    risk_level:               'HIGH_RISK',
    payments_total:           0,
    payments_on_time:         0,
    loan_repayments_total:    0,
    loan_repayments_on_time:  0,
    total_late_days:          0,
    transactions_count:       0,
    months_active:            0,
    last_calculated_at:       new Date().toISOString(),
  }

  // Defensive: derive risk from total in case the row stored an outdated bucket
  const risk = riskFromTotal(display.total_score) as RiskLevel
  const meta = RISK_META[risk]

  async function recalc() {
    setPending(true)
    const res = await recalcMemberCreditScore(memberId)
    setPending(false)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    toast.success('Score recalculé')
    router.refresh()
  }

  return (
    <section
      aria-label="Score de crédit"
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#0D1018',
        border: `1px solid ${meta.border}`,
        boxShadow: `0 0 32px ${meta.color}08`,
      }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: meta.color }} />
          <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Score de crédit
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.40)' }}>
            0 – {SCORE_MAX}
          </span>
        </div>
        <button
          type="button"
          onClick={recalc}
          disabled={pending}
          title="Forcer le recalcul (les triggers le font automatiquement)"
          className="inline-flex items-center gap-1.5 rounded-lg h-7 px-2.5 text-[11px] font-medium transition-colors hover:bg-white/5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.55)',
          }}>
          {pending
            ? <Loader2 size={11} className="animate-spin" />
            : <RefreshCw size={11} />}
          Recalculer
        </button>
      </div>

      {/* Score + risk */}
      <div className="px-5 py-5 flex items-center gap-5"
        style={{ borderBottom: compact ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
        <ScoreRing score={display.total_score} risk={risk} />
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
            {risk === 'HIGH_RISK' && <AlertCircle size={10} aria-hidden />}
            {meta.label}
          </span>
          <div className="mt-2 flex items-end gap-2">
            <p className="text-3xl font-bold kpi-value" style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.03em' }}>
              {display.total_score}
            </p>
            <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
              / {SCORE_MAX}
            </p>
          </div>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Mis à jour {formatRelative(display.last_calculated_at)} ·
            <span className="ml-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
              {display.months_active} mois d&apos;ancienneté
            </span>
          </p>
          {!score && (
            <p className="text-[11px] mt-2 px-2 py-1 rounded-lg inline-flex items-center gap-1"
              style={{ background: 'rgba(252,211,77,0.08)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.20)' }}>
              <AlertCircle size={10} />
              Aucun score calculé. Cliquez sur Recalculer.
            </p>
          )}
        </div>
      </div>

      {/* Components grid */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          {COMPONENTS.map(c => {
            const value = COMPONENT_VALUE[c.key](display)
            const max   = COMPONENT_MAX[c.key]
            const pct   = max > 0 ? Math.round((value / max) * 100) : 0
            const Icon  = c.Icon
            return (
              <div key={c.key} className="px-5 py-4 space-y-2" style={{ background: '#0D1018' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={12} />
                    <p className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {c.label}
                    </p>
                  </div>
                  <p className="text-xs font-bold kpi-value flex-shrink-0" style={{ color: c.color }}>
                    {value}<span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}> / {max}</span>
                  </p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: c.color }} />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span style={{ color: 'rgba(255,255,255,0.32)' }}>{c.desc}</span>
                  <span className="kpi-value" style={{ color: 'rgba(255,255,255,0.50)' }}>{c.hint(display)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
