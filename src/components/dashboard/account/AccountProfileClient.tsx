'use client'
import * as React from 'react'
import { FileDown, Loader2, Search } from 'lucide-react'

/* ── Types ────────────────────────────────────────────────────────────────── */
interface Tx {
  id: string
  transaction_type: string
  amount: number
  motif: string | null
  reference: string | null
  status: string | null
  created_at: string
}

interface Props {
  transactions: Tx[]
  currency: string
}

/* ── Inline formatters ────────────────────────────────────────────────────── */
function fMoney(n: number, currency: string) {
  if (currency === 'USD')
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}
function fDate(d: string) {
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Dépôt', withdrawal: 'Retrait', transfer: 'Virement', adjustment: 'Ajustement',
}
const TYPE_CFG: Record<string, { color: string; bg: string }> = {
  deposit:    { color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'  },
  withdrawal: { color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
  transfer:   { color: '#60A5FA', bg: 'rgba(59,130,246,0.10)' },
  adjustment: { color: '#FCD34D', bg: 'rgba(234,179,8,0.10)'  },
}

const TABS = [
  { key: 'all',        label: 'Tout'        },
  { key: 'deposit',    label: 'Dépôts'      },
  { key: 'withdrawal', label: 'Retraits'    },
  { key: 'adjustment', label: 'Ajustements' },
  { key: 'transfer',   label: 'Virements'   },
]

/* ── PDF export ───────────────────────────────────────────────────────────── */
async function exportAccountPDF(txs: Tx[], currency: string, accountRef: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297; const L = 12; const R = W - 12
  let y = 18

  // Header
  doc.setFillColor(12, 12, 14)
  doc.rect(0, 0, W, 30, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(196, 30, 58)
  doc.text(`RELEVÉ DE COMPTE — ${accountRef}`, W / 2, y, { align: 'center' })
  y += 7
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-HT')} · ${txs.length} opération(s)`, W / 2, y, { align: 'center' })
  y = 40

  // Summary
  const dep = txs.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + Number(t.amount), 0)
  const wit = txs.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0)
  const adj = txs.filter(t => t.transaction_type === 'adjustment').reduce((s, t) => s + Number(t.amount), 0)

  const cards = [
    { label: 'Total dépôts',     value: fMoney(dep, currency),           color: [74,222,128]  as [number,number,number] },
    { label: 'Total retraits',   value: fMoney(wit, currency),           color: [248,113,113] as [number,number,number] },
    { label: 'Flux net',         value: fMoney(dep - wit, currency),     color: dep >= wit ? [74,222,128] as [number,number,number] : [248,113,113] as [number,number,number] },
    { label: 'Ajustements',      value: fMoney(adj, currency),           color: [252,211,77]  as [number,number,number] },
    { label: 'Total opérations', value: String(txs.length),              color: [200,200,200] as [number,number,number] },
  ]
  cards.forEach((c, i) => {
    const x = L + i * 54
    doc.setFillColor(20, 20, 26)
    doc.roundedRect(x, y - 5, 51, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...c.color)
    doc.text(c.value, x + 25, y + 2, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(100, 100, 100)
    doc.text(c.label, x + 25, y + 7, { align: 'center' })
  })
  y += 20

  // Table
  const headers = ['Référence', 'Type', 'Montant', 'Motif', 'Statut', 'Date & Heure']
  const colW    = [38, 26, 38, 80, 24, 60]
  doc.setFillColor(18, 18, 24)
  doc.rect(L, y - 4, R - L, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  let cx = L + 2
  headers.forEach((h, i) => { doc.text(h, cx, y); cx += colW[i] })
  y += 6

  const TYPE_COLORS: Record<string, [number,number,number]> = {
    deposit: [74,222,128], withdrawal: [248,113,113], transfer: [96,165,250], adjustment: [252,211,77]
  }

  txs.forEach((t, idx) => {
    if (y > 192) { doc.addPage(); y = 15 }
    if (idx % 2 === 0) {
      doc.setFillColor(14, 14, 18)
      doc.rect(L, y - 3.5, R - L, 7, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const isCredit = t.transaction_type === 'deposit'
    const vals = [
      t.reference ?? t.id.slice(0, 10).toUpperCase(),
      TYPE_LABELS[t.transaction_type] ?? t.transaction_type,
      (isCredit ? '+' : '-') + fMoney(Number(t.amount), currency),
      (t.motif ?? '—').substring(0, 42),
      t.status ?? 'completed',
      fDate(t.created_at).substring(0, 28),
    ]
    cx = L + 2
    vals.forEach((v, i) => {
      if (i === 1) doc.setTextColor(...(TYPE_COLORS[t.transaction_type] ?? [180,180,180]))
      else if (i === 2) doc.setTextColor(...(isCredit ? [74,222,128] as [number,number,number] : [248,113,113] as [number,number,number]))
      else doc.setTextColor(180, 180, 180)
      doc.text(String(v), cx, y)
      cx += colW[i]
    })
    y += 7
  })

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(7)
    doc.setTextColor(60, 60, 60)
    doc.text(`Relevé compte ${accountRef} · Bosal Union Crédit · Page ${p}/${pages}`, W / 2, 205, { align: 'center' })
  }
  doc.save(`releve-${accountRef}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/* ── Component ────────────────────────────────────────────────────────────── */
export function AccountProfileClient({ transactions, currency }: Props) {
  const [activeTab, setActiveTab]     = React.useState('all')
  const [search, setSearch]           = React.useState('')
  const [exporting, setExporting]     = React.useState(false)

  const filtered = React.useMemo(() => {
    let rows = transactions
    if (activeTab !== 'all') rows = rows.filter(t => t.transaction_type === activeTab)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(t =>
        (t.reference ?? '').toLowerCase().includes(q) ||
        (t.motif     ?? '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [transactions, activeTab, search])

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: transactions.length }
    for (const t of transactions) c[t.transaction_type] = (c[t.transaction_type] ?? 0) + 1
    return c
  }, [transactions])

  async function handleExport() {
    setExporting(true)
    // derive account ref from first reference or use generic
    const ref = transactions[0]?.reference?.slice(0, 10) ?? 'COMPTE'
    await exportAccountPDF(filtered, currency, ref)
    setExporting(false)
  }

  return (
    <div className="space-y-3">

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1 flex-wrap flex-shrink-0"
          style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key
            const cfg = TYPE_CFG[tab.key] ?? { color: 'rgba(255,255,255,0.70)', bg: 'transparent' }
            const activeColor = tab.key === 'all' ? 'rgba(255,255,255,0.85)' : cfg.color
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: active ? (tab.key === 'all' ? 'rgba(255,255,255,0.07)' : cfg.bg) : 'transparent',
                  color: active ? activeColor : 'rgba(255,255,255,0.35)',
                }}
              >
                {tab.label}
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: active ? (tab.key === 'all' ? 'rgba(255,255,255,0.10)' : `${cfg.color}20`) : 'rgba(255,255,255,0.05)',
                    color: active ? activeColor : 'rgba(255,255,255,0.25)',
                  }}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="flex-1 relative min-w-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.30)' }} />
          <input
            type="text"
            placeholder="Chercher référence, motif…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl pl-8 pr-4 h-9 text-sm outline-none"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.75)' }}
          />
        </div>

        {/* Export PDF */}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || filtered.length === 0}
          className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.75)',
            opacity: (exporting || filtered.length === 0) ? 0.5 : 1,
          }}
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
          Relevé PDF
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {search ? `Aucun résultat pour "${search}"` : 'Aucune transaction dans cette catégorie'}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_110px_130px_2fr_90px_160px] gap-4 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.04)' }}>
              {['Référence', 'Type', 'Montant', 'Motif', 'Statut', 'Date'].map(h => (
                <p key={h} className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.30)' }}>{h}</p>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((t, idx) => {
              const cfg = TYPE_CFG[t.transaction_type] ?? { color: 'rgba(255,255,255,0.50)', bg: 'rgba(255,255,255,0.05)' }
              const isCredit = t.transaction_type === 'deposit'
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_110px_130px_2fr_90px_160px] gap-4 px-5 py-3.5 items-center"
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid #0e1118' }}
                >
                  {/* Référence */}
                  <p className="font-mono text-xs truncate" style={{ color: 'rgba(255,255,255,0.60)' }}>
                    {t.reference ?? t.id.slice(0, 12).toUpperCase()}
                  </p>

                  {/* Type badge */}
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium w-fit"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                    {TYPE_LABELS[t.transaction_type] ?? t.transaction_type}
                  </span>

                  {/* Montant */}
                  <p className="text-sm font-bold kpi-value"
                    style={{ color: isCredit ? '#4ADE80' : '#F87171' }}>
                    {isCredit ? '+' : '−'}{fMoney(Number(t.amount), currency)}
                  </p>

                  {/* Motif */}
                  <p className="text-sm truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {t.motif ?? <span style={{ color: 'rgba(255,255,255,0.22)' }}>—</span>}
                  </p>

                  {/* Statut */}
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium w-fit"
                    style={{
                      background: t.status === 'completed' ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.06)',
                      color:      t.status === 'completed' ? '#4ADE80' : 'rgba(255,255,255,0.40)',
                    }}>
                    {t.status === 'completed' ? 'Complété' : (t.status ?? '—')}
                  </span>

                  {/* Date */}
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {fDate(t.created_at)}
                  </p>
                </div>
              )
            })}
          </>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-right" style={{ color: 'rgba(255,255,255,0.22)' }}>
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
