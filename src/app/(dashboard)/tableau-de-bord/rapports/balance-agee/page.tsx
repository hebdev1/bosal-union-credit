import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { formatHTG } from '@/lib/formatters'
import { agedLoanBalance, par30, type LoanSnapshot } from '@/lib/accounting/reports'

export const metadata: Metadata = { title: 'Balance âgée' }

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000)
}

export default async function AgedBalanceReport() {
  const supabase = await createClient()

  const { data: loans } = await supabase
    .from('loans')
    .select('id, loan_number, principal_amount, total_amount_due, amount_paid, status, due_date, members(first_name, last_name, member_number)')

  const now = new Date()
  const snapshots: (LoanSnapshot & { loan_number: string; memberName: string })[] =
    (loans ?? []).map((l) => {
      const remaining = Number(l.total_amount_due) - Number(l.amount_paid ?? 0)
      const due = new Date(l.due_date)
      const dpd = l.status === 'active' ? Math.max(daysBetween(now, due), 0) : 0
      const member = Array.isArray(l.members) ? l.members[0] : l.members
      return {
        id: l.id,
        outstandingPrincipal: remaining,
        nextDueDate: due,
        daysPastDue: dpd,
        status: (l.status === 'active' ? 'active'
              : l.status === 'completed' ? 'paid_off'
              : l.status === 'defaulted' ? 'defaulted'
              : 'active') as LoanSnapshot['status'],
        loan_number: l.loan_number,
        memberName: member ? `${member.first_name} ${member.last_name}` : '—',
      }
    })

  const bal = agedLoanBalance(snapshots)
  const parRatio = par30(snapshots)

  const buckets = [
    { key: 'current', label: 'À jour (0 j)', value: bal.current, color: '#4ADE80' },
    { key: '1_30',    label: '1–30 j',      value: bal.bucket_1_30, color: '#A3E635' },
    { key: '31_60',   label: '31–60 j',     value: bal.bucket_31_60, color: '#FCD34D' },
    { key: '61_90',   label: '61–90 j',     value: bal.bucket_61_90, color: '#FB923C' },
    { key: '90_plus', label: '> 90 j',      value: bal.bucket_90_plus, color: '#F87171' },
  ]

  return (
    <>
      <Header title="Balance âgée" />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        <Link href="/tableau-de-bord/rapports"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          <ArrowLeft size={13} />
          Retour aux rapports
        </Link>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Portefeuille total</p>
            <p className="text-2xl font-bold mt-2 kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{formatHTG(bal.total)}</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(252,211,77,0.22)' }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>PAR 30</p>
            <p className="text-2xl font-bold mt-2 kpi-value" style={{ color: '#FCD34D' }}>{(parRatio * 100).toFixed(2)}%</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Portefeuille en risque &gt; 30 j</p>
          </div>
          <div className="rounded-xl p-5" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>Prêts actifs</p>
            <p className="text-2xl font-bold mt-2 kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{snapshots.length}</p>
          </div>
        </div>

        {/* Buckets */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.04)' }}>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Répartition par bucket d&apos;ancienneté</p>
          </div>
          <div className="grid grid-cols-5 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {buckets.map((b) => {
              const pct = bal.total > 0 ? (b.value / bal.total) * 100 : 0
              return (
                <div key={b.key} className="px-5 py-4" style={{ background: '#0D1018' }}>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{b.label}</p>
                  <p className="text-base font-bold mt-2 kpi-value" style={{ color: b.color }}>{formatHTG(b.value)}</p>
                  <div className="h-1 mt-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full" style={{ width: `${pct}%`, background: b.color }} />
                  </div>
                  <p className="text-[11px] mt-1 kpi-value" style={{ color: 'rgba(255,255,255,0.40)' }}>{pct.toFixed(1)}%</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail table */}
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Détail ({snapshots.length} prêts)
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div className="grid grid-cols-5 gap-4 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.04)' }}>
              {['Prêt', 'Emprunteur', 'Restant dû', 'Retard', 'Bucket'].map((h) => (
                <p key={h} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</p>
              ))}
            </div>
            {snapshots.map((s, idx) => {
              const bucket = s.daysPastDue <= 0 ? 'À jour'
                : s.daysPastDue <= 30 ? '1–30 j'
                : s.daysPastDue <= 60 ? '31–60 j'
                : s.daysPastDue <= 90 ? '61–90 j'
                : '> 90 j'
              return (
                <div key={s.id}
                  className="grid grid-cols-5 gap-4 px-5 py-3 items-center"
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>{s.loan_number}</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>{s.memberName}</p>
                  <p className="text-sm font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.88)' }}>{formatHTG(s.outstandingPrincipal)}</p>
                  <p className="text-sm kpi-value" style={{ color: s.daysPastDue > 30 ? '#F87171' : 'rgba(255,255,255,0.55)' }}>{s.daysPastDue} j</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{bucket}</p>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
