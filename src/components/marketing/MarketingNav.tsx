'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { LinkButton } from '@/components/ui/link-button'
import { BosalBadge } from '@/components/brand/BosalLogo'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '/fonctionnalites' },
  { label: 'Comment ça marche', href: '/comment-ca-marche' },
  { label: 'Tarifs', href: '/tarifs' },
  { label: 'Blog', href: '/blog' },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      <header
        role="banner"
        className={cn(
          'fixed inset-x-0 top-0 z-[40] transition-all duration-200',
          scrolled
            ? 'bg-[#0C0C0E]/95 backdrop-blur-md border-b border-[#252A36] shadow-[0_1px_0_rgba(255,255,255,0.04)]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between px-5 md:px-8"
        >
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] rounded-md"
            aria-label="Bosal Credit Union — Accueil"
          >
            <BosalBadge size={32} />
            <span className="hidden text-[14px] font-medium tracking-[-0.01em] text-white/90 sm:block">
              Bosal <span className="font-bold">Credit Union</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul role="list" className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  className="px-3 py-2 text-[13px] text-white/50 rounded-md transition-colors duration-[120ms] hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] inline-block"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <LinkButton
              href="/login"
              variant="ghost"
              size="sm"
              className="h-9 border border-[#363D52] text-white/70 hover:text-white hover:bg-white/5 hover:border-[#4A5266] text-[13px] font-medium transition-all duration-[120ms]"
            >
              Connexion
            </LinkButton>
            <LinkButton
              href="/inscription"
              size="sm"
              className="h-9 bg-[#C41E3A] hover:bg-[#9B1530] text-white text-[13px] font-medium px-4 shadow-[0_0_16px_rgba(196,30,58,0.25)] hover:shadow-[0_0_24px_rgba(196,30,58,0.40)] transition-all duration-[120ms]"
            >
              Commencer gratuitement
            </LinkButton>
          </div>

          {/* Mobile hamburger — 44×44 touch target */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A]"
          >
            {mobileOpen
              ? <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              : <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            }
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={cn(
          'fixed inset-0 z-[39] md:hidden transition-all duration-[240ms]',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className="absolute inset-0 bg-[#0C0C0E]/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <nav
          className={cn(
            'absolute inset-x-0 top-[60px] bg-[#111318] border-b border-[#252A36] px-5 pb-6 pt-3 transition-transform duration-[240ms] ease-out',
            mobileOpen ? 'translate-y-0' : '-translate-y-4'
          )}
        >
          <ul role="list" className="flex flex-col gap-1 mb-5">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center text-[15px] text-white/60 hover:text-white px-2 rounded-lg hover:bg-white/5 transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2.5">
            <LinkButton
              href="/login"
              variant="ghost"
              size="lg"
              className="w-full h-11 border border-[#363D52] text-white/70 hover:text-white hover:bg-white/5 text-[14px] font-medium justify-center"
              onClick={() => setMobileOpen(false)}
            >
              Connexion
            </LinkButton>
            <LinkButton
              href="/inscription"
              size="lg"
              className="w-full h-11 bg-[#C41E3A] hover:bg-[#9B1530] text-white text-[14px] font-semibold shadow-[0_0_20px_rgba(196,30,58,0.30)] justify-center"
              onClick={() => setMobileOpen(false)}
            >
              Commencer gratuitement
            </LinkButton>
          </div>
        </nav>
      </div>
    </>
  )
}
