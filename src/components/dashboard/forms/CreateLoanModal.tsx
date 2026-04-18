'use client'
import * as React from 'react'
import { CreditCard, X, Loader2, Calculator } from 'lucide-react'
import { createLoan } from '@/app/(dashboard)/tableau-de-bord/prets/actions'

const INPUT  = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.88)' }
const LABEL  = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.42)' }

function fHTG(n: number) {
  return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2 }).format(n)
}

export interface LoanMember {
  id: string
  first_name: string
  last_name: string
  member_number: string
}

export interface LoanAccount {
  id: string
  account_number: string
  currency: string
  account_type: string
  member_id: string
}

interface Props {
  members: LoanMember[]
  accounts: LoanAccount[]
}

export function CreateLoanModal({ members, accounts }: Props) {
  const [open, setOpen]         = React.useState(false)
  const [pending, setPending]   = React.useState(false)
  const [error, setError]       = React.useState<string | null>(null)
  const formRef                 = React.useRef<HTMLFormElement>(null)

  // Selected member to filter accounts
  const [selectedMemberId, setSelectedMemberId] = React.useState('')

  // Live preview state
  const [principal, setPrincipal]       = React.useState('')
  const [interestRate, setInterestRate] = React.useState('12')
  const [duration, setDuration]         = React.useState('12')

  // Accounts for selected member
  const memberAccounts = React.useMemo(
    () => accounts.filter(a => a.member_id === selectedMemberId),
    [accounts, selectedMemberId]
  )

  // Flat-rate calculations
  const principalNum = parseFloat(principal)
  const rateNum      = parseFloat(interestRate)
  const durationNum  = parseInt(duration, 10)

  const hasPreview = !isNaN(principalNum) && principalNum > 0
    && !isNaN(rateNum) && rateNum >= 0
    && !isNaN(durationNum) && durationNum > 0

  const totalInterest   = hasPreview ? principalNum * (rateNum / 100) * (durationNum / 12) : 0
  const totalAmountDue  = hasPreview ? principalNum + totalInterest : 0
  const monthlyPayment  = hasPreview ? totalAmountDue / durationNum : 0

  function handleClose() {
    setOpen(false)
    setError(null)
    setPrincipal('')
    setInterestRate('12')
    setDuration('12')
    setSelectedMemberId('')
    formRef.current?.reset()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createLoan(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) { setError(result.error); return }
    handleClose()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#C41E3A', color: '#fff' }}
      >
        <CreditCard size={15} aria-hidden="true" />
        Nouveau prêt
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(196,30,58,0.15)' }}>
                  <CreditCard size={14} style={{ color: '#C41E3A' }} />
                </div>
                <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Nouveau prêt
                </h2>
              </div>
              <button type="button" onClick={handleClose}
                className="rounded-lg p-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                <X size={15} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit}
              className="px-6 py-5 space-y-4 max-h-[78vh] overflow-y-auto">

              {/* Membre */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Membre *</label>
                <select
                  name="member_id"
                  required
                  className={INPUT}
                  style={INPUT_STYLE}
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                >
                  <option value="" disabled>Sélectionner un membre…</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} — {m.member_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compte associé */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Compte associé *</label>
                <select
                  name="account_id"
                  required
                  className={INPUT}
                  style={{
                    ...INPUT_STYLE,
                    opacity: selectedMemberId ? 1 : 0.5,
                  }}
                  defaultValue=""
                  disabled={!selectedMemberId}
                >
                  <option value="" disabled>
                    {selectedMemberId
                      ? memberAccounts.length === 0
                        ? 'Aucun compte actif pour ce membre'
                        : 'Sélectionner un compte…'
                      : 'Sélectionnez d\'abord un membre'
                    }
                  </option>
                  {memberAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.account_number} — {a.currency} ({a.account_type})
                    </option>
                  ))}
                </select>
                {selectedMemberId && memberAccounts.length === 0 && (
                  <p className="text-[11px] mt-1" style={{ color: '#F87171' }}>
                    Ce membre n&apos;a aucun compte actif. Créez-en un d&apos;abord.
                  </p>
                )}
              </div>

              {/* Capital */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Capital demandé (HTG) *</label>
                <input
                  name="principal_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  placeholder="ex : 50 000.00"
                  value={principal}
                  onChange={e => setPrincipal(e.target.value)}
                  className={INPUT}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Taux + Durée */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>
                    Taux d&apos;intérêt annuel (%) *
                  </label>
                  <input
                    name="interest_rate"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="ex : 12"
                    value={interestRate}
                    onChange={e => setInterestRate(e.target.value)}
                    className={INPUT}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Durée (mois) *</label>
                  <input
                    name="duration_months"
                    type="number"
                    min="1"
                    max="360"
                    step="1"
                    required
                    placeholder="ex : 12"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className={INPUT}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Objet */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Objet du prêt</label>
                <input
                  name="purpose"
                  type="text"
                  placeholder="ex : Commerce, Logement, Agriculture…"
                  className={INPUT}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Live preview */}
              {hasPreview && (
                <div className="rounded-xl p-4 space-y-3"
                  style={{ background: 'rgba(196,30,58,0.06)', border: '1px solid rgba(196,30,58,0.20)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator size={13} style={{ color: '#C41E3A' }} />
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Simulation (taux flat)
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Mensualité',       value: fHTG(monthlyPayment)  },
                      { label: 'Intérêts totaux',  value: fHTG(totalInterest)   },
                      { label: 'Total à rembourser', value: fHTG(totalAmountDue) },
                    ].map(item => (
                      <div key={item.label}
                        className="rounded-lg px-3 py-2"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-xs font-semibold kpi-value"
                          style={{ color: 'rgba(255,255,255,0.88)' }}>{item.value}</p>
                        <p className="text-[10px] mt-0.5"
                          style={{ color: 'rgba(255,255,255,0.30)' }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Le prêt sera créé avec le statut <span style={{ color: '#FCD34D' }}>En attente</span> — modifiable depuis la liste.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={handleClose}
                  className="h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)' }}>
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ background: '#C41E3A', color: '#fff', opacity: pending ? 0.65 : 1 }}
                >
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  Créer le prêt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
