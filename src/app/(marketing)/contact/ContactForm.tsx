'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { submitContactRequest, type ContactField, type ContactState } from './actions'

const INITIAL: ContactState = { status: 'idle' }

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactRequest, INITIAL)
  // The success result the visitor chose to leave ("Envoyer un autre
  // message"). Each submission returns a new object, so a later success
  // shows the confirmation again.
  const [dismissedState, setDismissedState] = useState<ContactState | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  const showSuccess = state.status === 'success' && state !== dismissedState
  const showError = state.status === 'error' && !pending
  const fieldErrors: Partial<Record<ContactField, string>> = showError ? state.fields ?? {} : {}

  // Move focus to what changed: the confirmation, the first invalid field,
  // or back to the form after "Envoyer un autre message".
  useEffect(() => {
    if (pending) return
    if (showSuccess) successRef.current?.focus()
    else if (state.status === 'error') {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [state, pending, showSuccess])

  useEffect(() => {
    if (dismissedState) formRef.current?.querySelector<HTMLElement>('input[name="full_name"]')?.focus()
  }, [dismissedState])

  if (showSuccess) {
    return (
      <div className="contact-form">
        <div className="form-success">
          <span>
            <Check size={25} aria-hidden="true" />
          </span>
          <h3 ref={successRef} tabIndex={-1}>Merci pour votre message.</h3>
          <p>Notre équipe reviendra vers vous pour organiser la suite.</p>
          <button type="button" onClick={() => setDismissedState(state)}>
            Envoyer un autre message
          </button>
        </div>
      </div>
    )
  }

  const describedBy = (field: ContactField) =>
    fieldErrors[field] ? `${field}-error` : undefined

  return (
    <form
      ref={formRef}
      className="contact-form"
      // action={action} is the no-JavaScript fallback (a POST to the server
      // action, never a GET that would put the visitor's data in the URL).
      // With JavaScript, onSubmit + preventDefault + startTransition runs the
      // same action without React's automatic form reset, so the visitor's
      // input survives a validation error.
      action={action}
      onSubmit={event => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        startTransition(() => action(formData))
      }}
      noValidate
    >
      {showError && (
        <p className="form-error" role="alert">{state.message}</p>
      )}
      <p className="form-hint">Tous les champs sont obligatoires, sauf mention contraire.</p>

      {/* Honeypot — hidden from people and assistive technology */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Site web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="form-row">
        <label>
          Prénom et nom
          <input
            name="full_name"
            required
            autoComplete="name"
            maxLength={120}
            placeholder="Votre nom complet"
            aria-invalid={Boolean(fieldErrors.full_name)}
            aria-describedby={describedBy('full_name')}
          />
          {fieldErrors.full_name && <span id="full_name-error" className="field-error">{fieldErrors.full_name}</span>}
        </label>
        <label>
          Adresse e-mail
          <input
            name="email"
            required
            type="email"
            autoComplete="email"
            maxLength={200}
            placeholder="vous@institution.org"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={describedBy('email')}
          />
          {fieldErrors.email && <span id="email-error" className="field-error">{fieldErrors.email}</span>}
        </label>
      </div>
      <div className="form-row">
        <label>
          Institution
          <input
            name="institution"
            required
            autoComplete="organization"
            maxLength={160}
            placeholder="Nom de votre institution"
            aria-invalid={Boolean(fieldErrors.institution)}
            aria-describedby={describedBy('institution')}
          />
          {fieldErrors.institution && <span id="institution-error" className="field-error">{fieldErrors.institution}</span>}
        </label>
        <label>
          Type d’organisation (facultatif)
          <select name="org_type" defaultValue="">
            <option value="" disabled>Sélectionner</option>
            <option value="cooperative">Coopérative financière</option>
            <option value="microfinance">Institution de microfinance</option>
            <option value="epargne_pret">Organisation d’épargne et prêt</option>
            <option value="autre">Autre</option>
          </select>
        </label>
      </div>
      <label>
        Nombre approximatif de membres (facultatif)
        <select name="member_range" defaultValue="">
          <option value="" disabled>Sélectionner une tranche</option>
          <option value="lt_1000">Moins de 1 000</option>
          <option value="1000_5000">1 000 à 5 000</option>
          <option value="5000_20000">5 000 à 20 000</option>
          <option value="gt_20000">Plus de 20 000</option>
        </select>
      </label>
      <label>
        Comment pouvons-nous vous aider ?
        <textarea
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder="Parlez-nous brièvement de vos besoins…"
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={describedBy('message')}
        />
        {fieldErrors.message && <span id="message-error" className="field-error">{fieldErrors.message}</span>}
      </label>
      <label className="consent">
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={Boolean(fieldErrors.consent)}
          aria-describedby={describedBy('consent')}
        />
        <span>
          J’accepte d’être contacté au sujet de ma demande. Aucune donnée
          financière réelle ne doit être transmise dans ce formulaire.
          {fieldErrors.consent && <><br /><span id="consent-error" className="field-error">{fieldErrors.consent}</span></>}
        </span>
      </label>
      <button type="submit" className="public-cta large" disabled={pending}>
        {pending
          ? <><Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> Envoi…</>
          : <>Envoyer ma demande <ArrowRight size={16} aria-hidden="true" /></>}
      </button>
    </form>
  )
}
