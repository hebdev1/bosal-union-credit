import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { formatHTG } from '@/lib/formatters'
import { incomeStatement } from '@/lib/accounting/reports'

export const metadata: Metadata = { title: 'Compte de résultat' }

function Row({ label, value, bold, negative }: { label: string; value: number; bold?: boolean; negative?: boolean }) {
  const color = negative
    ? '#F87171'
    : bold
      ? 'rgba(255,255,255,0.95)'
      : 'rgba(255,255,255,0.80)'
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className={bold ? 'text-sm font-semibold' : 'text-sm'} style={{ color: bold ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)' }}>{label}</span>
      <span className={`kpi-value ${bold ? 'text-base font-bold' : 'text-sm font-medium'}`} style={{ color }}>
        {negative ? '−' : ''}{formatHTG(Math.abs(value))}
      </span>
    </div>
  )
}

export default async function IncomeStatementReport() {
  const supabase = await createClient()

  const now = new Date()
  const nowMs = now.getTime()
  const year = now.getFullYear()
  const startOfYear = `${year}-01-01`

  // Revenue: interest from loans (estimated), fees from transaction adjustments, exchange margin
  const [loansRes, txRes, exchangeRes] = await Promise.allSettled([
    supabase.from('loans')
      .select('principal_amount, interest_rate, duration_months, status, created_at')
      .gte('created_at', startOfYear),
    supabase.from('transactions')
      .select('transaction_type, amount, created_at')
      .gte('created_at', startOfYear),
    supabase.from('exchange_transactions')
      .select('amount_given, amount_received, from_currency, to_currency, created_at')
      .gte('created_at', startOfYear),
  ])

  const loans = loansRes.status === 'fulfilled' ? (loansRes.value.data ?? []) : []
  const txs = txRes.status === 'fulfilled' ? (txRes.value.data ?? []) : []
  const exchanges = exchangeRes.status === 'fulfilled' ? (exchangeRes.value.data ?? []) : []

  // Intérêts courus (estimation sur base pro-rata année)
  const interestIncome = loans.reduce((s, l) => {
    const principal = Number(l.principal_amount)
    const annualRate = Number(l.interest_rate) / 100
    // Estimation prudente : intérêt annuel × pondération temps écoulé depuis création
    const createdAt = new Date(l.created_at ?? startOfYear)
    const monthsElapsed = Math.min(12, Math.max(0, (nowMs - createdAt.getTime()) / (30 * 86400_000)))
    return s + principal * annualRate * (monthsElapsed / 12)
  }, 0)

  const feeIncome = txs
    .filter((t) => t.transaction_type === 'adjustment')
    .reduce((s, t) => s + Number(t.amount), 0)

  // Marge de change approximative (1% du volume)
  const exchangeVolume = exchanges.reduce((s, e) => s + Number(e.amount_given), 0)
  const exchangeIncome = exchangeVolume * 0.01

  // Charges (pas de table dédiée — placeholders réalistes basés sur benchmarks coop)
  const salaries = 0
  const rent = 0
  const operatingExpenses = 0
  const loanLossProvision = loans
    .filter((l) => l.status === 'defaulted')
    .reduce((s, l) => s + Number(l.principal_amount) * 0.5, 0) // provision 50% sur défauts

  const stmt = incomeStatement({
    interestIncome,
    feeIncome,
    exchangeIncome,
    salaries,
    rent,
    operatingExpenses,
    loanLossProvision,
  })

  return (
    <>
      <Header title="Compte de résultat" />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        <Link href="/tableau-de-bord/rapports"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          <ArrowLeft size={13} />
          Retour aux rapports
        </Link>

        <div>
          <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Compte de résultat {year}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Revenus et charges cumulés depuis le 1er janvier — provisions calculées sur défauts constatés
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(74,222,128,0.22)' }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Revenus</p>
            <p className="text-2xl font-bold mt-2 kpi-value" style={{ color: '#4ADE80' }}>{formatHTG(stmt.revenue)}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(252,211,77,0.22)' }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Charges</p>
            <p className="text-2xl font-bold mt-2 kpi-value" style={{ color: '#FCD34D' }}>{formatHTG(stmt.operatingExpenses + stmt.provisions)}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#0D1018', border: `1px solid ${stmt.netIncome >= 0 ? 'rgba(74,222,128,0.22)' : 'rgba(248,113,113,0.22)'}` }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Résultat net</p>
            <p className="text-2xl font-bold mt-2 kpi-value" style={{ color: stmt.netIncome >= 0 ? '#4ADE80' : '#F87171' }}>
              {stmt.netIncome >= 0 ? '' : '−'}{formatHTG(Math.abs(stmt.netIncome))}
            </p>
          </div>
        </div>

        {/* Detailed statement */}
        <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-sm font-semibold mb-3 pb-3" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Produits d&apos;exploitation
          </h2>
          <Row label="Intérêts sur prêts" value={interestIncome} />
          <Row label="Commissions & frais" value={feeIncome} />
          <Row label="Marge de change (1%)" value={exchangeIncome} />
          <div className="mt-3 pt-3" style={{ borderTop: '2px solid rgba(74,222,128,0.25)' }}>
            <Row label="Total revenus" value={stmt.revenue} bold />
          </div>

          <h2 className="text-sm font-semibold mt-6 mb-3 pb-3" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Charges d&apos;exploitation
          </h2>
          <Row label="Salaires" value={salaries} negative />
          <Row label="Loyer & utilités" value={rent} negative />
          <Row label="Autres charges opérationnelles" value={operatingExpenses} negative />
          <Row label="Provisions pour pertes sur prêts" value={stmt.provisions} negative />
          <div className="mt-3 pt-3" style={{ borderTop: '2px solid rgba(252,211,77,0.25)' }}>
            <Row label="Total charges" value={stmt.operatingExpenses + stmt.provisions} bold negative />
          </div>

          <div className="mt-6 pt-4" style={{ borderTop: '2px solid rgba(196,30,58,0.35)' }}>
            <Row label="RÉSULTAT NET" value={Math.abs(stmt.netIncome)} bold negative={stmt.netIncome < 0} />
          </div>
        </div>

        <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Note : les salaires et charges fixes ne sont pas encore saisis dans le système. Ajoutez-les via le module comptabilité pour un résultat complet.
        </p>
      </div>
    </>
  )
}
