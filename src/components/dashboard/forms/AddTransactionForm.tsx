'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusCircle, X, Loader2, Search, ArrowDownCircle, ArrowUpCircle,
  CalendarClock, History, AlertTriangle, Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { recordTransactionEntry } from '@/app/(dashboard)/tableau-de-bord/transactions/actions'

/* ── Local style consts (match the rest of the dashboard) ─────────────── */
const INPUT_BASE  = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const SELECT_BASE = 'app-select w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.88)' }
const LABEL       = 'block text-[11px] font-semibold uppercase tracking-wide mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.42)' }

/* ── Public types — shaped to match the page's server-side queries ────── */
export interface MemberOption {
  id:            string
  first_name:    string
  last_name:     string
  member_number: string
}
export interface AccountOption {
  id:             string
  account_number: string
  currency:       string
  account_type:   string
  member_id:      string
}

interface Props {
  members:  MemberOption[]
  accounts: AccountOption[]
}

type Mode = 'current' | 'historical'
type TxType = 'deposit' | 'withdrawal'

/** Today as YYYY-MM-DD in the operator's local TZ (input[type=date] expects this). */
function isoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function AddTransactionForm({ members, accounts }: Props) {
  const router = useRouter()

  /* ── Modal open / submit state ─────────────────────────────────────── */
  const [open, setOpen]       = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError]     = React.useState<string | null>(null)

  /* ── Form state ────────────────────────────────────────────────────── */
  const [memberId, setMemberId]   = React.useState<string>('')
  const [accountId, setAccountId] = React.useState<string>('')
  const [type, setType]           = React.useState<TxType>('deposit')
  const [amount, setAmount]       = React.useState<string>('')
  const [mode, setMode]           = React.useState<Mode>('current')
  const [date, setDate]           = React.useState<string>(isoDate())
  const [note, setNote]           = React.useState<string>('')

  /* ── Searchable client picker ──────────────────────────────────────── */
  const [search, setSearch]               = React.useState('')
  const [pickerOpen, setPickerOpen]       = React.useState(false)
  const pickerRef                         = React.useRef<HTMLDivElement>(null)

  // Click-away
  React.useEffect(() => {
    if (!pickerOpen) return
    function onOut(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, [pickerOpen])

  const filteredMembers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members.slice(0, 50)
    return members.filter(m =>
      m.first_name.toLowerCase().includes(q)
      || m.last_name.toLowerCase().includes(q)
      || m.member_number.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [members, search])

  const selectedMember = React.useMemo(
    () => members.find(m => m.id === memberId) ?? null,
    [members, memberId],
  )

  const memberAccounts = React.useMemo(
    () => accounts.filter(a => a.member_id === memberId),
    [accounts, memberId],
  )

  /* ── Mode toggle synchronises the date field ──────────────────────── */
  React.useEffect(() => {
    if (mode === 'current') setDate(isoDate())
  }, [mode])

  /* ── Auto-pick the only account when the member has one ──────────── */
  React.useEffect(() => {
    if (memberAccounts.length === 1) setAccountId(memberAccounts[0].id)
    else if (!memberAccounts.find(a => a.id === accountId)) setAccountId('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId])

  /* ── Submit (shared between Save and Save & New) ──────────────────── */
  async function submit(saveAndNew: boolean) {
    setError(null)

    // Quick client validation (server re-validates everything)
    if (!memberId)              { setError('Sélectionnez un membre.'); return }
    if (!accountId)             { setError('Sélectionnez un compte.'); return }
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Montant invalide.'); return
    }
    if (!date) { setError('Date manquante.'); return }

    // Build the transaction_date.
    //   - In CURRENT mode, send `now()` so the second field stays accurate.
    //   - In HISTORICAL mode, end-of-day at noon local TZ (avoids the
    //     "12 AM looks like the previous day in UTC" pitfall).
    let txDate: Date
    if (mode === 'current') {
      txDate = new Date()
    } else {
      txDate = new Date(`${date}T12:00:00`)
    }

    // Future-date guard (with 60 s tolerance — same as the DB CHECK).
    if (txDate.getTime() > Date.now() + 60_000) {
      setError('La date ne peut pas être dans le futur.')
      return
    }

    setPending(true)
    const res = await recordTransactionEntry({
      accountId,
      type,
      amount: amt,
      transactionDate: txDate.toISOString(),
      note: note.trim() || null,
    })
    setPending(false)

    if ('error' in res) {
      setError(res.error)
      toast.error(res.error)
      return
    }

    toast.success(
      mode === 'historical'
        ? `Transaction historique enregistrée (${type === 'deposit' ? 'dépôt' : 'retrait'})`
        : `${type === 'deposit' ? 'Dépôt' : 'Retrait'} enregistré`,
    )
    router.refresh()

    if (saveAndNew) {
      // Smart Behavior — preserve client / account / type for rapid entry,
      // reset only the variable fields.
      setAmount('')
      setNote('')
      if (mode === 'current') setDate(isoDate())
    } else {
      closeAndReset()
    }
  }

  function closeAndReset() {
    setOpen(false)
    setError(null)
    setMemberId('')
    setAccountId('')
    setSearch('')
    setType('deposit')
    setAmount('')
    setNote('')
    setMode('current')
    setDate(isoDate())
  }

  /* ── Visual cue for historical mode (subtle bg shift) ─────────────── */
  const isHistorical = mode === 'historical'
  const wrapBg       = isHistorical ? 'rgba(252,211,77,0.04)' : '#0D1018'
  const wrapBorder   = isHistorical ? 'rgba(252,211,77,0.25)' : 'rgba(255,255,255,0.09)'

  const todayIso = isoDate()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#C41E3A', color: '#fff' }}
      >
        <PlusCircle size={15} aria-hidden />
        Saisir transaction
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)' }}
          onClick={e => { if (e.target === e.currentTarget) closeAndReset() }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-colors"
            style={{
              background: wrapBg,
              border: `1px solid ${wrapBorder}`,
              maxHeight: '92vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{ borderBottom: `1px solid ${wrapBorder}`, background: wrapBg }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: isHistorical ? 'rgba(252,211,77,0.15)' : 'rgba(196,30,58,0.15)' }}>
                  {isHistorical
                    ? <History  size={14} style={{ color: '#FCD34D' }} />
                    : <PlusCircle size={14} style={{ color: '#C41E3A' }} />}
                </div>
                <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  {isHistorical ? 'Saisie historique' : 'Saisir une transaction'}
                </h2>
              </div>
              <button type="button" onClick={closeAndReset}
                className="rounded-lg p-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* ─── Mode toggle ───────────────────────────────────── */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Mode</label>
                <div className="flex items-center rounded-lg overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                  {([
                    { v: 'current',    label: 'Actuelle',  Icon: CalendarClock },
                    { v: 'historical', label: 'Historique', Icon: History       },
                  ] as { v: Mode; label: string; Icon: React.ComponentType<{ size?: number }> }[])
                  .map(({ v, label, Icon }) => {
                    const active = mode === v
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMode(v)}
                        className="flex-1 flex items-center justify-center gap-2 h-9 text-xs font-medium transition-colors"
                        style={{
                          background: active
                            ? (v === 'historical' ? 'rgba(252,211,77,0.15)' : 'rgba(74,222,128,0.12)')
                            : 'transparent',
                          color: active
                            ? (v === 'historical' ? '#FCD34D' : '#4ADE80')
                            : 'rgba(255,255,255,0.55)',
                          borderRight: v === 'current' ? '1px solid rgba(255,255,255,0.09)' : undefined,
                        }}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    )
                  })}
                </div>
                {isHistorical && (
                  <p className="text-[11px] mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5"
                    style={{ background: 'rgba(252,211,77,0.06)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.18)' }}>
                    <AlertTriangle size={12} aria-hidden style={{ flexShrink: 0, marginTop: 1 }} />
                    Cette opération sera enregistrée comme transaction passée. La date d&apos;insertion système reste l&apos;heure réelle.
                  </p>
                )}
              </div>

              {/* ─── Client (searchable) ───────────────────────────── */}
              <div className="relative" ref={pickerRef}>
                <label className={LABEL} style={LABEL_STYLE}>Membre *</label>
                <button
                  type="button"
                  onClick={() => setPickerOpen(o => !o)}
                  className={INPUT_BASE + ' flex items-center justify-between text-left'}
                  style={INPUT_STYLE}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Search size={12} style={{ color: 'rgba(255,255,255,0.40)' }} />
                    <span className={selectedMember ? '' : 'opacity-60'}>
                      {selectedMember
                        ? `${selectedMember.first_name} ${selectedMember.last_name} · ${selectedMember.member_number}`
                        : 'Rechercher un membre…'}
                    </span>
                  </span>
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </button>
                {pickerOpen && (
                  <div
                    className="absolute z-30 mt-1 w-full rounded-xl overflow-hidden"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.10)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                    }}
                  >
                    <div className="px-2 py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <input
                        autoFocus
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Nom, prénom, n° membre…"
                        className="w-full rounded-md px-2 py-1.5 text-sm outline-none"
                        style={{ background: 'rgba(0,0,0,0.04)', color: '#000', border: '1px solid rgba(0,0,0,0.08)' }}
                      />
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {filteredMembers.length === 0 ? (
                        <p className="text-xs px-3 py-3" style={{ color: 'rgba(0,0,0,0.45)' }}>
                          Aucun membre trouvé.
                        </p>
                      ) : filteredMembers.map(m => {
                        const active = m.id === memberId
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setMemberId(m.id); setPickerOpen(false); setSearch('') }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors"
                            style={{ color: '#000' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = '#3B82F6'
                              ;(e.currentTarget as HTMLElement).style.color      = '#ffffff'
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent'
                              ;(e.currentTarget as HTMLElement).style.color      = '#000000'
                            }}
                          >
                            <span className="font-medium truncate">
                              {m.first_name} {m.last_name}
                            </span>
                            <span className="font-mono text-[11px] flex items-center gap-1.5" style={{ opacity: 0.7 }}>
                              {m.member_number}
                              {active && <Check size={10} />}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Account (filtered to selected member) ─────────── */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Compte *</label>
                <select
                  className={SELECT_BASE}
                  style={{ ...INPUT_STYLE, opacity: memberId ? 1 : 0.5 }}
                  disabled={!memberId}
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                >
                  <option value="" disabled>
                    {memberId
                      ? memberAccounts.length === 0
                        ? 'Aucun compte actif pour ce membre'
                        : 'Sélectionner un compte…'
                      : 'Sélectionnez d’abord un membre'}
                  </option>
                  {memberAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_number} · {a.currency} ({a.account_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* ─── Type (radio group, big touch targets) ─────────── */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { v: 'deposit',    label: 'Dépôt',  Icon: ArrowDownCircle, color: '#4ADE80' },
                    { v: 'withdrawal', label: 'Retrait', Icon: ArrowUpCircle,   color: '#F87171' },
                  ] as { v: TxType; label: string; Icon: React.ComponentType<{ size?: number }>; color: string }[])
                  .map(({ v, label, Icon, color }) => {
                    const active = type === v
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setType(v)}
                        className="flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: active ? `${color}1A` : 'rgba(255,255,255,0.04)',
                          border:     `1px solid ${active ? color : 'rgba(255,255,255,0.09)'}`,
                          color:      active ? color : 'rgba(255,255,255,0.65)',
                        }}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ─── Amount + Date side by side ─────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Montant (HTG) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className={INPUT_BASE + ' kpi-value'}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>
                    Date de la transaction {isHistorical && '*'}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    disabled={!isHistorical}
                    max={todayIso}
                    className={INPUT_BASE}
                    style={{
                      ...INPUT_STYLE,
                      opacity: isHistorical ? 1 : 0.55,
                      cursor:  isHistorical ? 'pointer' : 'not-allowed',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
              </div>

              {/* ─── Note (optional) ─────────────────────────── */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>
                  Note <span className="ml-1 normal-case font-normal" style={{ color: 'rgba(255,255,255,0.30)' }}>(optionnel)</span>
                </label>
                <input
                  type="text"
                  placeholder="ex : Versement collecté en agence le 12 mars"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className={INPUT_BASE}
                  style={INPUT_STYLE}
                  maxLength={200}
                />
              </div>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {error}
                </p>
              )}

              {/* ─── Footer actions ──────────────────────────── */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)' }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => submit(true)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.85)',
                    opacity: pending ? 0.6 : 1,
                  }}
                >
                  {pending ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
                  Enregistrer & nouveau
                </button>
                <button
                  type="button"
                  onClick={() => submit(false)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold"
                  style={{
                    background: '#C41E3A',
                    color: '#fff',
                    opacity: pending ? 0.6 : 1,
                  }}
                >
                  {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
