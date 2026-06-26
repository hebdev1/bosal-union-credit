'use client'
import * as React from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { DataCard, Table, TR, TD, EmptyState } from '@/components/dashboard/ui/DataTable'
import { MemberStatusPicker } from '@/components/dashboard/forms/MemberStatusPicker'
import { formatDate } from '@/lib/formatters'

interface AccountLite {
  id: string
  account_type: string
  balance: number | null
  currency: string | null
  status: string | null
}

export interface MemberRow {
  id: string
  member_number: string | null
  first_name:    string
  last_name:     string
  phone:         string | null
  email:         string | null
  profession:    string | null
  status:        string | null
  created_at:    string | null
  accounts:      AccountLite[] | null
}

interface Props {
  rows: MemberRow[]
}

function normalize(s: string | null | undefined): string {
  return (s ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    // Strip diacritics so "André" matches "andre"
    .replace(/[̀-ͯ]/g, '')
}

export function MembresClient({ rows }: Props) {
  const [query, setQuery] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = normalize(query).trim()
    if (!q) return rows
    return rows.filter(m => {
      const haystack = [
        m.member_number,
        m.first_name,
        m.last_name,
        `${m.first_name} ${m.last_name}`,
        m.phone,
        m.email,
        m.profession,
        m.status,
      ].map(normalize).join(' ')
      return haystack.includes(q)
    })
  }, [rows, query])

  return (
    <section aria-label="Liste des membres">
      {/* Search bar */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
          Liste des membres
        </h3>
        <div className="relative flex items-center" style={{ minWidth: 280 }}>
          <Search size={13} aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher : nom, n° membre, téléphone, email…"
            aria-label="Rechercher un membre"
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
          <EmptyState title="Aucun membre" description="Les membres apparaîtront ici une fois créés." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucun résultat"
            description={`Aucun membre ne correspond à « ${query} ».`}
          />
        ) : (
          <Table headers={['N° Membre', 'Nom complet', 'Téléphone', 'Email', 'Profession', 'Comptes', 'Statut', 'Inscription']}>
            {filtered.map(m => (
              <TR key={m.id}>
                <TD mono>
                  <Link href={`/tableau-de-bord/membres/${m.id}`}
                    className="hover:underline"
                    style={{ color: 'rgba(255,255,255,0.85)' }}>
                    {m.member_number ?? '—'}
                  </Link>
                </TD>
                <TD>
                  <Link href={`/tableau-de-bord/membres/${m.id}`}
                    className="font-medium hover:underline"
                    style={{ color: 'rgba(255,255,255,0.90)' }}>
                    {m.first_name} {m.last_name}
                  </Link>
                </TD>
                <TD mono>{m.phone ?? '—'}</TD>
                <TD mono>{m.email ?? '—'}</TD>
                <TD>{m.profession ?? '—'}</TD>
                <TD>
                  <span className="text-sm kpi-value" style={{ color: 'rgba(255,255,255,0.70)' }}>
                    {m.accounts?.length ?? 0}
                  </span>
                </TD>
                <TD>
                  <MemberStatusPicker
                    memberId={m.id}
                    current={(m.status ?? 'pending') as 'active' | 'suspended' | 'closed' | 'pending'}
                  />
                </TD>
                <TD>{m.created_at ? formatDate(m.created_at) : '—'}</TD>
              </TR>
            ))}
          </Table>
        )}
      </DataCard>
    </section>
  )
}
