/**
 * Runtime fraud check — à appeler depuis une server action après la création
 * d'une transaction. Charge l'historique du membre via Supabase, applique le
 * moteur de règles, puis persiste les flags détectés dans `fraud_flags`.
 *
 * Ne bloque jamais la transaction principale : les erreurs sont loguées mais
 * silencieuses côté appelant. L'opération métier reste prioritaire.
 */

import { createClient } from '@/lib/supabase/server'
import { evaluateFraud, maxSeverity, type TxContext, type HistoryEntry, type FraudFlag } from './rules'

export interface CheckTxInput {
  cooperativeId: string
  memberId: string
  transactionId?: string
  amount: number
  currency: string
  branchId?: string
  counterpartyId?: string
  ipAddress?: string
  occurredAt?: Date
}

export interface CheckResult {
  flags: FraudFlag[]
  maxSeverity: ReturnType<typeof maxSeverity>
  persisted: number
}

const HISTORY_WINDOW_HOURS = 24

export async function runFraudCheck(input: CheckTxInput): Promise<CheckResult> {
  try {
    const supabase = await createClient()
    const now = input.occurredAt ?? new Date()

    const sinceIso = new Date(now.getTime() - HISTORY_WINDOW_HOURS * 3600_000).toISOString()

    // Charge l'historique récent du membre (via ses comptes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: accs } = await (supabase as any)
      .from('accounts')
      .select('id')
      .eq('member_id', input.memberId)

    const accountIds = (accs ?? []).map((a: { id: string }) => a.id)

    let history: HistoryEntry[] = []
    if (accountIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: txs } = await (supabase as any)
        .from('transactions')
        .select('id, amount, created_at')
        .in('account_id', accountIds)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(100)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      history = (txs ?? []).map((t: any) => ({
        id: t.id,
        memberId: input.memberId,
        amount: Number(t.amount),
        occurredAt: new Date(t.created_at),
      }))
    }

    const ctx: TxContext = {
      id: input.transactionId ?? 'pending',
      memberId: input.memberId,
      amount: input.amount,
      currency: input.currency,
      occurredAt: now,
      branchId: input.branchId,
      counterpartyId: input.counterpartyId,
      ipAddress: input.ipAddress,
    }

    const flags = evaluateFraud(ctx, history)

    // Persistence des flags dans fraud_flags (schema: rule_triggered + severity + transaction_id)
    let persisted = 0
    if (flags.length > 0 && input.transactionId) {
      const rows = flags.map((f) => ({
        cooperative_id: input.cooperativeId,
        transaction_id: input.transactionId!,
        rule_triggered: f.rule,
        severity: f.severity,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('fraud_flags').insert(rows)
      if (!error) persisted = rows.length
      else console.warn('[fraud] insert failed:', error.message)
    }

    return { flags, maxSeverity: maxSeverity(flags), persisted }
  } catch (err) {
    console.warn('[fraud] check failed:', err instanceof Error ? err.message : err)
    return { flags: [], maxSeverity: null, persisted: 0 }
  }
}
