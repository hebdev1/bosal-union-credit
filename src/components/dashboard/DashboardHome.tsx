'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Users, Banknote, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import { formatHTG, formatUSD, formatCompact, formatRelative } from '@/lib/formatters'

/* ── Prop types ─────────────────────────────────────────────────────────── */
interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  created_at: string
  status: string
}

interface FraudFlag {
  id: string
  reason: string
  risk_score: number
  created_at: string
  resolved_at: string | null
}

interface CoopSummary {
  total_members?: number
  active_members?: number
  total_balance_htg?: number
  total_balance_usd?: number
  total_loans_outstanding?: number
  pending_transactions?: number
  open_fraud_flags?: number
  monthly_deposits?: number
  monthly_withdrawals?: number
}

interface Props {
  summary: CoopSummary | null
  recentTransactions: Transaction[]
  fraudFlags: FraudFlag[]
}

/* ── KPI card ───────────────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  trendLabel,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  accent?: string
}) {
  const trendColor =
    trend === 'up' ? '#4ADE80' : trend === 'down' ? '#F87171' : 'rgba(255,255,255,0.40)'

  return (
    <article
      className="rounded-xl p-5 flex flex-col gap-4 transition-colors duration-120"
      style={{
        background: '#111318',
        border: '1px solid #252A36',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#363D52')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#252A36')}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: accent ? `${accent}18` : 'rgba(255,255,255,0.06)',
          }}
          aria-hidden="true"
        >
          <Icon size={17} style={{ color: accent ?? 'rgba(255,255,255,0.55)' }} />
        </div>
        {trendLabel && (
          <div className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
            {trend === 'up' && <TrendingUp size={13} aria-hidden="true" />}
            {trend === 'down' && <TrendingDown size={13} aria-hidden="true" />}
            {trendLabel}
          </div>
        )}
      </div>
      <div>
        <p
          className="text-xl font-semibold kpi-value"
          style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
          {label}
        </p>
        {sub && (
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
            {sub}
          </p>
        )}
      </div>
    </article>
  )
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
function KpiSkeleton() {
  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: '#111318', border: '1px solid #252A36' }}>
      <div className="w-9 h-9 rounded-lg skeleton" />
      <div className="space-y-2">
        <div className="h-6 w-28 rounded skeleton" />
        <div className="h-3 w-20 rounded skeleton" />
      </div>
    </div>
  )
}

/* ── Transaction type label ─────────────────────────────────────────────── */
const TX_TYPE_LABELS: Record<string, string> = {
  deposit:    'Dépôt',
  withdrawal: 'Retrait',
  transfer:   'Virement',
  loan_disbursement: 'Décaissement',
  loan_repayment:    'Remboursement',
  exchange:   'Change',
  fee:        'Frais',
}

const TX_STATUS_COLORS: Record<string, string> = {
  completed: '#4ADE80',
  pending:   '#FCD34D',
  failed:    '#F87171',
  cancelled: 'rgba(255,255,255,0.35)',
}

const TX_STATUS_LABELS: Record<string, string> = {
  completed: 'Complété',
  pending:   'En attente',
  failed:    'Échoué',
  cancelled: 'Annulé',
}

