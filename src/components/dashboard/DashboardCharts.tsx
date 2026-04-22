'use client'
import * as React from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import { formatHTG, formatCompact } from '@/lib/formatters'

/* ── Raw types (server-fetched) ─────────────────────────────────────────── */
export interface RawTx {
  transaction_type: string
  amount:          number | string
  status:          string
  created_at:      string
}
export interface RawExchange {
  from_currency:  string
  to_currency:    string
  amount_given:   number | string
  rate_applied:   number | string
  created_at:     string
}
export interface RawLoan {
  status:           string
  principal_amount: number | string
  created_at:       string
}

interface Props {
  txs:       RawTx[]
  exchanges: RawExchange[]
  loans:     RawLoan[]
}

/* ── Palette & labels ───────────────────────────────────────────────────── */
const TX_COLORS: Record<string, string> = {
  deposit: '#4ADE80', withdrawal: '#F87171', transfer: '#60A5FA', adjustment: '#FCD34D',
}
const TX_LABELS: Record<string, string> = {
  deposit: 'Dépôts', withdrawal: 'Retraits', transfer: 'Virements', adjustment: 'Ajustements',
}
const TX_TYPES = ['deposit', 'withdrawal', 'transfer', 'adjustment'] as const
type TxType = typeof TX_TYPES[number]

const LOAN_COLORS: Record<string, string> = {
  pending: '#FCD34D', active: '#4ADE80', completed: '#60A5FA',
  defaulted: '#F87171', rejected: 'rgba(255,255,255,0.35)',
}
const LOAN_LABELS: Record<string, string> = {
  pending: 'En attente', active: 'Actifs', completed: 'Complétés',
  defaulted: 'En défaut', rejected: 'Rejetés',
}
const LOAN_STATUSES = ['pending', 'active', 'completed', 'defaulted', 'rejected'] as const

type Period = 7 | 30 | 90 | 365

/* ── UI helpers ─────────────────────────────────────────────────────────── */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="px-2.5 h-7 rounded-lg text-[11px] font-medium transition-colors"
      style={{
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        color:      active ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.40)',
        border:     '1px solid rgba(255,255,255,0.06)',
      }}>
      {children}
    </button>
  )
}

function Toggle({ active, color, onClick, children }: { active: boolean; color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 h-6 rounded-md text-[11px] font-medium transition-all"
      style={{
        background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
        color:      active ? color : 'rgba(255,255,255,0.35)',
        border:     `1px solid ${active ? `${color}35` : 'rgba(255,255,255,0.06)'}`,
      }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color, opacity: active ? 1 : 0.4 }} />
      {children}
    </button>
  )
}

function ChartCard({ title, subtitle, controls, children, minH = 280 }: {
  title: string
  subtitle?: string
  controls?: React.ReactNode
  children: React.ReactNode
  minH?: number
}) {
  return (
    <section
      className="rounded-xl p-5"
      style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>{subtitle}</p>
          )}
        </div>
        {controls && <div className="flex items-center gap-1.5 flex-wrap">{controls}</div>}
      </div>
      <div style={{ width: '100%', height: minH }}>
        {children}
      </div>
    </section>
  )
}

