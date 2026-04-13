// Tous les montants passent par ces fonctions — jamais de format ad-hoc

export const formatHTG = (n: number | null | undefined): string => {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-HT', {
    style: 'currency',
    currency: 'HTG',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export const formatUSD = (n: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)

export const formatCAD = (n: number): string =>
  new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(n)

export const formatDOP = (n: number): string =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  }).format(n)

export const formatCompact = (n: number): string =>
  new Intl.NumberFormat('fr-HT', {
    notation: 'compact',
    maximumSignificantDigits: 3,
  }).format(n)

export const formatPercent = (n: number): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('fr-HT').format(n)

export const formatDate = (d: string | Date): string =>
  new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(typeof d === 'string' ? new Date(d) : d)

export const formatDateShort = (d: string | Date): string =>
  new Intl.DateTimeFormat('fr-HT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(typeof d === 'string' ? new Date(d) : d)

export const formatTime = (d: string | Date): string =>
  new Intl.DateTimeFormat('fr-HT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof d === 'string' ? new Date(d) : d)

export const formatRelative = (d: string | Date): string => {
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60_000)       return "à l'instant"
  if (diff < 3_600_000)    return `il y a ${Math.floor(diff / 60_000)} min`
  if (diff < 86_400_000)   return `il y a ${Math.floor(diff / 3_600_000)}h`
  if (diff < 172_800_000)  return 'hier'
  return formatDateShort(d)
}

export const formatCurrency = (
  n: number | null | undefined,
  currency: 'HTG' | 'USD' | 'CAD' | 'DOP' = 'HTG'
): string => {
  if (n == null) return '—'
  switch (currency) {
    case 'USD': return formatUSD(n)
    case 'CAD': return formatCAD(n)
    case 'DOP': return formatDOP(n)
    default:    return formatHTG(n)
  }
}
