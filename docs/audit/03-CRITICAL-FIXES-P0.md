# 03 — Backlog P0 : fixes critiques

**Lecteur cible** : dev qui exécute. **Ce doc est opérationnel** — chaque fix a ses commandes, migrations SQL, tests de régression, et ordre de déploiement.

**Pré-requis avant exécution** :
1. Cloner Supabase prod → projet miroir pour tester toute la séquence
2. Branche git `audit/p0-fixes` créée à partir de `main`
3. Backup récent de la DB prod (`supabase/scripts/wipe_test_data.sql` style — mais INVERSE : juste dump, ne pas wiper)
4. Lire `01-SECURITY-RLS-TENANT.md` + `02-FINANCIAL-INTEGRITY.md` d'abord pour comprendre le "pourquoi"

**Rule 11 respectée** : aucun de ces fixes n'est exécuté par cet audit. Il faut une approbation explicite avant Session 2.

---

## Ordre d'exécution (optimisé pour minimiser le blast radius)

Chaque fix est **indépendant** mais l'ordre est optimisé pour (a) traiter d'abord ce qui saigne et (b) éviter que le fix suivant casse ce que le précédent a réparé.

| Ordre | Ticket | Sévérité | Est. complexité | Est. durée | Bloqué par |
|---:|---|:---:|:---:|:---:|:---:|
| 1 | FIX-1 : Upgrade `next` + `proxy-addr` CVE | P0 | S | 1 h | — |
| 2 | FIX-2 : Restaurer RLS + révoquer GRANT ALL | P0 | M | 2-3 h | FIX-1 (prudence) |
| 3 | FIX-3 : UNIQUE sur `transactions.reference` + idempotency | P0 | M | 2 h | FIX-2 |
| 4 | FIX-4 : Trigger `cash_vault` + réconciliation | P0 | M | 2 h | FIX-2, FIX-3 |
| 5 | FIX-5 : currency_code enum alignment | P0 (user bug) | S | 1 h | FIX-2 |
| 6 | FIX-6 : Trigger `loans.amount_paid` | P0 | M | 1 h | FIX-2 |
| 7 | FIX-7 : IDOR `updateAgentStatus` + `updateSetting` | P0 | S | 1 h | FIX-2 |
| 8 | FIX-8 : Logos bucket scoping | P1 | S | 1 h | FIX-2 |
| 9 | FIX-9 : Four-eyes câblage sur operations sensibles | P1 | L | 4-6 h | FIX-2, FIX-7 |
| 10 | FIX-10 : Mislabel audit `cash.transfer` | P1 | XS | 15 min | — |

**Total estimé** : 15-20 heures de travail concentré, étalé idéalement sur 2-3 sessions avec deploy intermédiaire + validation prod après chaque fix. **Ne pas tout faire en une passe**.

---

## FIX-1 : Upgrade CVE deps (Next + proxy-addr)

**Sévérité** : P0 — 2 CRITICAL + 18 HIGH via `npm audit --production`
**Fichiers touchés** : `package.json`, `package-lock.json`
**Risque** : breaking changes mineurs Next 16.x. Deps critiques à checker : `@base-ui/react 1.3.0`, `@supabase/ssr 0.10.2`, `zod 4.3.6`.

### Commandes

```bash
cd "C:/Users/elieh/tipa final/bosal-union-credit"

# 1. Vérifier la base
git status                             # doit être clean
git switch -c audit/p0-fix-1-cve-upgrade

# 2. Upgrade Next + React + fix auto des deps transitives
npm install next@latest react@latest react-dom@latest
npm audit fix --production

# 3. Résiduel manuel si npm audit fix laisse des trucs
npm audit --production                 # viser 0 CRITICAL

# 4. Validation
npx tsc --noEmit                       # exit 0
npm run lint                           # exit 0
npm run test                           # vitest, exit 0
npm run build                          # exit 0
npm run e2e                            # playwright, exit 0 (si config CI prête)

# 5. Commit + push + preview
git add package.json package-lock.json
git commit -m "chore(deps): upgrade Next + fix CVE criticals (audit P0 FIX-1)"
git push -u origin audit/p0-fix-1-cve-upgrade
# → Vercel génère un preview. Tester manuellement : login, dashboard, 1 transaction, 1 PDF export.
```

