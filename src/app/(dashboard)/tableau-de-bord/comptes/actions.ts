'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { runFraudCheck } from '@/lib/fraud/check'

/* ─── Shared ticket data shape (used by recordTransaction) ────────────────── */
export interface TransactionTicketData {
  reference:        string
  transaction_type: 'deposit' | 'withdrawal'
  amount:           number
  motif:            string | null
  created_at:       string
  // Account
  account_number:   string
  account_type:     string
  currency:         string
  balance_before:   number
  balance_after:    number
  // Member
  member_first_name: string
  member_last_name:  string
  member_number:     string
  // Cooperative + agent
  agent_name:        string
  coop_name:         string
}

export async function createAccount(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent, error: agentErr } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (agentErr || !agent) return { error: 'Agent introuvable' }

  const planId = formData.get('savings_product_id') as string | null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('accounts').insert({
    cooperative_id:     agent.cooperative_id,
    member_id:          formData.get('member_id') as string,
    account_number:     (formData.get('account_number') as string).trim(),
    account_type:       formData.get('account_type') as string,
    currency:           formData.get('currency') as string,
    balance:            Number(formData.get('balance') ?? 0),
    status:             'active',
    savings_product_id: planId && planId !== '' ? planId : null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ce numéro de compte est déjà utilisé.' }
    return { error: error.message }
  }

  await logAudit({
    action: 'account.open',
    cooperativeId: agent.cooperative_id,
    targetTable: 'accounts',
    metadata: { account_number: formData.get('account_number') as string },
  })

  revalidatePath('/tableau-de-bord/comptes')
  return null
}

export async function assignPlanToAccount(
  accountId: string,
  planId: string | null,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('accounts')
    .update({ savings_product_id: planId ?? null })
    .eq('id', accountId)

  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/comptes')
  return null
}

export async function closeAccount(
  accountId: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent, error: agentErr } = await (supabase as any)
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (agentErr || !agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error: accErr } = await (supabase as any)
    .from('accounts')
    .select('balance, currency, status, account_number, member_id')
    .eq('id', accountId)
    .single()
  if (accErr || !account) return { error: 'Compte introuvable' }
  if (account.status === 'closed') return { error: 'Ce compte est déjà fermé' }

  const CLOSING_FEE = 200 // HTG — frais fixes de fermeture
  const newBalance = Math.max(0, Number(account.balance) - CLOSING_FEE)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (supabase as any)
    .from('accounts')
    .update({ balance: newBalance, status: 'closed' })
    .eq('id', accountId)
  if (updateErr) return { error: updateErr.message }

  // Enregistrer les frais de fermeture comme transaction d'ajustement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tx } = await (supabase as any).from('transactions').insert({
    cooperative_id:   agent.cooperative_id,
    account_id:       accountId,
    agent_id:         agent.id,
    transaction_type: 'adjustment',
    amount:           CLOSING_FEE,
    motif:            `Frais de fermeture — compte ${account.account_number}`,
    reference:        `CLOSE-${Date.now().toString(36).toUpperCase()}`,
    status:           'completed',
  }).select('id').single()

  await logAudit({
    action: 'account.close',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'accounts',
    targetId: accountId,
    metadata: { account_number: account.account_number, closing_fee: CLOSING_FEE, final_balance: newBalance },
  })

  // Fraud check sur la transaction de fermeture
  if (tx?.id && account.member_id) {
    await runFraudCheck({
      cooperativeId: agent.cooperative_id,
      memberId: account.member_id,
      transactionId: tx.id,
      amount: CLOSING_FEE,
      currency: account.currency,
    })
  }

  revalidatePath('/tableau-de-bord/comptes')
  revalidatePath('/tableau-de-bord/transactions')
  return null
}

/* ─── Record a deposit / withdrawal + emit ticket ─────────────────────────── */
/**
 * Records a single deposit or withdrawal on an active account, updates the
 * account balance + cash vault atomically (best-effort 2-step), logs audit,
 * runs fraud check, and returns the data needed to print a paper ticket.
 *
 * Refuses any operation on a closed/suspended account, or a withdrawal that
 * would overdraft the balance.
 */
