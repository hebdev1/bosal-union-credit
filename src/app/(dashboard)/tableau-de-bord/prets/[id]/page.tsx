import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, UserCircle2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { StatusBadge } from '@/components/dashboard/ui/DataTable'
import { formatHTG, formatDate } from '@/lib/formatters'
import { amortizationSchedule } from '@/lib/finance/interest'
import { LoanScheduleClient, type RepaymentRecord } from '@/components/dashboard/forms/LoanScheduleClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('loans').select('loan_number').eq('id', id).single()
  return { title: data?.loan_number ? `Prêt ${data.loan_number}` : 'Prêt' }
}

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: loan } = await supabase
    .from('loans')
    .select(`
      id, loan_number, principal_amount, interest_rate, duration_months,
      monthly_payment, total_amount_due, amount_paid, status, purpose,
      created_at, disbursed_at, due_date, member_id, account_id,
      members(id, first_name, last_name, member_number, phone, email),
      accounts(id, account_number, balance, currency)
    `)
    .eq('id', id)
    .single()

  if (!loan) notFound()

  // Fetch payments (transactions) tied to this loan's account where motif references loan
  const { data: paymentsRaw } = await supabase
    .from('transactions')
    .select('id, amount, created_at, motif, reference, status, transaction_type')
    .eq('account_id', loan.account_id)
    .order('created_at', { ascending: true })

  const payments = (paymentsRaw ?? []).filter(
    (p) => (p.motif ?? '').toLowerCase().includes('prêt') || (p.motif ?? '').toLowerCase().includes('pret'),
  )

  // Fetch existing monthly repayments (one row per installment_no)
  const { data: repaymentsRaw } = await supabase
    .from('loan_repayments')
    .select('installment_no, amount_paid, amount_due, due_date, paid_at, status')
    .eq('loan_id', loan.id)
    .order('installment_no', { ascending: true })
  const repayments: RepaymentRecord[] = (repaymentsRaw ?? []).map((r) => ({
    installment_no: r.installment_no as number,
    amount_paid: r.amount_paid != null ? Number(r.amount_paid) : null,
    amount_due:  r.amount_due  != null ? Number(r.amount_due)  : null,
    due_date:    (r.due_date as string | null) ?? null,
    paid_at:     (r.paid_at as string | null) ?? null,
    status:      (r.status as string | null) ?? null,
  }))

  // Generate amortization schedule from loan terms — interest rate is already in %
  const principal = Number(loan.principal_amount)
  const annualRate = Number(loan.interest_rate)
  const schedule = amortizationSchedule(principal, annualRate, loan.duration_months)

  // Base date for due-date computation: disbursed_at if available, else created_at
  const baseDate = (loan.disbursed_at as string | null) ?? (loan.created_at as string | null) ?? new Date().toISOString()

  const amountPaid = Number(loan.amount_paid ?? 0)
  const totalDue = Number(loan.total_amount_due)
  const remaining = Math.max(totalDue - amountPaid, 0)
  const progress = totalDue > 0 ? Math.round((amountPaid / totalDue) * 100) : 0

  const member = loan.members
  const account = loan.accounts

  return (
    <>
      <Header title={`Prêt ${loan.loan_number}`} />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        <Link
          href="/tableau-de-bord/prets"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ArrowLeft size={13} />
          Retour aux prêts
        </Link>

        {/* Hero card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  {loan.loan_number}
                </h1>
                <StatusBadge value={loan.status ?? 'pending'} />
                {member && (
                  <Link
                    href={`/tableau-de-bord/membres/${member.id}`}
                    title="Voir le profil de l'emprunteur"
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-125"
                    style={{
                      background: 'rgba(196,30,58,0.12)',
                      color: '#C41E3A',
                      border: '1px solid rgba(196,30,58,0.30)',
                    }}
                  >
                    <UserCircle2 size={12} aria-hidden />
                    Profil emprunteur
                    <ExternalLink size={10} aria-hidden style={{ opacity: 0.7 }} />
                  </Link>
                )}
              </div>
              {member && (
                <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  <Link
                    href={`/tableau-de-bord/membres/${member.id}`}
                    className="font-medium hover:underline"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    {member.first_name} {member.last_name}
                  </Link>
                  <span style={{ color: 'rgba(255,255,255,0.30)' }}> · </span>
                  <span className="kpi-value" style={{ color: 'rgba(255,255,255,0.55)' }}>{member.member_number}</span>
                </p>
              )}
              {loan.purpose && (
                <p className="text-xs mt-2 max-w-md" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {loan.purpose}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold kpi-value" style={{ color: '#C41E3A' }}>
                {formatHTG(principal)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Capital · {Number(loan.interest_rate).toFixed(2)}% / {loan.duration_months} mois
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Remboursé : <span className="font-semibold kpi-value" style={{ color: '#4ADE80' }}>{formatHTG(amountPaid)}</span>
              </span>
              <span className="text-xs kpi-value" style={{ color: 'rgba(255,255,255,0.55)' }}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress >= 80 ? '#4ADE80' : progress >= 40 ? '#FCD34D' : '#C41E3A' }} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {[
              { label: 'Mensualité', value: formatHTG(Number(loan.monthly_payment)) },
              { label: 'Total dû', value: formatHTG(totalDue) },
              { label: 'Restant', value: formatHTG(remaining), color: remaining > 0 ? '#FCD34D' : '#4ADE80' },
              { label: 'Échéance', value: formatDate(loan.due_date) },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4" style={{ background: '#0D1018' }}>
                <p className="text-base font-bold kpi-value" style={{ color: s.color ?? 'rgba(255,255,255,0.88)' }}>{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Two-col: member + account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {member && (
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Emprunteur</h2>
              {[
                { label: 'Nom', value: `${member.first_name} ${member.last_name}` },
                { label: 'N° Membre', value: member.member_number },
                { label: 'Téléphone', value: member.phone ?? '—' },
                { label: 'Email', value: member.email ?? '—' },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.label}</span>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>{f.value}</span>
                </div>
              ))}
              <Link
                href={`/tableau-de-bord/membres/${member.id}`}
                className="block text-xs text-center py-2 rounded-lg transition-colors mt-2"
                style={{ background: 'rgba(196,30,58,0.10)', color: '#C41E3A' }}
              >
                Voir le profil membre →
              </Link>
            </div>
          )}

          {account && (
            <div className="rounded-xl p-5 space-y-3" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Compte associé</h2>
              {[
                { label: 'N° Compte', value: account.account_number },
                { label: 'Solde', value: formatHTG(Number(account.balance)) },
                { label: 'Devise', value: account.currency },
                { label: 'Décaissé le', value: loan.disbursed_at ? formatDate(loan.disbursed_at) : '—' },
              ].map((f) => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.label}</span>
                  <span className="text-sm font-medium kpi-value" style={{ color: 'rgba(255,255,255,0.80)' }}>{f.value}</span>
                </div>
              ))}
              <Link
                href={`/tableau-de-bord/comptes/${account.id}`}
                className="block text-xs text-center py-2 rounded-lg transition-colors mt-2"
                style={{ background: 'rgba(196,30,58,0.10)', color: '#C41E3A' }}
              >
                Voir le compte →
              </Link>
            </div>
          )}
        </div>

        {/* Amortization schedule with editable monthly payments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Échéancier ({schedule.length} versements)
            </h2>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Saisissez le montant versé à chaque mois — Entrée ou ✓ pour enregistrer
            </p>
          </div>
          <LoanScheduleClient
            loanId={loan.id}
            schedule={schedule}
            repayments={repayments}
            baseDate={baseDate}
            loanStatus={loan.status ?? null}
          />
        </section>

        {/* Payments recorded */}
        {payments.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Paiements enregistrés ({payments.length})
            </h2>
            <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div className="grid grid-cols-4 gap-4 px-5 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.04)' }}>
                {['Date', 'Montant', 'Référence', 'Statut'].map((h) => (
                  <p key={h} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</p>
                ))}
              </div>
              {payments.map((p, idx) => (
                <div key={p.id}
                  className="grid grid-cols-4 gap-4 px-5 py-3 items-center"
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{formatDate(p.created_at ?? '')}</p>
                  <p className="text-sm font-semibold kpi-value" style={{ color: '#4ADE80' }}>{formatHTG(Number(p.amount))}</p>
                  <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>{p.reference ?? '—'}</p>
                  <StatusBadge value={p.status ?? 'pending'} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
