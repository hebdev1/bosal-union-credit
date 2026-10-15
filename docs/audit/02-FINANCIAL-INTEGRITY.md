# 02 — Intégrité financière

**Sévérité globale** : 4 findings P0 + 5 P1. **L'application ne doit pas gérer de l'argent réel avant que §3-6 soient résolus.** Au-delà de la sécurité pure (doc 01), c'est l'intégrité financière qui définit la crédibilité d'un SaaS financier.

**Lecteur cible** : tech lead + CFO ou responsable financier. Ce doc explique où le code peut créer, perdre, dupliquer ou corrompre de l'argent. Chaque finding est reproductible.

---

## 1. Représentation money : float JS partout — P1

**Évidence** : tous les montants circulent en `number` JavaScript (IEEE-754 double). Aucune lib decimal (`decimal.js`, `big.js`, `dinero.js`) dans `package.json`.

**Fichiers concernés** :
- `src/lib/formatters.ts:3-11` — `formatHTG(n: number)` prend un `number`
- `src/lib/finance/interest.ts:107-109` — `round2(n)` opère sur `number`
- `src/app/(dashboard)/tableau-de-bord/prets/actions.ts:361-362` — `parseFloat(formData.get(...))`
- `src/app/(dashboard)/tableau-de-bord/comptes/actions.ts:44, 169, 262, 284` — `Number(formData.get(...))`
- Toutes les autres `actions.ts` : même pattern

