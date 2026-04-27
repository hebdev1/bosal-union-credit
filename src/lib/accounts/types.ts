/**
 * Canonical account-type catalogue.
 * Mirrors the `account_type` enum in Postgres (public schema) and gives
 * each value a human-readable French label + a one-line description.
 *
 * Adding a new product? Run an `ALTER TYPE public.account_type ADD VALUE`
 * migration first, then extend this array.
 */

export const ACCOUNT_TYPES = [
  { value: 'savings',      label: 'Épargne',              description: 'Compte d\u2019\u00e9pargne r\u00e9mun\u00e9r\u00e9' },
  { value: 'deposit',      label: 'Dépôt',                description: 'Compte de d\u00e9p\u00f4t standard' },
  { value: 'wallet',       label: 'Wallet',               description: 'Portefeuille \u00e9lectronique' },
  { value: 'current',      label: 'Compte courant',       description: 'Op\u00e9rations courantes au quotidien' },
  { value: 'checking',     label: 'Compte chèque',        description: 'Compte avec carnet de ch\u00e8ques' },
  { value: 'business',     label: 'Compte commercial',    description: 'D\u00e9di\u00e9 aux entreprises et commer\u00e7ants' },
  { value: 'youth',        label: 'Compte jeune',         description: 'Pour membres mineurs / \u00e9tudiants' },
  { value: 'salary',       label: 'Compte salaire',       description: 'R\u00e9ception du salaire mensuel' },
  { value: 'term_deposit', label: 'Dépôt à terme',        description: 'Bloqu\u00e9 sur p\u00e9riode d\u00e9finie, taux pr\u00e9f\u00e9rentiel' },
  { value: 'shares',       label: 'Parts sociales',       description: 'Capital social du membre dans la coop\u00e9rative' },
  { value: 'loan_account', label: 'Compte de prêt',       description: 'Adoss\u00e9 \u00e0 un pr\u00eat actif' },
] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]['value']

const LABEL_MAP: Record<string, string> = Object.fromEntries(
  ACCOUNT_TYPES.map(t => [t.value, t.label])
)

/** French label for a stored account_type value. Falls back to the raw value. */
export function accountTypeLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return LABEL_MAP[value] ?? value
}