### Validation prod post-déploiement
- Toutes les pages du dashboard chargent sans erreur console
- Login agent fonctionne
- 1 dépôt-test réussit et génère le ticket PDF
- `npm audit --production` depuis prod retourne 0 CRITICAL

### Rollback
```bash
git revert HEAD
git push
# Vercel redeploy automatique
```

---

## FIX-2 : Restaurer RLS + révoquer GRANT ALL

**Sévérité** : P0 — exploit cross-tenant par n'importe quel utilisateur authentifié
**Fichiers touchés** : nouvelle migration `supabase/migrations/20261015120000_restore_rls_tenant_isolation.sql` + `20261015120100_restrict_public_grants.sql`
**Risque** : les pages/actions qui dépendaient tacitement de RLS OFF vont casser. Tester chaque page.

### Pré-check : identifier les requêtes à risque

```bash
# Grep pour toutes les requêtes qui lisent les 5 tables maintenant protégées
cd "C:/Users/elieh/tipa final/bosal-union-credit"
grep -rn "from('agents')\|from('cooperatives')\|from('cash_vault')\|from('system_settings')\|from('exchange_rates')" src/
```

Documenter chaque hit : est-ce qu'il tourne dans une server action authentifiée (OK, RLS satisfait) ou dans un contexte non authentifié (CASSERA) ?

### Migration SQL

Voir le contenu complet dans `01-SECURITY-RLS-TENANT.md` §1 et §2. Copier-coller tel quel dans deux fichiers migration :
- `supabase/migrations/20261015120000_restore_rls_tenant_isolation.sql`
- `supabase/migrations/20261015120100_restrict_public_grants.sql`

### Exécution

```bash
# 1. Branche
git switch -c audit/p0-fix-2-rls-restore

# 2. Appliquer sur le MIROIR Supabase d'abord
supabase link --project-ref <MIROIR_ID>
supabase db push

# 3. Smoke test manuel sur le miroir : login, dashboard, chaque page, 1 transaction
# Si quelque chose casse, identifier la query et ajouter le filtre coop côté serveur (pas réouvrir RLS)

# 4. Une fois le miroir OK, appliquer en prod
supabase link --project-ref ebioqgjyzrhjxxlugzcz
supabase db push

# 5. Commit + push code (si des server actions ont été ajustées pendant le smoke test)
git add .
git commit -m "fix(security): restore RLS + restrict grants (audit P0 FIX-2)"
git push -u origin audit/p0-fix-2-rls-restore
```

### Tests SQL de régression

À exécuter sur le miroir après migration :

```sql
-- Test 1 : cross-tenant isolation
begin;
  set role authenticated;
  set local "request.jwt.claim.sub" = '<uuid agent coop A>';

  -- Chaque table doit retourner uniquement les rows de coop A
  select count(*) from public.agents            where cooperative_id != public.current_user_cooperative_id();  -- 0
  select count(*) from public.cash_vault        where cooperative_id != public.current_user_cooperative_id();  -- 0
  select count(*) from public.exchange_rates    where cooperative_id != public.current_user_cooperative_id();  -- 0
  select count(*) from public.system_settings   where cooperative_id != public.current_user_cooperative_id();  -- 0
  select count(*) from public.accounts          where cooperative_id != public.current_user_cooperative_id();  -- 0
rollback;

-- Test 2 : anon ne peut rien faire
begin;
  set role anon;
  select count(*) from public.cash_vault;   -- doit retourner 0 ou throw permission denied
rollback;
```

### Rollback

Si l'app casse en prod :
```sql
-- Migration d'urgence 20261015120099_rollback_rls.sql
alter table public.agents            disable row level security;
alter table public.cooperatives      disable row level security;
alter table public.cash_vault        disable row level security;
alter table public.system_settings   disable row level security;
alter table public.exchange_rates    disable row level security;
grant all on all tables in schema public to anon, authenticated;
```

**Appliquer uniquement en cas d'urgence** — le temps que le RLS correct soit mis en place.

---

## FIX-3 : Idempotence + UNIQUE sur `transactions.reference`

**Sévérité** : P0 — double-clic sur Dépôt crée 2 transactions
**Fichiers touchés** :
- `supabase/migrations/20261015140000_add_transaction_idempotency.sql`
- `src/app/(dashboard)/tableau-de-bord/comptes/actions.ts`
- `src/app/(dashboard)/tableau-de-bord/transactions/actions.ts`
- `src/components/dashboard/forms/RecordTransactionModal.tsx`
- `src/components/dashboard/forms/AddTransactionForm.tsx`

