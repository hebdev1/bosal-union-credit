'use client'

import * as React from 'react'
import {
  Users, Banknote, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, RefreshCw, Landmark,
} from 'lucide-react'
import { formatHTG, formatUSD, formatRelative } from '@/lib/formatters'
import { DashboardCharts, type RawTx, type RawExchange, type RawLoan } from './DashboardCharts'

/* ── Types ─────────────────────────────────────────────────────────────── */
interface ExchangeRate {
  from_currency: string
  to_currency: string
  rate: number
  is_active: boolean
  created_at: string
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  status: string
  created_at: string
  accounts?: {
    account_number: string
    currency: string
    members?: { first_name: string; last_name: string } | null
  } | null
}

interface FraudFlag {
  id: string
  rule_triggered: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  transaction_id: string
}

interface Props {
  summary: { total_balance: number; total_members: number; vault_balance: number; flagged_count: number } | null
  activeMembers: number
  totalBalanceHTG: number
  totalBalanceUSD: number
  vaultBalance: number | null
  activeLoansTotal: number
  activeLoansCount: number
  exchangeRates: ExchangeRate[]
  recentTransactions: Transaction[]
  fraudFlags: FraudFlag[]
  // Raw analytics data (last N days) for the charts section
  analyticsTx:        RawTx[]
  analyticsExchanges: RawExchange[]
  analyticsLoans:     RawLoan[]
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, accent, badge, badgeColor }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; accent?: string
  badge?: string; badgeColor?: string
}) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <article
      className="rounded-xl p-5 flex flex-col gap-4 cursor-default"
      style={{
        background: '#0D1018',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: accent ? `${accent}14` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${accent ? `${accent}20` : 'rgba(255,255,255,0.07)'}`,
          }}
          aria-hidden="true"
        >
          <Icon size={16} style={{ color: accent ?? 'rgba(255,255,255,0.50)' }} />
        </div>
        {badge && (
          <span
            className="rounded-full text-[10px] font-semibold kpi-value"
            style={{
              padding: '2px 8px',
              background: `${badgeColor ?? '#C41E3A'}18`,
              color: badgeColor ?? '#C41E3A',
              border: `1px solid ${badgeColor ?? '#C41E3A'}28`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div>
        <p
          className="text-xl font-semibold kpi-value"
          style={{ color: 'rgba(255,255,255,0.94)', letterSpacing: '-0.03em', lineHeight: 1.2 }}
        >
          {value}
        </p>
        <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{sub}</p>}
      </div>
    </article>
  )
}

/* ── TX type labels ─────────────────────────────────────────────────────── */
const TX_LABELS: Record<string, string> = {
  deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Virement', adjustment: 'Ajustement',
}
const TX_STATUS_COLORS: Record<string, string> = {
  completed: '#4ADE80', pending: '#FCD34D', failed: '#F87171', cancelled: 'rgba(255,255,255,0.35)',
}
const TX_STATUS_LABELS: Record<string, string> = {
  completed: 'Complété', pending: 'En attente', failed: 'Échoué', cancelled: 'Annulé',
}
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.20)', label: 'Critique' },
  high:     { color: '#FCD34D', bg: 'rgba(252,211,77,0.10)',  border: 'rgba(252,211,77,0.20)',  label: 'Élevé'   },
  medium:   { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.20)',  label: 'Moyen'   },
  low:      { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', label: 'Faible' },
}

/* ── Currency flag chip ─────────────────────────────────────────────────── */
function CurrencyFlag({ code }: { code: string }) {
  const colors: Record<string, string> = {
    HTG: '#C41E3A', USD: '#3B82F6', CAD: '#EF4444', DOP: '#22C55E',
  }
  const color = colors[code] ?? '#888'
  return (
    <span
      className="inline-flex items-center justify-center font-bold kpi-value"
      style={{
        fontSize: 10,
        padding: '2px 6px',
        borderRadius: 4,
        background: `${color}18`,
        color,
        border: `1px solid ${color}28`,
        minWidth: 36,
        letterSpacing: '0.04em',
      }}
    >
      {code}
    </span>
  )
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export function DashboardHome({
  activeMembers, totalBalanceHTG, totalBalanceUSD,
  vaultBalance, activeLoansTotal, activeLoansCount,
  exchangeRates, recentTransactions, fraudFlags,
  analyticsTx, analyticsExchanges, analyticsLoans,
}: Props) {
  const openFraud = fraudFlags.length

  // ── Recent tx filter ──
  const [txTypeFilter,   setTxTypeFilter]   = React.useState<'all' | 'deposit' | 'withdrawal' | 'transfer' | 'adjustment'>('all')
  const [txStatusFilter, setTxStatusFilter] = React.useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const filteredTx = React.useMemo(() => recentTransactions.filter(t =>
    (txTypeFilter   === 'all' || t.transaction_type === txTypeFilter) &&
    (txStatusFilter === 'all' || t.status           === txStatusFilter),
  ), [recentTransactions, txTypeFilter, txStatusFilter])

  // ── Fraud severity filter ──
  const [sevFilter, setSevFilter] = React.useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const filteredFraud = React.useMemo(() =>
    sevFilter === 'all' ? fraudFlags : fraudFlags.filter(f => f.severity === sevFilter),
  [fraudFlags, sevFilter])

  // ── KPI currency filter ──
  const [kpiCcy, setKpiCcy] = React.useState<'HTG' | 'USD'>('HTG')

  // ── Exchange rate currency filter ──
  const [rateCcy, setRateCcy] = React.useState<'ALL' | 'HTG' | 'USD' | 'CAD' | 'DOP'>('ALL')
  const visibleRates = React.useMemo(() =>
    rateCcy === 'ALL' ? exchangeRates : exchangeRates.filter(r => r.from_currency === rateCcy || r.to_currency === rateCcy),
  [exchangeRates, rateCcy])

  return (
    <div className="px-6 py-6 space-y-8 max-w-[1280px] mx-auto w-full">

      {/* Page header */}
      <div>
        <h2
          className="text-[18px] font-semibold"
          style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.03em' }}
        >
          Vue d&rsquo;ensemble
        </h2>
        <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.32)' }}>
          Indicateurs de la coopérative en temps réel
        </p>
      </div>

      {/* KPIs */}
      <section aria-label="Indicateurs clés">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Indicateurs clés</p>
          <div className="flex items-center gap-1 p-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['HTG', 'USD'] as const).map(c => (
              <button key={c} type="button" onClick={() => setKpiCcy(c)}
                className="px-2.5 h-6 rounded-md text-[11px] font-semibold transition-colors"
                style={{
                  background: kpiCcy === c ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color:      kpiCcy === c ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.35)',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Membres actifs"
            value={String(activeMembers)}
            sub="Comptes ouverts et opérationnels"
            icon={Users}
            accent="#3B82F6"
          />
          <KpiCard
            label={`Solde total ${kpiCcy}`}
            value={kpiCcy === 'HTG' ? formatHTG(totalBalanceHTG) : formatUSD(totalBalanceUSD)}
            sub={kpiCcy === 'HTG' ? `USD : ${formatUSD(totalBalanceUSD)}` : `HTG : ${formatHTG(totalBalanceHTG)}`}
            icon={Banknote}
            accent="#22C55E"
          />
          <KpiCard
            label="Cash Vault"
            value={vaultBalance !== null ? formatHTG(Number(vaultBalance)) : '—'}
            icon={Landmark}
            accent="#F59E0B"
          />
          <KpiCard
            label="Prêts actifs"
            value={formatHTG(activeLoansTotal)}
            sub={`${activeLoansCount} prêt${activeLoansCount !== 1 ? 's' : ''} en cours`}
            icon={TrendingUp}
            accent="#8B5CF6"
            badge={openFraud > 0 ? `${openFraud} alerte${openFraud > 1 ? 's' : ''}` : undefined}
            badgeColor="#EF4444"
          />
        </div>
      </section>

      {/* Charts */}
      <DashboardCharts txs={analyticsTx} exchanges={analyticsExchanges} loans={analyticsLoans} />

      {/* Exchange rates */}
      {exchangeRates.length > 0 && (
        <section aria-label="Taux de change actifs">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
              Taux de change
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-0.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['ALL', 'HTG', 'USD', 'CAD', 'DOP'] as const).map(c => (
                  <button key={c} type="button" onClick={() => setRateCcy(c)}
                    className="px-2 h-6 rounded-md text-[11px] font-semibold transition-colors"
                    style={{
                      background: rateCcy === c ? 'rgba(255,255,255,0.07)' : 'transparent',
                      color:      rateCcy === c ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.35)',
                    }}>
                    {c === 'ALL' ? 'Tous' : c}
                  </button>
                ))}
              </div>
              <a href="/tableau-de-bord/bureau-de-change"
                className="text-[12px] font-medium transition-opacity"
                style={{ color: 'var(--color-brand, #C41E3A)' }}>
                Gérer →
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {visibleRates.length === 0 ? (
              <p className="col-span-full text-[12px] py-4" style={{ color: 'rgba(255,255,255,0.30)' }}>Aucun taux pour cette devise.</p>
            ) : visibleRates.map(r => (
              <div
                key={`${r.from_currency}-${r.to_currency}-${r.created_at}`}
                className="rounded-xl p-3.5 space-y-2.5"
                style={{
                  background: '#0D1018',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CurrencyFlag code={r.from_currency} />
                  <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10 }}>→</span>
                  <CurrencyFlag code={r.to_currency} />
                </div>
                <p
                  className="text-[15px] font-semibold kpi-value"
                  style={{ color: 'rgba(255,255,255,0.94)', letterSpacing: '-0.02em' }}
                >
                  {Number(r.rate).toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  {formatRelative(r.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transactions + Fraud */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Recent transactions */}
        <section
          aria-label="Transactions récentes"
          className="lg:col-span-3 rounded-xl overflow-hidden"
          style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 gap-2 flex-wrap"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}>
              Transactions récentes
            </h3>
            <a
              href="/tableau-de-bord/transactions"
              className="text-[12px] font-medium transition-opacity"
              style={{ color: 'var(--color-brand, #C41E3A)' }}
            >
              Tout voir →
            </a>
          </div>
          <div className="px-5 py-3 flex items-center gap-1.5 flex-wrap"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {([
              ['all',        'Tous'],
              ['deposit',    'Dépôts'],
              ['withdrawal', 'Retraits'],
              ['transfer',   'Virements'],
              ['adjustment', 'Ajustements'],
            ] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTxTypeFilter(k)}
                className="px-2 h-6 rounded-md text-[11px] font-medium transition-colors"
                style={{
                  background: txTypeFilter === k ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color:      txTypeFilter === k ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.38)',
                  border:     '1px solid rgba(255,255,255,0.06)',
                }}>
                {label}
              </button>
            ))}
            <span className="mx-1" style={{ color: 'rgba(255,255,255,0.10)' }}>|</span>
            {([
              ['all',       'Tous statuts'],
              ['completed', 'Complété'],
              ['pending',   'En attente'],
              ['failed',    'Échoué'],
            ] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTxStatusFilter(k)}
                className="px-2 h-6 rounded-md text-[11px] font-medium transition-colors"
                style={{
                  background: txStatusFilter === k ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color:      txStatusFilter === k ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.38)',
                  border:     '1px solid rgba(255,255,255,0.06)',
                }}>
                {label}
              </button>
            ))}
          </div>

          {filteredTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw size={22} style={{ color: 'rgba(255,255,255,0.12)' }} aria-hidden="true" />
              <p className="mt-3 text-[13px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Aucune transaction</p>
            </div>
          ) : (
            <ul role="list">
              {filteredTx.map((tx, i) => {
                const isCredit = tx.transaction_type === 'deposit'
                const statusColor = TX_STATUS_COLORS[tx.status] ?? 'rgba(255,255,255,0.35)'
                const member = (tx.accounts as any)?.members
                const memberName = member ? `${member.first_name} ${member.last_name}` : (tx.accounts as any)?.account_number ?? '—'
                const currency = (tx.accounts as any)?.currency ?? 'HTG'

                return (
                  <li
                    key={tx.id}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition-colors"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: isCredit ? 'rgba(74,222,128,0.09)' : 'rgba(248,113,113,0.09)',
                        border: `1px solid ${isCredit ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}`,
                      }}
                      aria-hidden="true"
                    >
                      {isCredit
                        ? <ArrowDownRight size={14} style={{ color: '#4ADE80' }} />
                        : <ArrowUpRight size={14} style={{ color: '#F87171' }} />
                      }
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.84)' }}>
                        {TX_LABELS[tx.transaction_type] ?? tx.transaction_type}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          {memberName}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>·</span>
                        <Clock size={9} aria-hidden="true" style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
                        <time dateTime={tx.created_at} className="text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                          {formatRelative(tx.created_at)}
                        </time>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-[13px] font-semibold kpi-value"
                        style={{ color: isCredit ? '#4ADE80' : '#F87171', letterSpacing: '-0.01em' }}
                      >
                        {isCredit ? '+' : '-'}
                        {currency === 'USD' ? formatUSD(tx.amount) : formatHTG(tx.amount)}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: statusColor }}>
                        {TX_STATUS_LABELS[tx.status] ?? tx.status}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Fraud flags */}
        <section
          aria-label="Alertes fraude"
          className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h3 className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}>
              Alertes fraude
            </h3>
            {openFraud > 0 && (
              <span
                className="rounded-full text-[10px] font-semibold kpi-value"
                style={{
                  padding: '2px 8px',
                  background: 'rgba(248,113,113,0.12)',
                  color: '#F87171',
                  border: '1px solid rgba(248,113,113,0.20)',
                }}
              >
                {openFraud}
              </span>
            )}
          </div>
          <div className="px-5 py-3 flex items-center gap-1.5 flex-wrap"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {([
              ['all',      'Toutes'],
              ['critical', 'Critique'],
              ['high',     'Élevé'],
              ['medium',   'Moyen'],
              ['low',      'Faible'],
            ] as const).map(([k, label]) => {
              const color = k === 'all' ? 'rgba(255,255,255,0.50)' : SEVERITY_CONFIG[k]?.color ?? '#888'
              const active = sevFilter === k
              return (
                <button key={k} type="button" onClick={() => setSevFilter(k)}
                  className="px-2 h-6 rounded-md text-[11px] font-medium transition-colors"
                  style={{
                    background: active ? `${color}18` : 'transparent',
                    color:      active ? color : 'rgba(255,255,255,0.38)',
                    border:     `1px solid ${active ? `${color}30` : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  {label}
                </button>
              )
            })}
          </div>

          {filteredFraud.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="flex items-center justify-center mb-3"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(74,222,128,0.09)',
                  border: '1px solid rgba(74,222,128,0.15)',
                }}
                aria-hidden="true"
              >
                <AlertTriangle size={17} style={{ color: '#4ADE80' }} />
              </div>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Aucune alerte active</p>
            </div>
          ) : (
            <ul role="list">
              {filteredFraud.map((flag, i) => {
                const cfg = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.medium
                return (
                  <li
                    key={flag.id}
                    className="px-5 py-3.5 transition-colors"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: 'rgba(248,113,113,0.09)',
                          border: '1px solid rgba(248,113,113,0.15)',
                        }}
                        aria-hidden="true"
                      >
                        <AlertTriangle size={12} style={{ color: '#F87171' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.80)' }}>
                          {flag.rule_triggered}
                        </p>
                        <time
                          dateTime={flag.created_at}
                          className="text-[11px] block mt-0.5"
                          style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                          {formatRelative(flag.created_at)}
                        </time>
                      </div>
                      <span
                        className="rounded-full text-[10px] font-semibold flex-shrink-0"
                        style={{
                          padding: '2px 7px',
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {filteredFraud.length > 0 && (
            <div className="px-5 py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <a
                href="/tableau-de-bord/alertes-fraude"
                className="text-[12px] font-medium transition-opacity"
                style={{ color: 'var(--color-brand, #C41E3A)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.75')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
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
