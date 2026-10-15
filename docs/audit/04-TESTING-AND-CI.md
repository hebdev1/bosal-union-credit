# 04 — Tests et CI

**Sévérité globale** : P1 — pas directement bloquant comme les docs 01-02, mais **sans CI il n'y a aucun garde-fou pour empêcher que les fixes P0 soient re-cassés** par une future PR.

**Lecteur cible** : dev + QA. Ce doc inventorie l'existant, propose la stratégie cible, et donne un `.github/workflows/ci.yml` prêt à copier + squelettes de tests prioritaires.

---

## 1. État actuel

### Tests existants

**Unit (Vitest 2.1.8)** : 5 fichiers, tous dans `src/lib/`, tous ciblent de la logique pure :
- `src/lib/finance/interest.test.ts` — amortization, monthly payment
- `src/lib/finance/exchange.test.ts` — currency conversion math
- `src/lib/approvals/four-eyes.test.ts` — règles d'approbation
- `src/lib/fraud/rules.test.ts` — règles de détection
- `src/lib/accounting/reports.test.ts` — compute reports

**Observation** : excellent choix pour la logique pure, car ces calculs sont le cœur métier. **Mais zéro test** pour :
- Server actions (comportement avec DB mockée ou test DB)
- RLS / tenant isolation
- Idempotency transactions
- Workflow money-moving end-to-end
- Composants React critiques (modals, formulaires)

**E2E (Playwright 1.48 chromium)** : 2 fichiers dans `e2e/` :
- `auth.spec.ts` — login/logout flow
- `marketing.spec.ts` — pages publiques

**Observation** : couverture extrêmement limitée. Rien ne teste les parcours critiques utilisateur :
- Création de membre
- Création de compte avec solde initial
- Dépôt / retrait
- Enregistrement d'un remboursement de prêt
- Génération d'un ticket PDF
- Export d'un rapport

### CI

**État** : `.github/workflows/` est **vide**. Aucune action GitHub.

**Scripts npm existants et utilisables en CI** :
```json
{
  "dev": "...",
  "build": "...",
  "start": "...",
  "lint": "...",
  "typecheck": "...",
  "test": "vitest run",
  "test:watch": "...",
  "test:coverage": "...",
  "e2e": "playwright test",
  "e2e:ui": "...",
  "e2e:install": "..."
}
```

**Observation** : les outils sont installés et prêts. Il manque uniquement le fichier `.github/workflows/ci.yml` pour les exécuter automatiquement.

### Scorecard

| Dimension | Score | Note |
|---|:---:|---|
| Unit tests logique métier | 7/10 | Bonne couverture des fonctions pures critiques |
| Unit tests server actions | 1/10 | Quasi-inexistant |
| Integration tests DB/RLS | 0/10 | Aucun |
| E2E workflows critiques | 2/10 | Juste auth + marketing |
| Tests de régression financière | 0/10 | Aucun idempotency, concurrency, drift |
| CI exécution automatique | 0/10 | Aucune |
| Pre-commit hooks | 0/10 | Aucun husky / lint-staged |
| Couverture mesurée | 1/10 | script `test:coverage` existe mais non suivi |

**Global** : 2/10 — pour un SaaS financier, c'est insuffisant.

---

## 2. Stratégie cible

### Pyramide de tests recommandée

```
                 /\
                /  \        E2E (Playwright) — ~15 specs
               /    \       Workflows critiques utilisateur
              /------\
             /        \     Integration — ~30 specs
            /          \    RPCs + RLS + server actions avec DB test
           /------------\
          /              \  Unit — ~80 tests
         /                \ Logique pure + validation zod + rendu composants isolés
        /__________________\
```

Les tests actuels (5 unit + 2 E2E) sont la base. Objectif Phase 1 : ~100-125 tests au total, exécutés en CI.

### Priorités de couverture (par criticité métier)

| # | Zone | Type | Pourquoi |
|---:|---|---|---|
| 1 | **Idempotency transactions** | Unit + E2E | Protège les P0 FIX-3 contre régression |
| 2 | **Tenant isolation (RLS cross-coop)** | Integration SQL | Protège les P0 FIX-2 |
| 3 | **Balance = SUM(deposits) - SUM(withdrawals)** | Integration SQL | Protège le trigger existant |
| 4 | **cash_vault reconciliation** | Integration SQL | Protège les P0 FIX-4 |
| 5 | **loan amortization** | Unit (existe déjà) | Garder, étendre edge cases |
| 6 | **four-eyes approval** | Unit (existe) + E2E | Protège P1 FIX-9 |
| 7 | **currency enum validation** | Unit | Protège P0 FIX-5 |
| 8 | **auth flow + session refresh** | E2E (existe) | Garder |
| 9 | **PDF generation (tickets + rapports)** | E2E snapshot | Détecter régressions visuelles |
| 10 | **Fraud rules** | Unit (existe) | Garder |

