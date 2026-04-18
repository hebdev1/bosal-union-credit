'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  TrendingUp,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const BOTTOM_NAV = [
  { label: 'Accueil',        href: '/tableau-de-bord',                  icon: LayoutDashboard },
  { label: 'Membres',        href: '/tableau-de-bord/membres',           icon: Users },
  { label: 'Transactions',   href: '/tableau-de-bord/transactions',      icon: ArrowLeftRight },
  { label: 'Change',         href: '/tableau-de-bord/bureau-de-change',  icon: TrendingUp },
  { label: 'Paramètres',     href: '/tableau-de-bord/parametres',        icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40"
      style={{
        background: '#0C0C0E',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <ul className="flex items-stretch" role="list">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/tableau-de-bord'
              ? pathname === '/tableau-de-bord'
              : pathname.startsWith(item.href)

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-600"
                style={{ color: active ? '#C41E3A' : 'rgba(255,255,255,0.38)' }}
              >
                <Icon
                  size={20}
                  aria-hidden="true"
                  className="transition-transform duration-120"
                  style={{ transform: active ? 'scale(1.08)' : 'scale(1)' }}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