export async function recordTransaction(input: {
  accountId: string
  type: 'deposit' | 'withdrawal'
  amount: number
  motif?: string | null
}): Promise<{ error: string } | { ticket: TransactionTicketData }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, id, name').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  if (input.type !== 'deposit' && input.type !== 'withdrawal') {
    return { error: 'Type de transaction invalide.' }
  }
  if (!input.accountId) return { error: 'Compte manquant.' }
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Montant invalide.' }

  // Round to 2 decimals to keep stored balance clean
  const amt = Math.round(amount * 100) / 100

  // ── Load account + member ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account } = await (supabase as any)
    .from('accounts')
    .select(`
      id, account_number, account_type, balance, currency, status, member_id,
      members(first_name, last_name, member_number)
    `)
    .eq('id', input.accountId)
    .eq('cooperative_id', agent.cooperative_id)
    .single()
  if (!account) return { error: 'Compte introuvable.' }
  if (account.status !== 'active') {
    return { error: `Le compte est ${account.status} : opération refusée.` }
  }

  const balanceBefore = Number(account.balance ?? 0)
  const balanceAfter  = input.type === 'deposit'
    ? balanceBefore + amt
    : balanceBefore - amt

  if (input.type === 'withdrawal' && balanceAfter < 0) {
    return { error: `Solde insuffisant (${balanceBefore.toFixed(2)} ${account.currency}).` }
  }

  // ── Generate reference ────────────────────────────────────────────────
  const now       = new Date()
  const datePart  = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randPart  = Math.floor(1000 + Math.random() * 9000)
  const reference = `TX-${datePart}-${randPart}`
  const createdAt = now.toISOString()

  // ── Insert transaction ────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tx, error: txErr } = await (supabase as any).from('transactions').insert({
    cooperative_id:   agent.cooperative_id,
    account_id:       account.id,
    agent_id:         agent.id,
    transaction_type: input.type,
    amount:           amt,
    motif:            (input.motif ?? '').trim() || null,
    reference,
    status:           'completed',
  }).select('id').single()
  if (txErr) return { error: txErr.message }

  // accounts.balance is maintained by the trigger
  // trg_account_balance_from_transaction (always equal to deposits − retraits).
  // No client-side UPDATE needed — that would race with the trigger on
  // concurrent inserts.

  // ── Update cash vault (deposit → +, withdrawal → −) ───────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('cash_vault')
      .update({ current_balance: Math.round(newVault * 100) / 100, last_updated: createdAt })
      .eq('id', vault.id)
  }

  // ── Audit + fraud check (best-effort, never blocking) ─────────────────
  await logAudit({
    action: input.type === 'deposit' ? 'transaction.deposit' : 'transaction.withdrawal',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'transactions',
    targetId: tx?.id,
    metadata: {
      reference,
      account_number: account.account_number,
      amount: amt,
      currency: account.currency,
      balance_before: balanceBefore,
      balance_after:  balanceAfter,
    },
  })

  if (account.member_id) {
    await runFraudCheck({
      cooperativeId: agent.cooperative_id,
      memberId:      account.member_id,
      transactionId: tx?.id,
      amount:        amt,
      currency:      account.currency ?? 'HTG',
    })
  }

  // ── Fetch coop name (for the ticket header) ───────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coop } = await (supabase as any)
    .from('cooperatives').select('name').eq('id', agent.cooperative_id).single()

  revalidatePath('/tableau-de-bord/comptes')
  revalidatePath(`/tableau-de-bord/comptes/${account.id}`)
  revalidatePath('/tableau-de-bord/transactions')
  revalidatePath('/tableau-de-bord/caisse')

  const member = account.members
  return {
    ticket: {
      reference,
      transaction_type: input.type,
      amount:           amt,
      motif:            (input.motif ?? '').trim() || null,
      created_at:       createdAt,
      account_number:   account.account_number,
      account_type:     account.account_type,
      currency:         account.currency ?? 'HTG',
      balance_before:   balanceBefore,
      balance_after:    Math.round(balanceAfter * 100) / 100,
      member_first_name: member?.first_name ?? '—',
      member_last_name:  member?.last_name  ?? '—',
      member_number:     member?.member_number ?? '—',
      agent_name:        agent.name ?? '—',
      coop_name:         coop?.name  ?? 'Bosal Credit Union',
    },
  }
}
