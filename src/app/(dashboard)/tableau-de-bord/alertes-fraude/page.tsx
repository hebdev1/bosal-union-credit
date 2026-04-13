import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Alertes fraude' }

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low']

export default async function AlertesFraudePage() {
  const supabase = await createClient()

  const { data: flags } = await supabase
    .from('fraud_flags')
    .select('id, rule_triggered, severity, created_at, transaction_id, transactions(id, transaction_type, amount, created_at, accounts(account_number, members(first_name, last_name)))')
    .order('created_at', { ascending: false })

  const rows = flags ?? []
  const bySeverity = SEVERITY_ORDER.reduce((acc: Record<string, number>, s) => {
    acc[s] = rows.filter((f: any) => f.severity === s).length
    return acc
  }, {})

  const SEVERITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: 'Critique', color: '#F87171', bg: 'rgba(239,68,68,0.12)' },
    high:     { label: 'Élevé',   color: '#FCD34D', bg: 'rgba(245,158,11,0.12)' },
    medium:   { label: 'Moyen',   color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
    low:      { label: 'Faible',  color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' },
  }

  return (
    <>
      <Header title="Alertes fraude" />
      <PageShell
        title="Alertes fraude"
        description={`${rows.length} alerte${rows.length !== 1 ? 's' : ''} détectée${rows.length !== 1 ? 's' : ''}`}
      >
        {/* Severity breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SEVERITY_ORDER.map(s => {
            const cfg = SEVERITY_CFG[s]
            return (
              <div key={s} className="rounded-xl px-5 py-4 flex flex-col gap-2"
                style={{ background: '#111318', border: `1px solid ${cfg.color}30` }}>
                <span className="rounded-full px-2 py-0.5 text-[11px] font-medium self-start"
                  style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                <p className="text-2xl font-bold kpi-value" style={{ color: cfg.color }}>
                  {bySeverity[s] ?? 0}
                </p>
              </div>
            )
          })}
        </div>

        {/* Table */}
        <DataCard>
          {rows.length === 0 ? (
            <EmptyState title="Aucune alerte fraude" description="Toutes les transactions sont conformes." />
          ) : (
            <Table headers={['Sévérité', 'Règle déclenchée', 'Membre', 'Compte', 'Type transaction', 'Montant', 'Date alerte']}>
              {rows.map((f: any) => {
                const tx = f.transactions
                const acc = tx?.accounts
                const member = acc?.members
                const cfg = SEVERITY_CFG[f.severity] ?? SEVERITY_CFG.medium

                return (
                  <TR key={f.id}>
                    <TD>
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </TD>
                    <TD>
                      <span className="font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {f.rule_triggered}
                      </span>
                    </TD>
                    <TD>
                      {member ? `${member.first_name} ${member.last_name}` : '—'}
                    </TD>
                    <TD mono>{acc?.account_number ?? '—'}</TD>
                    <TD>{tx?.transaction_type ?? '—'}</TD>
                    <TD>
                      {tx?.amount ? (
                        <span className="font-semibold kpi-value" style={{ color: '#F87171' }}>
                          {Number(tx.amount).toLocaleString('fr-HT', { minimumFractionDigits: 2 })} HTG
                        </span>
                      ) : '—'}
                    </TD>
                    <TD>{formatDate(f.created_at)}</TD>
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
