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
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600',
        collapsed && 'justify-center px-2',
      )}
      style={{
        color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
        background: active ? '#181D27' : 'transparent',
        borderLeft: active ? '2px solid var(--color-brand, #C41E3A)' : '2px solid transparent',
        paddingLeft: active && !collapsed ? 10 : undefined,
      }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.80)' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' } }}
    >
      <Icon size={17} aria-hidden="true" style={{ color: active ? 'var(--color-brand, #C41E3A)' : 'inherit', flexShrink: 0 }} />
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
        width: collapsed ? 60 : 260,
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--color-sidebar, #0C0C0E)',
        borderRight: '1px solid #252A36',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 56, borderBottom: '1px solid #252A36', justifyContent: collapsed ? 'center' : undefined }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-brand, #C41E3A)', boxShadow: '0 0 16px rgba(196,30,58,0.25)' }} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Bosal Union Credit
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4" aria-label="Menu">
        {Array.from(sections.entries()).map(([section, items]) => (
          <div key={section}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.20)' }}>
                {section}
              </p>
            )}
            {collapsed && (
              <div className="mx-2 mb-2 border-t" style={{ borderColor: '#252A36' }} aria-hidden="true" />
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
      <div className="flex-shrink-0 px-2 pb-4">
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Déplier' : 'Replier'}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600',
            collapsed && 'justify-center',
          )}
          style={{ color: 'rgba(255,255,255,0.30)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.30)' }}
        >
          {collapsed ? <ChevronRight size={15} aria-hidden="true" /> : <><ChevronLeft size={15} aria-hidden="true" /><span>Replier</span></>}
        </button>
      </div>
    </aside>
  )
}
