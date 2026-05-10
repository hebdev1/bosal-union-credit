'use client'
import * as React from 'react'
import { FileDown, Loader2, Search, Printer } from 'lucide-react'
import { toast } from 'sonner'
import {
  generateTransactionTicketPDF,
  DEFAULT_TX_TICKET_CONFIG,
  type TicketConfig as TicketCfg,
  type TicketData,
} from '@/components/dashboard/forms/TransactionTicketPDF'

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
  /** Branded ticket config — falls back to brand defaults */
  ticketConfig?: TicketCfg
  /** Account context — needed to rebuild a ticket from a stored row */
  account?: {
    account_number: string
    account_type: string
    balance: number
  }
  member?: {
    first_name:    string
    last_name:     string
    member_number: string
  }
  agentName?: string
  coopName?:  string
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
  const {
    drawHeader, drawFooter, drawSectionHeading, drawStatCards, drawTable,
    statusToBadgeVariant,
  } = await import('@/lib/pdf/shadcn-table')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297; const H = 210; const L = 12; const R = W - 12
  const TOTAL_W = R - L

  // ── Header (shadcn-style) ──
  let y = drawHeader(doc, {
    title: `Relevé de compte — ${accountRef}`,
    subtitle: `Généré le ${new Date().toLocaleDateString('fr-HT')} · ${txs.length} opération(s)`,
  }, W)

  // ── KPI cards ──
  const dep = txs.filter(t => t.transaction_type === 'deposit').reduce((s, t) => s + Number(t.amount), 0)
  const wit = txs.filter(t => t.transaction_type === 'withdrawal').reduce((s, t) => s + Number(t.amount), 0)
  const adj = txs.filter(t => t.transaction_type === 'adjustment').reduce((s, t) => s + Number(t.amount), 0)

  y = drawStatCards(doc, L, y, TOTAL_W, [
    { label: 'Total dépôts',     value: fMoney(dep, currency),       accent: [22, 101, 52]  },
    { label: 'Total retraits',   value: fMoney(wit, currency),       accent: [185, 28, 28]  },
    { label: 'Flux net',         value: fMoney(dep - wit, currency), accent: dep >= wit ? [22, 101, 52] : [185, 28, 28] },
    { label: 'Ajustements',      value: fMoney(adj, currency),       accent: [161, 98, 7]   },
    { label: 'Total opérations', value: String(txs.length) },
  ], { perRow: 5 })
  y += 4

  // ── Table ──
  y = drawSectionHeading(doc, L, y, 'Détail des opérations')
  drawTable(doc, {
    x: L, y, totalWidth: TOTAL_W,
    pageBottomY: H - 16,
    onNewPage: dd => { dd.addPage(); return 20 },
    columns: [
      { header: 'Référence',   width: 36 },
      { header: 'Type',        width: 26, align: 'center' },
      { header: 'Montant',     width: 38, align: 'right' },
      { header: 'Motif',       width: 76 },
      { header: 'Statut',      width: 24, align: 'center' },
      { header: 'Date & heure', width: 56 },
    ],
    rows: txs.map(t => {
      const isCredit = t.transaction_type === 'deposit'
      return [
        { kind: 'mono', text: t.reference ?? t.id.slice(0, 10).toUpperCase() },
        { kind: 'badge', label: TYPE_LABELS[t.transaction_type] ?? t.transaction_type, variant: statusToBadgeVariant(t.transaction_type) },
        { kind: 'strong', text: (isCredit ? '+' : '-') + fMoney(Number(t.amount), currency) },
        { kind: 'muted', text: (t.motif ?? '—').substring(0, 48) },
        { kind: 'badge', label: t.status ?? 'completed', variant: statusToBadgeVariant(t.status ?? 'completed') },
        { kind: 'muted', text: fDate(t.created_at).substring(0, 28) },
      ]
    }),
    footer: [
      { kind: 'strong', text: 'Totaux' },
      '',
      { kind: 'strong', text: `+${fMoney(dep, currency)} · -${fMoney(wit, currency)}` },
      '',
      '',
      '',
    ],
  })

  drawFooter(doc, `Relevé compte ${accountRef} · Bosal Credit Union`, W, H)
  doc.save(`releve-${accountRef}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/* ── Component ────────────────────────────────────────────────────────────── */
export function AccountProfileClient({
  transactions,
  currency,
  ticketConfig = DEFAULT_TX_TICKET_CONFIG,
  account,
  member,
  agentName = '—',
  coopName  = 'Bosal Credit Union',
}: Props) {
  const [activeTab, setActiveTab]     = React.useState('all')
  const [search, setSearch]           = React.useState('')
  const [exporting, setExporting]     = React.useState(false)
  const [reprintingId, setReprinting] = React.useState<string | null>(null)

  /** Reprint a ticket from a stored transaction row.
   *  Note: balances aren't stored on the row, so we display 0 / current balance
   *  as best-effort placeholders — main fields (member, account, amount, ref)
   *  are always accurate. */
  async function reprint(tx: Tx) {
    if (!account || !member) {
      toast.error('Contexte insuffisant pour réimprimer.')
      return
    }
    if (tx.transaction_type !== 'deposit' && tx.transaction_type !== 'withdrawal') {
      toast.error('Type non imprimable (uniquement dépôt / retrait).')
      return
    }
    setReprinting(tx.id)
    const data: TicketData = {
      reference:        tx.reference ?? tx.id.slice(0, 12).toUpperCase(),
      transaction_type: tx.transaction_type as 'deposit' | 'withdrawal',
      amount:           Number(tx.amount),
      motif:            tx.motif,
      created_at:       tx.created_at,
      account_number:   account.account_number,
      account_type:     account.account_type,
      currency,
      // Best-effort reconstruction (current balance shown as "after")
      balance_before:   Number(account.balance),
      balance_after:    Number(account.balance),
      member_first_name: member.first_name,
      member_last_name:  member.last_name,
      member_number:     member.member_number,
      agent_name:        agentName,
      coop_name:         coopName,
    }
    try {
      await generateTransactionTicketPDF(data, ticketConfig)
      toast.success('Reçu téléchargé')
    } catch {
      toast.error('Impossible de générer le reçu')
    } finally {
      setReprinting(null)
    }
  }

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
            <div className="grid grid-cols-[1fr_110px_130px_2fr_90px_160px_36px] gap-4 px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.04)' }}>
              {['Référence', 'Type', 'Montant', 'Motif', 'Statut', 'Date', ''].map((h, i) => (
                <p key={`${h}-${i}`} className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.30)' }}>{h}</p>
              ))}
            </div>

            {/* Rows */}
            {filtered.map((t, idx) => {
              const cfg = TYPE_CFG[t.transaction_type] ?? { color: 'rgba(255,255,255,0.50)', bg: 'rgba(255,255,255,0.05)' }
              const isCredit = t.transaction_type === 'deposit'
              const printable = t.transaction_type === 'deposit' || t.transaction_type === 'withdrawal'
              return (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_110px_130px_2fr_90px_160px_36px] gap-4 px-5 py-3.5 items-center"
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

                  {/* Reprint ticket */}
                  {printable && account && member ? (
                    <button
                      type="button"
                      onClick={() => reprint(t)}
                      disabled={reprintingId === t.id}
                      title="Réimprimer le reçu"
                      className="inline-flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                      style={{
                        width: 28, height: 28,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.55)',
                      }}>
                      {reprintingId === t.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Printer size={12} />}
                    </button>
                  ) : <span aria-hidden />}
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
