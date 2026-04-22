'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAgent } from '@/hooks/useAgent'
import { NotificationBell } from './NotificationBell'
import { CloseDayButton } from './forms/CloseDayButton'

const ROLE_LABELS: Record<string, string> = {
  admin:   'Administrateur',
  manager: 'Gestionnaire',
  cashier: 'Caissier',
}

export function Header({ title }: { title?: string }) {
  const router = useRouter()
  const { agent } = useAgent()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  React.useEffect(() => {
    if (!menuOpen) return
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') { setMenuOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [menuOpen])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Déconnexion réussie')
    router.push('/login')
    router.refresh()
  }

  const displayName = agent?.name ?? 'Agent'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'A'
  const roleLabel = agent?.role ? (ROLE_LABELS[agent.role] ?? agent.role) : ''

  return (
    <header
      className="flex items-center justify-between flex-shrink-0 z-20"
      style={{
        height: 'var(--header-height, 56px)',
        paddingLeft: 24,
        paddingRight: 20,
        background: 'rgba(8,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Page title */}
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: 'var(--color-brand, #C41E3A)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        <h1
          className="text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}
        >
          {title ?? 'Tableau de bord'}
        </h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Close day */}
        <CloseDayButton />

        {/* Notification bell */}
        <NotificationBell />

        {/* Separator */}
        <div
          style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }}
          aria-hidden="true"
        />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu utilisateur"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{
              background: menuOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: `1px solid ${menuOpen ? 'rgba(255,255,255,0.10)' : 'transparent'}`,
            }}
            onMouseEnter={e => {
              if (!menuOpen) {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'rgba(255,255,255,0.05)'
                el.style.borderColor = 'rgba(255,255,255,0.08)'
              }
            }}
            onMouseLeave={e => {
              if (!menuOpen) {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'transparent'
                el.style.borderColor = 'transparent'
              }
            }}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--color-brand, #C41E3A)',
                color: '#fff',
                boxShadow: '0 0 0 2px rgba(196,30,58,0.25)',
              }}
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}>
                {displayName}
              </p>
              {roleLabel && (
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                  {roleLabel}
                </p>
              )}
            </div>

            <ChevronDown
              size={13}
              aria-hidden="true"
              className="transition-transform duration-150"
              style={{
                color: 'rgba(255,255,255,0.30)',
                transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-xl py-1 z-50"
              style={{
                background: '#111520',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4)',
                top: '100%',
              }}
            >
              {/* User info */}
              <div className="px-3.5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--color-brand, #C41E3A)',
                      color: '#fff',
                    }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-tight truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
                      {displayName}
                    </p>
                    {agent?.email && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>
                        {agent.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  role="menuitem"
                  type="button"
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] transition-all duration-100 focus-visible:outline-none"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'rgba(255,255,255,0.05)'
                    el.style.color = 'rgba(255,255,255,0.90)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'transparent'
                    el.style.color = 'rgba(255,255,255,0.65)'
                  }}
                  onClick={() => { setMenuOpen(false); router.push('/tableau-de-bord/parametres') }}
                >
                  <User size={14} aria-hidden="true" />
                  Mon profil
                </button>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} aria-hidden="true" />

              <div className="py-1">
                <button
                  role="menuitem"
                  type="button"
                  className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] transition-all duration-100 focus-visible:outline-none"
                  style={{ color: '#F87171' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  onClick={signOut}
                >
                  <LogOut size={14} aria-hidden="true" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