### Pré-check : détecter les doublons existants

```sql
select reference, count(*) as duplicates
from public.transactions
where reference is not null
group by reference
having count(*) > 1;
```

Si résultat vide → migration passe directement. Sinon : décider manuellement quelle row garder, créer une migration de nettoyage avant.

### Migration SQL

Voir `02-FINANCIAL-INTEGRITY.md` §3. Fichier : `supabase/migrations/20261015140000_add_transaction_idempotency.sql`.

### Fix code

Voir §3 de `02-FINANCIAL-INTEGRITY.md` pour le détail. Résumé :

1. Ajouter param `idempotencyKey?: string` à `recordTransaction` et `recordTransactionEntry`
2. Avant d'INSERT, SELECT par idempotency_key — si trouvé, retourner le ticket existant
3. INSERT inclut `idempotency_key: input.idempotencyKey ?? null`
4. Dans les modals (RecordTransactionModal, AddTransactionForm), générer un UUID avec `useMemo(() => crypto.randomUUID(), [])` au mount

### Test

```ts
// src/app/(dashboard)/tableau-de-bord/comptes/actions.test.ts (nouveau)
import { describe, it, expect } from 'vitest'
import { recordTransaction } from './actions'

describe('recordTransaction idempotency', () => {
  it('deuxième appel avec même key retourne la première tx', async () => {
    const key = crypto.randomUUID()
    const r1 = await recordTransaction({ accountId: TEST_ACCOUNT_ID, type: 'deposit', amount: 100, idempotencyKey: key })
    const r2 = await recordTransaction({ accountId: TEST_ACCOUNT_ID, type: 'deposit', amount: 100, idempotencyKey: key })
    expect('ticket' in r1 && 'ticket' in r2).toBe(true)
    if ('ticket' in r1 && 'ticket' in r2) {
      expect(r1.ticket.reference).toBe(r2.ticket.reference)
    }
  })
})
```

Et un E2E Playwright qui simule le double-clic :
```ts
// e2e/transactions-idempotency.spec.ts (nouveau)
test('double-click deposit creates only one transaction', async ({ page }) => {
  await loginAsAgent(page)
  await page.goto('/tableau-de-bord/comptes/<test-account>')
  await page.click('[data-testid=deposit-button]')
  await page.fill('[name=amount]', '100')

  // Fire two submit clicks in rapid succession
  await Promise.all([
    page.click('[data-testid=submit-tx]'),
    page.click('[data-testid=submit-tx]'),
  ])

  // Expect: only 1 ticket shown, only 1 transaction in DB
  await expect(page.locator('[data-testid=ticket-ref]')).toHaveCount(1)
})
```

---

## FIX-4 : Trigger `cash_vault` + réconciliation

**Sévérité** : P0 — race condition + absence de réconciliation
**Fichiers touchés** :
- `supabase/migrations/20261015150000_cash_vault_trigger.sql`
- `src/app/(dashboard)/tableau-de-bord/comptes/actions.ts` (retirer bloc lignes 321-336)

### Migration + retrait du code

Voir `02-FINANCIAL-INTEGRITY.md` §4 pour la migration complète.

### Test SQL

```sql
-- Doit retourner 0 drift
select cv.cooperative_id,
       cv.current_balance,
       coalesce(cv.opening_balance, 0) + coalesce((
         select sum(case when t.transaction_type='deposit' then t.amount
                         when t.transaction_type='withdrawal' then -t.amount
                         else 0 end)
         from public.transactions t
         where t.cooperative_id = cv.cooperative_id
       ), 0) as computed
from public.cash_vault cv
where cv.current_balance !=
  coalesce(cv.opening_balance, 0) + coalesce((
    select sum(case when t.transaction_type='deposit' then t.amount
                    when t.transaction_type='withdrawal' then -t.amount
                    else 0 end)
    from public.transactions t
    where t.cooperative_id = cv.cooperative_id
  ), 0);
-- doit retourner 0 rows (= pas de drift)
```

### Test E2E

```ts
test('concurrent deposits do not lose cash_vault increment', async () => {
  const initialVault = await getCashVault(TEST_COOP_ID)
  await Promise.all([
    recordTransaction({ accountId: ACC_A, type: 'deposit', amount: 100 }),
    recordTransaction({ accountId: ACC_B, type: 'deposit', amount: 200 }),
  ])
  const finalVault = await getCashVault(TEST_COOP_ID)
  expect(finalVault.current_balance).toBe(initialVault.current_balance + 300)
})
```

