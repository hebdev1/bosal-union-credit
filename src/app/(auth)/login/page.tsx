'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Metadata } from 'next'

// Note : metadata doit être dans un Server Component — on l'exporte depuis un
// wrapper si nécessaire. Ici c'est un client component, donc on utilise <title>
// via layout. Cette page étant dans le groupe (auth), le titre vient du layout.

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/tableau-de-bord'

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; form?: string }>({})

  const emailRef = React.useRef<HTMLInputElement>(null)

  function validate() {
    const next: typeof errors = {}
    if (!email.trim()) next.email = "L'adresse e-mail est requise."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Adresse e-mail invalide.'
    if (!password) next.password = 'Le mot de passe est requis.'
    else if (password.length < 6) next.password = 'Minimum 6 caractères.'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      // focus first invalid field
      if (validation.email) emailRef.current?.focus()
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const msg =
          error.message === 'Invalid login credentials'
            ? 'E-mail ou mot de passe incorrect.'
            : error.message === 'Email not confirmed'
            ? 'Veuillez confirmer votre adresse e-mail avant de vous connecter.'
            : error.message
        setErrors({ form: msg })
        return
      }

      toast.success('Connexion réussie', { description: 'Bienvenue sur Bosal Union Credit.' })
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setErrors({ form: 'Une erreur réseau est survenue. Réessayez.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8" role="main">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Connexion
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Accédez à votre espace de gestion coopérative.
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

      {/* Formulaire */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Formulaire de connexion">
        {/* E-mail */}
        <div className="space-y-1.5">
          <Label htmlFor="email">
            Adresse e-mail
            <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
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
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
            }}
            onBlur={() => {
              if (!email.trim()) setErrors((p) => ({ ...p, email: "L'adresse e-mail est requise." }))
              else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                setErrors((p) => ({ ...p, email: 'Adresse e-mail invalide.' }))
            }}
            className="h-11 text-base"
            style={{
              background: '#111318',
              borderColor: errors.email ? '#EF4444' : '#252A36',
            }}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">
              Mot de passe
              <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
            </Label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs transition-colors focus-visible:outline-none focus-visible:underline"
              style={{ color: '#C41E3A' }}
              tabIndex={0}
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
              }}
              className="h-11 pr-11 text-base"
              style={{
                background: '#111318',
                borderColor: errors.password ? '#EF4444' : '#252A36',
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              style={{ color: 'rgba(255,255,255,0.40)' }}
              tabIndex={0}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="text-xs" style={{ color: '#F87171' }}>
              {errors.password}
            </p>
          )}
        </div>

        {/* Bouton submit */}
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
              Connexion en cours…
            </>
          ) : (
            <>
              <LogIn size={16} aria-hidden="true" />
              Se connecter
            </>
          )}
        </Button>
      </form>

      {/* Séparateur */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t" style={{ borderColor: '#252A36' }} />
        </div>
        <div className="relative flex justify-center">
          <span
            className="px-3 text-xs"
            style={{ background: '#0C0C0E', color: 'rgba(255,255,255,0.30)' }}
          >
            Pas encore de compte ?
          </span>
        </div>
      </div>

      {/* Lien inscription */}
      <Link
        href="/inscription"
        className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        style={{
          borderColor: '#252A36',
          color: 'rgba(255,255,255,0.75)',
          background: 'transparent',
        }}
      >
        Créer un compte agent
      </Link>
    </div>
  )
}
