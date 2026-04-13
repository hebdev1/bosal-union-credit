'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, UserPlus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Fields = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

type FieldErrors = Partial<Record<keyof Fields | 'form', string>>

const STRENGTH_LEVELS = [
  { label: 'Très faible', color: '#EF4444', width: '20%' },
  { label: 'Faible',      color: '#F59E0B', width: '40%' },
  { label: 'Moyen',       color: '#F59E0B', width: '60%' },
  { label: 'Fort',        color: '#22C55E', width: '80%' },
  { label: 'Très fort',   color: '#22C55E', width: '100%' },
]

function getPasswordStrength(p: string): number {
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return Math.min(score, 4)
}

export default function InscriptionPage() {
  const router = useRouter()

  const [fields, setFields] = React.useState<Fields>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const firstNameRef = React.useRef<HTMLInputElement>(null)
  const strength = getPasswordStrength(fields.password)
  const strengthInfo = fields.password ? STRENGTH_LEVELS[strength] : null

  function setField(key: keyof Fields, value: string) {
    setFields((p) => ({ ...p, [key]: value }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }))
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!fields.firstName.trim()) next.firstName = 'Le prénom est requis.'
    if (!fields.lastName.trim()) next.lastName = 'Le nom est requis.'
    if (!fields.email.trim()) next.email = "L'adresse e-mail est requise."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) next.email = 'Adresse e-mail invalide.'
    if (!fields.password) next.password = 'Le mot de passe est requis.'
    else if (fields.password.length < 8) next.password = 'Minimum 8 caractères.'
    if (!fields.confirmPassword) next.confirmPassword = 'La confirmation est requise.'
    else if (fields.password !== fields.confirmPassword) next.confirmPassword = 'Les mots de passe ne correspondent pas.'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      if (validation.firstName) firstNameRef.current?.focus()
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: fields.email,
        password: fields.password,
        options: {
          data: {
            first_name: fields.firstName.trim(),
            last_name: fields.lastName.trim(),
          },
        },
      })

      if (error) {
        const msg =
          error.message.includes('already registered') || error.message.includes('already exists')
            ? 'Cette adresse e-mail est déjà utilisée.'
            : error.message
        setErrors({ form: msg })
        return
      }

      setSuccess(true)
    } catch {
      setErrors({ form: 'Une erreur réseau est survenue. Réessayez.' })
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Écran de succès ─────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="space-y-6 text-center" role="main" aria-live="polite">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.12)' }}
        >
          <CheckCircle2 size={32} style={{ color: '#4ADE80' }} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Compte créé !
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Un e-mail de confirmation a été envoyé à{' '}
            <strong style={{ color: 'rgba(255,255,255,0.80)' }}>{fields.email}</strong>.
            <br />
            Cliquez sur le lien dans l&rsquo;e-mail pour activer votre compte.
          </p>
        </div>
        <Link
          href="/login"
          className="flex items-center justify-center w-full h-11 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          style={{ background: '#C41E3A', color: '#fff' }}
        >
          Aller à la connexion
        </Link>
      </div>
    )
  }

  /* ── Formulaire ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8" role="main">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Créer un compte
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Rejoignez la plateforme de gestion coopérative.
        </p>
      </div>

      {/* Erreur globale */}
      {errors.form && (
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
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Formulaire d'inscription">
        {/* Prénom + Nom */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">
              Prénom <span className="text-red-400" aria-hidden="true">*</span>
            </Label>
            <Input
              ref={firstNameRef}
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              aria-required="true"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              placeholder="Jean"
              value={fields.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              className="h-11 text-base"
              style={{ background: '#111318', borderColor: errors.firstName ? '#EF4444' : '#252A36' }}
              disabled={isLoading}
            />
            {errors.firstName && (
              <p id="firstName-error" role="alert" className="text-xs" style={{ color: '#F87171' }}>
                {errors.firstName}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lastName">
              Nom <span className="text-red-400" aria-hidden="true">*</span>
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              aria-required="true"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              placeholder="Baptiste"
              value={fields.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              className="h-11 text-base"
              style={{ background: '#111318', borderColor: errors.lastName ? '#EF4444' : '#252A36' }}
              disabled={isLoading}
            />
            {errors.lastName && (
              <p id="lastName-error" role="alert" className="text-xs" style={{ color: '#F87171' }}>
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* E-mail */}
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Adresse e-mail <span className="text-red-400" aria-hidden="true">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            placeholder="vous@exemple.com"
            value={fields.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => {
              if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
                setErrors((p) => ({ ...p, email: 'Adresse e-mail invalide.' }))
            }}
            className="h-11 text-base"
            style={{ background: '#111318', borderColor: errors.email ? '#EF4444' : '#252A36' }}
            disabled={isLoading}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-xs" style={{ color: '#F87171' }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Mot de passe */}
        <div className="space-y-1.5">
          <Label htmlFor="password">
            Mot de passe <span className="text-red-400" aria-hidden="true">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={[
                errors.password ? 'password-error' : '',
                fields.password ? 'password-strength' : '',
              ].filter(Boolean).join(' ') || undefined}
              placeholder="••••••••"
              value={fields.password}
              onChange={(e) => setField('password', e.target.value)}
              className="h-11 pr-11 text-base"
              style={{ background: '#111318', borderColor: errors.password ? '#EF4444' : '#252A36' }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              style={{ color: 'rgba(255,255,255,0.40)' }}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>

          {/* Jauge de force */}
          {fields.password && (
            <div id="password-strength" aria-live="polite" className="space-y-1.5">
              <div className="h-1 w-full rounded-full" style={{ background: '#252A36' }}>
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: strengthInfo?.width ?? '0%',
                    background: strengthInfo?.color ?? 'transparent',
                  }}
                  role="progressbar"
                  aria-valuenow={strength}
                  aria-valuemin={0}
                  aria-valuemax={4}
                  aria-label={`Force du mot de passe : ${strengthInfo?.label ?? ''}`}
                />
              </div>
              <p className="text-xs" style={{ color: strengthInfo?.color ?? 'transparent' }}>
                {strengthInfo?.label}
              </p>
            </div>
          )}
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs" style={{ color: '#F87171' }}>
              {errors.password}
            </p>
          )}
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Minimum 8 caractères. Utilisez majuscules, chiffres et symboles.
          </p>
        </div>

        {/* Confirmation */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">
            Confirmer le mot de passe <span className="text-red-400" aria-hidden="true">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              aria-required="true"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
              placeholder="••••••••"
              value={fields.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              onBlur={() => {
                if (fields.confirmPassword && fields.password !== fields.confirmPassword)
                  setErrors((p) => ({ ...p, confirmPassword: 'Les mots de passe ne correspondent pas.' }))
              }}
              className="h-11 pr-11 text-base"
              style={{ background: '#111318', borderColor: errors.confirmPassword ? '#EF4444' : '#252A36' }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              style={{ color: 'rgba(255,255,255,0.40)' }}
              disabled={isLoading}
            >
              {showConfirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirm-error" role="alert" className="text-xs" style={{ color: '#F87171' }}>
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-sm font-semibold mt-2"
          style={{
            background: isLoading ? '#9B1530' : '#C41E3A',
            color: '#fff',
            transition: 'background 180ms ease',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Création en cours…
            </>
          ) : (
            <>
              <UserPlus size={16} aria-hidden="true" />
              Créer mon compte
            </>
          )}
        </Button>
      </form>

      {/* Lien connexion */}
      <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.40)' }}>
        Déjà un compte ?{' '}
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
