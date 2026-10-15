# 00 — Audit exécutif

**TL;DR en 60 secondes.** Bosal Union Credit est une app bien structurée pour son âge (Next 16, Supabase, TypeScript strict, domaine métier clair), mais elle **n'est pas prête à gérer de l'argent réel pour des coopératives** en l'état. Trois classes de problèmes bloquent le go-live : (1) **la sécurité multi-tenant est effectivement désactivée** sur plusieurs tables critiques — n'importe quel utilisateur avec la clé anon peut lire les données de toutes les coopératives, (2) **les écritures monétaires n'ont ni idempotence ni verrou atomique** — un double-clic sur Dépôt crée deux transactions, et (3) **plusieurs server actions ne vérifient pas l'appartenance tenant** avant d'agir, créant des IDORs exploitables. Ces défauts se corrigent en 1-2 sessions ciblées, l'architecture reste solide, et le produit a de vraies forces à préserver (scoring crédit DB-native, PDF design cohérent, UI en Kreyòl/français, triggers de balance corrects).

---

## 1. Qu'est-ce que ce produit ?

**Positionnement vérifié depuis le code** : SaaS de gestion de coopérative de crédit haïtienne, opéré par des agents (admin / manager / cashier) pour le compte des membres. Les membres ne s'authentifient pas eux-mêmes — ils sont gérés par les agents de leur coopérative.

**Modules implémentés** (vérifiés dans `src/app/(dashboard)/tableau-de-bord/`) :

- **Membres** — enregistrement, KYC léger, statut (active/suspended/closed/pending), profil complet
- **Comptes** — multi-devises (HTG/USD, enum DB accepte aussi CAD/DOP mais UI limite à HTG/USD), plans d'épargne attachés, solde dérivé des transactions via trigger
- **Transactions** — dépôts, retraits, virements, ajustements. Saisie temps réel ou historique. Ticket PDF reçu par opération
- **Prêts** — flat-rate, échéancier amortissement, remboursements par versement, scoring crédit automatique
- **Bureau de change** — paires de devises, taux configurables, historique des opérations, tickets PDF
- **Caisse (vault)** — balance physique de la caisse par coopérative, mise à jour à chaque dépôt/retrait
- **Rapports** — balance âgée, bilan, résultat, BRH (régulateur), portefeuille prêts, bureau de change
- **Paramètres** — thème, couleurs PDF, logos, politique d'inactivité membre, règles d'approbation (4 yeux)
- **Audit** — log structuré de 31 types d'actions
- **Scoring crédit** — 4 composantes (paiements, remboursement prêts, activité, stabilité), 0-1000, 4 niveaux de risque, recalculé par triggers

**Non implémenté mais pertinent** : notifications SMS/WhatsApp (Twilio câblé mais pas branché), AI assistant financier, intégration bancaire, mode offline-first (contexte Haïti).

---

## 2. Scorecard (0-10)

Scores basés sur l'évidence collectée, pas sur une métrique objective — à prendre comme opinion éclairée.

