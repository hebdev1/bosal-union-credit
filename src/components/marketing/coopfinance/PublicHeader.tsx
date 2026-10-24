'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { CoopFinanceLogo } from './Logo'

export const PUBLIC_NAV = [
  { label: 'Accueil', href: '/' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Tarification', href: '/tarifs' },
  { label: 'Sécurité', href: '/securite' },
  { label: 'Contact', href: '/contact' },
] as const

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function PublicHeader() {
  const pathname = usePathname()
  // The mobile menu is open for the page it was opened on: navigating to
  // another page closes it without an effect.
  const [menuPath, setMenuPath] = useState<string | null>(null)
  const menu = menuPath === pathname
  const buttonRef = useRef<HTMLButtonElement>(null)
  const close = () => setMenuPath(null)

  // Escape closes the menu and returns focus to its toggle.
  useEffect(() => {
    if (!menu) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuPath(null)
      buttonRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu])

  return (
    <header className="public-header">
      <Link href="/" className="public-logo" aria-label="CoopFinance — Accueil">
        <CoopFinanceLogo />
      </Link>

      {/* The toggle comes before the nav so that, once the menu is open,
          Tab moves straight into its links. Hidden on wide screens. */}
      <button
        ref={buttonRef}
        type="button"
        className="public-menu"
        onClick={() => setMenuPath(menu ? null : pathname)}
        aria-label={menu ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={menu}
        aria-controls="public-nav"
      >
        {menu ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
      </button>

      <nav
        id="public-nav"
        aria-label="Navigation principale"
        className={menu ? 'public-links open' : 'public-links'}
      >
        {PUBLIC_NAV.map(item => {
          const active = isActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'active' : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={close}
            >
              {item.label}
            </Link>
          )
        })}
        <Link href="/login" className="mobile-login" onClick={close}>Se connecter</Link>
      </nav>

      <div className="public-actions">
        <Link href="/login" className="public-login">Se connecter</Link>
        <Link href="/contact" className="public-cta">
          Demander une démo <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
