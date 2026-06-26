import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { CreateAccountModal } from '@/components/dashboard/forms/CreateAccountModal'
import { ComptesClient, type AccountRow } from '@/components/dashboard/forms/ComptesClient'
import { formatHTG, formatUSD } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Comptes' }

export default async function ComptesPage() {
  const supabase = await createClient()

  const [accountsRes, membersRes, plansRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('accounts')
      .select('id, account_number, account_type, balance, currency, status, created_at, savings_product_id, members(first_name, last_name, member_number), savings_products(name, interest_rate, interest_period)')
      .order('created_at', { ascending: false }),
    supabase
      .from('members')
      .select('id, first_name, last_name, member_number')
      .eq('status', 'active')
      .order('first_name'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('savings_products')
      .select('id, name, interest_rate, interest_period, min_balance')
      .eq('is_active', true)
      .order('name'),
  ])

  const rows    = (accountsRes.data ?? []) as AccountRow[]
  const members = (membersRes.data ?? []) as { id: string; first_name: string; last_name: string; member_number: string }[]
  const plans   = (plansRes.data ?? []) as { id: string; name: string; interest_rate: number; interest_period: string }[]

  const totalHTG = rows.filter(a => a.currency === 'HTG').reduce((s, a) => s + Number(a.balance ?? 0), 0)
  const totalUSD = rows.filter(a => a.currency === 'USD').reduce((s, a) => s + Number(a.balance ?? 0), 0)
  const actifs   = rows.filter(a => a.status === 'active').length
  const fermes   = rows.filter(a => a.status === 'closed').length

  return (
    <>
      <Header title="Comptes" />
      <PageShell
        title="Comptes"
        description={`${rows.length} compte${rows.length !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${fermes} fermé${fermes !== 1 ? 's' : ''}`}
        action={<CreateAccountModal members={members} plans={plans} />}
      >
        {/* KPIs — full dataset */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total comptes',  value: rows.length },
            { label: 'Comptes actifs', value: actifs },
            { label: 'Solde HTG total', value: formatHTG(totalHTG) },
            { label: 'Solde USD total', value: formatUSD(totalUSD) },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
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
              {plans.map(p => {
                const PERIOD: Record<string, string> = { daily: 'quotidien', monthly: 'mensuel', quarterly: 'trimestriel', yearly: 'annuel' }
                const linked = rows.filter(a => a.savings_product_id === p.id).length
                return (
                  <div key={p.id} className="rounded-xl px-4 py-3.5 space-y-1.5"
                    style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
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

        {/* Searchable table */}
        <ComptesClient rows={rows} />
      </PageShell>
    </>
  )
}
