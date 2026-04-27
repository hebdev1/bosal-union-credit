'use client'
import * as React from 'react'
import { PlusCircle, X, Loader2 } from 'lucide-react'
import { createAccount } from '@/app/(dashboard)/tableau-de-bord/comptes/actions'
import { ACCOUNT_TYPES } from '@/lib/accounts/types'

const INPUT  = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const SELECT = 'app-select w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.85)' }
const LABEL = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

interface Member { id: string; first_name: string; last_name: string; member_number: string }
interface Plan   { id: string; name: string; interest_rate: number; interest_period: string }

const PERIOD_LABELS: Record<string, string> = {
  daily: 'quotidien', monthly: 'mensuel', quarterly: 'trimestriel', yearly: 'annuel',
}

export function CreateAccountModal({ members, plans = [] }: { members: Member[]; plans?: Plan[] }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedType, setSelectedType] = React.useState<string>('savings')
  const formRef = React.useRef<HTMLFormElement>(null)

  // Active type meta (for the live description chip under the dropdown)
  const typeMeta = ACCOUNT_TYPES.find(t => t.value === selectedType)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createAccount(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) { setError(result.error); return }
    formRef.current?.reset()
    setSelectedType('savings')
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
        style={{ background: '#C41E3A', color: '#fff' }}
      >
        <PlusCircle size={15} aria-hidden="true" />
        Nouveau compte
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.70)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 sticky top-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0D1018' }}
            >
              <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Nouveau compte
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <X size={16} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Membre */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Membre *</label>
                <select name="member_id" required className={SELECT} style={INPUT_STYLE}>
                  <option value="">Sélectionner un membre</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} — {m.member_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* N° Compte */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>N° Compte *</label>
                <input name="account_number" required className={INPUT} style={INPUT_STYLE} placeholder="CPT-001" />
              </div>

              {/* Type de compte (élargi) */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>
                  Type de compte voulu *
                </label>
                <select
                  name="account_type"
                  required
                  className={SELECT}
                  style={INPUT_STYLE}
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                >
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {typeMeta && (
                  <p className="text-[11px] mt-1.5 flex items-center gap-1.5"
                    style={{ color: 'rgba(255,255,255,0.40)' }}>
                    <span aria-hidden style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#3B82F6', flexShrink: 0,
                    }} />
                    {typeMeta.description}
                  </p>
                )}
              </div>

              {/* Devise */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Devise *</label>
                <select name="currency" required className={SELECT} style={INPUT_STYLE}>
                  <option value="HTG">HTG</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* Plan d'épargne */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>
                  Plan d&apos;épargne
                  <span className="ml-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>(optionnel)</span>
                </label>
                <select name="savings_product_id" className={SELECT} style={INPUT_STYLE}>
                  <option value="">— Aucun plan —</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.interest_rate}% {PERIOD_LABELS[p.interest_period] ?? p.interest_period}
                    </option>
                  ))}
                </select>
                {plans.length === 0 && (
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    Aucun plan disponible.
                  </p>
                )}
                {plans.length > 0 && (
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    Un plan peut être attribué ou modifié ultérieurement.
                  </p>
                )}
              </div>

              {/* Solde initial */}
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Solde initial</label>
                <input name="balance" type="number" min="0" step="0.01" defaultValue="0"
                  className={INPUT} style={INPUT_STYLE} />
              </div>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.60)' }}>
                  Annuler
                </button>
                <button type="submit" disabled={pending}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium"
                  style={{ background: '#C41E3A', color: '#fff', opacity: pending ? 0.7 : 1 }}>
                  {pending && <Loader2 size={14} className="animate-spin" />}
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
