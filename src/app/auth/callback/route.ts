import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { safeInternalPath } from '@/lib/auth/redirect'

/**
 * Landing point of Supabase e-mail links (password recovery).
 *
 * Exchanges the one-time code for a session cookie, then redirects to
 * `next` (same-origin paths only). Handles both the PKCE `?code=` link and
 * the `?token_hash=&type=` link used by custom e-mail templates.
 *
 * The URL `<site>/auth/callback` must be listed in Supabase → Authentication
 * → URL Configuration → Redirect URLs, otherwise Supabase falls back to the
 * Site URL and the code is never exchanged.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next      = safeInternalPath(searchParams.get('next'))
  const code      = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  const failed = new URL('/mot-de-passe-oublie', origin)
  failed.searchParams.set('erreur', 'lien-invalide')
  return NextResponse.redirect(failed)
}
