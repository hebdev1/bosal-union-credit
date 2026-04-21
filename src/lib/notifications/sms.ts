/**
 * SMS / WhatsApp — provider Twilio.
 * Usage : await sendSms({ to: '+50936000000', body: 'Votre code : 123456' })
 *
 * Config env:
 *   TWILIO_ACCOUNT_SID=ACxxxx
 *   TWILIO_AUTH_TOKEN=xxxx
 *   TWILIO_FROM=+18005551234
 *   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  (optionnel)
 *
 * En dev sans creds, les messages sont loggés en console.
 */

export interface SmsPayload {
  to: string
  body: string
  /** "sms" par défaut ; "whatsapp" utilise le canal WhatsApp Business */
  channel?: 'sms' | 'whatsapp'
}

export interface SmsResult {
  ok: boolean
  sid?: string
  error?: string
  sent: boolean
}

export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const smsFrom = process.env.TWILIO_FROM
  const waFrom = process.env.TWILIO_WHATSAPP_FROM

  const channel = payload.channel ?? 'sms'
  const from = channel === 'whatsapp' ? waFrom : smsFrom

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${channel}:dry-run]`, { to: payload.to, body: payload.body.slice(0, 100) })
    }
    return { ok: true, sent: false }
  }

  const to = channel === 'whatsapp' ? `whatsapp:${payload.to}` : payload.to

  try {
    const form = new URLSearchParams({ To: to, From: from, Body: payload.body })
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      }
    )
    const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string }

    if (!res.ok) return { ok: false, error: json.message || `HTTP ${res.status}`, sent: false }
    return { ok: true, sid: json.sid, sent: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown', sent: false }
  }
}

/* ───────── Templates SMS (courts, ≤ 160 car) ───────── */

export const smsTemplates = {
  otp(code: string): string {
    return `Bosal Credit Union — Votre code : ${code}. Expire dans 5 min. Ne le partagez jamais.`
  },
  loanDueReminder({ loanNumber, amountDue, dueDate }: { loanNumber: string; amountDue: string; dueDate: string }): string {
    return `Rappel Bosal : échéance prêt ${loanNumber} de ${amountDue} due le ${dueDate}.`
  },
  loanApproved({ loanNumber }: { loanNumber: string }): string {
    return `Bosal : votre prêt ${loanNumber} est approuvé ✅. Passez en agence pour le décaissement.`
  },
  exchangeReceipt({ ticketNumber, toAmount }: { ticketNumber: string; toAmount: string }): string {
    return `Bosal — Ticket ${ticketNumber} : vous avez reçu ${toAmount}. Merci.`
  },
}
