'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { getCurrentAgent } from '@/lib/auth/agent'
import { makeReference, isUuid } from '@/lib/transactions/reference'

const IDEMPOTENCY_INDEX = 'transactions_coop_idempotency_key_uniq'

/**
 * Insert one transaction with an explicit user-provided transaction_date.
 *
 * Two modes — both go through the same code path :
 *   • CURRENT    → transactionDate = now(), nothing special
 *   • HISTORICAL → transactionDate is a past date provided by the operator
 *
 * Hard rules :
 *   • transaction_date NEVER in the future (DB CHECK + JS guard).
 *   • created_at is left to the database default — it MUST reflect the
 *     actual insert time and is never overwritten by transactionDate.
 *   • Withdrawals are NOT blocked by balance — historical reconstruction
 *     can legitimately cross zero (paper records may be incomplete).
 *   • accounts.balance and cash_vault are recomputed by database triggers
 *     on insert; this action never writes them.
 *   • `idempotencyKey` (one per form submission) makes a double click or a
 *     retried request return the already-recorded row instead of a duplicate.
 */
export async function recordTransactionEntry(input: {
  accountId:        string
  type:             'deposit' | 'withdrawal'
  amount:           number
  /** ISO string. Will be clamped to <= now() server-side. */
  transactionDate:  string
  /** Free-text "motif" — stored on transactions.motif. */
  note?:            string | null
  idempotencyKey?:  string | null
}): Promise<{ error: string } | { ok: true; id: string }> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  // ─── Validation ────────────────────────────────────────────────────────
  if (!input.accountId)            return { error: 'Compte manquant.' }
  if (input.type !== 'deposit' && input.type !== 'withdrawal') {
    return { error: 'Type de transaction invalide (dépôt ou retrait).' }
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: 'Montant invalide.' }
  }
  if (!input.transactionDate) return { error: 'Date manquante.' }
  if (input.idempotencyKey != null && !isUuid(input.idempotencyKey)) {
    return { error: 'Clé de soumission invalide. Rechargez la page.' }
  }
  const idempotencyKey = input.idempotencyKey ?? null

  const txDate = new Date(input.transactionDate)
  if (Number.isNaN(txDate.getTime())) {
    return { error: 'Date invalide.' }
  }
  // No future dates — give the DB a small skew tolerance (60 s).
  if (txDate.getTime() > Date.now() + 60_000) {
    return { error: 'La date ne peut pas être dans le futur.' }
  }

  // ─── Verify account ownership (cooperative scope) ──────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account } = await (supabase as any)
    .from('accounts')
    .select('id, account_number, currency, member_id, cooperative_id')
    .eq('id', input.accountId)
    .eq('cooperative_id', agent.cooperative_id)
    .maybeSingle()
  if (!account) return { error: 'Compte introuvable dans cette coopérative.' }

  // ─── Replay of an already-recorded submission ──────────────────────────
  if (idempotencyKey) {
    const existing = await findByIdempotencyKey(supabase, agent.cooperative_id, idempotencyKey)
    if (existing) {
      if (existing.account_id !== account.id) {
        return { error: 'Cette soumission a déjà été utilisée pour un autre compte.' }
      }
      return { ok: true, id: existing.id }
    }
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  // Reference is generated server-side (HISTORICAL prefix when applicable).
  const isHistorical = txDate.getTime() < Date.now() - 60_000
  const refPrefix    = isHistorical ? 'HIST' : 'TX'
  const amount       = Math.round(input.amount * 100) / 100

  let reference = makeReference(refPrefix)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: { data: any; error: any } = { data: null, error: null }
  for (let attempt = 0; attempt < 2; attempt++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = await (supabase as any)
      .from('transactions')
      .insert({
        cooperative_id:   agent.cooperative_id,
        account_id:       account.id,
        agent_id:         agent.id,
        transaction_type: input.type,
        amount,
        motif:            input.note?.trim() || (isHistorical ? 'Saisie historique' : null),
        reference,
        status:           'completed',
        transaction_date: txDate.toISOString(),
        idempotency_key:  idempotencyKey,
        // created_at left to DB default — never overridden.
      })
      .select('id')
      .single()

    if (!result.error || result.error.code !== '23505') break

    // Concurrent submit with the same key: the other request won the insert.
    if (idempotencyKey && String(result.error.message ?? '').includes(IDEMPOTENCY_INDEX)) {
      const existing = await findByIdempotencyKey(supabase, agent.cooperative_id, idempotencyKey)
      if (existing && existing.account_id === account.id) return { ok: true, id: existing.id }
      return { error: 'Cette soumission a déjà été enregistrée.' }
    }
    // Reference collision: retry once with a new reference.
    reference = makeReference(refPrefix)
  }

  if (result.error) return { error: result.error.message }
  const inserted = result.data as { id: string }

  await logAudit({
    action:        input.type === 'deposit' ? 'transaction.deposit' : 'transaction.withdrawal',
    cooperativeId: agent.cooperative_id,
    userId:        agent.id,
    targetTable:   'transactions',
    targetId:      inserted?.id,
    metadata: {
      historical:       isHistorical,
      account_number:   account.account_number,
      transaction_type: input.type,
      amount,
      currency:         account.currency,
      transaction_date: txDate.toISOString(),
      reference,
    },
  })

  revalidatePath('/tableau-de-bord/transactions')
  revalidatePath(`/tableau-de-bord/comptes/${account.id}`)
  revalidatePath('/tableau-de-bord/caisse')
  return { ok: true, id: inserted?.id }
}

async function findByIdempotencyKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cooperativeId: string,
  key: string,
): Promise<{ id: string; account_id: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('transactions')
    .select('id, account_id')
    .eq('cooperative_id', cooperativeId)
    .eq('idempotency_key', key)
    .maybeSingle()
  return (data as { id: string; account_id: string } | null) ?? null
}
