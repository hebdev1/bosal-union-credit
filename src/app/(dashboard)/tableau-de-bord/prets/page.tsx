import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { CreateLoanModal } from '@/components/dashboard/forms/CreateLoanModal'
import { PretsClient } from '@/components/dashboard/forms/PretsClient'
import { CloseDayButton } from '@/components/dashboard/forms/CloseDayButton'
import { formatHTG } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Prêts' }

export default async function PretsPage() {
  const supabase = await createClient()

  const [loansRes, repaymentsRes, membersRes] = await Promise.all([
    supabase
      .from('loans')
      .select('id, loan_number, principal_amount, interest_rate, duration_months, monthly_payment, total_amount_due, amount_paid, status, purpose, created_at, disbursed_at, due_date, members(first_name, last_name, member_number)')
      .order('created_at', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('loan_repayments')
      .select('id, installment_no, amount_due, amount_paid, due_date, paid_at, status, created_at, loans(loan_number, members(first_name, last_name))')
      .order('created_at', { ascending: false })
      .limit(150),
    supabase
      .from('members')
      .select('id, first_name, last_name, member_number')
      .eq('status', 'active')
      .order('last_name', { ascending: true }),
  ])

  const rows       = (loansRes.data ?? []) as any[]
  const repayments = (repaymentsRes.data ?? []) as any[]
  const members    = (membersRes.data ?? []) as any[]

  const actifs      = rows.filter((l: any) => l.status === 'active')
  const pendingRows = rows.filter((l: any) => l.status === 'pending')
  const totalActif  = actifs.reduce((s: number, l: any) => s + Number(l.principal_amount ?? 0) - Number(l.amount_paid ?? 0), 0)
  const totalRepaid = repayments.filter((r: any) => r.status === 'paid').reduce((s: number, r: any) => s + Number(r.amount_paid ?? 0), 0)
  const lateCount   = repayments.filter((r: any) => r.status === 'late' || r.status === 'missed').length

  return (
    <>
      <Header title="Prêts" />
      <PageShell
        title="Prêts"
        description={`${rows.length} prêt${rows.length !== 1 ? 's' : ''} · ${actifs.length} actif${actifs.length !== 1 ? 's' : ''} · ${pendingRows.length} en attente`}
        action={
          <div className="flex items-center gap-2">
            <CloseDayButton />
            <CreateLoanModal members={members} />
          </div>
        }
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total prêts',        value: rows.length },
            { label: 'Actifs',             value: actifs.length },
            { label: 'Capital restant dû', value: formatHTG(totalActif) },
            { label: 'Total remboursé',    value: formatHTG(totalRepaid) },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        <PretsClient loans={rows} repayments={repayments} lateCount={lateCount} />
      </PageShell>
    </>
  )
}
