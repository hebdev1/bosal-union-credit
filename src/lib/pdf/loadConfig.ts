import { createClient } from '@/lib/supabase/server'
import { buildPdfConfig, DEFAULT_PDF_CONFIG, type PdfReportConfig } from '@/lib/pdfConfig'

/** Loads the PDF report config from app_settings (category='pdf'). Never throws. */
export async function loadPdfReportConfig(): Promise<PdfReportConfig> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('app_settings').select('key, value').eq('category', 'pdf')
    return buildPdfConfig((data ?? []) as { key: string; value: unknown }[])
  } catch {
    return DEFAULT_PDF_CONFIG
  }
}
