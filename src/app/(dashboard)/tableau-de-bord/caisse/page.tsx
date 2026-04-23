import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { Vault } from 'lucide-react'
import { formatHTG, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Caisse — Vault' }

export default async function CaissePage() {
  const supabase = await createClient()

  const vaultRes = await supabase.from('cash_vault').select('*').limit(1).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vault = (vaultRes.data as any) ?? null

  const current  = Number(vault?.current_balance ?? 0)
  const opening  = Number(vault?.opening_balance  ?? 0)
  const variation = current - opening
  const variationPct = opening > 0 ? ((variation / opening) * 100).toFixed(1) : '—'

  return (
    <>
      <Header title="Caisse — Vault" />
      <PageShell title="Caisse (Cash Vault)" description="Solde de la caisse principale">

        {/* Vault balance card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 rounded-xl p-6 flex flex-col gap-4"
            style={{ background: '#0D1018', border: '1px solid #C41E3A33' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(196,30,58,0.15)' }} aria-hidden="true">
                <Vault size={20} style={{ color: '#C41E3A' }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Solde actuel</p>
                <p className="text-3xl font-bold kpi-value mt-0.5" style={{ color: 'rgba(255,255,255,0.97)', letterSpacing: '-0.03em' }}>
                  {formatHTG(current)}
                </p>
              </div>
            </div>
            {vault?.last_updated && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Dernière mise à jour : {formatDate(vault.last_updated)}
              </p>
            )}
          </div>

          <div className="rounded-xl p-6 space-y-4" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Solde de référence</p>
              <p className="text-lg font-semibold kpi-value mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {formatHTG(opening)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Variation</p>
              <p className="text-lg font-semibold kpi-value mt-0.5"
                style={{ color: variation >= 0 ? '#4ADE80' : '#F87171' }}>
                {variation >= 0 ? '+' : ''}{formatHTG(variation)}
                {variationPct !== '—' && <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.40)' }}>({variationPct}%)</span>}
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    </>
  )
}
