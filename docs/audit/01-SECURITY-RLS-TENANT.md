# 01 — Sécurité, RLS et isolation multi-tenant

**Sévérité globale** : plusieurs findings P0 — **le projet n'est pas prêt pour une vraie coopérative tant que §1-7 ne sont pas corrigés**.

**Lecteur cible** : tech lead + CTO. Ce doc explique CE qui est cassé, POURQUOI c'est exploitable, et FOURNIT les migrations SQL de remédiation prêtes à exécuter (ne pas copier aveuglément — tester sur un projet Supabase miroir d'abord, cf §10).

---

## 1. RLS désactivée sur 5 tables critiques — P0

**Fichier source** : `supabase/migrations/20260325020203_fix_agents_rls_allow_auth.sql:1-9`

```sql
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_vault DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates DISABLE ROW LEVEL SECURITY;
```

**Pourquoi c'est fait comme ça** : commentaire SQL dit « pour permettre la lecture après auth ». L'intention probable était d'éviter des RLS circulaires (une policy sur `members` qui lit `agents` qui lit `members`…). Mais la solution adoptée — tout ouvrir — est pire que le problème.

**Impact exploit** :
1. Un utilisateur authentifié de coop A peut `SELECT * FROM public.agents` et voir tous les agents de toutes les coopératives (noms, emails, roles, téléphones)
2. Combiné avec §2 (`GRANT ALL`), un utilisateur authentifié peut `UPDATE public.cash_vault SET current_balance = 999999999` sur n'importe quelle coopérative
3. Même la clé anon publique (celle qui est dans le JS bundle, visible à qui ouvre le DevTools de `bosal-union-credit.vercel.app`) a accès à ces tables en lecture

