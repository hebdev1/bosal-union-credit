'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'

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
 *   • This action does NOT mutate accounts.balance — balance recalculation
 *     belongs to a separate feature (see specs).
 */
export async function recordTransactionEntry(input: {
  accountId:        string
  type:             'deposit' | 'withdrawal'
  amount:           number
  /** ISO string. Will be clamped to <= now() server-side. */
  transactionDate:  string
  /** Free-text "motif" — stored on transactions.motif. */
  note?:            string | null
}): Promise<{ error: string } | { ok: true; id: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // ─── Validation ────────────────────────────────────────────────────────
  if (!input.accountId)            return { error: 'Compte manquant.' }
  if (input.type !== 'deposit' && input.type !== 'withdrawal') {
    return { error: 'Type de transaction invalide (dépôt ou retrait).' }
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: 'Montant invalide.' }
  }
  if (!input.transactionDate) return { error: 'Date manquante.' }

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

  // ─── Insert ────────────────────────────────────────────────────────────
  // Reference is generated server-side (HISTORICAL prefix when applicable).
  const isHistorical = txDate.getTime() < Date.now() - 60_000
  const refPrefix    = isHistorical ? 'HIST' : 'TX'
  const reference    = `${refPrefix}-${Date.now().toString(36).toUpperCase()}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (supabase as any)
    .from('transactions')
    .insert({
      cooperative_id:   agent.cooperative_id,
      account_id:       account.id,
      agent_id:         agent.id,
      transaction_type: input.type,
      amount:           Math.round(input.amount * 100) / 100,
      motif:            input.note?.trim() || (isHistorical ? 'Saisie historique' : null),
      reference,
      status:           'completed',
      transaction_date: txDate.toISOString(),
      // created_at left to DB default — never overridden.
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logAudit({
    action:        input.type === 'deposit' ? 'cash.transfer' : 'cash.transfer',
    cooperativeId: agent.cooperative_id,
    userId:        agent.id,
    targetTable:   'transactions',
    targetId:      inserted?.id,
    metadata: {
      historical:       isHistorical,
      account_number:   account.account_number,
      transaction_type: input.type,
      amount:           input.amount,
      transaction_date: txDate.toISOString(),
      reference,
    },
  })

  revalidatePath('/tableau-de-bord/transactions')
  revalidatePath(`/tableau-de-bord/comptes/${account.id}`)
  return { ok: true, id: inserted?.id }
}
