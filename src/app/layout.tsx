import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mache Kay BOSAL',
    template: '%s — Mache Kay BOSAL',
  },
  description: "Mache Kay BOSAL — la force de la coopérative. Plateforme core banking pour coopératives financières haïtiennes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#181D27',
              border: '1px solid #252A36',
              color: 'rgba(255,255,255,0.95)',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