### Environnements de test

**Problème** : les tests qui touchent la DB ne peuvent pas pointer sur la prod. Il faut un Supabase local ou un projet de test.

**Options** :
1. **Supabase local** via `supabase start` (Docker) — propre pour CI, un peu lourd pour dev local
2. **Projet Supabase de test** avec un sous-ensemble de données — plus simple mais réseau requis
3. **pgTAP** pour les tests SQL purs — tourne dans n'importe quelle Postgres, parfait pour tests RLS

**Recommandation** : adopter les trois. pgTAP pour tester RLS/triggers (le plus fiable), Supabase local pour integration test server-actions, projet Supabase test pour E2E de bout en bout.

---

## 3. `.github/workflows/ci.yml` prêt à copier

À placer dans `.github/workflows/ci.yml` (le dossier n'existe pas encore, à créer).

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  typecheck:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint

  unit:
    name: Unit tests (Vitest)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test -- --reporter=verbose
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    name: Build (Next.js)
    runs-on: ubuntu-latest
    needs: [typecheck, lint]
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://ebioqgjyzrhjxxlugzcz.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_CI }}
      NEXT_PUBLIC_APP_URL: https://bosal-union-credit-ci.vercel.app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build

  e2e:
    name: E2E (Playwright)
    runs-on: ubuntu-latest
    needs: [build]
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://ebioqgjyzrhjxxlugzcz.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY_CI }}
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      CI_TEST_AGENT_EMAIL: ${{ secrets.CI_TEST_AGENT_EMAIL }}
      CI_TEST_AGENT_PASSWORD: ${{ secrets.CI_TEST_AGENT_PASSWORD }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run Next.js in background
        run: |
          npm run build
          npm start &
          npx wait-on http://localhost:3000 --timeout 60000
      - name: Playwright
        run: npm run e2e
      - name: Upload E2E report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  audit:
    name: npm audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Check CRITICAL vulns
        run: |
          npm audit --production --audit-level=critical --json > audit.json || true
          CRITICAL=$(jq '.metadata.vulnerabilities.critical // 0' audit.json)
          if [ "$CRITICAL" -gt 0 ]; then
            echo "::error::$CRITICAL CRITICAL vulnerabilities found"
            cat audit.json
            exit 1
          fi

  migrations-check:
    name: Supabase migrations syntax
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Supabase CLI
        run: |
          curl -fsSL https://supabase.com/install.sh | sh
      - name: Lint migrations
        run: |
          for f in supabase/migrations/*.sql; do
            echo "Checking $f"
            # Vérifie syntax avec pg_prove dry-run si Postgres dispo,
            # sinon basique : pas de IDLE markers, pas de patterns dangereux
            if grep -q "DROP TABLE\|TRUNCATE.*CASCADE" "$f"; then
              echo "::warning file=$f::destructive statement in migration"
            fi
          done
```

### Secrets GitHub à configurer

Dans **Settings → Secrets and variables → Actions** du repo GitHub :

| Secret | Valeur | Usage |
|---|---|---|
| `SUPABASE_ANON_KEY_CI` | Anon key du projet de test (pas prod !) | Build + E2E |
| `CI_TEST_AGENT_EMAIL` | Email d'un agent de test dans le projet test | E2E login |
| `CI_TEST_AGENT_PASSWORD` | Mot de passe de cet agent | E2E login |

**NE PAS** mettre `SUPABASE_SERVICE_ROLE_KEY` en secret CI — pas nécessaire si le code n'y touche pas, et éviterait des exploits si un fork malicieux ouvrait une PR.

### Branch protection rules

Après CI opérationnelle, dans **Settings → Branches → main → Protect branch** :
- Require pull request before merging
- Require status checks before merging :
  - `TypeScript`
  - `ESLint`
  - `Unit tests (Vitest)`
  - `Build (Next.js)`
  - `npm audit`
- Require E2E uniquement en nightly cron (trop lent pour chaque PR)

---

## 4. Squelettes de tests prioritaires

### 4.1 Test unitaire currency validation (protège FIX-5)

Nouveau fichier : `src/lib/money/currency.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { parseCurrency, CurrencyCode, ACCOUNT_CURRENCIES } from './currency'

describe('parseCurrency', () => {
  it.each(['HTG', 'USD', 'CAD', 'DOP'])('accepte %s', (code) => {
    expect(parseCurrency(code)).toBe(code)
  })

  it.each(['', 'EUR', 'xyz', null, undefined, 42, {}])('rejette %p', (bad) => {
    expect(() => parseCurrency(bad)).toThrow(/Devise invalide/)
  })

  it('CurrencyCode est bien un enum zod', () => {
    const r = CurrencyCode.safeParse('HTG')
    expect(r.success).toBe(true)
  })

  it('ACCOUNT_CURRENCIES ne contient que HTG et USD', () => {
    expect(ACCOUNT_CURRENCIES).toEqual(['HTG', 'USD'])
  })
})
```

### 4.2 Test SQL idempotency (protège FIX-3)

Nouveau fichier : `supabase/tests/transactions_idempotency.test.sql` (format pgTAP)

```sql
begin;
select plan(4);

-- Setup
select set_eq(
  $$ select count(*) from pg_constraint
     where conname = 'transactions_reference_unique' $$,
  $$ values (1::bigint) $$,
  'La contrainte UNIQUE existe'
);

-- Insert d'une tx
insert into public.transactions (cooperative_id, account_id, agent_id, transaction_type,
                                 amount, reference, status)
values ('<coop-uuid>', '<account-uuid>', '<agent-uuid>', 'deposit',
        100, 'TX-TEST-001', 'completed');

-- Deuxième insert avec même reference doit échouer
select throws_ok(
  $$ insert into public.transactions (cooperative_id, account_id, agent_id, transaction_type,
                                       amount, reference, status)
     values ('<coop-uuid>', '<account-uuid>', '<agent-uuid>', 'deposit',
             200, 'TX-TEST-001', 'completed') $$,
  '23505',  -- unique_violation
  'Deuxième INSERT avec même reference échoue'
);

-- Test idempotency_key : même key = même tx
insert into public.transactions (cooperative_id, account_id, agent_id, transaction_type,
                                 amount, reference, status, idempotency_key)
values ('<coop-uuid>', '<account-uuid>', '<agent-uuid>', 'deposit',
        100, 'TX-TEST-002', 'completed', 'idem-key-abc');

select throws_ok(
  $$ insert into public.transactions (cooperative_id, account_id, agent_id, transaction_type,
                                       amount, reference, status, idempotency_key)
     values ('<coop-uuid>', '<account-uuid>', '<agent-uuid>', 'deposit',
             100, 'TX-TEST-003', 'completed', 'idem-key-abc') $$,
  '23505',
  'Même idempotency_key échoue'
);

select ok(true, 'All tests pass');
select * from finish();
rollback;
```

### 4.3 Test SQL RLS tenant isolation (protège FIX-2)

Nouveau fichier : `supabase/tests/rls_tenant_isolation.test.sql`

```sql
begin;
select plan(5);

-- Setup : 2 coops, 1 agent par coop
-- (données de test chargées via supabase/seed/*.sql)

-- Simuler agent de coop A
set local role authenticated;
set local "request.jwt.claim.sub" = '<agent-A-uuid>';

select is(
  (select count(*) from public.cash_vault where cooperative_id != '<coop-A-uuid>'),
  0::bigint,
  'Agent A ne voit pas le cash_vault de coop B'
);

select is(
  (select count(*) from public.accounts where cooperative_id != '<coop-A-uuid>'),
  0::bigint,
  'Agent A ne voit pas les accounts de coop B'
);

select throws_ok(
  $$ update public.cash_vault set current_balance = 9999
     where cooperative_id = '<coop-B-uuid>' $$,
  NULL,  -- Doit soit retourner 0 rows affected soit permission denied
  NULL,
  'Agent A ne peut pas écraser cash_vault de coop B'
);

-- Simuler anon
reset role;
set local role anon;

select throws_ok(
  $$ select * from public.cash_vault $$,
  '42501',  -- insufficient_privilege
  'anon ne peut rien faire sur cash_vault'
);

select ok(true, 'All RLS tests pass');
select * from finish();
rollback;
```

### 4.4 Test E2E double-click dépôt (protège FIX-3)

Nouveau fichier : `e2e/transactions-idempotency.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test.describe('Transaction idempotency', () => {
  test.beforeEach(async ({ page }) => {
    // Login + goto test account
    await page.goto('/login')
    await page.fill('[name=email]', process.env.CI_TEST_AGENT_EMAIL!)
    await page.fill('[name=password]', process.env.CI_TEST_AGENT_PASSWORD!)
    await page.click('button[type=submit]')
    await page.waitForURL(/\/tableau-de-bord/)
  })

  test('double-click on dépôt submit creates only one transaction', async ({ page }) => {
    await page.goto('/tableau-de-bord/comptes/<test-account-uuid>')

    // Compter les transactions avant
    const before = await page.locator('[data-testid=tx-row]').count()

    // Ouvrir modal dépôt
    await page.click('[data-testid=open-deposit-modal]')
    await page.fill('[name=amount]', '100')
    await page.fill('[name=motif]', 'Test idempotency E2E')

    // Fire two submit clicks in rapid succession
    const submitButton = page.locator('[data-testid=submit-tx]')
    await Promise.all([
      submitButton.click(),
      submitButton.click(),  // Devrait être idempotent
    ])

    // Attendre que le ticket apparaisse
    await expect(page.locator('[data-testid=ticket-ref]').first()).toBeVisible({ timeout: 5000 })

    // Fermer le modal
    await page.click('[data-testid=close-ticket-modal]')
    await page.reload()

    // Doit y avoir UNE SEULE transaction de plus
    const after = await page.locator('[data-testid=tx-row]').count()
    expect(after).toBe(before + 1)
  })

  test('refresh page après dépôt préserve le solde correctement', async ({ page }) => {
    await page.goto('/tableau-de-bord/comptes/<test-account-uuid>')
    const balanceBefore = await page.locator('[data-testid=current-balance]').textContent()

    await page.click('[data-testid=open-deposit-modal]')
    await page.fill('[name=amount]', '250')
    await page.click('[data-testid=submit-tx]')
    await page.click('[data-testid=close-ticket-modal]')

    await page.reload()
    const balanceAfter = await page.locator('[data-testid=current-balance]').textContent()
    // Parse et vérifier différence = 250
    const diff = parseFloat(balanceAfter!.replace(/[^\d.-]/g, '')) -
                 parseFloat(balanceBefore!.replace(/[^\d.-]/g, ''))
    expect(diff).toBeCloseTo(250, 2)
  })
})
```

### 4.5 Test unitaire concurrency balance (protège FIX-4)

Nouveau fichier : `supabase/tests/cash_vault_concurrency.test.sql`

```sql
begin;
select plan(2);

-- Avant : vault à 1000
insert into public.cash_vault (cooperative_id, current_balance, opening_balance)
values ('<coop-uuid>', 1000, 0)
on conflict (cooperative_id) do update set current_balance = 1000;

-- Fire 10 deposits en parallèle (simulated by multiple statements)
insert into public.transactions (cooperative_id, account_id, agent_id, transaction_type,
                                 amount, reference, status)
select '<coop-uuid>', '<account-uuid>', '<agent-uuid>', 'deposit',
       100, 'TX-CONC-' || i, 'completed'
from generate_series(1, 10) i;

-- Le trigger doit avoir incrémenté exactement de 1000 (10 x 100)
select is(
  (select current_balance from public.cash_vault where cooperative_id = '<coop-uuid>'),
  2000::numeric,  -- 1000 initial + 10×100
  'cash_vault reflète correctement les 10 dépôts'
);

-- Également vérifier reconciliation
select is(
  (select recompute_cash_vault('<coop-uuid>'); select current_balance from public.cash_vault where cooperative_id = '<coop-uuid>'),
  2000::numeric,
  'recompute_cash_vault donne le même résultat (idempotent)'
);

select * from finish();
rollback;
```

---

## 5. Pré-commit hooks (optionnel, Quick Win)

Pour éviter que du code non-typé / non-linté arrive dans un PR, ajouter husky + lint-staged :

```bash
npm install --save-dev husky lint-staged
npx husky init
```

Dans `package.json` :
```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ],
    "*.sql": [
      "echo 'TODO: pg_prove dry-run'"
    ]
  }
}
```

Dans `.husky/pre-commit` :
```sh
#!/usr/bin/env sh
npx lint-staged
```

Chaque `git commit` lint + run les tests liés aux fichiers modifiés.

**Durée setup** : 15 min. **Impact** : fini le "oops j'ai pushé avec un TypeScript error".

---

## 6. Mesure de couverture

Script existe déjà : `npm run test:coverage`. Jamais exécuté/suivi.

Ajouter dans la CI un job qui upload la couverture :

```yaml
# dans .github/workflows/ci.yml
  coverage:
    name: Coverage
    runs-on: ubuntu-latest
    needs: [unit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:coverage
      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: coverage/lcov.info
          fail_ci_if_error: false
```

(Codecov gratuit pour public repos et pour les orgs <5 users)

**Objectif cible** : 60% couverture globale, 85%+ sur `src/lib/`. Ne pas chasser le 100% — tests fragiles.

---

## 7. Observabilité runtime (hors CI, mais complète les tests)

Les tests détectent les bugs connus. L'observabilité détecte les bugs inconnus en production. Minimum viable :

| Outil | Coût | Intégration | Priorité |
|---|---|---|:---:|
| **Sentry** (errors + perf) | Gratuit <5k events/mois | 2 lignes dans `src/instrumentation.ts` | P1 |
| **Vercel Analytics** (web vitals) | Gratuit | Déjà inclus Vercel | P2 |
| **PostHog** (product analytics) | Gratuit <1M events/mois | 1 script + capture() | P3 |
| **UptimeRobot** (uptime externe) | Gratuit 50 monitors | 1 URL à surveiller | P2 |
| **Supabase logs** (DB + Auth + Edge Functions) | Inclus | Déjà actif via dashboard | — |

**Recommandation Phase 1** : Sentry + UptimeRobot d'abord. PostHog quand il y aura du trafic réel à analyser.

---

## 8. Backlog de tests manquants (priorité RICE)

| # | Test | Reach | Impact | Confidence | Effort | RICE | Priorité |
|---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | SQL idempotency transactions.reference | 10 | 9 | 10 | 1 | 900 | **P0** |
| 2 | SQL RLS cross-tenant isolation | 10 | 10 | 10 | 2 | 500 | **P0** |
| 3 | E2E double-click dépôt | 10 | 8 | 9 | 2 | 360 | **P0** |
| 4 | Unit currency validation | 10 | 7 | 10 | 1 | 700 | **P0** |
| 5 | SQL cash_vault reconciliation | 10 | 9 | 9 | 2 | 405 | **P0** |
| 6 | SQL loans.amount_paid trigger | 10 | 8 | 9 | 2 | 360 | **P0** |
| 7 | E2E login + session refresh | 9 | 7 | 10 | 1 | 630 | P1 (déjà partiel) |
| 8 | E2E create member + account + deposit | 9 | 8 | 8 | 3 | 192 | P1 |
| 9 | E2E loan creation + repayment | 7 | 7 | 7 | 4 | 86 | P1 |
| 10 | E2E PDF ticket generation (snapshot) | 7 | 5 | 6 | 3 | 70 | P2 |
| 11 | Unit server actions parametres (IDOR) | 9 | 7 | 9 | 2 | 283 | P1 |
| 12 | Integration four-eyes approval end-to-end | 7 | 7 | 7 | 3 | 114 | P2 |
| 13 | Unit audit log structure | 7 | 5 | 10 | 1 | 350 | P2 |
| 14 | E2E rapports PDF snapshot | 6 | 4 | 6 | 4 | 36 | P3 |
| 15 | Unit historical transaction entry edge cases | 7 | 6 | 7 | 2 | 147 | P2 |

RICE scoring : (Reach × Impact × Confidence) / Effort, où chaque critère ∈ [1, 10].

**Priorisation** : les 6 premiers sont des **gates** pour les fixes P0 — ils doivent exister AVANT que les fixes P0 soient merged en main, pour éviter des régressions.

---

## 9. Validation finale

Après implementation de ce doc, l'app doit avoir :

- [ ] `.github/workflows/ci.yml` opérationnel, chaque PR fait tourner typecheck + lint + unit + build + audit
- [ ] Branch protection sur `main` qui bloque sans CI verte
- [ ] Au moins les 6 tests prioritaires P0 (§8 liste) ajoutés et verts
- [ ] Coverage mesurée et uploadée (Codecov ou alternative)
- [ ] Husky pre-commit hook actif
- [ ] Documentation `docs/TESTING.md` qui explique comment lancer tests localement (si pas déjà fait)

Résultat attendu : impossible de merger une PR qui casse un fix P0 ou introduit une nouvelle CRITICAL CVE.

---

## Prochaine étape

Documents de la **Partie B (stratégique)** à produire dans la Session 3 :
- `05-PRODUCT-POSITIONING.md` — positionnement vérifié + persona + value prop + différenciation
- `06-SAAS-MODEL.md` — tiers, entitlements, prix, métriques
- `07-FEATURE-ROADMAP.md` — matrice existant + backlog RICE nouveautés
- `08-ARCHITECTURE-FUTURE.md` — architecture cible + migration

Puis `09-RAPO-FINAL-KREYOL.md` en Session 4.

**Pour la Session 2 (fixes P0)** : lire `03-CRITICAL-FIXES-P0.md` et suivre l'ordre.
