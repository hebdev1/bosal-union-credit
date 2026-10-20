'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const INPUT       = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
const INPUT_STYLE = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.85)' }
const LABEL       = 'block text-xs font-medium mb-1'
const LABEL_STYLE = { color: 'rgba(255,255,255,0.50)' }

const MIN_LENGTH = 10

export function NewPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm]   = React.useState('')
  const [pending, setPending]   = React.useState(false)
  const [error, setError]       = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_LENGTH} caractères.`)
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setPending(true)
    try {
      const supabase = createClient()
      const { error: updErr } = await supabase.auth.updateUser({ password })
      if (updErr) { setError(updErr.message); return }
      toast.success('Mot de passe mis à jour')
      router.push('/tableau-de-bord')
      router.refresh()
    } catch {
      setError('Une erreur réseau est survenue. Réessayez.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md rounded-xl p-6 space-y-4"
      style={{ background: '#0D1018', border: '1px solid rgba(255,255,255,0.09)' }}>
      <div>
        <label htmlFor="new-password" className={LABEL} style={LABEL_STYLE}>Nouveau mot de passe *</label>
        <input id="new-password" type="password" autoComplete="new-password" required
          minLength={MIN_LENGTH} value={password} onChange={e => setPassword(e.target.value)}
          className={INPUT} style={INPUT_STYLE} />
      </div>
      <div>
        <label htmlFor="confirm-password" className={LABEL} style={LABEL_STYLE}>Confirmer *</label>
        <input id="confirm-password" type="password" autoComplete="new-password" required
          minLength={MIN_LENGTH} value={confirm} onChange={e => setConfirm(e.target.value)}
          className={INPUT} style={INPUT_STYLE} />
      </div>

      {error && (
        <p className="text-xs rounded-lg px-3 py-2"
          style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium"
          style={{ background: '#C41E3A', color: '#fff', opacity: pending ? 0.7 : 1 }}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
          Enregistrer
        </button>
      </div>
    </form>
  )
}
