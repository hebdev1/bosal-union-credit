'use client'
import * as React from 'react'
import { PlusCircle, X, Loader2 } from 'lucide-react'
import { createAccount } from '@/app/(dashboard)/tableau-de-bord/comptes/actions'

const INPUT = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: '#0F1117', border: '1px solid #252A36', color: 'rgba(255,255,255,0.85)' }
const LABEL = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

interface Member { id: string; first_name: string; last_name: string; member_number: string }

export function CreateAccountModal({ members }: { members: Member[] }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await createAccount(new FormData(e.currentTarget))
      formRef.current?.reset()
      setOpen(false)
    } catch (err: any) {
      setError(err.message ?? 'Erreur inconnue')
    } finally {
      setPending(false)
    }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.70)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#111318', border: '1px solid #252A36' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1a1f2e' }}>
              <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Nouveau compte
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <X size={16} />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Membre *</label>
                <select name="member_id" required className={INPUT} style={INPUT_STYLE}>
                  <option value="">Sélectionner un membre</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} — {m.member_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL} style={LABEL_STYLE}>N° Compte *</label>
                <input name="account_number" required className={INPUT} style={INPUT_STYLE} placeholder="CPT-001" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Type de compte *</label>
                  <select name="account_type" required className={INPUT} style={INPUT_STYLE}>
                    <option value="savings">Épargne</option>
                    <option value="deposit">Dépôt</option>
                    <option value="wallet">Wallet</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Devise *</label>
                  <select name="currency" required className={INPUT} style={INPUT_STYLE}>
                    <option value="HTG">HTG</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

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
                  style={{ background: 'transparent', border: '1px solid #252A36', color: 'rgba(255,255,255,0.60)' }}>
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
