/** RFC-4180-ish CSV serializer with Excel-friendly UTF-8 BOM. */

export type CsvValue = string | number | boolean | null | undefined | Date

/**
 * Escape a single field per RFC 4180:
 * - Wrap in double-quotes if the value contains comma, double-quote, CR, or LF.
 * - Double any embedded double-quotes.
 */
function escapeField(v: CsvValue): string {
  if (v === null || v === undefined) return ''
  let s: string
  if (v instanceof Date)            s = v.toISOString()
  else if (typeof v === 'number')   s = Number.isFinite(v) ? String(v) : ''
  else if (typeof v === 'boolean')  s = v ? 'true' : 'false'
  else                              s = String(v)

  if (/[",\r\n;]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export interface CsvColumn<T> {
  /** Column header text */
  header: string
  /** Getter — return a primitive or Date */
  get:    (row: T) => CsvValue
}

/** Serialize rows to CSV text. Excel opens UTF-8 properly if saved with BOM. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const headerLine = columns.map(c => escapeField(c.header)).join(',')
  const bodyLines  = rows.map(r => columns.map(c => escapeField(c.get(r))).join(','))
  return [headerLine, ...bodyLines].join('\r\n')
}

/** Trigger a browser download of `content` as `filename`. Adds UTF-8 BOM. */
export function downloadCsv(filename: string, content: string): void {
  const BOM  = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Release the object URL shortly after to avoid leaks
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Convenience: today as YYYY-MM-DD for filenames. */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