---

## FIX-5 : currency_code enum alignment (bug utilisateur visible)

**Sévérité** : P0 (user-visible bug "input valid value for enum currency_code")
**Fichiers touchés** :
- `supabase/migrations/20261015170000_tighten_currency_code.sql`
- `src/lib/money/currency.ts` (NOUVEAU)
- `src/app/(dashboard)/tableau-de-bord/bureau-de-change/actions.ts`
- `src/app/(dashboard)/tableau-de-bord/comptes/actions.ts`
- `src/components/dashboard/forms/CreateAccountModal.tsx` (déjà aligné)
- `src/components/dashboard/forms/CreateExchangeModal.tsx` (à vérifier)

### Pré-check

```sql
-- Détecter les valeurs non-enum existantes
select distinct currency from public.accounts
  where currency not in ('HTG','USD','CAD','DOP') or currency is null;
```

Si résultats non vides, nettoyer manuellement avant la migration (`UPDATE ... SET currency = 'HTG' WHERE id = ...`).

### Migration SQL

Voir `02-FINANCIAL-INTEGRITY.md` §6 pour le code complet.

### Nouveau fichier `src/lib/money/currency.ts`

```ts
import { z } from 'zod'

/** Toutes les devises supportées par la DB (enum currency_code). */
export const CurrencyCode = z.enum(['HTG','USD','CAD','DOP'])
export type CurrencyCode = z.infer<typeof CurrencyCode>

/** Devises exposées dans l'UI pour ouverture de compte. */
export const ACCOUNT_CURRENCIES = ['HTG', 'USD'] as const
export const AccountCurrency = z.enum(ACCOUNT_CURRENCIES)
export type AccountCurrency = z.infer<typeof AccountCurrency>

/** Devises exposées dans le bureau de change (toutes). */
export const EXCHANGE_CURRENCIES = ['HTG', 'USD', 'CAD', 'DOP'] as const

/** Parse ou throw avec message localisé. */
export function parseCurrency(input: unknown): CurrencyCode {
  const r = CurrencyCode.safeParse(input)
  if (!r.success) {
    throw new Error(`Devise invalide : ${String(input)}. Doit être HTG, USD, CAD ou DOP.`)
  }
  return r.data
}
```

### Fix bureau-de-change/actions.ts

```ts
import { parseCurrency } from '@/lib/money/currency'

// Dans l'action :
const from = parseCurrency(formData.get('from_currency'))
const to   = parseCurrency(formData.get('to_currency'))
if (from === to) return { error: 'La devise source et cible doivent être différentes.' }

// Puis insert avec `from` et `to` typés garantis.
```

### Fix UI (CreateAccountModal)

Remplacer les options hardcodées par la constante :
```tsx
import { ACCOUNT_CURRENCIES } from '@/lib/money/currency'

<select name="currency" required className={SELECT} style={INPUT_STYLE}>
  {ACCOUNT_CURRENCIES.map(ccy => (
    <option key={ccy} value={ccy}>{ccy}</option>
  ))}
</select>
```

### Test

```ts
// src/lib/money/currency.test.ts
import { describe, it, expect } from 'vitest'
import { parseCurrency } from './currency'

describe('parseCurrency', () => {
  it('accepts HTG/USD/CAD/DOP', () => {
    for (const c of ['HTG','USD','CAD','DOP']) {
      expect(parseCurrency(c)).toBe(c)
    }
  })
  it('rejects empty string', () => {
    expect(() => parseCurrency('')).toThrow('Devise invalide')
  })
  it('rejects unknown codes', () => {
    expect(() => parseCurrency('EUR')).toThrow('Devise invalide')
  })
})
```

Test SQL :
```sql
-- Doit échouer
insert into public.accounts (cooperative_id, member_id, account_number, account_type, currency)
values ('<some uuid>', '<some uuid>', 'TEST-ENUM', 'savings', 'XYZ');
-- → ERROR : invalid input value for enum currency_code: "XYZ"
```

**Après ce fix, l'erreur `input valid value for enum currency_code` que l'utilisateur a vue retourne avec un message en français propre : "Devise invalide : XYZ. Doit être HTG, USD, CAD ou DOP."**

---

