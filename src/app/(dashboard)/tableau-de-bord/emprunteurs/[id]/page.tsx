import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, FileCheck, FileX, UserCircle2, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { CreateLoanModal } from '@/components/dashboard/forms/CreateLoanModal'
import { LoanStatusSelect } from '@/components/dashboard/forms/LoanStatusSelect'
import { LoanScheduleClient, type RepaymentRecord } from '@/components/dashboard/forms/LoanScheduleClient'
import { AdjustLoanForm } from '@/components/dashboard/forms/AdjustLoanForm'
import { formatHTG, formatDate } from '@/lib/formatters'
import { amortizationSchedule } from '@/lib/finance/interest'
import { isFinalLoanStatus, finalLoanStatusLabel } from '@/lib/loans/finality'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('members').select('first_name, last_name').eq('id', id).single()
  return { title: data ? `Profil emprunteur · ${data.first_name} ${data.last_name}` : 'Profil emprunteur' }
}

export default async function BorrowerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  /* ── Member ───────────────────────────────────────────────────────────── */
  const { data: member } = await supabase
    .from('members')
    .select(`
      id, first_name, last_name, member_number, phone, email,
      profession, monthly_income, status, created_at, photo_url
    `)
    .eq('id', id)
    .single()

  if (!member) notFound()

  /* ── Loans + accounts in parallel ─────────────────────────────────────── */
  const [loansRes, accountsRes, allActiveAccountsRes, activeMembersRes] = await Promise.all([
    supabase
      .from('loans')
      .select(`
        id, loan_number, principal_amount, interest_rate, duration_months,
        monthly_payment, total_amount_due, amount_paid, status, purpose,
        created_at, disbursed_at, due_date, account_id,
        accounts(id, account_number, currency)
      `)
      .eq('member_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('accounts')
      .select('id, account_number, account_type, balance, currency, status')
      .eq('member_id', id)
      .order('created_at', { ascending: false }),

    // For the "Nouveau prêt" modal — every active account in the coop
    supabase
      .from('accounts')
      .select('id, account_number, currency, account_type, member_id')
      .eq('status', 'active')
      .order('account_number', { ascending: true }),

    // For the "Nouveau prêt" modal — every active member in the coop
    supabase
      .from('members')
      .select('id, first_name, last_name, member_number')
      .eq('status', 'active')
      .order('last_name', { ascending: true }),
  ])

  const loans          = loansRes.data ?? []
  const accounts       = accountsRes.data ?? []
  const allAccounts    = (allActiveAccountsRes.data ?? []) as Array<{
    id: string; account_number: string; currency: string; account_type: string; member_id: string
  }>
  const activeMembers  = (activeMembersRes.data ?? []) as Array<{
    id: string; first_name: string; last_name: string; member_number: string
  }>

  /* ── Fetch all repayments for this member's loans in one round-trip ───── */
  const loanIds = loans.map(l => l.id)
  const { data: repaymentsRaw } = loanIds.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any)
        .from('loan_repayments')
        .select('loan_id, installment_no, amount_paid, amount_due, due_date, paid_at, status')
        .in('loan_id', loanIds)
        .order('installment_no', { ascending: true })
    : { data: [] as Array<Record<string, unknown>> }

  // Index repayments by loan_id
  const repaymentsByLoan = new Map<string, RepaymentRecord[]>()
  for (const r of (repaymentsRaw ?? []) as Array<Record<string, unknown>>) {
    const loanKey = r.loan_id as string
    const arr = repaymentsByLoan.get(loanKey) ?? []
    arr.push({
      installment_no: r.installment_no as number,
      amount_paid:    r.amount_paid != null ? Number(r.amount_paid) : null,
      amount_due:     r.amount_due  != null ? Number(r.amount_due)  : null,
      due_date:       (r.due_date as string | null) ?? null,
      paid_at:        (r.paid_at as string | null) ?? null,
      status:         (r.status as string | null) ?? null,
    })
    repaymentsByLoan.set(loanKey, arr)
  }

  /* ── Aggregate KPIs ───────────────────────────────────────────────────── */
  const totalBorrowed = loans.reduce((s, l) => s + Number(l.principal_amount ?? 0), 0)
  const totalRepaid   = loans.reduce((s, l) => s + Number(l.amount_paid       ?? 0), 0)
  const totalDue      = loans.reduce((s, l) => s + Number(l.total_amount_due  ?? 0), 0)
  const remaining     = Math.max(totalDue - totalRepaid, 0)
  const activeCount   = loans.filter(l => l.status === 'active').length
  const pendingCount  = loans.filter(l => l.status === 'pending').length
  const sealedCount   = loans.filter(l => isFinalLoanStatus(l.status ?? null)).length

  const initials = `${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`.toUpperCase()
  const memberStatus = (member.status ?? 'pending') as 'active' | 'suspended' | 'closed' | 'pending'
  const isMemberActive = memberStatus === 'active'

  /* ── Sort loans: active → pending → sealed ────────────────────────────── */
  const sortedLoans = [...loans].sort((a, b) => {
    const score = (s: string | null) =>
      isFinalLoanStatus(s) ? 2 : s === 'pending' ? 1 : 0
    return score(a.status ?? null) - score(b.status ?? null)
  })

  return (
    <>
      <Header title={`${member.first_name} ${member.last_name}`} />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        {/* Back link */}
        <Link
          href="/tableau-de-bord/prets"
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ArrowLeft size={13} />
          Retour aux prêts
        </Link>

        {/* Hero — borrower identity + KPIs */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                style={{ background: 'rgba(196,30,58,0.15)', color: '#C41E3A' }}>
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {member.first_name} {member.last_name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: 'rgba(196,30,58,0.12)',
                      color: '#C41E3A',
                      border: '1px solid rgba(196,30,58,0.30)',
                    }}>
                    <UserCircle2 size={11} aria-hidden /> Profil emprunteur
                  </span>
                  {isMemberActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
                      <FileCheck size={11} /> Membre actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: 'rgba(252,211,77,0.12)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.25)' }}>
                      <FileX size={11} /> {memberStatus}
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  N° <span className="kpi-value">{member.member_number}</span>
                  <span style={{ color: 'rgba(255,255,255,0.30)' }}> · </span>
                  Membre depuis {formatDate(member.created_at ?? '')}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px] flex-wrap"
                  style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {member.phone   && <span>📞 {member.phone}</span>}
                  {member.email   && <span>✉ {member.email}</span>}
                  {member.profession && <span>💼 {member.profession}</span>}
                </div>
              </div>
            </div>

            {/* CTA stack */}
            <div className="flex flex-col gap-2 items-start sm:items-end">
              <CreateLoanModal members={activeMembers} accounts={allAccounts} />
              <Link
                href={`/tableau-de-bord/membres/${member.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 h-9 text-xs font-medium transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.65)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                Voir profil membre complet →
              </Link>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            {[
              { label: 'Total emprunté',  value: formatHTG(totalBorrowed), color: '#C41E3A' },
              { label: 'Total remboursé', value: formatHTG(totalRepaid),   color: '#4ADE80' },
              { label: 'Restant dû',      value: formatHTG(remaining),     color: remaining > 0 ? '#FCD34D' : '#4ADE80' },
              { label: 'Prêts actifs',    value: `${activeCount}${pendingCount > 0 ? ` + ${pendingCount} en attente` : ''}`, color: activeCount > 0 ? '#FCD34D' : 'rgba(255,255,255,0.60)' },
              { label: 'Prêts soldés',    value: String(sealedCount),       color: 'rgba(255,255,255,0.70)' },
            ].map(s => (
              <div key={s.label} className="px-5 py-4" style={{ background: '#0D1018' }}>
                <p className="text-base font-bold kpi-value" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accounts strip */}
        {accounts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Comptes du membre ({accounts.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts.map(a => (
                <Link key={a.id} href={`/tableau-de-bord/comptes/${a.id}`}
                  className="rounded-xl p-4 transition-colors hover:bg-white/[0.02]"
                  style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>{a.account_number}</p>
                    <StatusBadge value={a.status ?? 'active'} />
                  </div>
                  <p className="text-base font-bold kpi-value" style={{ color: '#4ADE80' }}>
                    {formatHTG(Number(a.balance))} <span className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>{a.currency}</span>
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{a.account_type}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Loan history — one card per loan, fully expanded */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
                Historique de prêts ({loans.length})
              </h2>
            </div>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Statuts, ajustements et versements — tout dans cette page
            </p>
          </div>

          {loans.length === 0 ? (
            <div className="rounded-xl"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <EmptyState
                title="Aucun prêt"
                description='Cliquez sur "Nouveau prêt" pour ouvrir le premier dossier de cet emprunteur.'
              />
            </div>
          ) : (
            <div className="space-y-4">
              {sortedLoans.map(loan => {
                const principal     = Number(loan.principal_amount ?? 0)
                const annualRate    = Number(loan.interest_rate ?? 0)
                const durationMonths = loan.duration_months ?? 0
                const totalAmountDue = Number(loan.total_amount_due ?? 0)
                const paid          = Number(loan.amount_paid ?? 0)
                const monthlyPay    = Number(loan.monthly_payment ?? 0)
                const pct           = totalAmountDue > 0
                  ? Math.min(100, Math.round((paid / totalAmountDue) * 100))
                  : 0
                const sealed        = isFinalLoanStatus(loan.status ?? null)
                const isPending     = loan.status === 'pending'
                const barColor      = pct >= 100 ? '#4ADE80' : pct >= 50 ? '#FCD34D' : '#C41E3A'
                const account       = loan.accounts
                const repayments    = repaymentsByLoan.get(loan.id) ?? []
                const baseDate      = (loan.disbursed_at as string | null)
                                    ?? (loan.created_at as string | null)
                                    ?? new Date().toISOString()
                const hasAnyRepayment = repayments.length > 0
                const canAdjust       = isPending && !hasAnyRepayment
                const schedule        = amortizationSchedule(principal, annualRate, durationMonths)

                return (
                  <article key={loan.id}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: '#0D1018',
                      border: `1px solid ${sealed ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.09)'}`,
                    }}>

                    {/* Loan header */}
                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {sealed && <Lock size={11} aria-hidden style={{ color: '#4ADE80', opacity: 0.8 }} />}
                          <Link
                            href={`/tableau-de-bord/prets/${loan.id}`}
                            className="text-base font-bold kpi-value hover:underline"
                            style={{ color: 'rgba(255,255,255,0.95)' }}
                          >
                            {loan.loan_number}
                          </Link>
                          <LoanStatusSelect loanId={loan.id} currentStatus={loan.status ?? 'pending'} />
                          {sealed && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
                              {finalLoanStatusLabel(loan.status ?? null)} · irréversible
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
                          {loan.purpose ?? <span style={{ color: 'rgba(255,255,255,0.30)' }}>Sans objet renseigné</span>}
                          {account && (
                            <>
                              <span style={{ color: 'rgba(255,255,255,0.20)' }}> · </span>
                              <Link href={`/tableau-de-bord/comptes/${account.id}`}
                                className="font-mono hover:underline"
                                style={{ color: 'rgba(255,255,255,0.55)' }}>
                                {account.account_number}
                              </Link>
                              <span style={{ color: 'rgba(255,255,255,0.30)' }}> ({account.currency})</span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold kpi-value" style={{ color: '#C41E3A' }}>
                          {formatHTG(principal)}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                          {annualRate.toFixed(2)}% · {durationMonths} mois · mensualité {formatHTG(monthlyPay)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar — auto-updating */}
                    <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center justify-between mb-1.5 text-[11px]">
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                          Remboursé : <span className="font-semibold kpi-value" style={{ color: '#4ADE80' }}>{formatHTG(paid)}</span>
                          <span style={{ color: 'rgba(255,255,255,0.30)' }}> / {formatHTG(totalAmountDue)}</span>
                        </span>
                        <span className="kpi-value font-semibold" style={{ color: barColor }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[10px]"
                        style={{ color: 'rgba(255,255,255,0.40)' }}>
                        <span>Échéance finale {formatDate(loan.due_date)}</span>
                        <span>Décaissé : {loan.disbursed_at ? formatDate(loan.disbursed_at) : '—'}</span>
                      </div>
                    </div>

                    {/* Adjust form (pending + no repayments) */}
                    {canAdjust && (
                      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <AdjustLoanForm
                          loanId={loan.id}
                          initialPrincipal={principal}
                          initialInterestRate={annualRate}
                          initialDurationMonths={durationMonths}
                          initialPurpose={loan.purpose ?? null}
                        />
                      </div>
                    )}

                    {/* Inline schedule with payment entry */}
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                          Échéancier ({schedule.length} versements)
                        </h3>
                        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                          Saisissez chaque paiement reçu — la barre de progression se met à jour automatiquement
                        </p>
                      </div>
                      <LoanScheduleClient
                        loanId={loan.id}
                        schedule={schedule}
                        repayments={repayments}
                        baseDate={baseDate}
                        loanStatus={loan.status ?? null}
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
