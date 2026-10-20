'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

/**
 * Shown to a signed-in user who is not an active agent (account without an
 * agents row, or agent suspended by an admin). The dashboard layout sends
 * them here instead of rendering empty pages.
 */
export default function AccesRefusePage() {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function signOut() {
    setPending(true)
    try {
      await createClient().auth.signOut()
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6" role="main">
      <div className="space-y-2">
        <ShieldAlert size={28} aria-hidden="true" style={{ color: '#F87171' }} />
        <h1 className="text-2xl font-semibold tracking-tight">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">
          Votre compte n’est pas (ou plus) un agent actif de la coopérative. Si vous pensez
          qu’il s’agit d’une erreur, contactez l’administrateur de votre coopérative.
        </p>
      </div>
      <Button type="button" onClick={signOut} disabled={pending} className="w-full">
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogOut aria-hidden="true" />}
        Se déconnecter
      </Button>
    </div>
  )
}