const tooltipStyle: React.CSSProperties = {
  background: '#0A0C12', border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 8, fontSize: 11, padding: '8px 10px', color: 'rgba(255,255,255,0.85)',
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export function DashboardCharts({ txs, exchanges, loans }: Props) {
  // Global period
  const [period, setPeriod] = React.useState<Period>(30)

  // Section-specific filters
  const [activeTypes, setActiveTypes] = React.useState<Set<TxType>>(new Set(TX_TYPES))
  const [pieMetric,   setPieMetric]   = React.useState<'count' | 'amount'>('count')
  const [activeLoanStatuses, setActiveLoanStatuses] = React.useState<Set<string>>(new Set(LOAN_STATUSES))
  const [exchangeMetric, setExchangeMetric] = React.useState<'count' | 'volume'>('count')

  // Period bounds
  const now = React.useMemo(() => new Date(), [])
  const periodStart = React.useMemo(() => {
    const d = new Date(now); d.setDate(d.getDate() - period); return d
  }, [now, period])

  // Filter raw data by period
  const txsInRange = React.useMemo(
    () => txs.filter(t => new Date(t.created_at) >= periodStart),
    [txs, periodStart],
  )
  const exchangesInRange = React.useMemo(
    () => exchanges.filter(e => new Date(e.created_at) >= periodStart),
    [exchanges, periodStart],
  )
  const loansInRange = React.useMemo(
    () => loans.filter(l => new Date(l.created_at) >= periodStart),
    [loans, periodStart],
  )

  // ── Daily points ──
  const daily = React.useMemo(() => {
    const buckets = new Map<string, { deposit: number; withdrawal: number; transfer: number; adjustment: number }>()
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      buckets.set(key, { deposit: 0, withdrawal: 0, transfer: 0, adjustment: 0 })
    }
    for (const t of txsInRange) {
      const key = new Date(t.created_at).toISOString().slice(0, 10)
      const b = buckets.get(key); if (!b) continue
      const ttype = t.transaction_type as TxType
      if (!activeTypes.has(ttype)) continue
      if (ttype in b) b[ttype] += Number(t.amount) || 0
    }
    const fmt = new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'short' })
    return Array.from(buckets.entries()).map(([date, v]) => ({
      date, label: fmt.format(new Date(date)), ...v,
    }))
  }, [txsInRange, period, now, activeTypes])

  // ── Pie breakdown ──
  const typeBreakdown = React.useMemo(() => {
    return TX_TYPES.map(t => {
      const subset = txsInRange.filter(x => x.transaction_type === t)
      return {
        type:  t,
        label: TX_LABELS[t],
        count: subset.length,
        total: subset.reduce((s, x) => s + (Number(x.amount) || 0), 0),
      }
    })
  }, [txsInRange])

  const pieData = React.useMemo(() => typeBreakdown
    .filter(t => (pieMetric === 'count' ? t.count : t.total) > 0 && activeTypes.has(t.type))
    .map(t => ({
      name:  t.label,
      value: pieMetric === 'count' ? t.count : t.total,
      color: TX_COLORS[t.type],
      count: t.count,
      total: t.total,
    })),
  [typeBreakdown, pieMetric, activeTypes])

  // ── Loan statuses ──
  const loanStatuses = React.useMemo(() => {
    return LOAN_STATUSES
      .filter(s => activeLoanStatuses.has(s))
      .map(status => {
        const subset = loansInRange.filter(l => l.status === status)
        return {
          status,
          label:  LOAN_LABELS[status],
          count:  subset.length,
          amount: subset.reduce((s, l) => s + (Number(l.principal_amount) || 0), 0),
        }
      })
      .filter(r => r.count > 0)
  }, [loansInRange, activeLoanStatuses])

  // ── Exchange pairs ──
  const exchangePairs = React.useMemo(() => {
    const map = new Map<string, { pair: string; count: number; volume: number }>()
    for (const e of exchangesInRange) {
      const pair = `${e.from_currency}→${e.to_currency}`
      const existing = map.get(pair) ?? { pair, count: 0, volume: 0 }
      existing.count  += 1
      existing.volume += Number(e.amount_given) || 0
      map.set(pair, existing)
    }
    const sortKey = exchangeMetric === 'count' ? 'count' : 'volume'
    return Array.from(map.values()).sort((a, b) => b[sortKey] - a[sortKey]).slice(0, 8)
  }, [exchangesInRange, exchangeMetric])

  // Totals
  const totalTx      = typeBreakdown.reduce((s, t) => s + t.count, 0)
  const totalVolume  = typeBreakdown.reduce((s, t) => s + t.total, 0)
  const totalExch    = exchangesInRange.length
  const totalLoanAmt = loanStatuses.reduce((s, l) => s + l.amount, 0)

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <section aria-label="Graphiques de synthèse" className="space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>
            Activité & Analytique
          </h3>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.32)' }}>
            Synthèse toutes opérations — filtrable par section
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          {([7, 30, 90, 365] as Period[]).map(p => (
            <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>
              {p === 365 ? '1 an' : `${p} j`}
            </Pill>
          ))}
        </div>
      </div>

      {/* Activity stream — full width */}
      <ChartCard
        title="Flux quotidien des transactions"
        subtitle={`${totalTx} opération${totalTx !== 1 ? 's' : ''} · Volume ${formatHTG(totalVolume)}`}
        controls={
          <>
            {TX_TYPES.map(t => {
              const active = activeTypes.has(t)
              return (
                <Toggle key={t} active={active} color={TX_COLORS[t]}
                  onClick={() => {
                    const next = new Set(activeTypes)
                    if (next.has(t)) next.delete(t); else next.add(t)
                    if (next.size > 0) setActiveTypes(next)
                  }}>
                  {TX_LABELS[t]}
                </Toggle>
              )
            })}
          </>
        }
        minH={300}
      >
        <ResponsiveContainer>
          <AreaChart data={daily} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {TX_TYPES.map(k => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={TX_COLORS[k]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={TX_COLORS[k]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.30)" fontSize={10}
              tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              interval="preserveStartEnd" />
            <YAxis stroke="rgba(255,255,255,0.30)" fontSize={10}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => formatCompact(Number(v))} />
            <Tooltip contentStyle={tooltipStyle}
              labelStyle={{ color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}
              formatter={(v, name) => [formatHTG(Number(v) || 0), String(name)]}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
            {TX_TYPES.filter(t => activeTypes.has(t)).map(k => (
              <Area key={k} type="monotone" dataKey={k} name={TX_LABELS[k]}
                stackId="1" stroke={TX_COLORS[k]} strokeWidth={1.5} fill={`url(#grad-${k})`} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie */}
        <ChartCard
          title="Répartition par type"
          subtitle="Pondération des opérations"
          controls={
            <div className="flex items-center gap-1 p-0.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Pill active={pieMetric === 'count'}  onClick={() => setPieMetric('count')}>Nombre</Pill>
              <Pill active={pieMetric === 'amount'} onClick={() => setPieMetric('amount')}>Montant</Pill>
            </div>
          }
          minH={280}
        >
          {pieData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Aucune donnée</p>
            </div>
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  paddingAngle={2} stroke="#0D1018" strokeWidth={2}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(_v, _n, item) => {
                    const p = (item as { payload?: { count?: number; total?: number } })?.payload
                    return [`${p?.count ?? 0} op. · ${formatHTG(p?.total ?? 0)}`, 'Détail']
                  }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Loan statuses */}
        <ChartCard
          title="Portefeuille prêts par statut"
          subtitle={`${loanStatuses.reduce((s, l) => s + l.count, 0)} prêts · ${formatHTG(totalLoanAmt)}`}
          controls={
            <>
              {LOAN_STATUSES.map(s => {
                const active = activeLoanStatuses.has(s)
                return (
                  <Toggle key={s} active={active} color={LOAN_COLORS[s]}
                    onClick={() => {
                      const next = new Set(activeLoanStatuses)
                      if (next.has(s)) next.delete(s); else next.add(s)
                      if (next.size > 0) setActiveLoanStatuses(next)
                    }}>
                    {LOAN_LABELS[s]}
                  </Toggle>
                )
              })}
            </>
          }
          minH={280}
        >
          {loanStatuses.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Aucun prêt enregistré</p>
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={loanStatuses} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.30)" fontSize={10}
                  tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis stroke="rgba(255,255,255,0.30)" fontSize={10}
                  tickLine={false} axisLine={false}
                  tickFormatter={(v) => formatCompact(Number(v))} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  formatter={(v) => formatHTG(Number(v) || 0)} />
                <Bar dataKey="amount" name="Capital" radius={[6, 6, 0, 0]}>
                  {loanStatuses.map((entry, i) => (
                    <Cell key={i} fill={LOAN_COLORS[entry.status] ?? '#A78BFA'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Exchange pairs */}
      <ChartCard
        title="Bureau de change — Paires les plus actives"
        subtitle={`${totalExch} opération${totalExch !== 1 ? 's' : ''} de change sur la période`}
        controls={
          <div className="flex items-center gap-1 p-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Pill active={exchangeMetric === 'count'}  onClick={() => setExchangeMetric('count')}>Nombre</Pill>
            <Pill active={exchangeMetric === 'volume'} onClick={() => setExchangeMetric('volume')}>Volume</Pill>
          </div>
        }
        minH={260}
      >
        {exchangePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.28)' }}>Aucune opération de change</p>
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart data={exchangePairs} layout="vertical" margin={{ top: 6, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.30)" fontSize={10}
                tickLine={false} axisLine={false}
                tickFormatter={(v) => formatCompact(Number(v))} />
              <YAxis dataKey="pair" type="category" stroke="rgba(255,255,255,0.30)"
                fontSize={11} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(v) => exchangeMetric === 'count' ? `${Number(v) || 0} op.` : formatHTG(Number(v) || 0)} />
              <Bar dataKey={exchangeMetric === 'count' ? 'count' : 'volume'}
                name={exchangeMetric === 'count' ? 'Opérations' : 'Volume'}
                fill="#34D399" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </section>
  )
}
