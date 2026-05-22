/** Shared config for all PDF report generators */
export interface PdfReportConfig {
  headerColor:  string
  accentColor:  string
  textColor:    string
  footerText:   string
  logoUrl:      string
  logoEnabled:  boolean
}

export const DEFAULT_PDF_CONFIG: PdfReportConfig = {
  headerColor: '#0C0C0E',
  accentColor: '#C41E3A',
  textColor:   '#111318',
  footerText:  'Bosal Credit Union — Document confidentiel',
  logoUrl:     '',
  logoEnabled: true,
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ]
  }
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ]
}

export async function urlToBase64(url: string): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror   = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

export function buildPdfConfig(
  settings: Array<{ key: string; value: unknown }>
): PdfReportConfig {
  const get = (key: string) =>
    String(settings.find(s => s.key === key)?.value ?? '').replace(/"/g, '').trim()

  return {
    headerColor: get('pdf_header_color')  || DEFAULT_PDF_CONFIG.headerColor,
    accentColor: get('pdf_accent_color')  || DEFAULT_PDF_CONFIG.accentColor,
    textColor:   get('pdf_text_color')    || DEFAULT_PDF_CONFIG.textColor,
    footerText:  get('pdf_footer_text')   || DEFAULT_PDF_CONFIG.footerText,
    logoUrl:     get('pdf_logo_url')      || '',
    logoEnabled: get('pdf_logo_enabled')  !== 'false',
  }
}

/** Minimal ticket config — mirrors TicketConfig in ExchangeTicketPDF.ts (no cross-import) */
export interface TicketConfigShape {
  accent_color:       string
  received_color:     string
  withdrawal_color?:  string
  header_color?:      string
  header_text_color?: string
  text_color?:        string   // body text color (defaults to print-friendly slate)
  footer_text?:       string
  logo_url?:          string
  logo_enabled?:      boolean
}

export function buildTicketConfig(
  settings: Array<{ key: string; value: unknown }>
): TicketConfigShape {
  const get = (key: string) =>
    String(settings.find(s => s.key === key)?.value ?? '').replace(/"/g, '').trim()

  return {
    accent_color:       get('ticket_accent_color')       || '#C41E3A',
    received_color:     get('ticket_received_color')     || '#16A34A',
    withdrawal_color:   get('ticket_withdrawal_color')   || '#DC2626',
    header_color:       get('ticket_header_color')       || '#0E0E12',
    header_text_color:  get('ticket_header_text_color')  || '',
    text_color:         get('ticket_text_color')         || '#0F172A',
    footer_text:        get('ticket_footer_text')        || 'Merci de votre confiance · Conservez ce reçu',
    logo_url:           get('pdf_logo_url')              || '',
    logo_enabled:       get('pdf_logo_enabled')          !== 'false',
  }
}
