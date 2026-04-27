'use client'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateMemberStatus } from '@/app/(dashboard)/tableau-de-bord/membres/actions'

type Status = 'active' | 'suspended' | 'closed' | 'pending'

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Actif',     color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.30)' },
  pending:   { label: 'En attente', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.30)' },
  suspended: { label: 'Suspendu',  color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.30)' },
  closed:    { label: 'Clôturé',   color: 'rgba(255,255,255,0.55)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)' },
}

const ALL: Status[] = ['active', 'pending', 'suspended', 'closed']

export function MemberStatusPicker({ memberId, current }: { memberId: string; current: Status }) {
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState<Status>(current)
  const [pending, setPending] = React.useState(false)
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  // Keep optimistic state synced with prop after server revalidation
  React.useEffect(() => { setStatus(current) }, [current])

  // Compute menu position whenever it opens (and on scroll/resize)
  const updateCoords = React.useCallback(() => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setCoords({ top: r.bottom + 6, left: r.left })
  }, [])

  React.useEffect(() => {
    if (!open) { setCoords(null); return }
    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [open, updateCoords])

  // Click-away
  React.useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function key(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  async function pick(next: Status) {
    if (next === status || pending) { setOpen(false); return }
    setPending(true)
    setOpen(false)
    const prev = status
    setStatus(next) // optimistic
    const res = await updateMemberStatus(memberId, next)
    if (res?.error) {
      setStatus(prev)
      toast.error(res.error)
    } else {
      toast.success(`Statut mis à jour : ${STATUS_META[next].label}`)
    }
    setPending(false)
  }

  const meta = STATUS_META[status]

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(v => !v) }}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Changer le statut"
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all disabled:opacity-60 cursor-pointer hover:brightness-110"
        style={{
          background: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.border}`,
        }}
      >
        {pending ? <Loader2 size={11} className="animate-spin" aria-hidden /> : null}
        {meta.label}
        <ChevronDown size={11} aria-hidden style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {mounted && open && coords && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed min-w-[180px] rounded-xl py-1 overflow-hidden"
          style={{
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.10)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
          }}
        >
          {ALL.map(s => {
            const m = STATUS_META[s]
            const active = s === status
            return (
              <button
                key={s}
                type="button"
                role="menuitem"
                onClick={() => pick(s)}
                className="flex items-center justify-between w-full px-3 py-2 text-[12px] font-medium transition-colors"
                style={{ color: '#000000' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#3B82F6'
                  ;(e.currentTarget as HTMLElement).style.color      = '#ffffff'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color      = '#000000'
                }}
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
                  {m.label}
                </span>
                {active && <Check size={12} aria-hidden />}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </>
  )
}
