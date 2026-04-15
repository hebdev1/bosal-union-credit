'use client'
import * as React from 'react'
import { DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Virement', adjustment: 'Ajustement',
}

type Tx = {
  id: string
  transaction_type: string
  amount: number
  motif: string | null
  reference: string | null
  status: string | null
  created_at: string
  accounts: { account_number: string; currency: string; members: { first_name: string; last_name: string } | null } | null
}

interface Props {
  transactions: Tx[]
}

function formatHTG(n: number) {
  return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}
function formatDate(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

const TABS = [
  { key: 'all',        label: 'Tout',        color: 'rgba(255,255,255,0.70)' },
  { key: 'deposit',    label: 'Dépôts',      color: '#4ADE80' },
  { key: 'withdrawal', label: 'Retraits',    color: '#F87171' },
  { key: 'transfer',   label: 'Virements',   color: '#60A5FA' },
  { key: 'adjustment', label: 'Ajustements', color: '#FCD34D' },
]

export function TransactionsClient({ transactions }: Props) {
  const [activeTab, setActiveTab] = React.useState('all')
  const [search, setSearch] = React.useState('')

  const filtered = React.useMemo(() => {
    let rows = transactions
    if (activeTab !== 'all') rows = rows.filter(t => t.transaction_type === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(t =>
        (t.reference ?? '').toLowerCase().includes(q) ||
        (t.motif ?? '').toLowerCase().includes(q) ||
        (t.accounts?.account_number ?? '').toLowerCase().includes(q) ||
        (t.accounts?.members
          ? `${t.accounts.members.first_name} ${t.accounts.members.last_name}`.toLowerCase().includes(q)
          : false)
      )
    }
    return rows
  }, [transactions, activeTab, search])

  const tabCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length }
    for (const t of transactions) {
      counts[t.transaction_type] = (counts[t.transaction_type] ?? 0) + 1
    }
    return counts
  }, [transactions])

  return (
    <div className="space-y-4">
      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1 flex-wrap"
          style={{ background: '#111318', border: '1px solid #252A36' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: active ? tab.color : 'rgba(255,255,255,0.38)',
                }}
              >
                {tab.label}
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: active ? `${tab.color}20` : 'rgba(255,255,255,0.05)',
                    color: active ? tab.color : 'rgba(255,255,255,0.30)',
                  }}>
                  {tabCounts[tab.key] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Chercher référence, membre, compte…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-xl px-4 h-9 text-sm outline-none"
          style={{
            background: '#111318',
            border: '1px solid #252A36',
            color: 'rgba(255,255,255,0.75)',
            minWidth: 0,
          }}
        />
      </div>

      {/* Table */}
      <DataCard>
        {filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Aucun résultat' : 'Aucune transaction'}
            description={search ? `Aucune transaction ne correspond à "${search}"` : undefined}
          />
        ) : (
          <Table headers={['Référence', 'Type', 'Membre', 'Compte', 'Montant', 'Motif', 'Statut', 'Date']}>
            {filtered.map(t => {
              const acc    = t.accounts
              const member = acc?.members
              const isCredit = t.transaction_type === 'deposit'
              return (
                <TR key={t.id}>
                  <TD mono>{t.reference ?? t.id.slice(0, 8).toUpperCase()}</TD>
                  <TD>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        background: isCredit ? 'rgba(34,197,94,0.10)' : t.transaction_type === 'withdrawal' ? 'rgba(239,68,68,0.10)' : t.transaction_type === 'transfer' ? 'rgba(59,130,246,0.10)' : 'rgba(234,179,8,0.10)',
                        color: isCredit ? '#4ADE80' : t.transaction_type === 'withdrawal' ? '#F87171' : t.transaction_type === 'transfer' ? '#60A5FA' : '#FCD34D',
                      }}>
                      {TYPE_LABELS[t.transaction_type] ?? t.transaction_type}
                    </span>
                  </TD>
                  <TD>
                    {member
                      ? <span style={{ color: 'rgba(255,255,255,0.85)' }}>{member.first_name} {member.last_name}</span>
                      : '—'
                    }
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

      {filtered.length > 0 && (
        <p className="text-xs text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
