import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { CreateLoanModal } from '@/components/dashboard/forms/CreateLoanModal'
import { LoanStatusSelect } from '@/components/dashboard/forms/LoanStatusSelect'
import { formatHTG, formatDate } from '@/lib/formatters'

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
        action={<CreateLoanModal members={members} />}
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

        {/* Liste des prêts */}
        <section aria-label="Liste des prêts">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Liste des prêts
          </h3>
          <DataCard>
            {rows.length === 0 ? (
              <EmptyState
                title="Aucun prêt"
                description='Cliquez sur "Nouveau prêt" pour en créer un.'
              />
            ) : (
              <Table headers={['N° Prêt', 'Membre', 'Capital', 'Taux', 'Durée', 'Mensualité', 'Remboursé', 'Objet', 'Statut', 'Date']}>
                {rows.map((l: any) => {
                  const member = l.members
                  const rembPercent = l.total_amount_due > 0
                    ? Math.round((Number(l.amount_paid ?? 0) / Number(l.total_amount_due)) * 100)
                    : 0
                  return (
                    <TR key={l.id}>
                      <TD mono>{l.loan_number}</TD>
                      <TD>
                        {member ? (
                          <div>
                            <p className="font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
                              {member.first_name} {member.last_name}
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{member.member_number}</p>
                          </div>
                        ) : '—'}
                      </TD>
                      <TD>
                        <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.90)' }}>
                          {formatHTG(Number(l.principal_amount))}
                        </span>
                      </TD>
                      <TD mono>{Number(l.interest_rate).toFixed(1)} %</TD>
                      <TD mono>{l.duration_months} mois</TD>
                      <TD>{formatHTG(Number(l.monthly_payment))}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#252A36' }}>
                            <div className="h-full rounded-full"
                              style={{
                                width: `${rembPercent}%`,
                                background: rembPercent >= 80 ? '#4ADE80' : rembPercent >= 40 ? '#FCD34D' : '#C41E3A',
                              }} />
                          </div>
                          <span className="text-xs kpi-value" style={{ color: 'rgba(255,255,255,0.55)' }}>{rembPercent}%</span>
                        </div>
                      </TD>
                      <TD>{l.purpose ?? '—'}</TD>
                      <TD>
                        <LoanStatusSelect loanId={l.id} currentStatus={l.status} />
                      </TD>
                      <TD>{formatDate(l.created_at)}</TD>
                    </TR>
                  )
                })}
              </Table>
            )}
          </DataCard>
        </section>

        {/* Historique des remboursements */}
        <section aria-label="Historique des remboursements">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Historique des remboursements
            </h3>
            {lateCount > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.20)' }}>
                {lateCount} en retard / manqué{lateCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <DataCard>
            {repayments.length === 0 ? (
              <EmptyState
                title="Aucun remboursement enregistré"
                description="Les échéances apparaîtront ici une fois créées."
              />
            ) : (
              <Table headers={['N° Prêt', 'Membre', 'Échéance', 'Montant dû', 'Montant payé', 'Date échéance', 'Date paiement', 'Statut']}>
                {repayments.map((r: any) => {
                  const loan   = r.loans
                  const member = loan?.members
                  const isLate = r.status === 'late' || r.status === 'missed'
                  return (
                    <TR key={r.id}>
                      <TD mono>{loan?.loan_number ?? '—'}</TD>
                      <TD>
                        {member
                          ? <span style={{ color: 'rgba(255,255,255,0.85)' }}>{member.first_name} {member.last_name}</span>
                          : '—'
                        }
                      </TD>
                      <TD mono>#{r.installment_no}</TD>
                      <TD>
                        <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.80)' }}>
                          {formatHTG(Number(r.amount_due))}
                        </span>
                      </TD>
                      <TD>
                        <span className="font-semibold kpi-value"
                          style={{ color: r.status === 'paid' ? '#4ADE80' : isLate ? '#F87171' : 'rgba(255,255,255,0.60)' }}>
                          {r.amount_paid > 0 ? formatHTG(Number(r.amount_paid)) : '—'}
                        </span>
                      </TD>
                      <TD>{r.due_date  ? formatDate(r.due_date)  : '—'}</TD>
                      <TD>{r.paid_at   ? formatDate(r.paid_at)   : '—'}</TD>
                      <TD>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            background: r.status === 'paid'   ? 'rgba(34,197,94,0.10)'  :
                                        isLate                ? 'rgba(239,68,68,0.10)'  :
                                        'rgba(234,179,8,0.10)',
                            color:      r.status === 'paid'   ? '#4ADE80' :
                                        isLate                ? '#F87171' :
                                        '#FCD34D',
                          }}>
                          {r.status === 'paid'    ? 'Payé'       :
                           r.status === 'late'    ? 'En retard'  :
                           r.status === 'missed'  ? 'Manqué'     :
                           'En attente'}
                        </span>
                      </TD>
                    </TR>
                  )
                })}
              </Table>
            )}
          </DataCard>
        </section>
      </PageShell>
    </>
  )
}
