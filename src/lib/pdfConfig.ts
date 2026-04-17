/** Shared config for all PDF report generators */
export interface PdfReportConfig {
  headerColor:  string   // hex, header band background
  accentColor:  string   // hex, title text & highlights
  textColor:    string   // hex, data text
  footerText:   string   // footer label
  logoUrl:      string   // public URL (empty = no logo)
  logoEnabled:  boolean
}

export const DEFAULT_PDF_CONFIG: PdfReportConfig = {
  headerColor: '#0C0C0E',
  accentColor: '#C41E3A',
  textColor:   '#111318',
  footerText:  'Bosal Union Crédit — Document confidentiel',
  logoUrl:     '',
  logoEnabled: true,
}

/** Convert #RRGGBB or #RGB to [r, g, b] tuple */
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

/** Fetch a public image URL as base64 data URL for jsPDF.addImage() */
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

/** Build a PdfReportConfig from raw app_settings values */
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