## FIX-6 : Trigger `loans.amount_paid`

**Sévérité** : P0 — race condition `recordLoanRepayment`
**Fichier migration** : `supabase/migrations/20261015160000_loans_amount_paid_trigger.sql`
**Fichier code** : `src/app/(dashboard)/tableau-de-bord/prets/actions.ts` (retirer le bloc SUM + UPDATE amount_paid)

Voir `02-FINANCIAL-INTEGRITY.md` §5 pour le détail complet.

### Test

```sql
-- Après migration, pour chaque loan :
select l.id, l.amount_paid,
       coalesce(sum(r.amount_paid), 0) as computed
from public.loans l
left join public.loan_repayments r on r.loan_id = l.id
group by l.id, l.amount_paid
having l.amount_paid != coalesce(sum(r.amount_paid), 0);
-- doit retourner 0 rows
```

---

## FIX-7 : IDOR `updateAgentStatus` + `updateSetting`

**Sévérité** : P0 (updateAgentStatus) + P1 (updateSetting)
**Fichier** : `src/app/(dashboard)/tableau-de-bord/parametres/actions.ts`

Voir `01-SECURITY-RLS-TENANT.md` §3 et §5 pour le code complet.

### Tests Vitest

Voir §3 de `01-SECURITY-RLS-TENANT.md` pour la liste des cas (caller non-admin, cross-coop, self-suspend).

### Déploiement

```bash
git switch -c audit/p0-fix-7-idor-fixes
# Appliquer les changements code
npx tsc --noEmit && npm run lint && npm run test
git add src/app/(dashboard)/tableau-de-bord/parametres/actions.ts
git commit -m "fix(security): auth + role + coop checks on parametres actions (audit P0 FIX-7)"
git push -u origin audit/p0-fix-7-idor-fixes
```

---

## FIX-8 : Logos bucket scoping

**Sévérité** : P1
**Fichiers** :
- `supabase/migrations/20261015120200_scope_logos_bucket_to_cooperative.sql`
- `src/components/dashboard/forms/ParametresClient.tsx` (path upload)

Voir `01-SECURITY-RLS-TENANT.md` §7 pour le code.

### Migration de données existantes

Avant d'appliquer la nouvelle policy, déplacer les logos existants vers le pattern `/{coop_id}/logo.png` :
```sql
-- Lister les logos existants
select name from storage.objects where bucket_id = 'logos';
```

Si des logos existent, utiliser l'API Supabase Storage pour les copier au nouveau path, puis mettre à jour `app_settings.pdf_logo_url` → nouveau URL, puis supprimer les anciens.

### Test

```ts
test('agent de coop A ne peut pas écraser le logo de coop B', async () => {
  const { data: coopA } = await loginAsCoop('A')
  await uploadLogo(coopA, 'coop-B/logo.png', buffer)
  // Doit échouer avec permission denied
})
```

---

## FIX-9 : Four-eyes câblage

**Sévérité** : P1
**Fichiers** : chaque action.ts qui concerne une opération sensible (loan.disburse, loan.writeoff, cash.closure.close, account.close, role.grant, settings.update)
**Pré-requis** : FIX-7 (updateAgentStatus doit déjà avoir la base auth/role check)

Voir `01-SECURITY-RLS-TENANT.md` §6 pour le pattern.

**Important** : la version actuelle d'`evaluateApproval` suppose initiateur et approbateur dans le même payload de request. Pour un vrai workflow 4-yeux (A soumet, B approuve plus tard), il faut une table `pending_approvals`. C'est une refacto plus large — à faire en Phase 1 architectural, pas en Session 2.

Pour la Session 2, câbler le check au moins pour que la règle soit respectée **si l'appelant a bien passé un approverId distinct**. Les workflows async viennent après.

---

## FIX-10 : Mislabel audit `cash.transfer`

**Sévérité** : P1
**Fichier** : `src/app/(dashboard)/tableau-de-bord/transactions/actions.ts:97`
**Durée** : 15 min

### Fix

```ts
// Avant
await logAudit({
  action: input.type === 'deposit' ? 'cash.transfer' : 'cash.transfer',
  // ...
})

// Après
await logAudit({
  action: input.type === 'deposit' ? 'transaction.deposit' : 'transaction.withdrawal',
  // ...
})
```

