import type { Metadata } from 'next'
import { Header } from '@/components/dashboard/Header'
import { PageShell } from '@/components/dashboard/ui/DataTable'
import { NewPasswordForm } from '@/components/dashboard/forms/NewPasswordForm'

export const metadata: Metadata = { title: 'Nouveau mot de passe' }

export default function NouveauMotDePassePage() {
  return (
    <>
      <Header title="Nouveau mot de passe" />
      <PageShell
        title="Choisir un nouveau mot de passe"
        description="Vous êtes connecté via le lien reçu par e-mail. Définissez votre nouveau mot de passe."
      >
        <NewPasswordForm />
      </PageShell>
    </>
  )
}
