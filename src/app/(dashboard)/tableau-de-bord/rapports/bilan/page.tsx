import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { formatHTG } from '@/lib/formatters'
import { balanceSheet } from '@/lib/accounting/reports'

export const metadata: Metadata = { title: 'Bilan' }

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className={bold ? 'text-sm font-semibold' : 'text-sm'} style={{ color: bold ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)' }}>{label}</span>
      <span className={`kpi-value ${bold ? 'text-base font-bold' : 'text-sm font-medium'}`} style={{ color: bold ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.80)' }}>{formatHTG(value)}</span>
    </div>
  )
}

export default async function BalanceSheetReport() {
  const supabase = await createClient()

  const [accountsRes, loansRes, sharesRes] = await Promise.allSettled([
    supabase.from('accounts').select('account_type, balance'),
    supabase.from('loans').select('total_amount_due, amount_paid, status'),
    supabase.from('shares').select('quantity, unit_value, total_value, status').limit(10000),
  ])

  const accounts = accountsRes.status === 'fulfilled' ? (accountsRes.value.data ?? []) : []
  const loans = loansRes.status === 'fulfilled' ? (loansRes.value.data ?? []) : []
  const shares = sharesRes.status === 'fulfilled' ? (sharesRes.value.data ?? []) : []

  const cashOnHand = 0
  const bankAccounts = accounts
    .filter((a) => a.account_type === 'wallet')
    .reduce((s, a) => s + Number(a.balance ?? 0), 0)
  const loansOutstanding = loans
    .filter((l) => l.status !== 'completed' && l.status !== 'rejected' && l.status !== 'defaulted')
    .reduce((s, l) => s + (Number(l.total_amount_due) - Number(l.amount_paid ?? 0)), 0)

  const memberDeposits = accounts
    .filter((a) => a.account_type === 'savings' || a.account_type === 'deposit')
    .reduce((s, a) => s + Number(a.balance ?? 0), 0)

  const paidInCapital = shares
    .filter((s) => s.status === 'paid' || s.status === 'active')
    .reduce((s, x) => s + Number(x.total_value ?? Number(x.quantity) * Number(x.unit_value)), 0)

  const bs = balanceSheet({
    cashOnHand,
    bankAccounts,
    loansOutstanding,
    memberDeposits,
    paidInCapital,
    retainedEarnings: 0,
  })

  return (
    <>
      <Header title="Bilan comptable" />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        <Link href="/tableau-de-bord/rapports"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          <ArrowLeft size={13} />
          Retour aux rapports
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>Bilan au {new Date().toLocaleDateString('fr-FR')}</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Situation financière de la coopérative — Actif = Passif + Capitaux propres
            </p>
          </div>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: bs.balanced ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
              color: bs.balanced ? '#4ADE80' : '#F87171',
              border: `1px solid ${bs.balanced ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
            }}>
            {bs.balanced ? '✓ Équilibré' : `⚠ Écart ${formatHTG(bs.variance)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Actifs */}
          <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <h2 className="text-sm font-semibold mb-3 pb-3" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              Actifs
            </h2>
            <Row label="Trésorerie" value={bs.assets.cash} />
            <Row label="Comptes bancaires" value={bs.assets.bank} />
            <Row label="Prêts en cours" value={bs.assets.loans} />
            <Row label="Autres actifs" value={bs.assets.other} />
            <div className="mt-3 pt-3" style={{ borderTop: '2px solid rgba(196,30,58,0.25)' }}>
              <Row label="Total actifs" value={bs.assets.total} bold />
            </div>
          </div>

          {/* Passifs + Capitaux */}
          <div className="space-y-4">
            <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <h2 className="text-sm font-semibold mb-3 pb-3" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                Passifs
              </h2>
              <Row label="Dépôts membres" value={bs.liabilities.deposits} />
              <Row label="Emprunts externes" value={bs.liabilities.borrowings} />
              <Row label="Autres passifs" value={bs.liabilities.other} />
              <div className="mt-3 pt-3" style={{ borderTop: '2px solid rgba(255,255,255,0.15)' }}>
                <Row label="Total passifs" value={bs.liabilities.total} bold />
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <h2 className="text-sm font-semibold mb-3 pb-3" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                Capitaux propres
              </h2>
              <Row label="Capital libéré (parts sociales)" value={bs.equity.capital} />
              <Row label="Résultats reportés" value={bs.equity.retained} />
              <div className="mt-3 pt-3" style={{ borderTop: '2px solid rgba(255,255,255,0.15)' }}>
                <Row label="Total capitaux" value={bs.equity.total} bold />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
