'use client'
import * as React from 'react'
import { MoonStar, Loader2, Check, X } from 'lucide-react'
import { closeDay } from '@/app/(dashboard)/tableau-de-bord/cloture/actions'
import { useRouter } from 'next/navigation'

export function CloseDayButton() {
  const router = useRouter()
  const [state, setState] = React.useState<'idle' | 'confirm' | 'loading' | 'success' | 'error'>('idle')
  const [errMsg, setErrMsg] = React.useState('')

  async function handleConfirm() {
    setState('loading')
    const result = await closeDay()
    if ('error' in result) {
      setErrMsg(result.error)
      setState('error')
      setTimeout(() => setState('idle'), 3500)
      return
    }
    setState('success')
    setTimeout(() => {
      router.refresh()
      setState('idle')
    }, 1800)
  }

  if (state === 'confirm') {
    return (
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Clôturer la journée ?</span>
        <button type="button" onClick={handleConfirm}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold"
          style={{ background: '#C41E3A', color: '#fff' }}>
          <Check size={12} /> Confirmer
        </button>
        <button type="button" onClick={() => setState('idle')}
          className="flex items-center gap-1 h-8 px-2 rounded-lg text-xs"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}>
          <X size={12} />
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <button disabled className="flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-medium flex-shrink-0"
        style={{ background: 'rgba(196,30,58,0.15)', color: '#E8314F', border: '1px solid rgba(196,30,58,0.25)', opacity: 0.7 }}>
        <Loader2 size={12} className="animate-spin" />
        Clôture en cours…
      </button>
    )
  }

  if (state === 'success') {
    return (
      <button disabled className="flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-medium flex-shrink-0"
        style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}>
        <Check size={12} />
        Journée clôturée
      </button>
    )
  }

  if (state === 'error') {
    return (
      <button type="button" onClick={() => setState('idle')}
        className="flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-medium flex-shrink-0"
        style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' }}>
        <X size={12} />
        {errMsg || 'Erreur'}
      </button>
    )
  }

  return (
    <button type="button" onClick={() => setState('confirm')}
      className="flex items-center gap-2 h-8 px-4 rounded-lg text-xs font-medium flex-shrink-0 transition-colors"
      style={{ background: 'rgba(196,30,58,0.10)', color: '#E8314F', border: '1px solid rgba(196,30,58,0.22)' }}>
      <MoonStar size={12} />
      Fermer la journée
    </button>
  )
}
