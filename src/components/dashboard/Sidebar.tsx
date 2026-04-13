'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Banknote,
  ArrowLeftRight,
  Landmark,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/usePermissions'

/* ── Types ─────────────────────────────────────────────────────────────── */
interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
  permission?: Parameters<ReturnType<typeof usePermissions>['can']>[0]
  section?: string
}

/* ── Navigation items ───────────────────────────────────────────────────── */
const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', href: '/tableau-de-bord',                    icon: LayoutDashboard, section: 'Principal' },
  { label: 'Membres',          href: '/tableau-de-bord/membres',            icon: Users,            permission: 'members:read',      section: 'Gestion' },
  { label: 'Comptes',          href: '/tableau-de-bord/comptes',            icon: Banknote,         permission: 'accounts:read',     section: 'Gestion' },
  { label: 'Transactions',     href: '/tableau-de-bord/transactions',       icon: ArrowLeftRight,   permission: 'transactions:read', section: 'Gestion' },
  { label: 'Prêts',            href: '/tableau-de-bord/prets',              icon: Landmark,         permission: 'loans:read',        section: 'Gestion' },
  { label: 'Bureau de change', href: '/tableau-de-bord/bureau-de-change',   icon: TrendingUp,       permission: 'exchange:read',     section: 'Services' },
  { label: 'Caisse',           href: '/tableau-de-bord/caisse',             icon: Banknote,         permission: 'vault:read',        section: 'Services' },
  { label: 'Alertes fraude',   href: '/tableau-de-bord/alertes-fraude',     icon: AlertTriangle,    permission: 'fraud:read',        section: 'Sécurité' },
  { label: 'Rapports',         href: '/tableau-de-bord/rapports',           icon: BarChart3,        permission: 'reports:read',      section: 'Analytique' },
  { label: 'Paramètres',       href: '/tableau-de-bord/parametres',         icon: Settings,         permission: 'settings:read',     section: 'Configuration' },
]

/* ── Section grouping ───────────────────────────────────────────────────── */
function getSections(items: NavItem[]) {
  const map = new Map<string, NavItem[]>()
  for (const item of items) {
    const s = item.section ?? 'Autre'
    if (!map.has(s)) map.set(s, [])
    map.get(s)!.push(item)
  }
  return map
}

/* ── Nav item ───────────────────────────────────────────────────────────── */
function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600',
        collapsed && 'justify-center px-2',
        active
          ? 'text-white'
          : 'text-white/50 hover:text-white/85 hover:bg-white/[0.04]'
      )}
      style={
        active
          ? {
              background: '#181D27',
              borderLeft: '2px solid #C41E3A',
              paddingLeft: collapsed ? undefined : '10px',
            }
          : undefined
      }
    >
      <Icon
        size={17}
        aria-hidden="true"
        style={{ color: active ? '#C41E3A' : undefined, flexShrink: 0 }}
      />
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && item.badge && (
        <span
          className="ml-auto min-w-[20px] text-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold kpi-value"
          style={{ background: 'rgba(196,30,58,0.15)', color: '#E8314F' }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  )
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
export function Sidebar() {
  const pathname = usePathname()
  const { can } = usePermissions()

  const [collapsed, setCollapsed] = React.useState(false)

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || can(item.permission)
  )
  const sections = getSections(visibleItems)

  return (
    <aside
      aria-label="Navigation principale"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        transition: 'width 240ms cubic-bezier(0.4,0,0.2,1)',
        background: '#0C0C0E',
        borderRight: '1px solid #252A36',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid #252A36',
          justifyContent: collapsed ? 'center' : undefined,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#C41E3A', boxShadow: '0 0 16px rgba(196,30,58,0.25)' }}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          </svg>
        </div>
        {!collapsed && (
          <span
            className="text-sm font-semibold truncate"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Bosal Union Credit
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2" aria-label="Menu">
        {Array.from(sections.entries()).map(([section, items], sectionIdx) => (
          <div key={section} className={sectionIdx > 0 ? 'mt-4' : ''}>
            {!collapsed && (
              <p
                className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.22)' }}
              >
                {section}
              </p>
            )}
            {collapsed && sectionIdx > 0 && (
              <div className="my-2 mx-2 border-t" style={{ borderColor: '#252A36' }} aria-hidden="true" />
            )}
            <ul className="space-y-0.5" role="list">
              {items.map((item) => (
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

      {/* Toggle collapse button */}
      <div className="flex-shrink-0 px-2 pb-4">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Déplier la barre latérale' : 'Replier la barre latérale'}
          className={cn(
            'flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-xs font-medium transition-all duration-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600',
            collapsed ? 'justify-center' : '',
          )}
          style={{
            color: 'rgba(255,255,255,0.35)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.70)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
        >
          {collapsed
            ? <ChevronRight size={15} aria-hidden="true" />
            : (
              <>
                <ChevronLeft size={15} aria-hidden="true" />
                <span>Replier</span>
              </>
            )
          }
        </button>
      </div>
    </aside>
  )
}
