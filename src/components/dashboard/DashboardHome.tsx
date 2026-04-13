'use client'

import * as React from 'react'
import {
  Users, Banknote, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, RefreshCw, Landmark,
} from 'lucide-react'
import { formatHTG, formatUSD, formatCompact, formatRelative } from '@/lib/formatters'

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
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, accent, badge, badgeColor }: {
  label: string; value: string; sub?: string
  icon: React.ElementType; accent?: string
  badge?: string; badgeColor?: string
}) {
  return (
    <article
      className="rounded-xl p-5 flex flex-col gap-4 transition-colors duration-120 cursor-default"
      style={{ background: '#111318', border: '1px solid #252A36' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#363D52')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#252A36')}
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: accent ? `${accent}18` : 'rgba(255,255,255,0.06)' }} aria-hidden="true">
          <Icon size={17} style={{ color: accent ?? 'rgba(255,255,255,0.55)' }} />
        </div>
        {badge && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold kpi-value"
            style={{ background: `${badgeColor ?? '#C41E3A'}18`, color: badgeColor ?? '#C41E3A' }}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}>
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{label}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</p>}
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
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#F87171', bg: 'rgba(239,68,68,0.12)', label: 'Critique' },
  high:     { color: '#FCD34D', bg: 'rgba(245,158,11,0.12)', label: 'Élevé' },
  medium:   { color: '#60A5FA', bg: 'rgba(59,130,246,0.12)', label: 'Moyen' },
  low:      { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', label: 'Faible' },
}

/* ── Currency pair label ────────────────────────────────────────────────── */
function CurrencyFlag({ code }: { code: string }) {
  const colors: Record<string, string> = {
    HTG: '#C41E3A', USD: '#3B82F6', CAD: '#EF4444', DOP: '#22C55E',
  }
  return (
    <span className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold kpi-value"
      style={{ background: `${colors[code] ?? '#555'}22`, color: colors[code] ?? 'rgba(255,255,255,0.6)', minWidth: 36 }}>
      {code}
    </span>
  )
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export function DashboardHome({
  activeMembers, totalBalanceHTG, totalBalanceUSD,
  vaultBalance, activeLoansTotal, activeLoansCount,
  exchangeRates, recentTransactions, fraudFlags,
}: Props) {
  const openFraud = fraudFlags.length

  return (
    <div className="px-6 py-6 space-y-8 max-w-[1280px] mx-auto w-full">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>Vue d&rsquo;ensemble</h2>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Indicateurs de la coopérative en temps réel</p>
      </div>

      {/* KPIs */}
      <section aria-label="Indicateurs clés">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Membres actifs" value={String(activeMembers)}
            sub="Comptes ouverts et opérationnels" icon={Users} accent="#3B82F6" />
          <KpiCard label="Solde total HTG" value={formatHTG(totalBalanceHTG)}
            sub={`USD : ${formatUSD(totalBalanceUSD)}`} icon={Banknote} accent="#22C55E" />
          <KpiCard label="Cash Vault" value={vaultBalance !== null ? formatHTG(Number(vaultBalance)) : '—'}
            icon={Landmark} accent="#F59E0B" />
          <KpiCard label="Prêts actifs" value={formatHTG(activeLoansTotal)}
            sub={`${activeLoansCount} prêt${activeLoansCount !== 1 ? 's' : ''} en cours`}
            icon={TrendingUp} accent="#8B5CF6"
            badge={openFraud > 0 ? `${openFraud} alerte${openFraud > 1 ? 's' : ''}` : undefined}
            badgeColor="#EF4444" />
        </div>
      </section>

      {/* Exchange rates */}
      {exchangeRates.length > 0 && (
        <section aria-label="Taux de change actifs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Taux de change</h3>
            <a href="/tableau-de-bord/bureau-de-change" className="text-xs font-medium transition-colors"
              style={{ color: '#C41E3A' }}>Gérer →</a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {exchangeRates.map(r => (
              <div key={`${r.from_currency}-${r.to_currency}-${r.created_at}`}
                className="rounded-xl p-3.5 space-y-2"
                style={{ background: '#111318', border: '1px solid #252A36' }}>
                <div className="flex items-center gap-1.5">
                  <CurrencyFlag code={r.from_currency} />
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>→</span>
                  <CurrencyFlag code={r.to_currency} />
                </div>
                <p className="text-base font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {Number(r.rate).toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {formatRelative(r.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transactions + Fraud */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent transactions */}
        <section aria-label="Transactions récentes" className="lg:col-span-3 rounded-xl overflow-hidden"
          style={{ background: '#111318', border: '1px solid #252A36' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#252A36' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>Transactions récentes</h3>
            <a href="/tableau-de-bord/transactions" className="text-xs font-medium" style={{ color: '#C41E3A' }}>Tout voir</a>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw size={24} style={{ color: 'rgba(255,255,255,0.15)' }} aria-hidden="true" />
              <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>Aucune transaction</p>
            </div>
          ) : (
            <ul role="list">
              {recentTransactions.map(tx => {
                const isCredit = tx.transaction_type === 'deposit'
                const statusColor = TX_STATUS_COLORS[tx.status] ?? 'rgba(255,255,255,0.35)'
                const member = (tx.accounts as any)?.members
                const memberName = member ? `${member.first_name} ${member.last_name}` : (tx.accounts as any)?.account_number ?? '—'
                const currency = (tx.accounts as any)?.currency ?? 'HTG'

                return (
                  <li key={tx.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                    style={{ borderTop: '1px solid #1a1f2e' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isCredit ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.08)' }}
                      aria-hidden="true">
                      {isCredit
                        ? <ArrowDownRight size={15} style={{ color: '#4ADE80' }} />
                        : <ArrowUpRight size={15} style={{ color: '#F87171' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {TX_LABELS[tx.transaction_type] ?? tx.transaction_type}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.30)' }}>{memberName}</span>
                        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                        <Clock size={10} aria-hidden="true" style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0 }} />
                        <time dateTime={tx.created_at} className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {formatRelative(tx.created_at)}
                        </time>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold kpi-value"
                        style={{ color: isCredit ? '#4ADE80' : '#F87171' }}>
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
        <section aria-label="Alertes fraude" className="lg:col-span-2 rounded-xl overflow-hidden"
          style={{ background: '#111318', border: '1px solid #252A36' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#252A36' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>Alertes fraude</h3>
            {openFraud > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold kpi-value"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171' }}>{openFraud}</span>
            )}
          </div>

          {fraudFlags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ background: 'rgba(34,197,94,0.10)' }} aria-hidden="true">
                <AlertTriangle size={18} style={{ color: '#4ADE80' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>Aucune alerte active</p>
            </div>
          ) : (
            <ul role="list">
              {fraudFlags.map(flag => {
                const cfg = SEVERITY_CONFIG[flag.severity] ?? SEVERITY_CONFIG.medium
                return (
                  <li key={flag.id}
                    className="px-5 py-3.5 transition-colors"
                    style={{ borderTop: '1px solid #1a1f2e' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(239,68,68,0.10)' }} aria-hidden="true">
                        <AlertTriangle size={13} style={{ color: '#F87171' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug" style={{ color: 'rgba(255,255,255,0.80)' }}>
                          {flag.rule_triggered}
                        </p>
                        <time dateTime={flag.created_at} className="text-xs block mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          {formatRelative(flag.created_at)}
                        </time>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {fraudFlags.length > 0 && (
            <div className="px-5 py-3 border-t" style={{ borderColor: '#252A36' }}>
              <a href="/tableau-de-bord/alertes-fraude" className="text-xs font-medium" style={{ color: '#C41E3A' }}>
                Gérer les alertes →
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