/* ── Risk badge ─────────────────────────────────────────────────────────── */
function RiskBadge({ score }: { score: number }) {
  const level =
    score >= 80 ? { label: 'Critique', bg: 'rgba(239,68,68,0.12)', color: '#F87171' }
    : score >= 60 ? { label: 'Élevé', bg: 'rgba(245,158,11,0.12)', color: '#FCD34D' }
    : { label: 'Moyen', bg: 'rgba(59,130,246,0.12)', color: '#60A5FA' }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold kpi-value"
      style={{ background: level.bg, color: level.color }}
    >
      {score} — {level.label}
    </span>
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function DashboardHome({ summary, recentTransactions, fraudFlags }: Props) {
  const hasData = summary !== null

  const kpis = hasData
    ? [
        {
          label: 'Membres actifs',
          value: formatCompact(summary?.active_members ?? 0),
          sub: `${formatCompact(summary?.total_members ?? 0)} membres au total`,
          icon: Users,
          accent: '#3B82F6',
          trend: undefined as 'up' | 'down' | 'neutral' | undefined,
          trendLabel: undefined as string | undefined,
        },
        {
          label: 'Solde total (HTG)',
          value: formatHTG(summary?.total_balance_htg ?? 0),
          sub: `USD : ${formatUSD(summary?.total_balance_usd ?? 0)}`,
          icon: Banknote,
          accent: '#22C55E',
          trend: 'up' as const,
          trendLabel: 'Ce mois',
        },
        {
          label: 'Prêts en cours',
          value: formatHTG(summary?.total_loans_outstanding ?? 0),
          sub: undefined,
          icon: TrendingUp,
          accent: '#F59E0B',
          trend: undefined as 'up' | 'down' | 'neutral' | undefined,
          trendLabel: undefined as string | undefined,
        },
        {
          label: 'Alertes fraude ouvertes',
          value: String(summary?.open_fraud_flags ?? 0),
          sub: undefined,
          icon: AlertTriangle,
          accent: (summary?.open_fraud_flags ?? 0) > 0 ? '#EF4444' : '#22C55E',
          trend: (summary?.open_fraud_flags ?? 0) > 0 ? ('up' as const) : undefined,
          trendLabel: (summary?.open_fraud_flags ?? 0) > 0 ? 'À traiter' : undefined,
        },
      ]
    : null

  return (
    <div
      className="px-6 py-6 space-y-8 max-w-[1280px] mx-auto w-full"
      style={{ color: 'rgba(255,255,255,0.95)' }}
    >
      {/* Welcome */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Vue d&rsquo;ensemble
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Indicateurs clés de la coopérative en temps réel.
        </p>
      </div>

      {/* KPI grid */}
      <section aria-label="Indicateurs clés de performance">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis
            ? kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)
            : Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      </section>

      {/* Lower grid: transactions + fraud flags */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent transactions — 3/5 */}
        <section
          aria-label="Transactions récentes"
          className="lg:col-span-3 rounded-xl overflow-hidden"
          style={{ background: '#111318', border: '1px solid #252A36' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: '#252A36' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
              Transactions récentes
            </h3>
            <a
              href="/tableau-de-bord/transactions"
              className="text-xs font-medium transition-colors focus-visible:outline-none focus-visible:underline"
              style={{ color: '#C41E3A' }}
            >
              Tout voir
            </a>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowUpRight size={28} style={{ color: 'rgba(255,255,255,0.15)' }} aria-hidden="true" />
              <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Aucune transaction récente
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ divideColor: '#1e2330' } as React.CSSProperties}>
              {recentTransactions.map((tx) => {
                const isCredit = ['deposit', 'loan_disbursement'].includes(tx.type)
                const statusColor = TX_STATUS_COLORS[tx.status] ?? 'rgba(255,255,255,0.35)'

                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                    style={{ borderTop: '1px solid #1a1f2e' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isCredit ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)',
                      }}
                      aria-hidden="true"
                    >
                      {isCredit
                        ? <ArrowDownRight size={15} style={{ color: '#4ADE80' }} />
                        : <ArrowUpRight size={15} style={{ color: '#F87171' }} />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {TX_TYPE_LABELS[tx.type] ?? tx.type}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} aria-hidden="true" style={{ color: 'rgba(255,255,255,0.25)' }} />
                        <time
                          dateTime={tx.created_at}
                          className="text-xs"
                          style={{ color: 'rgba(255,255,255,0.30)' }}
                        >
                          {formatRelative(tx.created_at)}
                        </time>
                      </div>
                    </div>

                    {/* Amount + status */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm font-semibold kpi-value"
                        style={{ color: isCredit ? '#4ADE80' : '#F87171' }}
                      >
                        {isCredit ? '+' : '-'}
                        {tx.currency === 'HTG'
                          ? formatHTG(tx.amount)
                          : tx.currency === 'USD'
                          ? formatUSD(tx.amount)
                          : `${tx.amount.toLocaleString()} ${tx.currency}`}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: statusColor }}>
                        {TX_STATUS_LABELS[tx.status] ?? tx.status}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Fraud flags — 2/5 */}
        <section
          aria-label="Alertes fraude actives"
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ background: '#111318', border: '1px solid #252A36' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: '#252A36' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
              Alertes fraude
            </h3>
            {fraudFlags.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold kpi-value"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171' }}
              >
                {fraudFlags.length}
              </span>
            )}
          </div>

          {fraudFlags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.10)' }}
                aria-hidden="true"
              >
                <AlertTriangle size={18} style={{ color: '#4ADE80' }} />
              </div>
              <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Aucune alerte active
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.20)' }}>
                Tout est en ordre.
              </p>
            </div>
          ) : (
            <ul className="divide-y" role="list">
              {fraudFlags.map((flag) => (
                <li
                  key={flag.id}
                  className="px-5 py-3.5 transition-colors"
                  style={{ borderTop: '1px solid #1a1f2e' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(239,68,68,0.10)' }}
                      aria-hidden="true"
                    >
                      <AlertTriangle size={13} style={{ color: '#F87171' }} />
                    </div>
                    <div className="flex-1 min-w-0 ml-2">
                      <p
                        className="text-sm font-medium leading-snug truncate"
                        style={{ color: 'rgba(255,255,255,0.80)' }}
                      >
                        {flag.reason}
                      </p>
                      <time
                        dateTime={flag.created_at}
                        className="text-xs mt-0.5 block"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {formatRelative(flag.created_at)}
                      </time>
                    </div>
                    <RiskBadge score={flag.risk_score} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {fraudFlags.length > 0 && (
            <div className="px-5 py-3 border-t" style={{ borderColor: '#252A36' }}>
              <a
                href="/tableau-de-bord/alertes-fraude"
                className="text-xs font-medium transition-colors focus-visible:outline-none focus-visible:underline"
                style={{ color: '#C41E3A' }}
              >
                Gérer les alertes →
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
