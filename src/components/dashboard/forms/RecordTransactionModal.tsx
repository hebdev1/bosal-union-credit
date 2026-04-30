'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownToLine, ArrowUpFromLine, X, Loader2, Printer, Check, AlertCircle } from 'lucide-react'
import { recordTransaction } from '@/app/(dashboard)/tableau-de-bord/comptes/actions'
import {
  generateTransactionTicketPDF,
  DEFAULT_TX_TICKET_CONFIG,
  type TicketData,
  type TicketConfig,
} from './TransactionTicketPDF'

const INPUT       = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.85)' }
const LABEL       = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

type TxKind = 'deposit' | 'withdrawal'

const KIND_META: Record<TxKind, { label: string; icon: React.ComponentType<{ size?: number }>; color: string; bg: string; border: string; intent: string }> = {
  deposit:    {
    label:  'Dépôt',
    icon:   ArrowDownToLine,
    color:  '#4ADE80',
    bg:     'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.30)',
    intent: 'crédite le compte du membre',
  },
  withdrawal: {
    label:  'Retrait',
    icon:   ArrowUpFromLine,
    color:  '#F87171',
    bg:     'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.30)',
    intent: 'débite le compte du membre',
  },
}

function fmt(n: number, ccy: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: ccy || 'HTG', minimumFractionDigits: 2,
  }).format(n)
}

interface Props {
  accountId:      string
  accountNumber:  string
  currency:       string
  currentBalance: number
  /** Pre-selects the operation type when the modal opens. */
  defaultKind?:   TxKind
  /** Custom button label / icon override. */
  triggerLabel?:  string
  /** Branded ticket config — falls back to DEFAULT. */
  ticketConfig?:  TicketConfig
}

