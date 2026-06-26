'use client'
import * as React from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { DataCard, Table, TR, TD, StatusBadge, EmptyState } from '@/components/dashboard/ui/DataTable'
import { CloseAccountButton } from '@/components/dashboard/forms/CloseAccountButton'
import { formatHTG, formatUSD, formatDate } from '@/lib/formatters'

interface MemberLite {
  first_name:    string
  last_name:     string
  member_number: string | null
}

interface SavingsProductLite {
  name:            string
  interest_rate:   number
  interest_period: string
}

export interface AccountRow {
  id:                 string
  account_number:     string
  account_type:       string
  balance:            number | null
  currency:           string | null
  status:             string | null
  created_at:         string | null
  savings_product_id: string | null
  members:            MemberLite | null
  savings_products:   SavingsProductLite | null
}

interface Props {
  rows: AccountRow[]
}

function normalize(s: string | null | undefined): string {
  return (s ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function ComptesClient({ rows }: Props) {
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = normalize(query).trim()
    if (!q) return rows
    return rows.filter(a => {
      const member = a.members
      const haystack = [
        a.account_number,
        a.account_type,
        a.currency,
        a.status,
        member?.first_name,
        member?.last_name,
        member ? `${member.first_name} ${member.last_name}` : '',
        member?.member_number,
        a.savings_products?.name,
      ].map(normalize).join(' ')
      return haystack.includes(q)
    })
  }, [rows, query])

  return (
    <section aria-label="Liste des comptes">
      {/* Search bar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
          Liste des comptes
        </h3>
        <div className="relative flex items-center" style={{ minWidth: 280 }}>
          <Search size={13} aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher : n° compte, membre, type, plan…"
            aria-label="Rechercher un compte"
            className="w-full h-9 pl-9 pr-9 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.88)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Counter */}
      {query && (
        <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour
          <span className="ml-1 px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>
            {query}
          </span>
        </p>
      )}

      <DataCard>
        {rows.length === 0 ? (
          <EmptyState title="Aucun compte" description="Les comptes apparaîtront ici une fois créés." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucun résultat"
            description={`Aucun compte ne correspond à « ${query} ».`}
          />
        ) : (
          <Table headers={['N° Compte', 'Membre', 'Type', 'Plan', 'Solde', 'Devise', 'Statut', 'Ouvert le', 'Action', '']}>
            {filtered.map(a => {
              const member = a.members
              const plan   = a.savings_products
              const currency = a.currency ?? 'HTG'
              return (
                <TR key={a.id}>
                  <TD mono>{a.account_number}</TD>
                  <TD>
                    {member ? (
                      <div>
                        <p className="font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {member.member_number}
                        </p>
                      </div>
                    ) : '—'}
                  </TD>
                  <TD><StatusBadge value={a.account_type} /></TD>
                  <TD>
                    {plan ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: 'rgba(52,211,153,0.10)', color: '#34D399' }}>
                        {plan.name}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12 }}>—</span>
                    )}
                  </TD>
                  <TD>
                    <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.90)' }}>
                      {currency === 'USD' ? formatUSD(Number(a.balance ?? 0)) : formatHTG(Number(a.balance ?? 0))}
                    </span>
                  </TD>
                  <TD mono>{currency}</TD>
                  <TD><StatusBadge value={a.status ?? 'pending'} /></TD>
                  <TD>{a.created_at ? formatDate(a.created_at) : '—'}</TD>
                  <TD>
                    {a.status !== 'closed' ? (
                      <CloseAccountButton accountId={a.id} accountNumber={a.account_number} />
                    ) : (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>Fermé</span>
                    )}
                  </TD>
                  <TD>
                    <Link
                      href={`/tableau-de-bord/comptes/${a.id}`}
                      className="inline-flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.09)' }}
                    >
                      Voir profil →
                    </Link>
                  </TD>
                </TR>
              )
            })}
          </Table>
        )}
      </DataCard>
    </section>
  )
}