**Pourquoi c'est un problème** :
- IEEE-754 ne peut pas représenter exactement `0.1 + 0.2` (donne `0.30000000000000004`). Sur quelques opérations c'est invisible. Sur **des milliers d'opérations** cumulées (ce qui est le cas d'une caisse qui tourne), l'erreur s'accumule.
- Exemple : `17.49 - 10.00 - 7.49` en float JS donne `3.552713678800501e-15` au lieu de `0`. Visualisé c'est `0`, stocké c'est quasi-zéro. Agrégé sur mille lignes, ça diverge.
- Les banques, cartes de crédit, et toutes les librairies pro de comptabilité utilisent **des entiers (minor units)** ou **des décimaux arbitraires**.

**Sévérité P1 et pas P0** : les cas d'usage actuels (petites coopératives, quelques milliers de transactions par mois) rendent la dérive invisible à court terme. Mais c'est une bombe à retardement — plus on scale, plus ça fait mal. Et c'est **impossible à retrofit** sans migration de données.

**Recommandation** : adopter `dinero.js` au boundary (entrée de server action + sortie vers DB). Les calculs internes restent en integer cents.

```ts
// src/lib/money/index.ts (nouveau)
import { dinero, add, subtract, multiply, type Dinero } from 'dinero.js'
import { HTG, USD } from '@dinero.js/currencies'

const CURRENCIES = { HTG, USD }

export function money(amount: number, currency: 'HTG' | 'USD'): Dinero<number> {
  return dinero({ amount: Math.round(amount * 100), currency: CURRENCIES[currency] })
}
export function toCents(d: Dinero<number>): number { /* ... */ }
export function fromCents(cents: number, currency: 'HTG' | 'USD'): Dinero<number> { /* ... */ }
```

Puis migration incrémentale : à chaque action.ts touchée, remplacer les `Number()` + `Math.round(x*100)/100` par `money(x, currency)`.

**Pas une priorité pour la Session 2 fixes P0** — mais à backlog Phase 1 architectural foundation.

---

## 2. Colonnes money sans précision — P1

**Évidence** : seule `payments.amount` est typée strictement :
```sql
-- supabase/migrations/20260427140000_credit_scoring_schema.sql:16-17
amount      numeric(14,2) not null default 0  check (amount      >= 0),
amount_due  numeric(14,2) not null            check (amount_due  >= 0),
```

Toutes les autres colonnes money utilisent `numeric` sans précision :
- `accounts.balance` — `supabase/migrations/20260323121040_add_loan_and_savings_products.sql:8-10`
- `transactions.amount` — `20260323121052:9`
- `loans.principal_amount`, `monthly_payment`, `total_amount_due`, `amount_paid` — `20260323121116:30,38`
- `cash_vault.current_balance`, `opening_balance` — même pattern
- `exchange_transactions.amount_given`, `amount_received` — même pattern

**Impact** : un client (via n'importe quelle lib Supabase) peut écrire `0.333333333333333` dans un champ money. Le trigger `recompute_account_balance` fait `round(v_balance, 2)` à l'écriture (`supabase/migrations/20260430140000_...:37`), donc `accounts.balance` est propre côté sortie. Mais `transactions.amount` lui n'est pas rounded par trigger — un INSERT direct avec 10 décimales est accepté.

**Fix** : contraindre à `numeric(14,2)` + CHECK >= 0 sur toutes les colonnes money.

```sql
-- supabase/migrations/20261015130000_tighten_money_columns.sql

-- accounts.balance (nullable car pas default historiquement)
alter table public.accounts
  alter column balance type numeric(14,2) using round(balance::numeric, 2);
alter table public.accounts
  add constraint accounts_balance_non_null_or_default check (balance is not null);
-- CHECK >= 0 NON appliqué : un compte peut légitimement être négatif (découvert, correction, closeAccount edge)

-- transactions.amount
alter table public.transactions
  alter column amount type numeric(14,2) using round(amount::numeric, 2);
alter table public.transactions
  add constraint transactions_amount_positive check (amount > 0);

-- loans
alter table public.loans
  alter column principal_amount type numeric(14,2) using round(principal_amount::numeric, 2),
  alter column monthly_payment  type numeric(14,2) using round(monthly_payment::numeric, 2),
  alter column total_amount_due type numeric(14,2) using round(total_amount_due::numeric, 2),
  alter column amount_paid      type numeric(14,2) using round(coalesce(amount_paid, 0)::numeric, 2);
alter table public.loans
  add constraint loans_principal_positive check (principal_amount > 0),
  add constraint loans_monthly_payment_non_negative check (monthly_payment >= 0),
  add constraint loans_total_due_non_negative check (total_amount_due >= 0),
  add constraint loans_amount_paid_non_negative check (amount_paid >= 0);

-- cash_vault
alter table public.cash_vault
  alter column current_balance type numeric(14,2) using round(current_balance::numeric, 2),
  alter column opening_balance type numeric(14,2) using round(coalesce(opening_balance, 0)::numeric, 2);

-- exchange_transactions
alter table public.exchange_transactions
  alter column amount_given    type numeric(14,2) using round(amount_given::numeric, 2),
  alter column amount_received type numeric(14,2) using round(amount_received::numeric, 2);
alter table public.exchange_transactions
  add constraint exchange_amount_given_positive check (amount_given > 0),
  add constraint exchange_amount_received_positive check (amount_received > 0);
```

**Risque** : si des rows existent avec plus de 2 décimales, le `using round(…)` les tronque silencieusement. Vérifier d'abord :
```sql
select count(*) from public.transactions where amount != round(amount::numeric, 2);
```

---

## 3. Idempotence manquante sur `recordTransaction` — P0

**Évidence** :
- `src/app/(dashboard)/tableau-de-bord/comptes/actions.ts:294-297` génère une référence pseudo-aléatoire :
  ```ts
  const now       = new Date()
  const datePart  = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randPart  = Math.floor(1000 + Math.random() * 9000)  // 4 chars, 9000 combos
  const reference = `TX-${datePart}-${randPart}`
  ```
- Aucune contrainte `UNIQUE` sur `transactions.reference` dans aucune migration
- Pas d'idempotency key passé par le client. Chaque submit du bouton Dépôt = nouvel appel, nouvelle référence, nouvelle ligne

**Impact exploit** (reproductible manuellement) :
1. Caissier clique sur "Dépôt 1000 G"
2. Le browser pour une raison X (clic frénétique, lag réseau, click-and-rage) ré-envoie la requête
3. Deux lignes dans `transactions` avec la même intention mais 2 références différentes
4. Le trigger `trg_account_balance_from_transaction` additionne les deux
5. `cash_vault.current_balance` est incrémenté deux fois (voir §4)
6. Résultat : **client crédité du double, caisse déséquilibrée**

**Fix niveau DB** :
```sql
-- supabase/migrations/20261015140000_add_transaction_idempotency.sql

-- 1) Contrainte UNIQUE sur reference pour empêcher doublons côté DB
--    (nettoyer d'abord les doublons existants s'il y en a)
delete from public.transactions t
using (
  select min(ctid) as keep_ctid, reference
  from public.transactions
  where reference is not null
  group by reference
  having count(*) > 1
) d
where t.reference = d.reference and t.ctid != d.keep_ctid;

alter table public.transactions
  add constraint transactions_reference_unique unique (reference);

-- 2) Idempotency key client-side (optional, protège le cas double-submit)
alter table public.transactions
  add column if not exists idempotency_key text;

create unique index if not exists transactions_idempotency_key_unique_idx
  on public.transactions (idempotency_key)
  where idempotency_key is not null;
```

**Fix niveau code** :
```ts
// src/app/(dashboard)/tableau-de-bord/comptes/actions.ts
// Signature mise à jour pour accepter un idempotencyKey optional
export async function recordTransaction(input: {
  accountId: string
  type: 'deposit' | 'withdrawal'
  amount: number
  motif?: string | null
  idempotencyKey?: string   // NEW — généré client-side par le modal au moment du mount
}): Promise<...> {
  // ... auth, validation ...

  // Si une transaction avec cette idempotencyKey existe déjà, retourner son ticket (idempotent)
  if (input.idempotencyKey) {
    const { data: existing } = await (supabase as any)
      .from('transactions')
      .select('id, reference')
      .eq('idempotency_key', input.idempotencyKey)
      .eq('cooperative_id', agent.cooperative_id)
      .maybeSingle()
    if (existing) {
      // return the existing ticket, as if the first call succeeded
      return { ticket: /* ... reconstruct from existing ... */ }
    }
  }

  // Insert avec idempotency_key
  const { data: tx, error: txErr } = await (supabase as any).from('transactions').insert({
    // ... reste ...
    reference,
    idempotency_key: input.idempotencyKey ?? null,
  }).select('id').single()
  // ...
}
```

```tsx
// src/components/dashboard/forms/RecordTransactionModal.tsx (ou équivalent)
import { useMemo } from 'react'
const idempotencyKey = useMemo(() => crypto.randomUUID(), [])  // généré UNE FOIS au mount
// … passer idempotencyKey à la server action
```

Après submit success, reset le key à un nouveau UUID pour la prochaine opération.

**Test de régression** :
```ts
// src/app/(dashboard)/tableau-de-bord/comptes/actions.test.ts
it('est idempotent sur double-submit avec même idempotency_key', async () => {
  const key = crypto.randomUUID()
  const r1 = await recordTransaction({ accountId, type: 'deposit', amount: 100, idempotencyKey: key })
  const r2 = await recordTransaction({ accountId, type: 'deposit', amount: 100, idempotencyKey: key })
  expect(r1.ticket.reference).toBe(r2.ticket.reference)
  const txs = await supabase.from('transactions').select('*').eq('idempotency_key', key)
  expect(txs.data?.length).toBe(1)
})
```

**Même fix à appliquer à `recordTransactionEntry`** (`transactions/actions.ts:20`).

---

## 4. Race condition `cash_vault` sans lock — P0

**Évidence** :
```ts
// src/app/(dashboard)/tableau-de-bord/comptes/actions.ts:321-336
const { data: vault } = await (supabase as any)
  .from('cash_vault')
  .select('id, current_balance')
  .eq('cooperative_id', agent.cooperative_id)
  .limit(1)
  .maybeSingle()
if (vault?.id) {
  const newVault = input.type === 'deposit'
    ? Number(vault.current_balance ?? 0) + amt
    : Number(vault.current_balance ?? 0) - amt
  await (supabase as any)
    .from('cash_vault')
    .update({ current_balance: Math.round(newVault * 100) / 100, last_updated: createdAt })
    .eq('id', vault.id)
}
```

**Impact exploit** (reproductible avec deux onglets ou deux caissiers) :
1. T=0 : Caissier A fait un dépôt de 100. Son action read `cash_vault.current_balance = 1000`.
2. T=1 : Caissier B fait un dépôt de 200 (coop même coop). Son action read `cash_vault.current_balance = 1000` (toujours, A n'a pas encore UPDATE).
3. T=2 : A UPDATE → `current_balance = 1100`.
4. T=3 : B UPDATE → `current_balance = 1200` (basé sur son read de 1000, pas sur le 1100 de A).
5. Résultat : la caisse montre 1200 au lieu de 1300. **Perte de 100 G.**

De plus : **aucune réconciliation serveur**. Pas de job cron qui recompute `cash_vault.current_balance = SUM(deposit) − SUM(withdrawal)` sur toutes les transactions. La dérive est indétectable sans audit manuel.

**Fix niveau DB** : exactement comme `accounts.balance`, créer une RPC + trigger. Le trigger ne tire pas sur `cash_vault` directement — il tire sur `transactions` et met à jour `cash_vault` de la coop concernée.

```sql
-- supabase/migrations/20261015150000_cash_vault_trigger.sql

-- 1) RPC qui recompute le solde d'une caisse à partir des transactions
create or replace function public.recompute_cash_vault(p_cooperative_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_cooperative_id is null then return; end if;

  select coalesce(sum(
    case
      when transaction_type = 'deposit'    then  amount
      when transaction_type = 'withdrawal' then -amount
      else 0
    end
  ), 0)
  into v_balance
  from public.transactions
  where cooperative_id = p_cooperative_id;

  update public.cash_vault
     set current_balance = round(v_balance + coalesce(opening_balance, 0), 2),
         last_updated    = now()
   where cooperative_id = p_cooperative_id;
end;
$$;

comment on function public.recompute_cash_vault(uuid) is
  'Recompute cash_vault.current_balance = opening_balance + SUM(deposits) − SUM(withdrawals). Idempotent.';

revoke all on function public.recompute_cash_vault(uuid) from anon, public;
grant execute on function public.recompute_cash_vault(uuid) to authenticated;

-- 2) Trigger function qui fire après INSERT/UPDATE/DELETE sur transactions
create or replace function public._trg_vault_from_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op in ('INSERT','UPDATE')) and new.cooperative_id is not null then
    perform public.recompute_cash_vault(new.cooperative_id);
  end if;
  if tg_op = 'UPDATE'
     and old.cooperative_id is not null
     and old.cooperative_id is distinct from new.cooperative_id then
    perform public.recompute_cash_vault(old.cooperative_id);
  end if;
  if tg_op = 'DELETE' and old.cooperative_id is not null then
    perform public.recompute_cash_vault(old.cooperative_id);
  end if;
  return null;
end;
$$;

-- 3) Wire le trigger
drop trigger if exists trg_cash_vault_from_transaction on public.transactions;
create trigger trg_cash_vault_from_transaction
after insert or update or delete on public.transactions
for each row execute function public._trg_vault_from_transaction();

-- 4) Backfill : recompute pour toutes les coops existantes
set local session_replication_role = 'replica';
do $$
declare c record;
begin
  for c in select id from public.cooperatives loop
    perform public.recompute_cash_vault(c.id);
  end loop;
end $$;
set local session_replication_role = 'origin';
```

**Fix niveau code** : retirer complètement le bloc `cash_vault` update dans `recordTransaction` (lignes 321-336 de `comptes/actions.ts`) — le trigger s'en charge. Même nettoyage que ce qui a été fait pour `accounts.balance` dans le commit `4813c6e`.

**Test de régression** :
```sql
-- Doit toujours être true
select cv.current_balance,
       cv.opening_balance + coalesce(sum(case when t.transaction_type='deposit' then t.amount
                                              when t.transaction_type='withdrawal' then -t.amount
                                              else 0 end), 0) as computed
from public.cash_vault cv
left join public.transactions t on t.cooperative_id = cv.cooperative_id
group by cv.id, cv.current_balance, cv.opening_balance;
-- current_balance doit égaler computed pour chaque row
```

---

## 5. `recordLoanRepayment` non atomique — P0

**Évidence** :
```ts
// src/app/(dashboard)/tableau-de-bord/prets/actions.ts:208-227 (approximatif)
// 1) SUM(amount_paid) sur loan_repayments pour ce prêt
const { data: sumRow } = await (supabase as any)
  .from('loan_repayments')
  .select('amount_paid')
  .eq('loan_id', input.loanId)
// 2) agrège côté JS
const totalPaid = sumRow.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0)
// 3) INSERT la nouvelle ligne loan_repayments
// 4) UPDATE loans.amount_paid = totalPaid + input.amount
```

**Impact exploit** : si deux agents enregistrent deux versements du même prêt en même temps, les deux voient `totalPaid` identique avant leur INSERT. Les deux UPDATE écrasent `loans.amount_paid` avec leur propre calcul. Le second versement est partiellement ignoré.

Example :
- `loans.amount_paid = 500`
- Agent A : record 100 → read 500, insert repayment, UPDATE → 600
- Agent B : record 150 (en parallèle) → read 500 (pas encore vu A), insert repayment, UPDATE → 650
- Après les deux : `loans.amount_paid = 650` mais la vraie somme des repayments est 750.

**Fix niveau DB** : réécrire comme un trigger sur `loan_repayments` qui recompute `loans.amount_paid` à partir de la table (comme on fait pour `accounts.balance`).

```sql
-- supabase/migrations/20261015160000_loans_amount_paid_trigger.sql

create or replace function public.recompute_loan_amount_paid(p_loan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric;
begin
  if p_loan_id is null then return; end if;

  select coalesce(sum(amount_paid), 0)
  into v_total
  from public.loan_repayments
  where loan_id = p_loan_id;

  update public.loans
     set amount_paid = round(v_total, 2)
   where id = p_loan_id;
end;
$$;

create or replace function public._trg_loan_amount_paid_from_repayment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op in ('INSERT','UPDATE')) and new.loan_id is not null then
    perform public.recompute_loan_amount_paid(new.loan_id);
  end if;
  if tg_op = 'UPDATE'
     and old.loan_id is not null
     and old.loan_id is distinct from new.loan_id then
    perform public.recompute_loan_amount_paid(old.loan_id);
  end if;
  if tg_op = 'DELETE' and old.loan_id is not null then
    perform public.recompute_loan_amount_paid(old.loan_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_loan_amount_paid_from_repayment on public.loan_repayments;
create trigger trg_loan_amount_paid_from_repayment
after insert or update or delete on public.loan_repayments
for each row execute function public._trg_loan_amount_paid_from_repayment();

-- Backfill
set local session_replication_role = 'replica';
do $$
declare l record;
begin
  for l in select id from public.loans loop
    perform public.recompute_loan_amount_paid(l.id);
  end loop;
end $$;
set local session_replication_role = 'origin';

revoke all on function public.recompute_loan_amount_paid(uuid)      from anon, public;
revoke all on function public._trg_loan_amount_paid_from_repayment() from anon, public;
grant execute on function public.recompute_loan_amount_paid(uuid)   to authenticated;
```

**Fix niveau code** : dans `recordLoanRepayment`, retirer tout le code `SUM + UPDATE loans.amount_paid`. Juste INSERT dans `loan_repayments`, le trigger s'occupe du reste.

Note : la logique métier "si fully paid → status = closed/completed" doit rester côté serveur ou passer dans le trigger. Simplest : laisser côté serveur, mais après INSERT faire un SELECT sur `loans` pour comparer `amount_paid` (maintenant à jour par le trigger) avec `total_amount_due`.

---

## 6. Enum `currency_code` non appliqué — P1 (bug utilisateur visible)

**Évidence** :
- `src/types/database.ts:1718` : `currency_code: "HTG" | "USD" | "CAD" | "DOP"` (enum DB)
- `src/types/database.ts:49` : `accounts.currency: string | null` (text libre, pas l'enum)
- `src/app/(dashboard)/tableau-de-bord/bureau-de-change/actions.ts:19-20` passe des strings bruts sans validation
- `src/components/dashboard/forms/CreateAccountModal.tsx:134-135` propose seulement HTG + USD
- `src/app/(dashboard)/tableau-de-bord/bureau-de-change/page.tsx:12-14` accepte toutes les 4 valeurs

**Impact user** : l'erreur `input valid value for enum currency_code` que l'utilisateur a signalée vient de là. Un formulaire envoie une valeur qui ne correspond pas à l'enum (par exemple string vide, ou devise comme "EUR" entrée via le bureau de change). PostgreSQL rejette → la server action retourne l'erreur brute → l'UI affiche le message cru.

**Impact métier plus large** : `accounts.currency` étant en text libre, un bug applicatif pourrait créer un compte avec `currency = ''` ou `currency = 'xyz'`. Les rapports / exports / taux de change ne retrouveraient pas la devise.

**Fix** (2 migrations + alignement UI) :

```sql
-- supabase/migrations/20261015170000_tighten_currency_code.sql

-- 1) Valider les données existantes avant migration
--    (pas forcément bloquant mais utile pour debug)
select distinct currency from public.accounts
  where currency not in ('HTG','USD','CAD','DOP');
select distinct from_currency from public.exchange_rates
  where from_currency not in ('HTG','USD','CAD','DOP');
-- Si résultats non vides, nettoyer manuellement avant la migration.

-- 2) Convertir accounts.currency vers l'enum
alter table public.accounts
  alter column currency type public.currency_code using currency::public.currency_code;

-- (exchange_rates et exchange_transactions utilisent déjà l'enum)

-- 3) Default = 'HTG' pour éviter les NULL
alter table public.accounts
  alter column currency set default 'HTG';

alter table public.accounts
  alter column currency set not null;
```

**Validation côté serveur avec zod** :

```ts
// src/lib/money/currency.ts (nouveau)
import { z } from 'zod'

export const CurrencyCode = z.enum(['HTG','USD','CAD','DOP'])
export type CurrencyCode = z.infer<typeof CurrencyCode>

// Alias UI : certaines modales n'exposent que HTG/USD
export const AccountCurrency = z.enum(['HTG','USD'])
```

Dans chaque action.ts qui prend une devise :
```ts
import { CurrencyCode } from '@/lib/money/currency'

const parsed = CurrencyCode.safeParse(input.currency)
if (!parsed.success) {
  return { error: `Devise invalide : ${input.currency}. Doit être HTG, USD, CAD ou DOP.` }
}
```

**Alignement UI** :
- `CreateAccountModal.tsx` : offrir uniquement `HTG` et `USD` (c'est le cas aujourd'hui, à préserver). Les 4 devises de l'enum sont pour le bureau de change uniquement.
- `bureau-de-change/page.tsx` : offrir les 4, c'est ok.
- Pour chaque select devise dans l'UI, utiliser une constante partagée pour éviter la dérive :
  ```ts
  // src/lib/money/currency.ts
  export const ACCOUNT_CURRENCIES = ['HTG', 'USD'] as const
  export const EXCHANGE_CURRENCIES = ['HTG', 'USD', 'CAD', 'DOP'] as const
  ```

---

## 7. Rounding incohérent sur certaines opérations — P1

**Trouvailles de l'agent** :
- `Math.round(x*100)/100` est bien utilisé dans la plupart des endroits : `comptes/actions.ts:82,266,334,387`, `transactions/actions.ts:84`, `prets/actions.ts:153-154,215,317-318,337-338,397-398`, `interest.ts:108`.
- **MANQUE** dans :
  - `bureau-de-change/actions.ts:88` — `amountGiven * rateApplied` stocké sans rounding dans `exchange_transactions.amount_received`
  - `prets/actions.ts:301-303` — `totalInterest`, `totalAmountDue`, `monthlyPayment` sont calculés, seuls les deux derniers sont rounded

**Impact** : les montants stockés peuvent avoir 10+ décimales. Combiné avec §2 (colonnes money sans précision), ça finit en DB littéralement.

**Fix** : audit systématique de chaque `.insert`/`.update` qui touche un champ money. Ajouter `Math.round(x * 100) / 100` partout. Mieux : refactorer en helper `cents(x)` dans `src/lib/money/`.

Une fois la lib money (§1) en place, ce problème disparaît par construction.

---

## 8. Mislabel audit `cash.transfer` — P1

**Évidence** :
```ts
// src/app/(dashboard)/tableau-de-bord/transactions/actions.ts:97
await logAudit({
  action: input.type === 'deposit' ? 'cash.transfer' : 'cash.transfer',  // ← identique des deux côtés !
  // ...
})
```

**Impact** : chaque dépôt ET chaque retrait est loggé comme `'cash.transfer'`. Impossible de distinguer les deux dans l'audit trail post-mortem. Les rapports de conformité par type d'opération sont inexacts.

**Fix** :
```ts
await logAudit({
  action: input.type === 'deposit' ? 'transaction.deposit' : 'transaction.withdrawal',
  // ...
})
```

Et étendre l'enum `AuditAction` dans `src/lib/audit/index.ts`:
```ts
export type AuditAction =
  | 'loan.approve'
  | 'loan.reject'
  // ...
  | 'transaction.deposit'      // NEW
  | 'transaction.withdrawal'   // NEW
  | 'transaction.historical'   // NEW — spécifique à l'entry historique
  | 'cash.transfer'            // garder pour les vrais transferts inter-comptes
  // ...
```

Nettoyer aussi `recordTransaction` dans `comptes/actions.ts` qui utilise probablement le même mislabel (à vérifier).

**Migration de rattrapage** (optionnel) : re-labeliser les audit_logs existants qui ont `action='cash.transfer'` et `metadata.transaction_type ∈ {deposit, withdrawal}` :
```sql
update public.audit_logs
   set action = 'transaction.deposit'
 where action = 'cash.transfer'
   and metadata->>'transaction_type' = 'deposit';

update public.audit_logs
   set action = 'transaction.withdrawal'
 where action = 'cash.transfer'
   and metadata->>'transaction_type' = 'withdrawal';
```

---

## 9. Trigger storm sur imports bulk — P1

**Évidence** : `supabase/migrations/20260427140200_credit_scoring_triggers.sql` wire `_trg_score_from_transaction` AFTER INSERT/UPDATE/DELETE for each row sur `public.transactions`. La fonction `refresh_member_credit_score` fait un SELECT ... + INSERT ON CONFLICT UPDATE.

**Impact** : si tu importes 1000 transactions historiques en bulk (par ex. depuis un Excel de reprise de données), 1000 triggers firent, 1000 recomputations de score se font. Chaque recomputation = ~10 queries. Total = 10 000 queries, probablement plusieurs secondes de blocage.

**Fix** : passer en trigger `AFTER INSERT ... FOR EACH STATEMENT` qui fait un SELECT distinct des `member_id` affectés et recompute une seule fois chacun.

```sql
-- supabase/migrations/20261015180000_debounce_credit_score_trigger.sql

create or replace function public._trg_score_from_transaction_batch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  -- Dans un AFTER STATEMENT trigger, les tables new_table / old_table
  -- (REFERENCING NEW TABLE AS new_table) contiennent toutes les rows affectées.
  for r in
    select distinct a.member_id
    from (
      select account_id from new_table
      union
      select account_id from old_table
    ) t
    join public.accounts a on a.id = t.account_id
    where a.member_id is not null
  loop
    perform public.refresh_member_credit_score(r.member_id);
  end loop;
  return null;
end;
$$;

drop trigger if exists trg_credit_score_transactions on public.transactions;

-- INSERT
create trigger trg_credit_score_transactions_insert
after insert on public.transactions
referencing new table as new_table
for each statement execute function public._trg_score_from_transaction_batch();

-- UPDATE
create trigger trg_credit_score_transactions_update
after update on public.transactions
referencing new table as new_table old table as old_table
for each statement execute function public._trg_score_from_transaction_batch();

-- DELETE
create trigger trg_credit_score_transactions_delete
after delete on public.transactions
referencing old table as old_table
for each statement execute function public._trg_score_from_transaction_batch();
```

Attention : la syntaxe `referencing new table as new_table` est spécifique AFTER + FOR EACH STATEMENT. Testez bien sur le miroir avant.

**Pour les cas simples (1 INSERT seul)** : le comportement est identique, juste la façon dont le trigger est câblé qui change. Le score se met à jour normalement.

---

## 10. Amortization edge cases — vérifié OK, mais à documenter

**Évidence** : `src/lib/finance/interest.ts:71-84` fait rounding row par row avec adjustment au dernier paiement :
```ts
// Dernier paiement : solder tout exactement
if (period === termMonths) {
  principalPart = round2(balance)
  payment = round2(principalPart + interest)
}
```

C'est propre. Le solde atterrit exactement à 0 à la fin de l'amortissement, même avec des arrondis intermédiaires. Vérifié par les tests `src/lib/finance/interest.test.ts` existants.

Point P3 : ajouter plus de cas edge aux tests :
- Prêt principal = 1 G (micro-crédit)
- Prêt principal = 100 000 G (gros montant)
- Taux = 0%
- Durée = 1 mois (edge single-payment)
- Durée = 60 mois (long)

Pour la Session 2, ne pas toucher ce code — il fonctionne. Juste augmenter la couverture tests dans la Session dedicated testing (voir doc 04).

---

## 11. Recommandation architecturale finale

Les fixes DB sont nécessaires et suffisants pour résoudre les P0 à court terme. Mais à moyen terme (Phase 1 architectural), la bonne approche est de **centraliser toutes les opérations money-moving dans des RPC SECURITY DEFINER PostgreSQL**.

Pattern recommandé :
```sql
-- Exemple : record_deposit RPC
create or replace function public.rpc_record_deposit(
  p_account_id        uuid,
  p_amount            numeric(14,2),
  p_motif             text,
  p_idempotency_key   text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account record;
  v_agent   record;
  v_tx_id   uuid;
begin
  -- 1. Résolution de l'agent appelant
  select cooperative_id, id into v_agent
  from public.agents where id = auth.uid();
  if v_agent is null then
    raise exception 'Non authentifié' using errcode = '42501';
  end if;

  -- 2. Idempotency : si une tx avec cette clé existe, retourner son id
  select id into v_tx_id
  from public.transactions
  where idempotency_key = p_idempotency_key
    and cooperative_id = v_agent.cooperative_id;
  if v_tx_id is not null then
    return json_build_object('ok', true, 'id', v_tx_id, 'idempotent', true);
  end if;

  -- 3. Verrouiller le compte pour éviter race conditions
  select id, cooperative_id, status, currency, balance
  into v_account
  from public.accounts
  where id = p_account_id
    and cooperative_id = v_agent.cooperative_id
  for update;  -- ← LE LOCK est ici

  if v_account is null then
    raise exception 'Compte introuvable';
  end if;
  if v_account.status != 'active' then
    raise exception 'Compte non actif';
  end if;

  -- 4. Insert transaction
  insert into public.transactions (...)
  values (...)
  returning id into v_tx_id;

  -- Le trigger balance + trigger vault s'occupent de la synchronisation

  return json_build_object('ok', true, 'id', v_tx_id, 'idempotent', false);
end;
$$;

revoke all on function public.rpc_record_deposit from anon, public;
grant execute on function public.rpc_record_deposit to authenticated;
```

Et côté code TS, remplacer la server action par :
```ts
const { data, error } = await supabase.rpc('rpc_record_deposit', { ... })
```

**Avantages** :
- Lock atomique côté DB (impossible à race)
- Idempotence par construction
- Logique money centralisée dans la DB — pas de dérive application/DB
- Testable isolément avec pgTAP
- Même les Edge Functions / scripts externes passent par la même porte

**Coût** : chaque opération money nécessite une migration SQL. Plus de boilerplate côté DB. Moins de flexibilité pour debug depuis l'IDE.

**Recommandation** : adopter progressivement, en commençant par les 4 opérations P0 (`record_deposit`, `record_withdrawal`, `record_loan_repayment`, `close_account`). Les autres (createLoan, adjustLoan, etc.) peuvent rester en server action pour l'instant.

---

## 12. Résumé des findings

| # | Finding | Sévérité | Fix doc | Session suggérée |
|---|---|:---:|---|:---:|
| 1 | Float JS partout | P1 | Dinero.js au boundary | Phase 1 archi |
| 2 | Colonnes money sans précision | P1 | Migration tighten | Session 2 |
| 3 | Idempotence manquante recordTransaction | **P0** | UNIQUE reference + idempotency_key | **Session 2** |
| 4 | cash_vault race + pas de réconciliation | **P0** | Trigger + RPC recompute | **Session 2** |
| 5 | recordLoanRepayment non atomique | **P0** | Trigger recompute amount_paid | **Session 2** |
| 6 | Enum currency_code non appliqué | **P0** (user bug) | Migration enum + zod validator | **Session 2** |
| 7 | Rounding incohérent | P1 | Audit systématique | Session 2 |
| 8 | Mislabel audit cash.transfer | P1 | Fix 1-liner + enum ext | Session 2 |
| 9 | Trigger storm credit-score | P1 | Statement-level trigger | Session 2 |
| 10 | Amortization edge cases | P3 | Plus de tests | Testing session |
| 11 | Centraliser money ops en RPC | - (recommendation) | Progressif | Phase 1 archi |

---

## Prochaine étape

Lire `03-CRITICAL-FIXES-P0.md` qui contient le backlog exécutable (ordre, commandes, vérifications) pour les 6 P0 de ce doc + ceux du doc 01.
