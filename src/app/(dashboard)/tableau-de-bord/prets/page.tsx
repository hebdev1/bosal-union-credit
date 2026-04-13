import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { formatHTG, formatDate, formatPercent } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Prêts' }

export default async function PretsPage() {
  const supabase = await createClient()

  const { data: loans } = await supabase
    .from('loans')
    .select('id, loan_number, principal_amount, interest_rate, duration_months, monthly_payment, total_amount_due, amount_paid, status, purpose, created_at, disbursed_at, due_date, members(first_name, last_name, member_number)')
    .order('created_at', { ascending: false })

  const rows = loans ?? []
  const actifs    = rows.filter((l: any) => l.status === 'active')
  const pending   = rows.filter((l: any) => l.status === 'pending')
  const totalActif = actifs.reduce((s: number, l: any) => s + Number(l.principal_amount ?? 0) - Number(l.amount_paid ?? 0), 0)

  return (
    <>
      <Header title="Prêts" />
      <PageShell
        title="Prêts"
        description={`${rows.length} prêt${rows.length !== 1 ? 's' : ''} · ${actifs.length} actif${actifs.length !== 1 ? 's' : ''} · ${pending.length} en attente`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total prêts', value: rows.length },
            { label: 'Actifs', value: actifs.length },
            { label: 'En attente', value: pending.length },
            { label: 'Capital restant dû', value: formatHTG(totalActif) },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        <DataCard>
          {rows.length === 0 ? (
            <EmptyState title="Aucun prêt" description="Les prêts apparaîtront ici une fois créés." />
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
                            style={{ width: `${rembPercent}%`, background: rembPercent >= 80 ? '#4ADE80' : rembPercent >= 40 ? '#FCD34D' : '#C41E3A' }} />
                        </div>
                        <span className="text-xs kpi-value" style={{ color: 'rgba(255,255,255,0.55)' }}>{rembPercent}%</span>
                      </div>
                    </TD>
                    <TD>{l.purpose ?? '—'}</TD>
                    <TD><StatusBadge value={l.status} /></TD>
                    <TD>{formatDate(l.created_at)}</TD>
                  </TR>
                )
              })}
            </Table>
          )}
        </DataCard>
      </PageShell>
    </>
  )
}
