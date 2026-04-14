'use client'
import * as React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { closeAccount } from '@/app/(dashboard)/tableau-de-bord/comptes/actions'

export function CloseAccountButton({
  accountId,
  accountNumber,
}: {
  accountId: string
  accountNumber: string
}) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleClose() {
    setPending(true)
    setError(null)
    try {
      await closeAccount(accountId)
      setOpen(false)
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Erreur inconnue')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-2.5 py-1 text-xs font-medium transition-colors"
        style={{
          background: 'rgba(239,68,68,0.08)',
          color: '#F87171',
          border: '1px solid rgba(239,68,68,0.20)',
        }}
      >
        Fermer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setError(null) } }}
        >
          <div
            className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: '#111318', border: '1px solid #252A36' }}
          >
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.12)' }}
                >
                  <AlertTriangle size={18} style={{ color: '#F87171' }} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                    Fermer le compte
                  </h2>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {accountNumber}
                  </p>
                </div>
              </div>

              <div
                className="rounded-xl px-4 py-3.5 text-sm mb-4"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}
              >
                <p style={{ color: 'rgba(255,255,255,0.70)' }}>
                  La fermeture entraîne automatiquement une déduction de{' '}
                  <span className="font-bold" style={{ color: '#F87171' }}>200 HTG</span>
                  {' '}du solde à titre de frais de clôture. Cette action est{' '}
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>irréversible</span>.
                </p>
              </div>

              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2 mb-3"
                  style={{
                    background: 'rgba(239,68,68,0.10)',
                    color: '#F87171',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null) }}
                className="flex-1 h-9 rounded-lg text-sm font-medium"
                style={{
                  background: 'transparent',
                  border: '1px solid #252A36',
                  color: 'rgba(255,255,255,0.60)',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={pending}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium"
                style={{ background: '#C41E3A', color: '#fff', opacity: pending ? 0.65 : 1 }}
              >
                {pending && <Loader2 size={13} className="animate-spin" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
