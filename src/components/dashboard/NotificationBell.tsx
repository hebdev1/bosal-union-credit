'use client'

import * as React from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'

interface Notification {
  id: string
  type: string
  message: string
  sent_at: string | null
  read_at: string | null
}

const TYPE_LABELS: Record<string, string> = {
  loan_approved: 'Prêt approuvé',
  loan_due: 'Échéance',
  loan_late: 'Retard',
  exchange_receipt: 'Change',
  fraud_alert: 'Alerte fraude',
  member_created: 'Nouveau membre',
  password_reset: 'Mot de passe',
  generic: 'Info',
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<Notification[]>([])
  const [unread, setUnread] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as { items: Notification[]; unreadCount: number }
      setItems(json.items)
      setUnread(json.unreadCount)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
    const i = setInterval(load, 60_000)
    return () => clearInterval(i)
  }, [load])

  React.useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  async function markOne(id: string) {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    load()
  }

  async function markAll() {
    await fetch('/api/notifications/read', { method: 'POST', body: '{}' })
    load()
  }

  function formatTime(iso: string | null): string {
    if (!iso) return ''
    const d = new Date(iso)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return 'à l\'instant'
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
    return d.toLocaleDateString('fr-FR')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unread ? ` (${unread} non lues)` : ''}`}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        style={{
          color: open ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.38)',
          background: open ? 'rgba(255,255,255,0.06)' : 'transparent',
        }}
      >
        <Bell size={16} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-[10px] font-bold"
            style={{
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: '#C41E3A',
              color: '#fff',
              boxShadow: '0 0 0 2px rgba(8,10,15,0.92)',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 rounded-xl z-50"
          style={{
            width: 360,
            maxHeight: 480,
            background: '#111520',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                <CheckCheck size={12} /> Tout marquer lu
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ flex: 1 }}>
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
                Chargement…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
                Aucune notification
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="group px-4 py-3 flex items-start gap-3 transition-colors"
                  style={{
                    background: n.read_at ? 'transparent' : 'rgba(196,30,58,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: 'rgba(196,30,58,0.85)' }}
                    >
                      {TYPE_LABELS[n.type] ?? n.type}
                    </p>
                    <p
                      className="text-[13px] mt-1"
                      style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}
                    >
                      {n.message}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.32)' }}>
                      {formatTime(n.sent_at)}
                    </p>
                  </div>
                  {!n.read_at && (
                    <button
                      type="button"
                      onClick={() => markOne(n.id)}
                      aria-label="Marquer comme lue"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center"
                      style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)' }}
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
