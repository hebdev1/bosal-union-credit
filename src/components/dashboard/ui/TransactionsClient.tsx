'use client'
import * as React from 'react'
import { FileDown, Loader2, Calendar } from 'lucide-react'
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
}
function formatDate(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

type DatePreset = 'today' | '7d' | '30d' | 'all'
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d',    label: '7 jours'    },
  { key: '30d',   label: '30 jours'   },
  { key: 'all',   label: 'Tout'       },
]

function getDateBounds(preset: DatePreset, from: string, to: string): { start: Date | null; end: Date | null } {
  const now = new Date()
  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { start, end }
  }
  if (preset === '7d')  return { start: new Date(Date.now() - 7  * 86400000), end: null }
  if (preset === '30d') return { start: new Date(Date.now() - 30 * 86400000), end: null }
  if (from || to) {
    return {
      start: from ? new Date(from) : null,
      end:   to   ? new Date(to + 'T23:59:59.999') : null,
    }
  }
  return { start: null, end: null }
}

async function exportTransactionsPDF(rows: Tx[]) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297; const L = 12; const R = W - 12

  doc.setFillColor(12, 12, 14)
  doc.rect(0, 0, W, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(196, 30, 58)
  doc.text('HISTORIQUE DES TRANSACTIONS', W / 2, 13, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-HT')} · ${rows.length} transaction(s)`, W / 2, 21, { align: 'center' })

  const deposits    = rows.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + Number(t.amount), 0)
  const withdrawals = rows.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0)
  let y = 36
  const sumItems = [
    { label: 'Dépôts',          value: formatHTG(deposits),              color: [74,222,128]  as [number,number,number] },
    { label: 'Retraits',        value: formatHTG(withdrawals),           color: [248,113,113] as [number,number,number] },
    { label: 'Flux net',        value: formatHTG(deposits - withdrawals), color: deposits >= withdrawals ? [74,222,128] as [number,number,number] : [248,113,113] as [number,number,number] },
    { label: 'Total opérations',value: String(rows.length),              color: [200,200,200] as [number,number,number] },
  ]
  sumItems.forEach((item, i) => {
    const x = L + i * 68
    doc.setFillColor(20, 20, 26)
    doc.roundedRect(x, y - 5, 64, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.setTextColor(...item.color)
    doc.text(item.value, x + 32, y + 2, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(item.label, x + 32, y + 7, { align: 'center' })
  })

  y = 58
  const headers = ['Référence', 'Type', 'Membre', 'Compte', 'Montant', 'Motif', 'Statut', 'Date']
  const colW    = [30, 22, 44, 28, 34, 54, 22, 38]
  doc.setFillColor(18, 18, 24)
  doc.rect(L, y - 4, R - L, 8, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100)
  let cx = L + 2
  headers.forEach((h, i) => { doc.text(h, cx, y); cx += colW[i] })
  y += 6
  rows.forEach((t, idx) => {
    if (y > 192) { doc.addPage(); y = 15 }
    if (idx % 2 === 0) { doc.setFillColor(14, 14, 18); doc.rect(L, y - 3.5, R - L, 7, 'F') }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
    const member   = t.accounts?.members
    const isCredit = t.transaction_type === 'deposit'
    const amtColor: [number,number,number] = isCredit ? [74,222,128] : [248,113,113]
    const vals = [
      t.reference ?? t.id.slice(0, 8).toUpperCase(),
      TYPE_LABELS[t.transaction_type] ?? t.transaction_type,
      member ? `${member.first_name} ${member.last_name}` : '—',
      t.accounts?.account_number ?? '—',
      (isCredit ? '+' : '-') + (t.accounts?.currency === 'USD' ? formatUSD(Number(t.amount)) : formatHTG(Number(t.amount))),
      (t.motif ?? '—').substring(0, 28),
      t.status ?? 'completed',
      formatDate(t.created_at).substring(0, 20),
    ]
    cx = L + 2
    vals.forEach((v, i) => {
      if (i === 4) doc.setTextColor(...amtColor)
      else doc.setTextColor(180, 180, 180)
      doc.text(String(v), cx, y); cx += colW[i]
    })
    y += 7
  })

  doc.setFontSize(7); doc.setTextColor(60, 60, 60)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-HT')} — Bosal Union Crédit`, W / 2, 205, { align: 'center' })
  doc.save(`transactions-${new Date().toISOString().slice(0, 10)}.pdf`)
}

const TYPE_TABS = [
  { key: 'all',        label: 'Tout',        color: 'rgba(255,255,255,0.70)' },
  { key: 'deposit',    label: 'Dépôts',      color: '#4ADE80' },
  { key: 'withdrawal', label: 'Retraits',    color: '#F87171' },
  { key: 'transfer',   label: 'Virements',   color: '#60A5FA' },
  { key: 'adjustment', label: 'Ajustements', color: '#FCD34D' },
]

export function TransactionsClient({ transactions }: Props) {
  const [activeTab,   setActiveTab]   = React.useState('all')
  const [search,      setSearch]      = React.useState('')
  const [datePreset,  setDatePreset]  = React.useState<DatePreset>('today')
  const [dateFrom,    setDateFrom]    = React.useState('')
  const [dateTo,      setDateTo]      = React.useState('')
  const [exporting,   setExporting]   = React.useState(false)

  async function handleExport() {
    setExporting(true)
    await exportTransactionsPDF(filtered)
    setExporting(false)
  }

  function handlePreset(p: DatePreset) { setDatePreset(p); setDateFrom(''); setDateTo('') }
  function handleFrom(v: string)  { setDateFrom(v);  setDatePreset('all') }
  function handleTo(v: string)    { setDateTo(v);    setDatePreset('all') }

  const filtered = React.useMemo(() => {
    let rows = transactions
    // Date filter
    const { start, end } = getDateBounds(datePreset, dateFrom, dateTo)
    if (start || end) {
      rows = rows.filter(t => {
        const d = new Date(t.created_at)
        if (start && d < start) return false
        if (end   && d > end)   return false
        return true
      })
    }
    // Type filter
    if (activeTab !== 'all') rows = rows.filter(t => t.transaction_type === activeTab)
    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(t =>
        (t.reference ?? '').toLowerCase().includes(q) ||
        (t.motif     ?? '').toLowerCase().includes(q) ||
        (t.accounts?.account_number ?? '').toLowerCase().includes(q) ||
        (t.accounts?.members
          ? `${t.accounts.members.first_name} ${t.accounts.members.last_name}`.toLowerCase().includes(q)
          : false)
      )
    }
    return rows
  }, [transactions, activeTab, search, datePreset, dateFrom, dateTo])

  const tabCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length }
    for (const t of transactions) counts[t.transaction_type] = (counts[t.transaction_type] ?? 0) + 1
    return counts
  }, [transactions])

  return (
    <div className="space-y-4">
      {/* Date filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar size={13} style={{ color: 'rgba(255,255,255,0.30)' }} className="flex-shrink-0" />
        <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0"
          style={{ background: '#111318', border: '1px solid #252A36' }}>
          {DATE_PRESETS.map(p => (
            <button key={p.key} type="button" onClick={() => handlePreset(p.key)}
              className="px-3 h-7 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: datePreset === p.key ? 'rgba(255,255,255,0.07)' : 'transparent',
                color:      datePreset === p.key ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
        <input type="date" value={dateFrom} onChange={e => handleFrom(e.target.value)}
          className="h-9 rounded-xl px-3 text-xs outline-none flex-shrink-0"
          style={{ background: '#111318', border: '1px solid #252A36', color: dateFrom ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark', minWidth: 130 }} />
        <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.20)' }}>→</span>
        <input type="date" value={dateTo} onChange={e => handleTo(e.target.value)}
          className="h-9 rounded-xl px-3 text-xs outline-none flex-shrink-0"
          style={{ background: '#111318', border: '1px solid #252A36', color: dateTo ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.30)', colorScheme: 'dark', minWidth: 130 }} />
      </div>

      {/* Type tabs + search + export */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 rounded-xl p-1 flex-wrap"
          style={{ background: '#111318', border: '1px solid #252A36' }}>
          {TYPE_TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color:      active ? tab.color : 'rgba(255,255,255,0.38)',
                }}>
                {tab.label}
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: active ? `${tab.color}20` : 'rgba(255,255,255,0.05)',
                    color:      active ? tab.color : 'rgba(255,255,255,0.30)',
                  }}>
                  {tabCounts[tab.key] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        <input type="text" placeholder="Chercher référence, membre, compte…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 rounded-xl px-4 h-9 text-sm outline-none"
          style={{ background: '#111318', border: '1px solid #252A36', color: 'rgba(255,255,255,0.75)', minWidth: 0 }}
        />

        <button type="button" onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium flex-shrink-0 transition-opacity"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border:     '1px solid #252A36',
            color:      'rgba(255,255,255,0.75)',
            opacity:    (exporting || filtered.length === 0) ? 0.5 : 1,
          }}>
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
          Exporter PDF
        </button>
      </div>

      {/* Table */}
      <DataCard>
        {filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Aucun résultat' : datePreset === 'today' ? "Aucune transaction aujourd'hui" : 'Aucune transaction'}
            description={search
              ? `Aucune transaction ne correspond à "${search}"`
              : datePreset === 'today'
                ? 'Les transactions du jour apparaîtront ici'
                : undefined
            }
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
                        color:      isCredit ? '#4ADE80'               : t.transaction_type === 'withdrawal' ? '#F87171'               : t.transaction_type === 'transfer' ? '#60A5FA'               : '#FCD34D',
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
                    <span className="font-semibold kpi-value" style={{ color: isCredit ? '#4ADE80' : '#F87171' }}>
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
