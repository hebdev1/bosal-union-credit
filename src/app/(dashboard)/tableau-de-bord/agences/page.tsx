import type { Metadata } from 'next'
import { Building2, MapPin, Phone, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { EmptyState, StatusBadge } from '@/components/dashboard/ui/DataTable'
import { formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Agences' }

export default async function BranchesPage() {
  const supabase = await createClient()

  const { data: branches } = await supabase
    .from('branches')
    .select(`
      id, name, address, phone, status, created_at,
      manager_agent_id,
      agents!branches_manager_agent_id_fkey(id, name, email, role)
    `)
    .order('created_at', { ascending: false })

  const rows = branches ?? []

  return (
    <>
      <Header title="Agences" />

      <div className="px-6 py-6 space-y-6 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Réseau d&apos;agences
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Gérez vos points de service et leurs responsables ({rows.length})
            </p>
          </div>
          <button type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            style={{ background: '#C41E3A', color: '#fff' }}>
            <Building2 size={13} /> Ajouter une agence
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <EmptyState title="Aucune agence" description="Créez votre première agence pour commencer à gérer votre réseau." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((b) => {
              const manager = Array.isArray(b.agents) ? b.agents[0] : b.agents
              return (
                <div key={b.id} className="rounded-xl p-5 space-y-4"
                  style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: 'rgba(196,30,58,0.15)', color: '#C41E3A' }}>
                        <Building2 size={16} />
                      </div>
                      <h3 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        {b.name}
                      </h3>
                    </div>
                    <StatusBadge value={b.status ?? 'active'} />
                  </div>

                  <div className="space-y-2">
                    {b.address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{b.address}</p>
                      </div>
                    )}
                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>{b.phone}</p>
                      </div>
                    )}
                    {manager && (
                      <div className="flex items-center gap-2">
                        <User size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                          {manager.name} <span style={{ color: 'rgba(255,255,255,0.35)' }}>· {manager.role}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                      Ouverte le {formatDate(b.created_at ?? '')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
