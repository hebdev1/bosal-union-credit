import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { CreateAccountModal } from '@/components/dashboard/forms/CreateAccountModal'
import { CloseAccountButton } from '@/components/dashboard/forms/CloseAccountButton'
import { formatHTG, formatUSD, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Comptes' }

export default async function ComptesPage() {
  const supabase = await createClient()

  const [accountsRes, membersRes, plansRes] = await Promise.all([
    (supabase as any)
      .from('accounts')
      .select('id, account_number, account_type, balance, currency, status, created_at, savings_product_id, members(first_name, last_name, member_number), savings_products(name, interest_rate, interest_period)')
      .order('created_at', { ascending: false }),
    supabase
      .from('members')
      .select('id, first_name, last_name, member_number')
      .eq('status', 'active')
      .order('first_name'),
    (supabase as any)
      .from('savings_products')
      .select('id, name, interest_rate, interest_period, min_balance')
      .eq('is_active', true)
      .order('name'),
  ])

  const rows    = (accountsRes.data ?? []) as any[]
  const members = (membersRes.data ?? []) as { id: string; first_name: string; last_name: string; member_number: string }[]
  const plans   = (plansRes.data ?? []) as { id: string; name: string; interest_rate: number; interest_period: string }[]

  const totalHTG = rows.filter((a: any) => a.currency === 'HTG').reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0)
  const totalUSD = rows.filter((a: any) => a.currency === 'USD').reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0)
  const actifs   = rows.filter((a: any) => a.status === 'active').length
  const fermes   = rows.filter((a: any) => a.status === 'closed').length

  return (
    <>
      <Header title="Comptes" />
      <PageShell
        title="Comptes"
        description={`${rows.length} compte${rows.length !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${fermes} fermé${fermes !== 1 ? 's' : ''}`}
        action={<CreateAccountModal members={members} plans={plans} />}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total comptes',  value: rows.length },
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

        {/* Plans disponibles */}
        {plans.length > 0 && (
          <section aria-label="Plans d'épargne disponibles">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Plans d&apos;épargne disponibles
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {plans.map((p: any) => {
                const PERIOD: Record<string, string> = { daily: 'quotidien', monthly: 'mensuel', quarterly: 'trimestriel', yearly: 'annuel' }
                const linked = rows.filter((a: any) => a.savings_product_id === p.id).length
                return (
                  <div key={p.id} className="rounded-xl px-4 py-3.5 space-y-1.5"
                    style={{ background: '#111318', border: '1px solid #252A36' }}>
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>{p.name}</p>
                    <p className="text-xs" style={{ color: '#34D399' }}>
                      {Number(p.interest_rate).toFixed(2)}% {PERIOD[p.interest_period] ?? p.interest_period}
                    </p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {linked} compte{linked !== 1 ? 's' : ''} associé{linked !== 1 ? 's' : ''}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Table des comptes */}
        <DataCard>
          {rows.length === 0 ? (
            <EmptyState title="Aucun compte" description="Les comptes apparaîtront ici une fois créés." />
          ) : (
            <Table headers={['N° Compte', 'Membre', 'Type', 'Plan', 'Solde', 'Devise', 'Statut', 'Ouvert le', 'Action', '']}>
              {rows.map((a: any) => {
                const member = a.members
                const plan   = a.savings_products
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
                      {plan ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: 'rgba(52,211,153,0.10)', color: '#34D399' }}>
                          {plan.name}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12 }}>—</span>
                      )}
                    </TD>
                    <TD>
                      <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.90)' }}>
                        {a.currency === 'USD' ? formatUSD(Number(a.balance)) : formatHTG(Number(a.balance))}
                      </span>
                    </TD>
                    <TD mono>{a.currency}</TD>
                    <TD><StatusBadge value={a.status} /></TD>
                    <TD>{formatDate(a.created_at)}</TD>
                    <TD>
                      {a.status !== 'closed' ? (
                        <CloseAccountButton accountId={a.id} accountNumber={a.account_number} />
                      ) : (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>Fermé</span>
                      )}
                    </TD>
                    <TD>
                      <Link
                        href={`/tableau-de-bord/comptes/${a.id}`}
                        className="inline-flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', border: '1px solid #252A36' }}
                      >
                        Voir profil →
                      </Link>
                    </TD>
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