**Vérification exploit** (reproductible depuis n'importe quel navigateur) :
```js
// Depuis la console du navigateur sur bosal-union-credit.vercel.app
await fetch('https://ebioqgjyzrhjxxlugzcz.supabase.co/rest/v1/cash_vault?select=*', {
  headers: {
    'apikey':        '<NEXT_PUBLIC_SUPABASE_ANON_KEY>',
    'authorization': 'Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY>',
  }
}).then(r => r.json())
// → retourne les balances cash_vault de TOUTES les coopératives
```

**Fix** : restaurer RLS avec des policies qui évitent la récursion circulaire. Le truc est d'utiliser une fonction `SECURITY DEFINER` qui prend le `auth.uid()` courant et retourne la `cooperative_id`, et de l'appeler dans les policies — comme ça, pas de SELECT récursif.

**Migration de remédiation** (à exécuter après test sur miroir) :

```sql
-- supabase/migrations/20261015120000_restore_rls_tenant_isolation.sql

-- ─── 1. Helper : current_user_cooperative_id ──────────────────────────────
-- SECURITY DEFINER + search_path verrouillé = pas de récursion dans les policies.
-- Note : le résultat est stable sur la durée d'une session (STABLE).
create or replace function public.current_user_cooperative_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select cooperative_id from public.agents where id = (select auth.uid()) limit 1
$$;

revoke all on function public.current_user_cooperative_id() from anon, public;
grant execute on function public.current_user_cooperative_id() to authenticated;

-- ─── 2. Ré-active RLS ─────────────────────────────────────────────────────
alter table public.agents            enable row level security;
alter table public.cooperatives      enable row level security;
alter table public.cash_vault        enable row level security;
alter table public.system_settings   enable row level security;
alter table public.exchange_rates    enable row level security;

-- ─── 3. Policies utilisant le helper (plus de récursion) ──────────────────

-- agents : chaque agent voit les agents de sa propre coopérative
drop policy if exists "agents_select_own_coop" on public.agents;
create policy "agents_select_own_coop" on public.agents
  for select to authenticated
  using (cooperative_id = public.current_user_cooperative_id());

-- Un agent ne peut modifier QUE son propre profil (nom, téléphone)
-- Les changements de role / status passent par une server action admin.
drop policy if exists "agents_update_self" on public.agents;
create policy "agents_update_self" on public.agents
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- INSERT/DELETE sur agents : interdit via API ; passe par les RPC admin.
-- (pas de policy = refus par défaut en RLS)

-- cooperatives : lecture-seule de SA coopérative + update par admin via server action
drop policy if exists "cooperatives_select_own" on public.cooperatives;
create policy "cooperatives_select_own" on public.cooperatives
  for select to authenticated
  using (id = public.current_user_cooperative_id());

drop policy if exists "cooperatives_update_admin" on public.cooperatives;
create policy "cooperatives_update_admin" on public.cooperatives
  for update to authenticated
  using (
    id = public.current_user_cooperative_id()
    and exists (
      select 1 from public.agents
      where id = (select auth.uid()) and role = 'admin'
    )
  )
  with check (id = public.current_user_cooperative_id());

-- cash_vault : lecture par coop ; écriture UNIQUEMENT via trigger (voir doc 02)
drop policy if exists "cash_vault_select_own_coop" on public.cash_vault;
create policy "cash_vault_select_own_coop" on public.cash_vault
  for select to authenticated
  using (cooperative_id = public.current_user_cooperative_id());

-- Interdit INSERT/UPDATE/DELETE direct via API (passe par SECURITY DEFINER RPC)
-- -> aucune policy FOR INSERT/UPDATE/DELETE = refus

-- system_settings : lecture + update par admin
drop policy if exists "system_settings_select_own" on public.system_settings;
create policy "system_settings_select_own" on public.system_settings
  for select to authenticated
  using (cooperative_id = public.current_user_cooperative_id());

drop policy if exists "system_settings_write_admin" on public.system_settings;
create policy "system_settings_write_admin" on public.system_settings
  for all to authenticated
  using (
    cooperative_id = public.current_user_cooperative_id()
    and exists (select 1 from public.agents where id = (select auth.uid()) and role = 'admin')
  )
  with check (
    cooperative_id = public.current_user_cooperative_id()
    and exists (select 1 from public.agents where id = (select auth.uid()) and role = 'admin')
  );

-- exchange_rates : lecture par coop + write par admin/manager
drop policy if exists "exchange_rates_select_own" on public.exchange_rates;
create policy "exchange_rates_select_own" on public.exchange_rates
  for select to authenticated
  using (cooperative_id = public.current_user_cooperative_id());

drop policy if exists "exchange_rates_write_mgmt" on public.exchange_rates;
create policy "exchange_rates_write_mgmt" on public.exchange_rates
  for all to authenticated
  using (
    cooperative_id = public.current_user_cooperative_id()
    and exists (
      select 1 from public.agents
      where id = (select auth.uid()) and role in ('admin','manager')
    )
  )
  with check (
    cooperative_id = public.current_user_cooperative_id()
    and exists (
      select 1 from public.agents
      where id = (select auth.uid()) and role in ('admin','manager')
    )
  );
```

**Test de régression** :
```sql
-- Avant : SELECT retourne N rows (toutes coops)
-- Après : SELECT retourne seulement les rows de la coop du JWT
begin;
  set role authenticated;
  set local "request.jwt.claim.sub" = '<uuid d un agent coop A>';
  select count(*) from public.cash_vault; -- doit être 1 (celui de coop A)
  select count(*) from public.agents where cooperative_id != public.current_user_cooperative_id(); -- doit être 0
rollback;
```

**Risque** : les pages du dashboard qui lisaient `agents`, `cooperatives`, `cash_vault`, `system_settings`, `exchange_rates` sans auth (en relying sur RLS OFF) vont casser. Il faut tester chaque page après le fix. Les 2 server actions problématiques (`updateAgentStatus`, `updateSetting`) sont traitées en §3 et §5.

---

## 2. GRANT ALL to anon, authenticated — P0

**Fichier source** : `supabase/migrations/20260325020531_fix_grants_and_permissions.sql:3-14`

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
```

**Pourquoi c'est fait comme ça** : vraisemblablement pour « déboguer » un problème de permission qui venait du RLS désactivé juste au-dessus (§1). Classique spiral de debugging : désactiver RLS → les requêtes marchent → les grants bloquent → on grant tout → on oublie de revenir en arrière.

**Impact exploit** : combiné avec §1, c'est le GRANT qui ouvre réellement la porte. RLS ignore les GRANT, mais quand RLS est OFF, les GRANT sont la seule barrière restante. Et là on grant **tout** à **anon** (y compris DELETE et UPDATE sur toutes les tables).

**Fix** : révoquer les grants excessifs, grant uniquement ce que PostgREST + Supabase SSR a besoin de voir.

```sql
-- supabase/migrations/20261015120100_restrict_public_grants.sql

-- Révoque les grants ouverts à anon (clé publique)
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all routines  in schema public from anon;

-- authenticated : grant minimum pour que PostgREST serve les requêtes
-- (RLS gère ensuite ce qui est visible).
-- SELECT/INSERT/UPDATE/DELETE par table est plus propre que ALL mais ALL
-- est acceptable tant que RLS est enable sur toutes les tables.
revoke all on all tables    in schema public from authenticated;
grant  select, insert, update, delete on all tables in schema public to authenticated;

revoke all on all sequences in schema public from authenticated;
grant  usage, select on all sequences in schema public to authenticated;

-- service_role garde ALL (c'est le contrat Supabase pour les Edge Functions server-side)

-- Reset default privileges pour les futurs objets
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on routines  from anon;

alter default privileges in schema public revoke all on tables    from authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public revoke all on sequences from authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- Les fonctions SECURITY DEFINER restent avec leur propre grant explicite
-- (voir recompute_account_balance, refresh_member_credit_score, etc.)
```

**Test de régression** :
```sql
-- anon ne doit plus pouvoir SELECT sur rien
set role anon;
select * from public.cash_vault; -- doit retourner 0 rows (RLS deny) ou permission denied

-- authenticated peut SELECT (RLS filtre après)
set role authenticated;
set local "request.jwt.claim.sub" = '<uuid d un agent>';
select * from public.cash_vault; -- doit retourner 1 row (celui de la coop du JWT)
```

**Risque** : si une page du dashboard faisait des requêtes anonymes à Supabase, elle cassera. Checker `src/components/dashboard/` pour tout `createClient` qui ne serait pas chaîné à une session agent.

---

## 3. IDOR dans `updateAgentStatus` — P0

**Fichier source** : `src/app/(dashboard)/tableau-de-bord/parametres/actions.ts:47-60`

```ts
export async function updateAgentStatus(
  id: string,
  status: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('agents')
    .update({ status })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/parametres')
  return null
}
```

**Impact exploit** : zéro vérification. Avec RLS actuellement OFF sur `agents` (§1), n'importe quel utilisateur authentifié peut appeler cette server action avec n'importe quel UUID d'agent de n'importe quelle coopérative et le suspendre. Un admin d'une coop peut suspendre les admins d'une coop concurrente.

**Fix** :

```ts
export async function updateAgentStatus(
  id: string,
  status: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // L'appelant doit être admin de sa propre coop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase as any)
    .from('agents').select('cooperative_id, role').eq('id', user.id).single()
  if (!me) return { error: 'Agent introuvable' }
  if (me.role !== 'admin') return { error: 'Action réservée aux administrateurs.' }

  // La cible doit être dans la MÊME coopérative
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: target } = await (supabase as any)
    .from('agents').select('cooperative_id, role, name').eq('id', id).maybeSingle()
  if (!target) return { error: 'Agent cible introuvable' }
  if (target.cooperative_id !== me.cooperative_id) {
    return { error: 'Vous ne pouvez modifier que les agents de votre coopérative.' }
  }

  // Un admin ne peut pas se suspendre lui-même (évite l'auto-lockout)
  if (id === user.id && status !== 'active') {
    return { error: 'Vous ne pouvez pas suspendre votre propre compte.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('agents').update({ status }).eq('id', id)
    .eq('cooperative_id', me.cooperative_id)
  if (error) return { error: error.message }

  await logAudit({
    action: 'role.grant', // ou role.revoke selon status
    cooperativeId: me.cooperative_id,
    userId: user.id,
    targetTable: 'agents',
    targetId: id,
    metadata: { previous_status: 'unknown', new_status: status, target_name: target.name },
  })

  revalidatePath('/tableau-de-bord/parametres')
  return null
}
```

**Test de régression** (Vitest, à ajouter dans `src/app/(dashboard)/tableau-de-bord/parametres/actions.test.ts`) :
- Caller non-admin → `{ error: 'Action réservée aux administrateurs.' }`
- Caller admin coop A tente de suspendre agent de coop B → `{ error: 'Vous ne pouvez modifier que les agents de votre coopérative.' }`
- Admin tente de se suspendre lui-même → `{ error: 'Vous ne pouvez pas suspendre votre propre compte.' }`
- Admin suspend agent de sa coop → succès, audit logged

---

## 4. CVE critiques dans dépendances — P0

**Évidence** : `npm audit --production` retourne :
- 2 CRITICAL (dont `next 16.2.3` et `proxy-addr`)
- 18 HIGH (`sharp`, `ws`, `braces`, `brace-expansion`, `nanoid`, `postcss`, `micromatch`, `fast-glob`, `source-map-js`, `ip-address`, `hono`, `js-yaml`, `@modelcontextprotocol/sdk`, etc.)

**Impact** : les CVE `next.js` récents touchent le routing SSR et peuvent permettre contournement d'authentification middleware (CVE-2025-xxxxx, par ex. authorization bypass dans `next/middleware`). Même sans exploit public, ne pas patcher est une red flag en due diligence.

**Fix** :
```bash
cd "C:/Users/elieh/tipa final/bosal-union-credit"
npm install next@latest react@latest react-dom@latest
npm audit fix --production
npm audit --production  # vérifier qu'il ne reste rien de CRITICAL
npx tsc --noEmit         # vérifier pas de breaking types
npm run test             # vérifier régressions
npm run build            # vérifier build passe
```

**Risque** : upgrade mineur Next 16.x → 16.y a parfois des breaking changes sur `middleware`/`proxy.ts` ou les Server Actions. Lire le CHANGELOG. Les deps critiques à vérifier :
- `@base-ui/react 1.3.0` (nouveau framework UI, peu de patches)
- `@supabase/ssr 0.10.2` (compat Next 16+)
- `zod 4.3.6` (zod v4 a quelques breaking changes par rapport à v3)

Si Next ships une nouvelle release pendant que vous lisez : vérifiez juste que `proxy.ts` est toujours le bon nom (était `middleware.ts` en Next ≤ 15).

---

## 5. IDOR dans `updateSetting` — P1

**Fichier source** : `src/app/(dashboard)/tableau-de-bord/parametres/actions.ts:6-19`

```ts
export async function updateSetting(
  key: string,
  value: unknown,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('app_settings')
    .update({ value })
    .eq('key', key)
  // ...
}
```

**Impact** : zéro auth, zéro role, zéro filtre coop. Un cashier (ou n'importe qui en appelant la server action directement) peut modifier `member_inactivity_days`, les couleurs PDF, les seuils d'approbation 4 yeux, etc. Comme `app_settings` est scope par `(cooperative_id, category, key)`, un `.update().eq('key', 'member_inactivity_days')` SANS filtre coop updateerait **toutes les coops** si plusieurs rows existent.

**Fix** :
```ts
export async function updateSetting(
  key: string,
  value: unknown,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, role').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }
  if (agent.role !== 'admin') return { error: 'Action réservée aux administrateurs.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('app_settings')
    .update({ value, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq('key', key)
    .eq('cooperative_id', agent.cooperative_id)
  if (error) return { error: error.message }

  await logAudit({
    action: 'settings.update',
    cooperativeId: agent.cooperative_id,
    userId: user.id,
    targetTable: 'app_settings',
    metadata: { key, value },
  })

  revalidatePath('/tableau-de-bord/parametres')
  return null
}
```

---

## 6. Four-eyes approval incomplète — P1

**Fichier source** : `src/lib/approvals/four-eyes.ts` (déclare les règles pour 7 actions sensibles) vs `src/app/(dashboard)/tableau-de-bord/prets/actions.ts:40` (seule invocation réelle).

**État actuel** :

| Opération | Règle déclarée | Appliquée ? |
|---|---|:---:|
| `loan.approve` | Oui | ✅ |
| `loan.disburse` | Oui | ❌ |
| `loan.writeoff` | Oui | ❌ |
| `cash.closure.close` | Oui | ❌ |
| `cash.transfer` | Oui | ❌ |
| `account.close` | Oui | ❌ |
| `role.grant` | Oui | ❌ |
| `settings.update` | Oui | ❌ |

**Impact P1** : la règle 4-yeux (deux approbateurs distincts, dont au moins un manager/admin) est documentée dans la lib et attendue par le modèle métier, mais 6 opérations sensibles passent sans contrôle. Un cashier solo peut écrire-off un prêt, fermer une caisse, fermer un compte.

**Fix** : câbler `evaluateApproval` dans chaque action sensible. Modèle (en reprenant exactement le pattern déjà en place dans `prets/actions.ts:40`) :

```ts
// Dans comptes/actions.ts, fonction closeAccount
import { evaluateApproval, APPROVAL_RULES, type Role } from '@/lib/approvals/four-eyes'

// Après avoir chargé `agent` et `account` :
const rule = APPROVAL_RULES['account.close']
const evalResult = evaluateApproval({
  state: {
    initiatorId:   account.created_by_agent_id ?? agent.id, // ou autre
    initiatorRole: 'cashier', // à passer depuis le contexte
    initiatedAt:   new Date(account.created_at ?? Date.now()),
    approverId:   agent.id,
    approverRole: agent.role as Role,
    approvedAt:   new Date(),
  },
  amount: Number(account.balance ?? 0),
  rule,
})
if (!evalResult.allowed) {
  return { error: 'Approbation 4-yeux requise pour cette fermeture.' }
}
```

**Note architecture** : la version actuelle de `evaluateApproval` fait le check dans un seul request (initiateur + approbateur dans le même payload). Pour un vrai workflow 4-yeux, il faut une table `pending_approvals` qui persiste la demande, et une seconde action pour approuver. Voir `docs/audit/08-ARCHITECTURE-FUTURE.md` (Session 3).

**Fix cosmetic** aussi : nettoyer le role enum drift. `four-eyes.ts` déclare `supervisor`, `auditor`, `agent` qui n'existent pas dans `src/types/database.ts` (enum = `admin|manager|cashier`). Soit étendre l'enum DB, soit retirer les roles fantômes du type.

---

## 7. Bucket Storage `logos` cross-coop — P1

**Fichier source** : `supabase/migrations/20260417181945_fix_logos_storage_rls_and_settings.sql:3-17`

```sql
CREATE POLICY "logos_insert_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_update_authenticated"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "logos_delete_authenticated"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "logos_select_public"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');
```

**Impact** :
- INSERT : tout utilisateur authentifié peut uploader n'importe quel fichier dans le bucket logos avec n'importe quel path. Un agent de coop A peut uploader un `.exe` ou une image choquante au path `coop-B/logo.png`.
- UPDATE / DELETE : tout utilisateur authentifié peut écraser ou supprimer le logo de n'importe quelle coopérative.
- SELECT public : OK pour les logos (destinés à être affichés), mais fait que n'importe qui peut lister les paths et deviner les coopératives.

**Fix** : scope par le path. Les logos devraient être uploadés dans un dossier `/{cooperative_id}/logo.png` et les policies vérifient le préfixe.

```sql
-- supabase/migrations/20261015120200_scope_logos_bucket_to_cooperative.sql

drop policy if exists "logos_insert_authenticated" on storage.objects;
drop policy if exists "logos_update_authenticated" on storage.objects;
drop policy if exists "logos_delete_authenticated" on storage.objects;

create policy "logos_insert_own_coop" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.current_user_cooperative_id()::text
  );

create policy "logos_update_own_coop" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.current_user_cooperative_id()::text
  );

create policy "logos_delete_own_coop" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = public.current_user_cooperative_id()::text
  );

-- logos_select_public reste comme avant (lecture publique OK pour affichage logo)
```

**Changement code requis** : `src/components/dashboard/forms/ParametresClient.tsx:135` qui construit le path doit préfixer par la coop :
```ts
const coopId = agent.cooperative_id
const path   = `${coopId}/logo-${Date.now()}.${ext}`  // au lieu de juste `logo-...`
```

---

## 8. Autres findings P1/P2

| # | Finding | Sévérité | Fichier | Fix court |
|---|---|:---:|---|---|
| 8.1 | `closeAccount` sans `.eq('cooperative_id',…)` explicite | P1 | `comptes/actions.ts:146` | Ajouter le filtre coop sur toutes les requêtes (déjà en partie fait, à auditer ligne par ligne) |
| 8.2 | `assignPlanToAccount` sans auth check | P1 | `comptes/actions.ts:127` | Ajouter getUser + agent + role check (manager/admin) + coop filter |
| 8.3 | `createLoan`/`createAccount` acceptent `member_id`/`account_id` sans vérifier appartenance coop | P2 | `prets/actions.ts`, `comptes/actions.ts` | Fetch le `member`/`account`, vérifier `.cooperative_id === agent.cooperative_id` avant d'INSERT |
| 8.4 | Password min 6 chars, pas de MFA | P1 | `src/app/(auth)/login/page.tsx:36` | Config Supabase : password_min_length ≥ 10 + enable MFA TOTP + enforcer sur comptes admin |
| 8.5 | `signInWithPassword` depuis client sans rate limiting | P1 | `login/page.tsx` | Soit activer rate limiting Supabase (dashboard), soit wrapper côté serveur avec rate-limit middleware |
| 8.6 | Dev-mode auth bypass si env vars Supabase manquantes | P2 | `src/proxy.ts` | `throw new Error('SUPABASE env missing')` au lieu de `NextResponse.next()`. En prod ça fail-fast. |
| 8.7 | CSP `script-src unsafe-eval` en prod | P2 | `next.config.ts` | Retirer `unsafe-eval` du CSP prod. Garder en dev si Next/Turbopack en a besoin |
| 8.8 | Role enum drift : `four-eyes.ts` déclare `supervisor`/`auditor`/`agent` absents de la DB | P3 | `src/lib/approvals/four-eyes.ts` + `src/types/database.ts:1717` | Soit étendre l'enum DB avec les roles manquants, soit retirer les fantômes du type |

---

## 9. Service role key

**Finding positif** : zero référence à `SUPABASE_SERVICE_ROLE_KEY` dans `src/`. Le fichier `.env.local` l'a mais vide. Tout le code passe par la clé anon avec session JWT côté serveur (via `src/lib/supabase/server.ts`). RLS s'applique correctement. **À préserver** — ne JAMAIS introduire le service role dans le code applicatif. Si un cron a besoin d'écrire sans contexte user, passer par un Supabase Edge Function qui tient le service role en secret, pas par le code Next.

Nettoyage : retirer la ligne `SUPABASE_SERVICE_ROLE_KEY=` de `.env.example` pour ne pas tenter un futur dev de la câbler.

---

## 10. Ordre de déploiement recommandé

Les fixes doivent se faire dans un ordre précis pour ne pas casser l'app en cascade :

1. **D'abord**, créer un projet Supabase miroir (clone de prod) pour tester toute la séquence
2. **Fix §4 (CVE deps)** sur un branch git — s'assurer que `npm run build` + `npx tsc --noEmit` + `npm run test` + `npm run e2e` passent
3. **Fix §1 (restore RLS)** sur le miroir — tester chaque page du dashboard, chaque server action. Les pages qui lisent `agents`/`cooperatives`/`cash_vault`/`system_settings`/`exchange_rates` doivent toujours fonctionner (la session JWT satisfait les nouvelles policies)
4. **Fix §2 (restrict grants)** sur le miroir — refaire les tests complets de l'app
5. **Fix §3 et §5 (IDOR server actions)** — tests Vitest ciblés
6. **Fix §6 (four-eyes câblage)** par opération, pas tout d'un coup — tester chaque chemin
7. **Fix §7 (logos bucket)** avec migration de données existantes (déplacer `logos/foo.png` → `logos/{coop_id}/foo.png` pour les existants, mettre à jour les URLs dans `app_settings`)
8. **Fix §8.x** par ordre de sévérité

À chaque étape, commit granulaire + push + Vercel deploy preview + validation manuelle avant de passer à la suivante.

Si quelque chose casse en prod après le fix §1 : rollback immédiat via `supabase db push` d'une migration de reverse qui réactive les ALTER TABLE DISABLE. L'exploit cross-tenant est GRAVE mais pas détonant (il faut qu'un attaquant soit motivé) — vaut mieux rollback propre que app down.

---

## 11. Ce qui est fait correctement (préserver)

- **Supabase SSR cookies** : setup propre dans `src/lib/supabase/server.ts` + `src/proxy.ts`. Session refresh fonctionne.
- **Server actions tenant pattern** : `getUser → fetch agent → .eq('cooperative_id', agent.cooperative_id)` utilisé consistamment dans `prets/`, `membres/`, `transactions/`, `comptes/recordTransaction`. À extraire dans un helper `withTenantAuth` dans `src/lib/auth/tenant.ts` pour standardiser et empêcher les oublis futurs.
- **Zéro usage de service role dans l'app** (voir §9).
- **Audit log structuré** (`src/lib/audit/index.ts`) avec 31 actions typées, appelé partout. Petit bug de mislabel traité en doc 02.
- **Headers sécurité** (`next.config.ts`) : HSTS, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, CSP avec `frame-ancestors 'none'`.
- **Policies RLS existantes** sur `members`/`accounts`/`transactions`/`loans`/`loan_repayments` : utilisent `(select auth.uid())` pour la perf (performance_initplan optimization) + `cooperative_id IN (SELECT ...)` — pattern canonique.

---

## Prochaine étape

Lire `02-FINANCIAL-INTEGRITY.md` puis `03-CRITICAL-FIXES-P0.md` qui a le backlog complet avec timing / tests / commandes.