export function RecordTransactionModal({
  accountId,
  accountNumber,
  currency,
  currentBalance,
  defaultKind = 'deposit',
  triggerLabel,
  ticketConfig = DEFAULT_TX_TICKET_CONFIG,
}: Props) {
  const router = useRouter()
  const [open, setOpen]       = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError]     = React.useState<string | null>(null)
  const [kind, setKind]       = React.useState<TxKind>(defaultKind)
  const [amount, setAmount]   = React.useState('')
  const [motif, setMotif]     = React.useState('')
  const [lastTicket, setLastTicket] = React.useState<TicketData | null>(null)

  // Reset transient state when modal closes
  React.useEffect(() => {
    if (!open) {
      setError(null)
      setAmount('')
      setMotif('')
      setLastTicket(null)
    } else {
      setKind(defaultKind)
    }
  }, [open, defaultKind])

  const triggerMeta = KIND_META[defaultKind]
  const TriggerIcon = triggerMeta.icon

  const amountNum    = Number(amount)
  const amountValid  = Number.isFinite(amountNum) && amountNum > 0
  const balanceAfter = kind === 'deposit'
    ? currentBalance + (amountValid ? amountNum : 0)
    : currentBalance - (amountValid ? amountNum : 0)
  const overdraft    = kind === 'withdrawal' && amountValid && balanceAfter < 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!amountValid) { setError('Montant invalide.'); return }
    if (overdraft)    { setError(`Solde insuffisant — il manque ${fmt(Math.abs(balanceAfter), currency)}.`); return }
    setPending(true)
    setError(null)

    const res = await recordTransaction({
      accountId,
      type:   kind,
      amount: amountNum,
      motif:  motif.trim() || null,
    })

    setPending(false)
    if ('error' in res) { setError(res.error); return }

    // Auto-trigger ticket PDF download
    try {
      await generateTransactionTicketPDF(res.ticket, ticketConfig)
    } catch {
      // Non-blocking : the ticket UI still allows manual reprint.
    }

    setLastTicket(res.ticket)
    // Refresh server-rendered balance / KPIs / transaction list
    router.refresh()
  }

  function handleClose() { setOpen(false) }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
        style={{
          background: triggerMeta.bg,
          color:      triggerMeta.color,
          border:     `1px solid ${triggerMeta.border}`,
        }}
      >
        <TriggerIcon size={13} />
        {triggerLabel ?? triggerMeta.label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0D1018' }}>
              <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                {lastTicket
                  ? 'Opération enregistrée · Reçu prêt'
                  : `Nouvelle opération · ${accountNumber}`}
              </h2>
              <button type="button" onClick={handleClose}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <X size={16} />
              </button>
            </div>

            {/* ── Success / reprint screen ───────────────────────────────── */}
            {lastTicket ? (
              <div className="px-6 py-6 space-y-4">
                <div className="rounded-xl p-4 space-y-3"
                  style={{
                    background: lastTicket.transaction_type === 'deposit'
                      ? 'rgba(74,222,128,0.06)'  : 'rgba(248,113,113,0.06)',
                    border: `1px solid ${lastTicket.transaction_type === 'deposit'
                      ? 'rgba(74,222,128,0.28)' : 'rgba(248,113,113,0.28)'}`,
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold"
                      style={{ color: lastTicket.transaction_type === 'deposit' ? '#4ADE80' : '#F87171' }}>
                      {lastTicket.reference}
                    </span>
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Intl.DateTimeFormat('fr-HT', { hour: '2-digit', minute: '2-digit' })
                        .format(new Date(lastTicket.created_at))}
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
                    {lastTicket.member_first_name} {lastTicket.member_last_name}
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                      {' · '}{lastTicket.member_number}
                    </span>
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: lastTicket.transaction_type === 'deposit' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
                        color:      lastTicket.transaction_type === 'deposit' ? '#4ADE80' : '#F87171',
                      }}>
                      {lastTicket.transaction_type === 'deposit' ? 'Dépôt' : 'Retrait'}
                    </span>
                    <span className="text-base font-bold kpi-value"
                      style={{ color: lastTicket.transaction_type === 'deposit' ? '#4ADE80' : '#F87171' }}>
                      {lastTicket.transaction_type === 'deposit' ? '+' : '−'}{fmt(lastTicket.amount, lastTicket.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.40)' }}>Solde après opération</span>
                    <span className="font-semibold kpi-value" style={{ color: 'rgba(255,255,255,0.90)' }}>
                      {fmt(lastTicket.balance_after, lastTicket.currency)}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-center flex items-center justify-center gap-1.5"
                  style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <Check size={12} style={{ color: '#4ADE80' }} />
                  Le reçu PDF a été téléchargé automatiquement.
                </p>

                <div className="flex gap-3">
                  <button type="button"
                    onClick={() => generateTransactionTicketPDF(lastTicket, ticketConfig)}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.75)' }}>
                    <Printer size={14} />
                    Réimprimer le reçu
                  </button>
                  <button type="button"
                    onClick={() => { setLastTicket(null) }}
                    className="flex-1 h-9 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: '#C41E3A', color: '#fff' }}>
                    Nouvelle opération
                  </button>
                </div>
              </div>
            ) : (
              /* ── Form ──────────────────────────────────────────────── */
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                {/* Kind toggle */}
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Type d&apos;opération *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['deposit', 'withdrawal'] as const).map(k => {
                      const meta = KIND_META[k]
                      const Icon = meta.icon
                      const active = kind === k
                      return (
                        <button key={k} type="button" onClick={() => setKind(k)}
                          className="flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: active ? meta.bg : 'rgba(255,255,255,0.03)',
                            color:      active ? meta.color : 'rgba(255,255,255,0.50)',
                            border:     `1px solid ${active ? meta.border : 'rgba(255,255,255,0.07)'}`,
                          }}>
                          <Icon size={12} />
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    Cette opération {KIND_META[kind].intent}.
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>
                    Montant ({currency}) *
                  </label>
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={INPUT}
                    style={INPUT_STYLE}
                    autoFocus
                  />
                </div>

                {/* Motif */}
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>
                    Motif <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.30)' }}>(optionnel)</span>
                  </label>
                  <input
                    name="motif"
                    type="text"
                    value={motif}
                    onChange={e => setMotif(e.target.value)}
                    placeholder="ex : Versement mensuel, Retrait pour achats…"
                    className={INPUT}
                    style={INPUT_STYLE}
                  />
                </div>

                {/* Live preview */}
                {amountValid && (
                  <div className="rounded-xl px-4 py-3 space-y-1.5"
                    style={{
                      background: KIND_META[kind].bg,
                      border:     `1px solid ${KIND_META[kind].border}`,
                    }}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>Solde avant</span>
                      <span className="kpi-value" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {fmt(currentBalance, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {kind === 'deposit' ? '+ Dépôt' : '− Retrait'}
                      </span>
                      <span className="kpi-value font-semibold" style={{ color: KIND_META[kind].color }}>
                        {kind === 'deposit' ? '+' : '−'}{fmt(amountNum, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Solde après</span>
                      <span className="text-sm font-bold kpi-value"
                        style={{ color: overdraft ? '#F87171' : 'rgba(255,255,255,0.95)' }}>
                        {fmt(balanceAfter, currency)}
                      </span>
                    </div>
                    {overdraft && (
                      <p className="text-[11px] flex items-center gap-1.5 mt-1"
                        style={{ color: '#F87171' }}>
                        <AlertCircle size={11} />
                        Découvert non autorisé — réduisez le montant.
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-xs rounded-lg px-3 py-2"
                    style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={handleClose}
                    className="h-9 px-4 rounded-lg text-sm font-medium"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.60)' }}>
                    Annuler
                  </button>
                  <button type="submit" disabled={pending || !amountValid || overdraft}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-opacity"
                    style={{
                      background: kind === 'deposit' ? '#16A34A' : '#DC2626',
                      color: '#fff',
                      opacity: (pending || !amountValid || overdraft) ? 0.5 : 1,
                    }}>
                    {pending ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                    Enregistrer & imprimer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
