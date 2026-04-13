import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, EmptyState } from '@/components/dashboard/ui/DataTable'
import { BookCheck } from 'lucide-react'
import { formatHTG, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Clôture journée' }

export default async function CloturePage() {
  const supabase = await createClient()

  const { data: closings } = await supabase
    .from('daily_closings')
    .select('*')
    .order('closing_date', { ascending: false })
    .limit(60)

  const rows = (closings ?? []) as any[]
  const todayOpen = rows.find((c: any) => c.status === 'open')
  const lastClosed = rows.find((c: any) => c.status === 'closed' || c.status === 'validated')

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    open:      { label: 'Ouvert',  color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'  },
    closed:    { label: 'Fermé',   color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
    validated: { label: 'Validé',  color: '#60A5FA', bg: 'rgba(59,130,246,0.10)' },
  }

  return (
    <>
      <Header title="Clôture journée" />
      <PageShell title="Clôture journalière" description="Bilan quotidien des opérations de la caisse">

        {/* Today's status */}
        {todayOpen ? (
          <div className="rounded-xl p-6 flex items-center gap-4"
            style={{ background: '#111318', border: '1px solid rgba(74,222,128,0.30)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(74,222,128,0.12)' }} aria-hidden="true">
              <BookCheck size={20} style={{ color: '#4ADE80' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
                Journée en cours — {new Date(todayOpen.closing_date).toLocaleDateString('fr-HT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Solde d'ouverture : {formatHTG(Number(todayOpen.opening_balance))}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-5 flex items-center gap-3"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <BookCheck size={18} style={{ color: '#FCD34D' }} aria-hidden="true" />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Aucune journée ouverte. La dernière clôture date du{' '}
              {lastClosed ? new Date(lastClosed.closing_date).toLocaleDateString('fr-HT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}.
            </p>
          </div>
        )}

        {/* Summary of last closed day */}
        {lastClosed && (
          <section aria-label="Résumé dernière clôture">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>
              Dernière clôture — {new Date(lastClosed.closing_date).toLocaleDateString('fr-HT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total dépôts',      value: formatHTG(Number(lastClosed.total_deposits ?? 0)),             color: '#4ADE80' },
                { label: 'Total retraits',    value: formatHTG(Number(lastClosed.total_withdrawals ?? 0)),          color: '#F87171' },
                { label: 'Décaissements',     value: formatHTG(Number(lastClosed.total_loan_disbursements ?? 0)),   color: '#FCD34D' },
                { label: 'Remboursements',    value: formatHTG(Number(lastClosed.total_loan_repayments ?? 0)),      color: '#60A5FA' },
                { label: 'Change entrant',    value: formatHTG(Number(lastClosed.total_exchange_in ?? 0)),          color: '#34D399' },
                { label: 'Change sortant',    value: formatHTG(Number(lastClosed.total_exchange_out ?? 0)),         color: '#F87171' },
                { label: 'Frais collectés',   value: formatHTG(Number(lastClosed.total_fees_collected ?? 0)),       color: '#A78BFA' },
                { label: 'Solde clôture',     value: formatHTG(Number(lastClosed.closing_balance ?? 0)),            color: 'rgba(255,255,255,0.90)' },
              ].map(k => (
                <div key={k.label} className="rounded-xl px-4 py-3"
                  style={{ background: '#111318', border: '1px solid #252A36' }}>
                  <p className="text-base font-semibold kpi-value" style={{ color: k.color }}>{k.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{k.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* History */}
        <section aria-label="Historique des clôtures">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.80)' }}>Historique</h3>
          <DataCard>
            {rows.length === 0 ? (
              <EmptyState title="Aucune clôture enregistrée" description="Les clôtures journalières apparaîtront ici." />
            ) : (
              <div className="divide-y" style={{ borderColor: '#1a1f2e' }}>
                {rows.map((c: any) => {
                  const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.open
                  const net = Number(c.closing_balance ?? 0) - Number(c.opening_balance ?? 0)
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-4 transition-colors"
                      style={{ borderTop: '1px solid #1a1f2e' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                          {new Date(c.closing_date).toLocaleDateString('fr-HT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
                          Ouv. {formatHTG(Number(c.opening_balance))} → Clôt. {formatHTG(Number(c.closing_balance))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold kpi-value" style={{ color: net >= 0 ? '#4ADE80' : '#F87171' }}>
                          {net >= 0 ? '+' : ''}{formatHTG(net)}
                        </p>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </DataCard>
        </section>
      </PageShell>
    </>
  )
}