Étendre `AuditAction` dans `src/lib/audit/index.ts` :
```ts
export type AuditAction =
  // existing...
  | 'transaction.deposit'
  | 'transaction.withdrawal'
  | 'transaction.historical'
  | 'cash.transfer'   // garder pour vrais transferts inter-comptes
```

### Migration de rattrapage (optionnelle)

Voir `02-FINANCIAL-INTEGRITY.md` §8 pour relabelliser les audit_logs existants.

---

## Validation globale post-déploiement

Après toutes les FIX-* appliquées, lancer cette checklist complète :

### Côté DB (via SQL editor Supabase)

```sql
-- 1. RLS active sur toutes les tables tenant
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('agents','cooperatives','cash_vault','system_settings','exchange_rates',
                    'accounts','members','transactions','loans','loan_repayments')
order by tablename;
-- rowsecurity doit être `true` partout

-- 2. Pas de GRANT ALL to anon
select grantee, privilege_type, count(*)
from information_schema.table_privileges
where grantee = 'anon' and table_schema = 'public'
group by grantee, privilege_type;
-- Idéalement vide (anon ne doit rien pouvoir faire par défaut)

-- 3. UNIQUE sur transactions.reference
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.transactions'::regclass and contype = 'u';
-- doit lister transactions_reference_unique

-- 4. Tous les comptes alignés
select count(*) filter (where a.balance = computed) as ok,
       count(*) filter (where a.balance != computed) as drift
from (
  select a.id, a.balance,
         coalesce((select sum(case when t.transaction_type='deposit' then t.amount
                                   when t.transaction_type='withdrawal' then -t.amount
                                   else 0 end)
                   from transactions t where t.account_id = a.id), 0) as computed
  from accounts a
) a;
-- drift doit être 0

-- 5. cash_vault aligné
-- (requête §4 ci-dessus)

-- 6. loans.amount_paid aligné
-- (requête §FIX-6 ci-dessus)
```

### Côté app (manuel + E2E)

- [ ] Login agent fonctionne
- [ ] Dashboard charge toutes les pages (membres, comptes, transactions, prêts, bureau de change, caisse, rapports, paramètres)
- [ ] Création compte avec solde initial 1000 G → ticket généré, solde affiché 1000 G, 1 transaction d'ouverture visible
- [ ] Dépôt 500 G → solde devient 1500 G, cash_vault incrémenté de 500 G, ticket PDF téléchargeable
- [ ] Retrait 200 G → solde devient 1300 G, cash_vault décrémenté de 200 G
- [ ] Double-clic sur Dépôt → 1 seule transaction créée (test idempotency)
- [ ] Tentative création compte avec devise `EUR` → erreur en français propre (test currency enum)
- [ ] Tentative suspension d'un agent d'une autre coop → refusée (test IDOR)
- [ ] npm audit --production → 0 CRITICAL
- [ ] Lighthouse / Vercel preview : aucune nouvelle erreur console

### Côté audit log

```sql
-- Vérifier que les dépôts et retraits sont loggés distinctement
select action, count(*)
from public.audit_logs
where action in ('transaction.deposit', 'transaction.withdrawal', 'cash.transfer')
  and created_at > now() - interval '7 days'
group by action;
-- Doit avoir au moins `transaction.deposit` et `transaction.withdrawal` représentés
```

---

## Si quelque chose casse en prod

Protocole d'urgence :
1. **Rollback immédiat** du dernier déploiement Vercel (bouton "Rollback" dans la UI Vercel)
2. **Rollback migration DB** si c'est une migration DB qui a cassé :
   ```bash
   # Exemple de rollback d'urgence pour RLS (voir §FIX-2)
   supabase db execute <<SQL
   alter table public.agents disable row level security;
   -- etc.
   SQL
   ```
3. Reproduire l'erreur sur le miroir
4. Fixer sur le miroir
5. Re-déployer

Ne JAMAIS appliquer un fix en prod sans l'avoir validé sur miroir d'abord. Ne JAMAIS forcer un push.

---

## Ce qui n'est PAS dans ce doc

- Les fixes P1 et P2 non critiques (voir docs 01-02 pour la liste)
- La refacto money → Dinero.js (Phase 1 architectural, pas Session 2)
- Les RPC SECURITY DEFINER centralisées (recommandation long-terme, pas P0)
- La refonte produit / SaaS (Session 3)

L'objectif de ce doc est **exclusivement de résoudre les 7 P0 bloquants** identifiés dans les docs 00-02. Pas plus. Pas moins.
