import { test, expect } from '@playwright/test'

/**
 * Smoke E2E — parcours marketing public.
 * Ces tests n'exigent pas de Supabase configuré (middleware laisse passer
 * sans clés en env) et vérifient que les pages publiques se rendent.
 */

test.describe('Parcours marketing', () => {
  test('landing affiche la marque Bosal Credit Union', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Bosal/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('navigation principale fonctionne', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: /principale/i })).toBeVisible()
  })

  test('page tarifs se charge', async ({ page }) => {
    await page.goto('/tarifs')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('page sécurité se charge', async ({ page }) => {
    await page.goto('/securite')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('footer contient Conditions et Confidentialité', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer.getByRole('link', { name: /Conditions/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /Confidentialité/i })).toBeVisible()
  })
})
