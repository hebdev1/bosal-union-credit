# Bosal Credit Union

Plateforme Core Banking pour coopératives d'épargne et de crédit haïtiennes.
Next.js 16 · React 19 · Supabase · Tailwind 4.

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs Supabase
npm run dev
```

Ouvrir http://localhost:3000.

## Scripts

| Script               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `npm run dev`        | Serveur de développement (Turbopack)                          |
| `npm run build`      | Build de production                                           |
| `npm start`          | Serveur de production (après `build`)                         |
| `npm run lint`       | ESLint                                                        |
| `npm run typecheck`  | Vérification TypeScript stricte (`tsc --noEmit`)              |
| `npm test`           | Tests unitaires Vitest                                        |
| `npm run test:watch` | Vitest en mode watch                                          |
| `npm run e2e`        | Tests end-to-end Playwright                                   |
| `npm run db:types`   | Regénère `src/types/database.ts` depuis Supabase              |
| `npm run db:pull`    | Synchronise les migrations depuis la base distante            |
| `npm run db:push`    | Applique les migrations locales vers la base distante         |
| `npm run db:reset`   | Réinitialise la base locale + applique migrations + seed      |
| `npm run db:diff`    | Génère une migration depuis un diff (`npm run db:diff -- nom`) |

## Base de données (Supabase)

Le schéma de production est versionné dans `supabase/migrations/`.

### Première synchronisation (à exécuter une seule fois)

1. Récupérer un access token : https://supabase.com/dashboard/account/tokens
2. Exporter le token puis tirer types + migrations :

```bash
export SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxx
npx supabase login --token $SUPABASE_ACCESS_TOKEN
npx supabase link --project-ref ebioqgjyzrhjxxlugzcz
npm run db:pull         # crée supabase/migrations/<timestamp>_remote_schema.sql
npm run db:types        # regénère src/types/database.ts
git add supabase/ src/types/database.ts
git commit -m "chore(db): baseline schema + types from remote"
```

### Workflow quotidien

- **Modifier le schéma** : créer une migration locale avec `npm run db:diff -- add_loans_penalty_column`, la relire, commiter.
- **Appliquer en prod** : `npm run db:push` (ou via GitHub Actions + service role key).
- **Après modification en Studio Cloud** : `npm run db:pull` puis `npm run db:types`.

## Tests

### Unitaires (Vitest)

Logique métier pure testée : intérêts, échéanciers, pénalités, change, clôture caisse.

```bash
npm test                    # run unique
npm run test:watch          # watch
npm run test:coverage       # + rapport de couverture HTML dans /coverage
```

Emplacement : `src/**/*.{test,spec}.{ts,tsx}`.

### E2E (Playwright)

```bash
npm run e2e:install         # première fois seulement
npm run e2e                 # run headless
npm run e2e:ui              # mode interactif
```

Emplacement : `e2e/*.spec.ts`. Les parcours qui nécessitent une authentification
réelle sont marqués `test.skip` ; les activer après avoir mis en place un
utilisateur de test + `SUPABASE_SERVICE_ROLE_KEY` en env.

## Proxy (ex-middleware)

⚠️ Sur **Next.js 16**, la convention `middleware` a été **renommée en
`proxy`**. Le fichier `src/proxy.ts` gère l'authentification edge
(redirections `/login` ↔ `/tableau-de-bord`). Ne pas le renommer.

## Structure

```
src/
├── app/                    # App Router (marketing, auth, dashboard)
├── components/             # UI (brand, dashboard, marketing, ui)
├── hooks/                  # React hooks
├── lib/
│   ├── finance/            # Logique métier pure (intérêts, change, caisse)
│   ├── supabase/           # Clients Supabase (client.ts, server.ts)
│   └── …
├── types/
│   └── database.ts         # Types générés par `npm run db:types`
└── proxy.ts                # Auth edge (Next.js 16 convention)
e2e/                        # Tests Playwright
supabase/                   # Migrations + seed + config local
.github/workflows/          # CI (lint · typecheck · unit · build · e2e)
```

## Déploiement

Vercel : le push sur `main` déclenche un deploy automatique.
Les variables d'environnement requises sont documentées dans `.env.example`.
