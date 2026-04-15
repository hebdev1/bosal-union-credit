'use client'
import * as React from 'react'
import { UserPlus, X, Loader2 } from 'lucide-react'
import { createMember } from '@/app/(dashboard)/tableau-de-bord/membres/actions'

const INPUT = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: '#0F1117', border: '1px solid #252A36', color: 'rgba(255,255,255,0.85)' }
const LABEL = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

export function CreateMemberModal() {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const formRef = React.useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    const result = await createMember(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    formRef.current?.reset()
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
        <UserPlus size={15} aria-hidden="true" />
        Nouveau membre
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.70)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#111318', border: '1px solid #252A36' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #1a1f2e' }}>
              <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Nouveau membre
              </h2>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Prénom *</label>
                  <input name="first_name" required className={INPUT} style={INPUT_STYLE} placeholder="Jean" />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Nom *</label>
                  <input name="last_name" required className={INPUT} style={INPUT_STYLE} placeholder="Dupont" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>N° Membre *</label>
                  <input name="member_number" required className={INPUT} style={INPUT_STYLE} placeholder="MBR-001" />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Date de naissance *</label>
                  <input name="birth_date" type="date" required className={INPUT} style={INPUT_STYLE} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Téléphone</label>
                  <input name="phone" type="tel" className={INPUT} style={INPUT_STYLE} placeholder="+509 XXXX XXXX" />
                </div>
                <div>
                  <label className={LABEL} style={LABEL_STYLE}>Email</label>
                  <input name="email" type="email" className={INPUT} style={INPUT_STYLE} placeholder="jean@example.com" />
                </div>
              </div>

              <div>
                <label className={LABEL} style={LABEL_STYLE}>Adresse</label>
                <input name="address" className={INPUT} style={INPUT_STYLE} placeholder="Port-au-Prince, Haïti" />
              </div>

              <div>
                <label className={LABEL} style={LABEL_STYLE}>Profession</label>
                <input name="profession" className={INPUT} style={INPUT_STYLE} placeholder="Commerçant" />
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
                  Créer le membre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
