/**
 * Emails transactionnels — provider Resend (https://resend.com).
 *
 * Usage:
 *   import { sendEmail, emailTemplates } from '@/lib/notifications/email'
 *   await sendEmail(emailTemplates.loanApproved({
 *     to: member.email,
 *     memberName: member.first_name,
 *     loanNumber: loan.loan_number,
 *     amount: loan.principal_amount,
 *   }))
 *
 * Config requise en env:
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM="Bosal Credit Union <no-reply@votre-domaine.ht>"
 *
 * En dev sans clé, les emails sont loggés en console (pas d'envoi).
 */

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  /** Clé d'idempotence — évite les doubles envois */
  idempotencyKey?: string
}

export interface EmailResult {
  ok: boolean
  id?: string
  error?: string
  /** true si l'email a été envoyé, false si dry-run (pas de clé configurée) */
  sent: boolean
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'Bosal Credit Union <no-reply@bosal.local>'

  if (!apiKey) {
    // Dev / preview : loguer au lieu d'envoyer
    if (process.env.NODE_ENV !== 'test') {
      console.log('[email:dry-run]', {
        to: payload.to,
        subject: payload.subject,
        preview: payload.text?.slice(0, 120) ?? stripHtml(payload.html).slice(0, 120),
      })
    }
    return { ok: true, sent: false }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? stripHtml(payload.html),
        reply_to: payload.replyTo,
      }),
    })

    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string }

    if (!res.ok) {
      return { ok: false, error: json.message || `HTTP ${res.status}`, sent: false }
    }
    return { ok: true, id: json.id, sent: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown', sent: false }
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/* ───────── Templates ─────────
 * Chaque template renvoie un EmailPayload complet.
 * Les templates sont en français et adaptés à la coopérative haïtienne.
 */

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0C0C0E;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;color:#E8EAED;">
    <div style="border-bottom:1px solid #252A36;padding-bottom:16px;margin-bottom:24px;">
      <span style="color:#C41E3A;font-weight:700;letter-spacing:-.01em;">Bosal Credit Union</span>
    </div>
    ${body}
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #252A36;color:#6B7280;font-size:12px;">
      Bosal Credit Union — Core Banking pour coopératives haïtiennes.<br/>
      Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.
    </div>
  </div>
</body></html>`
}

export const emailTemplates = {
  signupConfirm({ to, memberName, confirmUrl }: { to: string; memberName: string; confirmUrl: string }): EmailPayload {
    return {
      to,
      subject: 'Confirmez votre inscription — Bosal Credit Union',
      html: shell('Confirmation', `
        <h1 style="font-size:20px;margin:0 0 16px;">Bienvenue, ${escapeHtml(memberName)} 👋</h1>
        <p>Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
        <p style="margin:24px 0;">
          <a href="${confirmUrl}" style="display:inline-block;background:#C41E3A;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Activer mon compte</a>
        </p>
        <p style="color:#9AA0A6;font-size:13px;">Ou collez ce lien dans votre navigateur :<br/><span style="word-break:break-all;">${confirmUrl}</span></p>
      `),
    }
  },

  passwordReset({ to, resetUrl }: { to: string; resetUrl: string }): EmailPayload {
    return {
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: shell('Reset mot de passe', `
        <h1 style="font-size:20px;margin:0 0 16px;">Nouveau mot de passe</h1>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien expire dans 1 heure.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#C41E3A;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Choisir un nouveau mot de passe</a>
        </p>
        <p style="color:#9AA0A6;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `),
    }
  },

  loanApproved({ to, memberName, loanNumber, amount, monthlyPayment }: {
    to: string; memberName: string; loanNumber: string; amount: string; monthlyPayment: string
  }): EmailPayload {
    return {
      to,
      subject: `Prêt ${loanNumber} approuvé`,
      idempotencyKey: `loan-approved-${loanNumber}`,
      html: shell('Prêt approuvé', `
        <h1 style="font-size:20px;margin:0 0 16px;">Bonne nouvelle, ${escapeHtml(memberName)} !</h1>
        <p>Votre prêt <strong>${loanNumber}</strong> a été approuvé.</p>
        <table style="width:100%;margin:20px 0;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#9AA0A6;">Montant</td><td style="text-align:right;font-weight:600;">${amount}</td></tr>
          <tr><td style="padding:8px 0;color:#9AA0A6;">Mensualité</td><td style="text-align:right;font-weight:600;">${monthlyPayment}</td></tr>
        </table>
        <p>Présentez-vous à votre agence pour le décaissement.</p>
      `),
    }
  },

  exchangeReceipt({ to, memberName, ticketNumber, fromAmount, toAmount, rate }: {
    to: string; memberName: string; ticketNumber: string; fromAmount: string; toAmount: string; rate: string
  }): EmailPayload {
    return {
      to,
      subject: `Reçu de change #${ticketNumber}`,
      idempotencyKey: `exchange-${ticketNumber}`,
      html: shell('Reçu de change', `
        <h1 style="font-size:20px;margin:0 0 16px;">Merci, ${escapeHtml(memberName)}</h1>
        <p>Votre opération de change est confirmée.</p>
        <table style="width:100%;margin:20px 0;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#9AA0A6;">Ticket</td><td style="text-align:right;font-family:monospace;">${ticketNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#9AA0A6;">Remis</td><td style="text-align:right;font-weight:600;">${fromAmount}</td></tr>
          <tr><td style="padding:8px 0;color:#9AA0A6;">Reçu</td><td style="text-align:right;font-weight:600;">${toAmount}</td></tr>
          <tr><td style="padding:8px 0;color:#9AA0A6;">Taux appliqué</td><td style="text-align:right;">${rate}</td></tr>
        </table>
      `),
    }
  },

  loanDueReminder({ to, memberName, loanNumber, amountDue, dueDate }: {
    to: string; memberName: string; loanNumber: string; amountDue: string; dueDate: string
  }): EmailPayload {
    return {
      to,
      subject: `Rappel d'échéance — prêt ${loanNumber}`,
      idempotencyKey: `due-${loanNumber}-${dueDate}`,
      html: shell('Rappel échéance', `
        <h1 style="font-size:20px;margin:0 0 16px;">Bonjour ${escapeHtml(memberName)}</h1>
        <p>Votre prochaine échéance du prêt <strong>${loanNumber}</strong> est due le <strong>${dueDate}</strong>.</p>
        <p style="font-size:18px;font-weight:600;margin:24px 0;">Montant : ${amountDue}</p>
        <p>Présentez-vous à votre agence ou utilisez MonCash pour régler.</p>
      `),
    }
  },
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
