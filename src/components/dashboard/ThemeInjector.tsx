'use client'
import { useEffect } from 'react'

interface ThemeVars {
  brandColor:       string
  sidebarBg:        string
  surfaceColor:     string
  borderColor:      string
  textPrimary:      string
  textSecondary:    string
  kpiValueColor:    string
}

export function ThemeInjector({ vars }: { vars: ThemeVars }) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-brand',        vars.brandColor)
    root.style.setProperty('--color-sidebar',      vars.sidebarBg)
    root.style.setProperty('--color-surface',      vars.surfaceColor)
    root.style.setProperty('--color-border',       vars.borderColor)
    root.style.setProperty('--color-text-primary', vars.textPrimary)
    root.style.setProperty('--color-text-sec',     vars.textSecondary)
    root.style.setProperty('--color-kpi',          vars.kpiValueColor)
  }, [vars.brandColor, vars.sidebarBg, vars.surfaceColor, vars.borderColor,
      vars.textPrimary, vars.textSecondary, vars.kpiValueColor])

  return null
}
