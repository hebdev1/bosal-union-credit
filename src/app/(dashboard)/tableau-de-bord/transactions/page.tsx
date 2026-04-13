import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/Header'
import { PageShell, DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { formatHTG, formatUSD, formatDate } from '@/lib/formatters'

export const metadata: Metadata = { title: 'Transactions' }

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Virement', adjustment: 'Ajustement',
}

export default async function TransactionsPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, transaction_type, amount, motif, reference, status, created_at, accounts(account_number, currency, members(first_name, last_name))')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows = transactions ?? []
  const deposits    = rows.filter((t: any) => t.transaction_type === 'deposit').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const withdrawals = rows.filter((t: any) => t.transaction_type === 'withdrawal').reduce((s: number, t: any) => s + Number(t.amount), 0)

  return (
    <>
      <Header title="Transactions" />
      <PageShell
        title="Transactions"
        description={`${rows.length} transaction${rows.length !== 1 ? 's' : ''} récentes`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total opérations', value: rows.length },
            { label: 'Dépôts', value: rows.filter((t: any) => t.transaction_type === 'deposit').length },
            { label: 'Montant dépôts', value: formatHTG(deposits) },
            { label: 'Montant retraits', value: formatHTG(withdrawals) },
          ].map(k => (
            <div key={k.label} className="rounded-xl px-5 py-4"
              style={{ background: '#111318', border: '1px solid #252A36' }}>
              <p className="text-xl font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.95)' }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        <DataCard>
          {rows.length === 0 ? (
            <EmptyState title="Aucune transaction" />
          ) : (
            <Table headers={['Référence', 'Type', 'Membre', 'Compte', 'Montant', 'Motif', 'Statut', 'Date']}>
              {rows.map((t: any) => {
                const acc = t.accounts
                const member = acc?.members
                const isCredit = t.transaction_type === 'deposit'
                return (
                  <TR key={t.id}>
                    <TD mono>{t.reference ?? t.id.slice(0, 8).toUpperCase()}</TD>
                    <TD><StatusBadge value={t.transaction_type} /></TD>
                    <TD>
                      {member ? `${member.first_name} ${member.last_name}` : '—'}
                    </TD>
                    <TD mono>{acc?.account_number ?? '—'}</TD>
                    <TD>
                      <span className="font-semibold kpi-value"
                        style={{ color: isCredit ? '#4ADE80' : '#F87171' }}>
                        {isCredit ? '+' : '-'}
                        {acc?.currency === 'USD' ? formatUSD(Number(t.amount)) : formatHTG(Number(t.amount))}
                      </span>
                    </TD>
                    <TD>{t.motif ?? '—'}</TD>
                    <TD><StatusBadge value={t.status ?? 'completed'} /></TD>
                    <TD>{formatDate(t.created_at)}</TD>
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
