import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard } from '@/components/dashboard/ui/DataTable'

export const metadata: Metadata = { title: 'Paramètres' }

export default async function ParametresPage() {
  const supabase = await createClient()

  const [settingsRes, agentsRes, coopRes] = await Promise.allSettled([
    supabase.from('app_settings').select('category, key, label, value, description, input_type').order('category').order('key'),
    supabase.from('agents').select('id, name, role, email, phone, status').order('role'),
    supabase.from('cooperatives').select('*').limit(1).single(),
  ])

  const settings  = settingsRes.status === 'fulfilled'  ? (settingsRes.value.data ?? [])  : []
  const agents    = agentsRes.status === 'fulfilled'     ? (agentsRes.value.data ?? [])    : []
  const coop      = coopRes.status === 'fulfilled'       ? (coopRes.value.data as any)     : null

  // Group settings by category
  const grouped = settings.reduce((acc: Record<string, any[]>, s: any) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const ROLE_LABELS: Record<string, string> = { admin: 'Administrateur', manager: 'Gestionnaire', cashier: 'Caissier' }
  const STATUS_CFG: Record<string, { color: string; bg: string }> = {
    active:    { color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'  },
    suspended: { color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
    pending:   { color: '#FCD34D', bg: 'rgba(234,179,8,0.10)'  },
  }

  return (
    <>
      <Header title="Paramètres" />
      <PageShell title="Paramètres" description="Configuration de la coopérative et gestion des agents">

        {/* Cooperative info */}
        {coop && (
          <section aria-label="Informations coopérative">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>Coopérative</h3>
            <DataCard>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
                style={{ divideColor: '#252A36' } as React.CSSProperties}>
                {[
                  { label: 'Nom', value: coop.name },
                  { label: 'Adresse', value: coop.address ?? '—' },
                  { label: 'Téléphone', value: coop.phone ?? '—' },
                ].map(f => (
                  <div key={f.label} className="px-5 py-4" style={{ borderColor: '#252A36' }}>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.label}</p>
                    <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.value}</p>
                  </div>
                ))}
              </div>
            </DataCard>
          </section>
        )}

        {/* Agents */}
        <section aria-label="Agents">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
            Agents ({agents.length})
          </h3>
          <DataCard>
            <div className="divide-y">
              {agents.map((a: any) => {
                const statusCfg = STATUS_CFG[a.status] ?? STATUS_CFG.pending
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5"
                    style={{ borderTop: '1px solid #1a1f2e' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: '#C41E3A20', color: '#C41E3A' }} aria-hidden="true">
                      {a.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.88)' }}>{a.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{a.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: 'rgba(196,30,58,0.12)', color: '#E8314F' }}>
                        {ROLE_LABELS[a.role] ?? a.role}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </DataCard>
        </section>

        {/* App settings by category */}
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category} aria-label={`Paramètres : ${category}`}>
            <h3 className="text-sm font-semibold mb-3 capitalize" style={{ color: 'rgba(255,255,255,0.80)' }}>
              {category.replace(/_/g, ' ')}
            </h3>
            <DataCard>
              <div className="divide-y">
                {(items as any[]).map((s: any) => (
                  <div key={s.key} className="flex items-center justify-between gap-4 px-5 py-3.5"
                    style={{ borderTop: '1px solid #1a1f2e' }}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
                        {s.label ?? s.key}
                      </p>
                      {s.description && (
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>{s.description}</p>
                      )}
                    </div>
                    <span className="font-mono text-sm flex-shrink-0 rounded px-2 py-0.5"
                      style={{ background: '#0F1117', color: 'rgba(255,255,255,0.70)', border: '1px solid #252A36' }}>
                      {JSON.stringify(s.value)}
                    </span>
                  </div>
                ))}
              </div>
            </DataCard>
          </section>
        ))}
      </PageShell>
    </>
  )
}
