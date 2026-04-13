import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { Users } from 'lucide-react'
import { formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Membres' }

export default async function MembresPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('members')
    .select('id, member_number, first_name, last_name, phone, email, profession, status, created_at, accounts(id, account_type, balance, currency, status)')
    .order('created_at', { ascending: false })

  const rows = members ?? []
  const total   = rows.length
  const actifs  = rows.filter((m: any) => m.status === 'active').length
  const inactifs = total - actifs

  return (
    <>
      <Header title="Membres" />
      <PageShell
        title="Membres"
        description={`${total} membre${total !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${inactifs} inactif${inactifs !== 1 ? 's' : ''}`}
      >
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total membres', value: total },
            { label: 'Actifs', value: actifs },
            { label: 'Inactifs / Suspendus', value: inactifs },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <DataCard>
          {rows.length === 0 ? (
            <EmptyState icon={Users} title="Aucun membre" description="Les membres apparaîtront ici une fois créés." />
          ) : (
            <Table headers={['N° Membre', 'Nom complet', 'Téléphone', 'Email', 'Profession', 'Comptes', 'Statut', 'Inscription']}>
              {rows.map((m: any) => (
                <TR key={m.id}>
                  <TD mono>{m.member_number}</TD>
                  <TD>
                    <span className="font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
                      {m.first_name} {m.last_name}
                    </span>
                  </TD>
                  <TD mono>{m.phone ?? '—'}</TD>
                  <TD mono>{m.email ?? '—'}</TD>
                  <TD>{m.profession ?? '—'}</TD>
                  <TD>
                    <span className="text-sm kpi-value" style={{ color: 'rgba(255,255,255,0.70)' }}>
                      {(m.accounts as any[])?.length ?? 0}
                    </span>
                  </TD>
                  <TD><StatusBadge value={m.status} /></TD>
                  <TD>{formatDate(m.created_at)}</TD>
                </TR>
              ))}
            </Table>
          )}
        </DataCard>
      </PageShell>
    </>
  )
}
