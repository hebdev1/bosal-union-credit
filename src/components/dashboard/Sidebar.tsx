'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Banknote, ArrowLeftRight,
  Landmark, TrendingUp, Vault, AlertTriangle,
  BarChart3, Settings, ChevronLeft, ChevronRight,
  BookCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  section: string
}

const NAV: NavItem[] = [
  { label: 'Tableau de bord', href: '/tableau-de-bord',                   icon: LayoutDashboard, section: 'Principal'     },
  { label: 'Membres',          href: '/tableau-de-bord/membres',           icon: Users,           section: 'Gestion'       },
  { label: 'Comptes',          href: '/tableau-de-bord/comptes',           icon: Banknote,        section: 'Gestion'       },
  { label: 'Transactions',     href: '/tableau-de-bord/transactions',      icon: ArrowLeftRight,  section: 'Gestion'       },
  { label: 'Prêts',            href: '/tableau-de-bord/prets',             icon: Landmark,        section: 'Gestion'       },
  { label: 'Bureau de change', href: '/tableau-de-bord/bureau-de-change',  icon: TrendingUp,      section: 'Services'      },
  { label: 'Caisse (Vault)',   href: '/tableau-de-bord/caisse',            icon: Vault,           section: 'Services'      },
  { label: 'Clôture journée',  href: '/tableau-de-bord/cloture',          icon: BookCheck,       section: 'Services'      },
  { label: 'Alertes fraude',   href: '/tableau-de-bord/alertes-fraude',   icon: AlertTriangle,   section: 'Sécurité'      },
  { label: 'Rapports',         href: '/tableau-de-bord/rapports',          icon: BarChart3,       section: 'Analytique'    },
  { label: 'Paramètres',       href: '/tableau-de-bord/parametres',       icon: Settings,        section: 'Configuration' },
]

function groupBy(items: NavItem[]) {
  const map = new Map<string, NavItem[]>()
  for (const item of items) {
    if (!map.has(item.section)) map.set(item.section, [])
    map.get(item.section)!.push(item)
  }
  return map
}

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600',
        collapsed ? 'justify-center px-0 py-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5',
        active ? 'nav-link-active' : 'nav-link-idle'
      )}
      style={active ? {
        background: 'linear-gradient(90deg, rgba(196,30,58,0.12) 0%, rgba(196,30,58,0.04) 100%)',
        color: 'rgba(255,255,255,0.95)',
        boxShadow: 'inset 3px 0 0 var(--color-brand, #C41E3A)',
      } : {
        color: 'rgba(255,255,255,0.42)',
        background: 'transparent',
      }}
      onMouseEnter={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'rgba(255,255,255,0.05)'
          el.style.color = 'rgba(255,255,255,0.78)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.background = 'transparent'
          el.style.color = 'rgba(255,255,255,0.42)'
        }
      }}
    >
      <Icon
        size={16}
        aria-hidden="true"
        style={{
          color: active ? 'var(--color-brand, #C41E3A)' : 'inherit',
          flexShrink: 0,
          transition: 'color 150ms',
        }}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const sections = groupBy(NAV)

  return (
    <aside
      aria-label="Navigation principale"
      style={{
        width: collapsed ? 64 : 256,
        transition: 'width 240ms cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--color-sidebar, #080A0F)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{
          height: 56,
          padding: collapsed ? '0 12px' : '0 20px',
          justifyContent: collapsed ? 'center' : undefined,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'var(--color-brand, #C41E3A)',
            boxShadow: '0 0 20px rgba(196,30,58,0.35), 0 2px 8px rgba(0,0,0,0.4)',
          }}
          aria-hidden="true"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.95" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
          </svg>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="block text-[13px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
              Bosal Union Credit
            </span>
            <span className="block text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Cooperative
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5" style={{ padding: collapsed ? '16px 10px' : '16px 10px' }} aria-label="Menu">
        {Array.from(sections.entries()).map(([section, items]) => (
          <div key={section}>
            {!collapsed ? (
              <p
                className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: 'rgba(255,255,255,0.18)' }}
              >
                {section}
              </p>
            ) : (
              <div
                className="mb-2"
                style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 8px 8px' }}
                aria-hidden="true"
              />
            )}
            <ul className="space-y-0.5" role="list">
              {items.map(item => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    collapsed={collapsed}
                    active={
                      item.href === '/tableau-de-bord'
                        ? pathname === '/tableau-de-bord'
                        : pathname.startsWith(item.href)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div
        className="flex-shrink-0 pb-4"
        style={{ padding: collapsed ? '0 10px 16px' : '0 10px 16px' }}
      >
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} aria-hidden="true" />
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600',
            collapsed ? 'justify-center px-0 py-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5',
          )}
          style={{ color: 'rgba(255,255,255,0.28)', background: 'transparent' }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.05)'
            el.style.color = 'rgba(255,255,255,0.60)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'transparent'
            el.style.color = 'rgba(255,255,255,0.28)'
          }}
        >
          {collapsed
            ? <ChevronRight size={14} aria-hidden="true" />
            : <><ChevronLeft size={14} aria-hidden="true" /><span>Replier</span></>
          }
        </button>
      </div>
    </aside>
  )
}