| Axe | Score | Justification |
|---|---:|---|
| Architecture | **7** / 10 | Modular monolith Next 16 bien organisé par domaine. Pattern server-actions standardisé. Pas de microservices prématurés — bon choix. Lacunes : logique money mélangée au reste, pas de couche d'abstraction `src/lib/money/`. |
| Qualité code | **7** / 10 | TypeScript strict, naming cohérent, séparation client/server respectée. Lacunes : trop de `as any` sur les tables récentes (payments, credit_scores) parce que les types DB ne sont pas regénérés systématiquement. 3 TODO/FIXME seulement. |
| Design DB | **6** / 10 | 38 migrations, schéma cohérent, triggers bien pensés (SECURITY DEFINER + search_path verrouillé). Lacunes : colonnes money en `numeric` sans précision (sauf `payments.amount`). RLS désactivée sur 5 tables critiques (voir sécurité). |
| **Intégrité financière** | **4** / 10 | Trigger balance = SUM(deposits) − SUM(withdrawals) est propre. MAIS pas d'idempotence, pas de UNIQUE sur `transactions.reference`, cash_vault race condition, recordLoanRepayment sans lock, float JS pour tout. Score bas car *l'intégrité est l'exigence #1 d'un SaaS financier*. |
| **Sécurité** | **3** / 10 | RLS DISABLED sur agents/cooperatives/cash_vault/system_settings/exchange_rates. GRANT ALL to anon/authenticated. Password 6 car, pas de MFA, pas de rate limiting. 2 CVE critiques dans next + proxy-addr. Dev-mode bypass auth. Score bas car *bloquant pour toute vraie coopérative*. |
| UI/UX | **7** / 10 | Design cohérent (dark theme, cartes `#0D1018`, badges typés). Modales bien faites. Rapports PDF récemment refondus en style shadcn-table. Barres de recherche live sur membres/comptes. Lacunes : pas de mobile-first, pas d'offline, workflow onboarding membre partiellement incomplet. |
| Complétude features | **6** / 10 | Core fonctionnel (membres, comptes, transactions, prêts, bureau de change, rapports). Scoring crédit bien pensé. Lacunes : notifications SMS/WhatsApp câblées non activées, pas de dashboard de bord agile, pas d'export CSV universel, pas d'import Excel pour onboarding coop. |
| Scalabilité | **5** / 10 | Supabase scale bien verticalement, mais pas de pagination serveur sur les listes transactions/comptes, trigger storm credit-score sur imports bulk, pas de cache Redis. Suffit pour 1-10 coops petites, pas pour 100+. |
| Test coverage | **2** / 10 | 5 tests unitaires (finance, approvals, fraud, accounting) + 2 E2E (auth, marketing). Zéro test RLS/multi-tenant, zéro test idempotency, zéro CI. Les tests existent mais ne sont pas exécutés automatiquement. |
| Préparation commerciale | **3** / 10 | Aucun système de subscription/billing. Pas d'enforcement d'entitlements. Pas de self-serve onboarding coopérative. Pas de métriques SaaS instrumentées. Modèle économique à définir. |

**Score global pondéré** (sécurité × 2 + intégrité × 2 + autres × 1) : **5.0 / 10** — produit prometteur mais pré-production.

---

## 3. Top 20 problèmes rangés

Chaque entrée cite `file:line` pour vérification.

### Bloquants (P0 — 7 entrées)

