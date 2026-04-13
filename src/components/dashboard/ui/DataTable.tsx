'use client'
import * as React from 'react'
import { Inbox } from 'lucide-react'

/* ── Status badge ───────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Actif',      color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'  },
  pending:   { label: 'En attente', color: '#FCD34D', bg: 'rgba(234,179,8,0.10)'  },
  suspended: { label: 'Suspendu',   color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
  closed:    { label: 'Fermé',      color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)' },
  completed: { label: 'Complété',   color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'  },
  defaulted: { label: 'En défaut',  color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
  rejected:  { label: 'Rejeté',     color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
  low:       { label: 'Faible',     color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' },
  medium:    { label: 'Moyen',      color: '#60A5FA', bg: 'rgba(59,130,246,0.10)' },
  high:      { label: 'Élevé',      color: '#FCD34D', bg: 'rgba(245,158,11,0.10)' },
  critical:  { label: 'Critique',   color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
  savings:   { label: 'Épargne',    color: '#60A5FA', bg: 'rgba(59,130,246,0.10)' },
  deposit:   { label: 'Dépôt',      color: '#A78BFA', bg: 'rgba(139,92,246,0.10)' },
  wallet:    { label: 'Wallet',     color: '#34D399', bg: 'rgba(52,211,153,0.10)' },
  open:      { label: 'Ouvert',     color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'  },
  validated: { label: 'Validé',     color: '#60A5FA', bg: 'rgba(59,130,246,0.10)' },
  paid:      { label: 'Payé',       color: '#4ADE80', bg: 'rgba(34,197,94,0.10)'  },
  late:      { label: 'En retard',  color: '#FCD34D', bg: 'rgba(234,179,8,0.10)'  },
  missed:    { label: 'Manqué',     color: '#F87171', bg: 'rgba(239,68,68,0.10)'  },
}

export function StatusBadge({ value }: { value: string }) {
  const cfg = STATUS_CFG[value] ?? { label: value, color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

/* ── Empty state ────────────────────────────────────────────────────────── */
export function EmptyState({ title, description }: {
  title: string; description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ background: 'rgba(255,255,255,0.05)' }}>
        <Inbox size={22} style={{ color: 'rgba(255,255,255,0.20)' }} aria-hidden="true" />
      </div>
      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{title}</p>
      {description && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{description}</p>}
    </div>
  )
}

/* ── Page shell ─────────────────────────────────────────────────────────── */
export function PageShell({ title, description, action, children }: {
  title: string; description?: string
  action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="px-6 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>{title}</h2>
          {description && <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ── Card wrapper ───────────────────────────────────────────────────────── */
export function DataCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className ?? ''}`}
      style={{ background: '#111318', border: '1px solid #252A36' }}>
      {children}
    </div>
  )
}

/* ── Table ──────────────────────────────────────────────────────────────── */
export function Table({ headers, children, empty }: {
  headers: string[]; children: React.ReactNode; empty?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #252A36' }}>
            {headers.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.30)', background: '#0F1117' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function TR({ children, href }: { children: React.ReactNode; href?: string }) {
  const [hovered, setHovered] = React.useState(false)
  const content = (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid #1a1f2e',
        background: hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        cursor: href ? 'pointer' : 'default',
        transition: 'background 100ms',
      }}
    >
      {children}
    </tr>
  )
  return content
}

export function TD({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td className={`px-4 py-3 ${mono ? 'font-mono text-xs' : ''}`}
      style={{ color: 'rgba(255,255,255,0.75)' }}>
      {children}
    </td>
  )
}
