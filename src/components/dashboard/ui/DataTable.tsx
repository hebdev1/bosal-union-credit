'use client'
import * as React from 'react'
import { Inbox } from 'lucide-react'

/* ── Status badge ───────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot?: string }> = {
  active:    { label: 'Actif',      color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  dot: '#4ADE80' },
  pending:   { label: 'En attente', color: '#FCD34D', bg: 'rgba(252,211,77,0.10)',  dot: '#FCD34D' },
  suspended: { label: 'Suspendu',   color: '#F87171', bg: 'rgba(248,113,113,0.10)', dot: '#F87171' },
  closed:    { label: 'Fermé',      color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.05)' },
  completed: { label: 'Complété',   color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  dot: '#4ADE80' },
  defaulted: { label: 'En défaut',  color: '#F87171', bg: 'rgba(248,113,113,0.10)', dot: '#F87171' },
  rejected:  { label: 'Rejeté',     color: '#F87171', bg: 'rgba(248,113,113,0.10)', dot: '#F87171' },
  low:       { label: 'Faible',     color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' },
  medium:    { label: 'Moyen',      color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  dot: '#60A5FA' },
  high:      { label: 'Élevé',      color: '#FCD34D', bg: 'rgba(252,211,77,0.10)',  dot: '#FCD34D' },
  critical:  { label: 'Critique',   color: '#F87171', bg: 'rgba(248,113,113,0.10)', dot: '#F87171' },
  savings:   { label: 'Épargne',    color: '#60A5FA', bg: 'rgba(96,165,250,0.10)'  },
  deposit:   { label: 'Dépôt',      color: '#A78BFA', bg: 'rgba(167,139,250,0.10)' },
  wallet:    { label: 'Wallet',     color: '#34D399', bg: 'rgba(52,211,153,0.10)'  },
  open:      { label: 'Ouvert',     color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  dot: '#4ADE80' },
  validated: { label: 'Validé',     color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  dot: '#60A5FA' },
  paid:      { label: 'Payé',       color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  dot: '#4ADE80' },
  late:      { label: 'En retard',  color: '#FCD34D', bg: 'rgba(252,211,77,0.10)',  dot: '#FCD34D' },
  missed:    { label: 'Manqué',     color: '#F87171', bg: 'rgba(248,113,113,0.10)', dot: '#F87171' },
}

export function StatusBadge({ value }: { value: string }) {
  const cfg = STATUS_CFG[value] ?? { label: value, color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.06)' }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px 2px 6px' }}
    >
      {cfg.dot && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: cfg.dot,
            flexShrink: 0,
            display: 'inline-block',
          }}
          aria-hidden="true"
        />
      )}
      {cfg.label}
    </span>
  )
}

/* ── Empty state ────────────────────────────────────────────────────────── */
export function EmptyState({ title, description }: {
  title: string; description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="flex items-center justify-center mb-4"
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        aria-hidden="true"
      >
        <Inbox size={20} style={{ color: 'rgba(255,255,255,0.18)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>{title}</p>
      {description && (
        <p className="text-xs mt-1 max-w-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>{description}</p>
      )}
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
          <h2
            className="text-[17px] font-semibold"
            style={{ color: 'rgba(255,255,255,0.94)', letterSpacing: '-0.025em', lineHeight: 1.3 }}
          >
            {title}
          </h2>
          {description && (
            <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.32)' }}>
              {description}
            </p>
          )}
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
    <div
      className={`rounded-xl overflow-hidden ${className ?? ''}`}
      style={{
        background: '#0D1018',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </div>
  )
}

/* ── Table ──────────────────────────────────────────────────────────────── */
export function Table({ headers, children }: {
  headers: string[]; children: React.ReactNode; empty?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {headers.map(h => (
              <th
                key={h}
                className="px-4 py-3 text-left text-[11px] font-semibold uppercase"
                style={{
                  color: 'rgba(255,255,255,0.28)',
                  background: 'rgba(255,255,255,0.02)',
                  letterSpacing: '0.07em',
                  whiteSpace: 'nowrap',
                }}
              >
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
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        cursor: href ? 'pointer' : 'default',
        transition: 'background 120ms',
      }}
    >
      {children}
    </tr>
  )
}

export function TD({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      className={`px-4 py-3.5 ${mono ? 'font-mono' : ''}`}
      style={{
        color: 'rgba(255,255,255,0.72)',
        fontSize: mono ? 12 : 13,
      }}
    >
      {children}
    </td>
  )
}
