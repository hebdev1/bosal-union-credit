'use server'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/notifications/email'

export type ContactField = 'full_name' | 'email' | 'institution' | 'message' | 'consent'

export type ContactState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string; fields?: Partial<Record<ContactField, string>> }

const ORG_TYPES = ['cooperative', 'microfinance', 'epargne_pret', 'autre'] as const
const MEMBER_RANGES = ['lt_1000', '1000_5000', '5000_20000', 'gt_20000'] as const
// Mirrors the table CHECK (Postgres [:space:] also covers U+0085).
const EMAIL_RE = /^[^@\s\u0085]+@[^@\s\u0085]+\.[^@\s\u0085]+$/u
// Control characters Postgres text cannot store (NUL) or that have no place
// in a contact request. Newlines and tabs stay allowed in the message.
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u0085]/
const LINE_BREAK_RE = /[\t\n\r]/

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

// Length in code points, as Postgres char_length() counts it.
function len(value: string) {
  return [...value].length
}

function allowed(list: readonly string[], value: string) {
  return list.includes(value) ? value : ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Public contact form. The request is stored through the
 * submit_contact_request() database function — the only write path open to
 * anonymous visitors (validated and rate-limited in the database). When
 * RESEND_API_KEY, RESEND_FROM and CONTACT_NOTIFY_EMAIL are configured, the
 * team also receives an e-mail, sent after the response.
 */
export async function submitContactRequest(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: real visitors never fill this hidden field.
  if (text(formData, 'website')) return { status: 'success' }

  const fullName    = text(formData, 'full_name')
  const email       = text(formData, 'email').toLowerCase()
  const institution = text(formData, 'institution')
  const orgType     = allowed(ORG_TYPES, text(formData, 'org_type'))
  const memberRange = allowed(MEMBER_RANGES, text(formData, 'member_range'))
  // Browsers submit line breaks as CRLF; count and store them as the textarea does.
  const message     = text(formData, 'message').replace(/\r\n?/g, '\n')

  const singleLine = (value: string) => !CONTROL_RE.test(value) && !LINE_BREAK_RE.test(value)

  const fields: Partial<Record<ContactField, string>> = {}
  if (len(fullName) < 2 || len(fullName) > 120 || !singleLine(fullName)) fields.full_name = 'Indiquez votre nom complet.'
  if (!EMAIL_RE.test(email) || len(email) > 200 || !singleLine(email)) fields.email = 'Adresse e-mail invalide.'
  if (len(institution) < 2 || len(institution) > 160 || !singleLine(institution)) fields.institution = 'Indiquez le nom de votre institution.'
  if (len(message) < 10 || len(message) > 4000) fields.message = 'Votre message doit contenir entre 10 et 4 000 caractères.'
  else if (CONTROL_RE.test(message)) fields.message = 'Votre message contient des caractères non pris en charge.'
  if (formData.get('consent') !== 'on') fields.consent = 'Merci d’accepter d’être contacté.'
  if (Object.keys(fields).length > 0) {
    return { status: 'error', message: 'Vérifiez les champs indiqués.', fields }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('submit_contact_request', {
    p_full_name:    fullName,
    p_email:        email,
    p_institution:  institution,
    p_org_type:     orgType,
    p_member_range: memberRange,
    p_message:      message,
  })

  if (error) {
    // P0001 = rate limit raised by the function (message is user-facing).
    if (error.code === 'P0001') return { status: 'error', message: error.message }
    // CHECK violation or text the database cannot store.
    if (error.code === '23514' || error.code === '22P05') {
      return { status: 'error', message: 'Vérifiez votre saisie : un champ est trop court ou contient des caractères non pris en charge.' }
    }
    console.error('[contact] submit_contact_request failed:', error.code, error.message)
    return { status: 'error', message: 'Votre demande n’a pas pu être envoyée. Réessayez dans quelques instants.' }
  }

  const notifyTo = process.env.CONTACT_NOTIFY_EMAIL
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM && notifyTo) {
    // The request is stored; the notification must not delay the visitor.
    after(async () => {
      const result = await sendEmail({
        to: notifyTo,
        replyTo: email,
        subject: `Nouvelle demande de démo — ${institution.slice(0, 120)}`,
        html: `<p><strong>${escapeHtml(fullName)}</strong> (${escapeHtml(email)})</p>
<p>Institution : ${escapeHtml(institution)}<br>Type : ${escapeHtml(orgType || '—')}<br>Membres : ${escapeHtml(memberRange || '—')}</p>
<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      })
      if (!result.ok) console.error('[contact] notification e-mail failed:', result.error)
    })
  } else if (process.env.NODE_ENV === 'production') {
    console.warn('[contact] notification e-mail not configured; request stored in contact_requests only')
  }

  return { status: 'success' }
}
