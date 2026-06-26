import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { CreateMemberModal } from '@/components/dashboard/forms/CreateMemberModal'
import { MembresClient, type MemberRow } from '@/components/dashboard/forms/MembresClient'

export const metadata: Metadata = { title: 'Membres' }

export default async function MembresPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('members')
    .select('id, member_number, first_name, last_name, phone, email, profession, status, created_at, accounts(id, account_type, balance, currency, status)')
    .order('created_at', { ascending: false })

  const rows = (members ?? []) as unknown as MemberRow[]
  const total    = rows.length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actifs   = rows.filter((m: any) => m.status === 'active').length
  const inactifs = total - actifs

  return (
    <>
      <Header title="Membres" />
      <PageShell
        title="Membres"
        description={`${total} membre${total !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${inactifs} inactif${inactifs !== 1 ? 's' : ''}`}
        action={<CreateMemberModal />}
      >
        {/* KPI strip — based on full dataset, not filtered view */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total membres', value: total },
            { label: 'Actifs', value: actifs },
            { label: 'Inactifs / Suspendus', value: inactifs },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Searchable table */}
        <MembresClient rows={rows} />
      </PageShell>
    </>
  )
}