1. **🔴 RLS désactivée sur 5 tables tenant** — `supabase/migrations/20260325020203_fix_agents_rls_allow_auth.sql`. `agents`, `cooperatives`, `cash_vault`, `system_settings`, `exchange_rates` ont RLS OFF. Combiné avec le GRANT ALL ci-dessous, n'importe qui avec la clé publique anon peut lire/écrire les données de toutes les coopératives. → voir [01-SECURITY-RLS-TENANT.md](./01-SECURITY-RLS-TENANT.md#1-rls-désactivée)
2. **🔴 GRANT ALL TO anon, authenticated** — `supabase/migrations/20260325020531_fix_grants_and_permissions.sql`. Grant large qui, combiné avec P0#1, ouvre tout. → voir [01](./01-SECURITY-RLS-TENANT.md#2-grant-all)
3. **🔴 Pas d'idempotence sur `recordTransaction`** — `src/app/(dashboard)/tableau-de-bord/comptes/actions.ts:170` et `transactions/actions.ts:20`. Double-clic sur Dépôt → 2 transactions insérées + 2 mouvements `cash_vault`. Aucune contrainte UNIQUE sur `transactions.reference`. → voir [02-FINANCIAL-INTEGRITY.md](./02-FINANCIAL-INTEGRITY.md#3-idempotence)
4. **🔴 Race condition `cash_vault`** — `comptes/actions.ts:321-336`. Read-modify-write client-side sans `FOR UPDATE`. Deux caissiers concurrents = perte d'un des deux mouvements. → voir [02](./02-FINANCIAL-INTEGRITY.md#4-cash_vault-race)
5. **🔴 `recordLoanRepayment` non atomique** — `prets/actions.ts:208-227`. SUM(amount_paid) → UPDATE sans lock. Deux agents enregistrant deux versements du même prêt en même temps peuvent corrompre `loans.amount_paid`. → voir [02](./02-FINANCIAL-INTEGRITY.md#5-recordloanrepayment)
6. **🔴 IDOR `updateAgentStatus`** — `parametres/actions.ts:47`. Pas d'auth check, pas de role check, pas de filtre coop. Une coop peut suspendre l'admin d'une autre. → voir [01](./01-SECURITY-RLS-TENANT.md#3-updateagentstatus)
7. **🔴 CVE critiques dans deps** — `next 16.2.3` + `proxy-addr`. 2 CRITICAL + 18 HIGH via `npm audit --production`. Upgrade immédiat requis. → voir [01](./01-SECURITY-RLS-TENANT.md#4-cves-dépendances)

### Haute priorité (P1 — 8 entrées)

8. **🟠 Enum `currency_code` non appliqué sur `accounts.currency`** — `src/types/database.ts:49` (text libre) vs `:1718` (enum). `bureau-de-change/actions.ts:19-20` passe strings bruts → erreur `input valid value for enum currency_code` que l'utilisateur a vue. → voir [03-CRITICAL-FIXES-P0.md § currency_code](./03-CRITICAL-FIXES-P0.md#fix-5-currency_code-enum-alignment)
9. **🟠 Float JS pour toute l'arithmétique monétaire** — `src/lib/formatters.ts`, `src/lib/finance/interest.ts`, toutes les `actions.ts`. Dérive cumulative sur milliers d'ops. Recommandation : adopter Dinero.js ou decimal.js au boundary. → voir [02](./02-FINANCIAL-INTEGRITY.md#1-float-vs-decimal)
10. **🟠 Colonnes money en `numeric` sans précision** — toutes les migrations sauf `20260427140000` qui a `numeric(14,2)` pour `payments.amount`. → voir [02](./02-FINANCIAL-INTEGRITY.md#2-colonnes-money-sans-précision)
11. **🟠 IDOR `updateSetting`** — `parametres/actions.ts:6`. Un cashier peut changer les seuils de validation 4 yeux. → voir [01](./01-SECURITY-RLS-TENANT.md#5-updatesetting)
12. **🟠 Four-eyes approval incomplète** — `src/lib/approvals/four-eyes.ts` déclare 7 règles, seule `loan.approve` est câblée (`prets/actions.ts:40`). `loan.disburse`, `loan.writeoff`, `cash.closure.close`, `account.close`, `role.grant`, `settings.update` ne la font pas respecter. → voir [01](./01-SECURITY-RLS-TENANT.md#6-four-eyes)
13. **🟠 Bucket Storage `logos` cross-coop** — `supabase/migrations/20260417181945_fix_logos_storage_rls_and_settings.sql`. Policies autorisent tout utilisateur authentifié à INSERT/UPDATE/DELETE sur n'importe quel path. → voir [01](./01-SECURITY-RLS-TENANT.md#7-logos-bucket)
14. **🟠 Mislabel audit `cash.transfer`** — `transactions/actions.ts:97`. Ternaire identique des deux côtés logge dépôt ET retrait comme `'cash.transfer'`. Audit trail trompeur. → voir [02](./02-FINANCIAL-INTEGRITY.md#8-mislabel-audit)
15. **🟠 Pas de réconciliation `cash_vault` serveur** — `cash_vault.current_balance` maintenu uniquement par read-modify-write client. Pas de job de recomputation. Dérive indétectable. → voir [02](./02-FINANCIAL-INTEGRITY.md#4-cash_vault-race)

### Moyennes (P2 — 5 entrées)

16. **🟡 Trigger storm credit-score** — `_trg_score_from_transaction` dans `20260427140200_credit_scoring_triggers.sql` recalcule à chaque INSERT. Imports bulk = N recomputations. Debounce ou statement-level trigger recommandé.
17. **🟡 Password min 6 chars + pas de MFA + pas de rate limiting login** — `src/app/(auth)/login/page.tsx:36`. `signInWithPassword` direct depuis client, pas de wrapper serveur.
18. **🟡 Dev-mode auth bypass** — `src/proxy.ts`. Si env Supabase manquantes → `NextResponse.next()`. Acceptable dev, danger si logs config leak.
19. **🟡 CSP `unsafe-eval` en prod** — `next.config.ts`. XSS risk amplifié.
20. **🟡 0 CI pipeline** — `.github/workflows/` vide. Les 5 tests unit + 2 E2E existent mais ne s'exécutent pas automatiquement. Régressions passent au travers. → voir [04-TESTING-AND-CI.md](./04-TESTING-AND-CI.md)

### Mentions honorables (P3)

- Role enum drift : `four-eyes.ts` déclare `supervisor`/`auditor`/`agent` qui n'existent pas dans l'enum DB (`admin|manager|cashier`)
- Pas de pagination serveur sur les listes
- Pas de télémétrie (Sentry, PostHog, uptime)
- `SUPABASE_SERVICE_ROLE_KEY` dans `.env.example` mais inutilisé — à retirer pour éviter confusion
- Pas de `.env.local.example`

---

## 4. Forces à préserver

Pas tout est à refaire. Ce qui marche et doit être conservé :

- **Trigger `recompute_account_balance`** (`supabase/migrations/20260430140000_...`) : SECURITY DEFINER + search_path verrouillé + REVOKE anon,public + idempotent. Modèle à répliquer pour `cash_vault`.
- **Scoring crédit DB-native** (`supabase/migrations/20260427140200_...`) : 4 composantes clairement séparées, risk_level dérivé, backfill one-shot propre. Juste à ajouter un debounce pour les bulk inserts.
- **Pattern server-action standardisé** : `getUser` → fetch agent → `.eq('cooperative_id',…)`. À extraire dans un helper `withTenantAuth(action)` pour éviter les oublis.
- **`logAudit`** (`src/lib/audit/index.ts`) : couvre 31 actions typées, appelé partout sauf le mislabel l.97. Fondation audit trail solide.
- **PDF design shadcn-table unifié** (`src/lib/pdf/shadcn-table.ts`) : primitives drawHeader/drawTable/drawBadge/statusToBadgeVariant. Tous les rapports PDF l'utilisent maintenant. Garder.
- **Four-eyes approval** (`src/lib/approvals/four-eyes.ts`) : bien conçu, juste pas câblé partout. Câbler, ne pas réécrire.
- **Supabase SSR cookies** (`src/lib/supabase/{client,server}.ts` + `src/proxy.ts`) : setup correct avec `@supabase/ssr` v0.10. Session refresh fonctionnel.
- **Barre de recherche live** (`src/components/dashboard/forms/MembresClient.tsx` + `ComptesClient.tsx`) : filtering client-side avec normalisation diacritiques. Modèle à répliquer sur transactions, prêts.
- **Historical Transaction Entry** (`src/app/(dashboard)/tableau-de-bord/transactions/actions.ts`) : vraie séparation `transaction_date` (user input) vs `created_at` (system). CHECK contrainte au niveau DB. Bien pensé.
- **Backfill opening balance → vraie transaction** (`supabase/migrations/20260430180000_...`) : traite la dette technique sans perdre d'historique.

---

## 5. Résumé 1-page pour décision

| Question | Réponse |
|---|---|
| **Peut-on connecter une vraie coopérative demain ?** | **Non.** 7 P0 bloquants dont RLS désactivée + idempotence manquante. |
| **Combien de temps pour être prêt ?** | **1-2 semaines focalisées.** Les fixes sont ciblés, le code sain. |
| **L'architecture est-elle à refondre ?** | **Non.** Modular monolith Next 16 + Supabase est le bon choix pour cette taille. Petites extractions (`src/lib/money/`, helper `withTenantAuth`) suffisent. |
| **Le produit a-t-il un vrai avantage compétitif ?** | **Oui.** UI en Kreyòl/français, prêts flat-rate adaptés à Haïti, bureau de change intégré, scoring crédit automatique. Peu de concurrents directs dans la niche coopératives Haïti. |
| **Est-ce que ça peut devenir un vrai SaaS payant ?** | **Oui, mais pas encore cadré.** Aucune infrastructure billing/entitlements n'existe. À concevoir en Session 3. |
| **Quel est le plus gros risque si on ignore cet audit ?** | **Fuite de données inter-coopératives** via la clé anon publique. Un seul utilisateur curieux peut dumper toutes les transactions de toutes les coopératives. Risque réputationnel + légal majeur. |
| **Quel est le plus petit changement à fort impact ?** | **Restaurer RLS + REVOKE anon GRANT ALL.** Une migration SQL de ~50 lignes élimine le risque de fuite cross-tenant. |

---

## Prochaine étape

Lire `01-SECURITY-RLS-TENANT.md` et `02-FINANCIAL-INTEGRITY.md` pour les détails techniques des P0. Puis `03-CRITICAL-FIXES-P0.md` pour le backlog exécutable.
