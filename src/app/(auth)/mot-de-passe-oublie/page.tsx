'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [emailError, setEmailError] = React.useState('')
  const [formError, setFormError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const emailRef = React.useRef<HTMLInputElement>(null)

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError("L'adresse e-mail est requise.")
      emailRef.current?.focus()
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Adresse e-mail invalide.')
      emailRef.current?.focus()
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/tableau-de-bord/profil/nouveau-mot-de-passe`,
      })

      if (error) {
        setFormError(error.message)
        return
      }

      setSuccess(true)
    } catch {
      setFormError('Une erreur réseau est survenue. Réessayez.')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Succès ────────────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="space-y-6" role="main" aria-live="polite">
        <div className="text-center space-y-4">
          <div
            className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)' }}
          >
            <Mail size={26} style={{ color: '#60A5FA' }} aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
              E-mail envoyé
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Un lien de réinitialisation a été envoyé à{' '}
              <strong style={{ color: 'rgba(255,255,255,0.80)' }}>{email}</strong>.
              <br />
              Vérifiez votre boîte de réception (et vos spams).
            </p>
          </div>
        </div>

        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            background: 'rgba(59,130,246,0.06)',
            borderColor: 'rgba(59,130,246,0.20)',
            color: 'rgba(255,255,255,0.60)',
          }}
        >
          <p>Le lien expire dans <strong style={{ color: 'rgba(255,255,255,0.80)' }}>60 minutes</strong>.</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { setSuccess(false); setEmail(''); }}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{ borderColor: '#252A36', color: 'rgba(255,255,255,0.70)', background: 'transparent' }}
          >
            Renvoyer un e-mail
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            style={{ background: '#C41E3A', color: '#fff' }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  /* ── Formulaire ────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8" role="main">
      {/* En-tête */}
      <div className="space-y-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm mb-2 transition-colors focus-visible:outline-none focus-visible:underline"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Retour
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Mot de passe oublié
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Entrez votre adresse e-mail. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      {/* Erreur globale */}
      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            borderColor: 'rgba(239,68,68,0.25)',
            color: '#F87171',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Réinitialisation du mot de passe">
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Adresse e-mail <span className="text-red-400" aria-hidden="true">*</span>
          </Label>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            aria-required="true"
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : 'email-hint'}
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (emailError) setEmailError('')
            }}
            onBlur={() => {
              if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                setEmailError('Adresse e-mail invalide.')
            }}
            className="h-11 text-base"
            style={{ background: '#111318', borderColor: emailError ? '#EF4444' : '#252A36' }}
            disabled={isLoading}
          />
          {emailError ? (
            <p id="email-error" role="alert" className="text-xs" style={{ color: '#F87171' }}>
              {emailError}
            </p>
          ) : (
            <p id="email-hint" className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
              L&rsquo;adresse associée à votre compte agent.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-sm font-semibold"
          style={{
            background: isLoading ? '#9B1530' : '#C41E3A',
            color: '#fff',
            transition: 'background 180ms ease',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Envoi en cours…
            </>
          ) : (
            <>
              <Mail size={16} aria-hidden="true" />
              Envoyer le lien
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Vous vous souvenez ?{' '}
        <Link
          href="/login"
          className="font-medium transition-colors focus-visible:outline-none focus-visible:underline"
          style={{ color: '#C41E3A' }}
        >
          Se connecter
        </Link>
      </p>
    </div>
  )
}
