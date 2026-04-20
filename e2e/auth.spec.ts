import { test, expect } from '@playwright/test'

/**
 * Parcours authentification — vérifie que les pages publiques d'auth se rendent
 * et que les routes protégées redirigent vers /login quand non connecté.
 *
 * Ces tests ne tentent pas une vraie authentification (nécessiterait un
 * utilisateur de test Supabase + SUPABASE_SERVICE_ROLE_KEY). Un parcours complet
 * est ajouté comme TODO et skippé par défaut.
 */

test.describe('Pages d\'authentification', () => {
  test('/login affiche le formulaire', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('input[type="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('/inscription affiche le formulaire', async ({ page }) => {
    await page.goto('/inscription')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('/mot-de-passe-oublie se charge', async ({ page }) => {
    await page.goto('/mot-de-passe-oublie')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Routes protégées', () => {
  test('non connecté → /tableau-de-bord redirige vers /login', async ({ page }) => {
    // Ce test nécessite que SUPABASE soit configuré en env.
    // Sans clés, le proxy laisse passer → on skip dans ce cas.
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_URL,
      'Skippé : pas de Supabase configuré en env',
    )
    const response = await page.goto('/tableau-de-bord')
    await expect(page).toHaveURL(/\/login/)
    expect(response?.status()).toBeLessThan(500)
  })
})

test.describe('Parcours complets [TODO]', () => {
  test.skip('inscription → vérif email → login → dashboard', async () => {
    // À implémenter avec un provider email de test (Mailpit / Inbucket)
    // et SUPABASE_SERVICE_ROLE_KEY pour pré-provisionner un user de test.
  })

  test.skip('création d\'un compte membre depuis le dashboard', async () => {
    // Requiert auth fixture + base de données de test isolée
  })

  test.skip('décaissement d\'un prêt', async () => {
    // Requiert auth fixture + fixtures métier (membre, compte, prêt approuvé)
  })

  test.skip('émission d\'un ticket de change', async () => {
    // Requiert auth fixture + taux de change configuré
  })

  test.skip('clôture journalière de la caisse', async () => {
    // Requiert auth fixture + mouvements de caisse préalables
  })
})
