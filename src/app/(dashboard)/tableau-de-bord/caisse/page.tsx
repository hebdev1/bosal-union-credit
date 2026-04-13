import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, EmptyState } from '@/components/dashboard/ui/DataTable'
import { Vault } from 'lucide-react'
import { formatHTG, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Caisse — Vault' }

export default async function CaissePage() {
  const supabase = await createClient()

  const [vaultRes, closingsRes] = await Promise.allSettled([
    supabase.from('cash_vault').select('*').limit(1).single(),
    supabase
      .from('daily_closings')
      .select('id, closing_date, opening_balance, closing_balance, total_deposits, total_withdrawals, total_loan_disbursements, total_loan_repayments, total_exchange_in, total_exchange_out, total_fees_collected, status, notes, closed_at')
      .order('closing_date', { ascending: false })
      .limit(30),
  ])

  const vault    = vaultRes.status === 'fulfilled'    ? (vaultRes.value.data as any)    : null
  const closings = closingsRes.status === 'fulfilled' ? (closingsRes.value.data ?? []) : []

  const current  = Number(vault?.current_balance ?? 0)
  const opening  = Number(vault?.opening_balance  ?? 0)
  const variation = current - opening
  const variationPct = opening > 0 ? ((variation / opening) * 100).toFixed(1) : '—'

  return (
    <>
      <Header title="Caisse — Vault" />
      <PageShell title="Caisse (Cash Vault)" description="Solde de la caisse principale et historique des clôtures journalières">

        {/* Vault balance card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 rounded-xl p-6 flex flex-col gap-4"
            style={{ background: '#111318', border: '1px solid #C41E3A33' }}>
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

          <div className="rounded-xl p-6 space-y-4" style={{ background: '#111318', border: '1px solid #252A36' }}>
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Solde d'ouverture</p>
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

        {/* Daily closings */}
        <section aria-label="Clôtures journalières récentes">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>Clôtures journalières récentes</h3>
          <DataCard>
            {closings.length === 0 ? (
              <EmptyState icon={Vault} title="Aucune clôture enregistrée" description="Les clôtures journalières apparaîtront ici." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #252A36' }}>
                      {['Date', 'Solde ouv.', 'Dépôts', 'Retraits', 'Décais. prêts', 'Remb. prêts', 'Change in', 'Change out', 'Frais', 'Solde clôt.', 'Statut'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                          style={{ color: 'rgba(255,255,255,0.30)', background: '#0F1117' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closings.map((c: any) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #1a1f2e' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {new Date(c.closing_date).toLocaleDateString('fr-HT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        {[c.opening_balance, c.total_deposits, c.total_withdrawals, c.total_loan_disbursements,
                          c.total_loan_repayments, c.total_exchange_in, c.total_exchange_out, c.total_fees_collected].map((v, i) => (
                          <td key={i} className="px-4 py-3 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            {formatHTG(Number(v ?? 0))}
                          </td>
                        ))}
                        <td className="px-4 py-3 font-semibold font-mono text-xs" style={{ color: 'rgba(255,255,255,0.90)' }}>
                          {formatHTG(Number(c.closing_balance ?? 0))}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const cfg: Record<string, { color: string; bg: string; label: string }> = {
                              open:      { color: '#4ADE80', bg: 'rgba(34,197,94,0.10)',  label: 'Ouvert'   },
                              closed:    { color: '#F87171', bg: 'rgba(239,68,68,0.10)',  label: 'Fermé'    },
                              validated: { color: '#60A5FA', bg: 'rgba(59,130,246,0.10)', label: 'Validé'   },
                            }
                            const s = cfg[c.status] ?? { color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)', label: c.status }
                            return (
                              <span className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{ background: s.bg, color: s.color }}>{s.label}</span>
                            )
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataCard>
        </section>
      </PageShell>
    </>
  )
}
