import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { CreateAccountModal } from '@/components/dashboard/forms/CreateAccountModal'
import { formatHTG, formatUSD, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Comptes' }

const TYPE_LABELS: Record<string, string> = {
  savings: 'Épargne', deposit: 'Dépôt', wallet: 'Wallet',
}

export default async function ComptesPage() {
  const supabase = await createClient()

  const [{ data: accounts }, { data: allMembers }] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, account_number, account_type, balance, currency, status, created_at, members(first_name, last_name, member_number)')
      .order('created_at', { ascending: false }),
    supabase
      .from('members')
      .select('id, first_name, last_name, member_number')
      .eq('status', 'active')
      .order('first_name'),
  ])

  const rows = accounts ?? []
  const members = (allMembers ?? []) as { id: string; first_name: string; last_name: string; member_number: string }[]
  const totalHTG = rows.filter((a: any) => a.currency === 'HTG').reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0)
  const totalUSD = rows.filter((a: any) => a.currency === 'USD').reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0)
  const actifs = rows.filter((a: any) => a.status === 'active').length

  return (
    <>
      <Header title="Comptes" />
      <PageShell
        title="Comptes"
        description={`${rows.length} compte${rows.length !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''}`}
        action={<CreateAccountModal members={members} />}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total comptes', value: rows.length },
            { label: 'Comptes actifs', value: actifs },
            { label: 'Solde HTG total', value: formatHTG(totalHTG) },
            { label: 'Solde USD total', value: formatUSD(totalUSD) },
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
            <EmptyState title="Aucun compte" description="Les comptes apparaîtront ici une fois créés." />
          ) : (
            <Table headers={['N° Compte', 'Membre', 'Type', 'Solde', 'Devise', 'Statut', 'Ouvert le']}>
              {rows.map((a: any) => {
                const member = a.members
                return (
                  <TR key={a.id}>
                    <TD mono>{a.account_number}</TD>
                    <TD>
                      {member ? (
                        <div>
                          <p className="font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {member.member_number}
                          </p>
                        </div>
                      ) : '—'}
                    </TD>
                    <TD><StatusBadge value={a.account_type} /></TD>
                    <TD>
                      <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.90)' }}>
                        {a.currency === 'USD' ? formatUSD(Number(a.balance)) : formatHTG(Number(a.balance))}
                      </span>
                    </TD>
                    <TD mono>{a.currency}</TD>
                    <TD><StatusBadge value={a.status} /></TD>
                    <TD>{formatDate(a.created_at)}</TD>
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
