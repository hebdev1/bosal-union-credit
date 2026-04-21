import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Download, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { formatHTG } from '@/lib/formatters'
import { agedLoanBalance, par30, keyRatios, type LoanSnapshot } from '@/lib/accounting/reports'

export const metadata: Metadata = { title: 'Rapport BRH' }

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000)
}

// Seuils prudentiels BRH pour les coopératives (valeurs indicatives)
const BRH_THRESHOLDS = {
  par30_max: 0.05,    // PAR30 ≤ 5%
  car_min: 0.10,      // CAR ≥ 10% (capitaux / actifs)
  ldr_max: 0.80,      // LDR ≤ 80% (prêts / dépôts)
  liquidity_min: 0.15, // Liquidité ≥ 15% (cash + bank / dépôts)
}

export default async function BRHReport() {
  const supabase = await createClient()

  const [loansRes, accountsRes, membersRes, sharesRes] = await Promise.allSettled([
    supabase.from('loans').select('principal_amount, total_amount_due, amount_paid, status, due_date'),
    supabase.from('accounts').select('account_type, balance, status'),
    supabase.from('members').select('status'),
    supabase.from('shares').select('quantity, unit_value, total_value, status'),
  ])

  const loans = loansRes.status === 'fulfilled' ? (loansRes.value.data ?? []) : []
  const accounts = accountsRes.status === 'fulfilled' ? (accountsRes.value.data ?? []) : []
  const members = membersRes.status === 'fulfilled' ? (membersRes.value.data ?? []) : []
  const shares = sharesRes.status === 'fulfilled' ? (sharesRes.value.data ?? []) : []

  const now = new Date()
  const snapshots: LoanSnapshot[] = loans.map((l) => {
    const remaining = Number(l.total_amount_due) - Number(l.amount_paid ?? 0)
    const due = new Date(l.due_date)
    const dpd = l.status === 'active' ? Math.max(daysBetween(now, due), 0) : 0
    return {
      id: '',
      outstandingPrincipal: remaining,
      nextDueDate: due,
      daysPastDue: dpd,
      status: (l.status === 'completed' ? 'paid_off'
            : l.status === 'defaulted' ? 'defaulted'
            : 'active') as LoanSnapshot['status'],
    }
  })

  const aged = agedLoanBalance(snapshots)
  const par30Ratio = par30(snapshots)

  const memberDeposits = accounts
    .filter((a) => a.account_type === 'savings' || a.account_type === 'deposit')
    .reduce((s, a) => s + Number(a.balance ?? 0), 0)
  const wallets = accounts
    .filter((a) => a.account_type === 'wallet')
    .reduce((s, a) => s + Number(a.balance ?? 0), 0)

  const loansOutstanding = aged.total
  const paidInCapital = shares
    .filter((s) => s.status === 'paid' || s.status === 'active')
    .reduce((s, x) => s + Number(x.total_value ?? Number(x.quantity) * Number(x.unit_value)), 0)

  const totalAssets = memberDeposits + wallets + loansOutstanding + paidInCapital
  const equity = paidInCapital

  const ratios = keyRatios({
    loansOutstanding,
    deposits: memberDeposits,
    totalAssets,
    equity,
    netIncome: 0, // non disponible ici — relier au compte de résultat
    par30: par30Ratio,
  })

  const liquidity = memberDeposits > 0 ? wallets / memberDeposits : 0

  const activeMembers = members.filter((m) => m.status === 'active').length

  const checks = [
    { label: 'PAR 30',                value: `${(par30Ratio * 100).toFixed(2)}%`,   pass: par30Ratio <= BRH_THRESHOLDS.par30_max,   threshold: `≤ ${(BRH_THRESHOLDS.par30_max * 100)}%` },
    { label: 'Ratio de capital (CAR)', value: `${(ratios.car * 100).toFixed(2)}%`,   pass: ratios.car >= BRH_THRESHOLDS.car_min,     threshold: `≥ ${(BRH_THRESHOLDS.car_min * 100)}%` },
    { label: 'Loan-to-Deposit',       value: `${(ratios.ldr * 100).toFixed(2)}%`,   pass: ratios.ldr <= BRH_THRESHOLDS.ldr_max,     threshold: `≤ ${(BRH_THRESHOLDS.ldr_max * 100)}%` },
    { label: 'Liquidité',             value: `${(liquidity * 100).toFixed(2)}%`,    pass: liquidity >= BRH_THRESHOLDS.liquidity_min, threshold: `≥ ${(BRH_THRESHOLDS.liquidity_min * 100)}%` },
  ]

  const allPass = checks.every((c) => c.pass)
  const trimester = Math.ceil((now.getMonth() + 1) / 3)

  return (
    <>
      <Header title="Rapport BRH" />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        <Link href="/tableau-de-bord/rapports"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          <ArrowLeft size={13} />
          Retour aux rapports
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Rapport réglementaire BRH — T{trimester} {now.getFullYear()}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Conformité aux exigences de la Banque de la République d&apos;Haïti pour les coopératives d&apos;épargne et de crédit
            </p>
          </div>
          <button type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: '#C41E3A', color: '#fff' }}>
            <Download size={13} /> Exporter PDF
          </button>
        </div>

        {/* Global status */}
        <div className="rounded-xl p-5 flex items-center gap-4"
          style={{ background: '#0D1018', border: `1px solid ${allPass ? 'rgba(74,222,128,0.35)' : 'rgba(252,211,77,0.35)'}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: allPass ? 'rgba(74,222,128,0.15)' : 'rgba(252,211,77,0.15)' }}>
            {allPass
              ? <CheckCircle2 size={22} style={{ color: '#4ADE80' }} />
              : <AlertCircle size={22} style={{ color: '#FCD34D' }} />
            }
          </div>
          <div className="flex-1">
            <p className="text-base font-bold" style={{ color: allPass ? '#4ADE80' : '#FCD34D' }}>
              {allPass ? 'Conforme aux exigences BRH' : 'Écart(s) à corriger'}
            </p>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {checks.filter((c) => c.pass).length}/{checks.length} ratios prudentiels respectés
            </p>
          </div>
        </div>

        {/* Ratios */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Ratios prudentiels</p>
          </div>
          {checks.map((c, idx) => (
            <div key={c.label}
              className="grid grid-cols-4 gap-4 px-5 py-4 items-center"
              style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>{c.label}</p>
              <p className="text-base font-bold kpi-value" style={{ color: c.pass ? '#4ADE80' : '#FCD34D' }}>{c.value}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Seuil : {c.threshold}</p>
              <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold w-fit"
                style={{
                  background: c.pass ? 'rgba(74,222,128,0.12)' : 'rgba(252,211,77,0.12)',
                  color: c.pass ? '#4ADE80' : '#FCD34D',
                }}>
                {c.pass ? '✓ Conforme' : '⚠ À corriger'}
              </span>
            </div>
          ))}
        </div>

        {/* Structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-5 space-y-3" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Structure du portefeuille</h2>
            {[
              { k: 'Portefeuille brut',   v: formatHTG(loansOutstanding) },
              { k: '· Sain (0 j)',         v: formatHTG(aged.current) },
              { k: '· 1–30 j',             v: formatHTG(aged.bucket_1_30) },
              { k: '· 31–60 j',            v: formatHTG(aged.bucket_31_60) },
              { k: '· 61–90 j',            v: formatHTG(aged.bucket_61_90) },
              { k: '· > 90 j',             v: formatHTG(aged.bucket_90_plus) },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.k}</span>
                <span className="text-sm font-medium kpi-value" style={{ color: 'rgba(255,255,255,0.80)' }}>{r.v}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5 space-y-3" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Structure du passif</h2>
            {[
              { k: 'Dépôts membres',      v: formatHTG(memberDeposits) },
              { k: 'Comptes opérationnels', v: formatHTG(wallets) },
              { k: 'Capital libéré',      v: formatHTG(paidInCapital) },
              { k: 'Total actifs',         v: formatHTG(totalAssets) },
              { k: 'Membres actifs',       v: String(activeMembers) },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.k}</span>
                <span className="text-sm font-medium kpi-value" style={{ color: 'rgba(255,255,255,0.80)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Note : ce rapport est une auto-évaluation interne. Les seuils sont indicatifs ; consultez la circulaire BRH en vigueur pour les valeurs réglementaires exactes. L&apos;export PDF sera disponible prochainement.
        </p>
      </div>
    </>
  )
}
