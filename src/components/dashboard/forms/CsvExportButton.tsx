'use client'
import * as React from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { toCsv, downloadCsv, todayStamp, type CsvColumn } from '@/lib/csv'

interface Props<T> {
  /** Rows to export */
  rows:     T[]
  /** Column definitions — header + getter */
  columns:  CsvColumn<T>[]
  /** Base filename — date stamp and .csv extension are appended automatically */
  filename: string
  /** Optional label override */
  label?:   string
  /** Optional variant: "solid" (brand) or "ghost" (subtle) */
  variant?: 'solid' | 'ghost'
  /** Optional disabled override */
  disabled?: boolean
}

export function CsvExportButton<T>({ rows, columns, filename, label, variant = 'ghost', disabled }: Props<T>) {
  const [busy, setBusy] = React.useState(false)

  async function handleExport() {
    setBusy(true)
    try {
      const csv = toCsv(rows, columns)
      downloadCsv(`${filename}-${todayStamp()}.csv`, csv)
    } finally {
      setBusy(false)
    }
  }

  const isEmpty = rows.length === 0
  const isDisabled = busy || disabled || isEmpty

  const styles: React.CSSProperties = variant === 'solid'
    ? { background: '#15803D', color: '#fff', opacity: isDisabled ? 0.55 : 1 }
    : {
        background: 'rgba(34,197,94,0.08)',
        color:      '#4ADE80',
        border:     '1px solid rgba(34,197,94,0.22)',
        opacity:    isDisabled ? 0.55 : 1,
      }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled}
      title={isEmpty ? 'Aucune donnée à exporter' : 'Télécharger au format CSV'}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity"
      style={styles}
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />}
      {label ?? 'Exporter CSV'}
    </button>
  )
}
