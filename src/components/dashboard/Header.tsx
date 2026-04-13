'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAgent } from '@/hooks/useAgent'

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

  /* Close on outside click */
  React.useEffect(() => {
    if (!menuOpen) return
    function handle(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  /* Close on Escape */
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

  const initials =
    agent
      ? `${agent.first_name?.[0] ?? ''}${agent.last_name?.[0] ?? ''}`.toUpperCase() || 'A'
      : '…'

  const fullName = agent ? `${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim() : ''
  const roleLabel = agent?.role ? (ROLE_LABELS[agent.role] ?? agent.role) : ''

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0 z-20"
      style={{
        height: 'var(--header-height)',
        background: '#0C0C0E',
        borderBottom: '1px solid #252A36',
        position: 'sticky',
        top: 0,
      }}
      aria-label="En-tête de l'application"
    >
      {/* Page title */}
      <h1
        className="text-sm font-semibold truncate"
        style={{ color: 'rgba(255,255,255,0.85)' }}
      >
        {title ?? 'Tableau de bord'}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          style={{ color: 'rgba(255,255,255,0.45)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#181D27'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
        >
          <Bell size={17} aria-hidden="true" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu utilisateur"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{ background: menuOpen ? '#181D27' : 'transparent' }}
            onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.background = '#181D27' }}
            onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: '#C41E3A', color: '#fff' }}
              aria-hidden="true"
            >
              {initials}
            </div>
            {/* Name */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.90)' }}>
                {fullName || 'Agent'}
              </p>
              {roleLabel && (
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {roleLabel}
                </p>
              )}
            </div>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="transition-transform duration-120"
              style={{
                color: 'rgba(255,255,255,0.35)',
                transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)',
              }}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              aria-label="Options utilisateur"
              className="absolute right-0 mt-1.5 w-52 rounded-xl py-1 z-50"
              style={{
                background: '#181D27',
                border: '1px solid #252A36',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                top: '100%',
              }}
            >
              {/* User info header */}
              <div
                className="px-3 py-2.5 border-b"
                style={{ borderColor: '#252A36' }}
              >
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  {fullName || 'Agent'}
                </p>
                {agent?.email && (
                  <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {agent.email}
                  </p>
                )}
              </div>

              {/* Profil */}
              <button
                role="menuitem"
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-white/5"
                style={{ color: 'rgba(255,255,255,0.70)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.90)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.70)' }}
                onClick={() => { setMenuOpen(false); router.push('/tableau-de-bord/profil') }}
              >
                <User size={15} aria-hidden="true" />
                Mon profil
              </button>

              {/* Séparateur */}
              <div className="my-1 border-t" style={{ borderColor: '#252A36' }} aria-hidden="true" />

              {/* Déconnexion */}
              <button
                role="menuitem"
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-red-900/20"
                style={{ color: '#F87171' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                onClick={signOut}
              >
                <LogOut size={15} aria-hidden="true" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
