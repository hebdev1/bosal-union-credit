'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { runFraudCheck } from '@/lib/fraud/check'
import { getCurrentAgent, isManager } from '@/lib/auth/agent'
import { makeReference, isUuid } from '@/lib/transactions/reference'

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

/** Currencies an account can be opened in (the UI offers HTG and USD). */
const ACCOUNT_CURRENCIES = ['HTG', 'USD'] as const

const IDEMPOTENCY_INDEX = 'transactions_coop_idempotency_key_uniq'

export async function createAccount(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  const memberId       = String(formData.get('member_id') ?? '')
  const planId         = formData.get('savings_product_id') as string | null
  const accountNumber  = String(formData.get('account_number') ?? '').trim()
  const accountType    = String(formData.get('account_type') ?? '')
  const currency       = String(formData.get('currency') ?? 'HTG')
  const openingBalance = Math.max(0, Number(formData.get('balance') ?? 0))

  if (!accountNumber) return { error: 'Numéro de compte manquant.' }
  if (!(ACCOUNT_CURRENCIES as readonly string[]).includes(currency)) {
    return { error: 'Devise non prise en charge.' }
  }
  if (!Number.isFinite(openingBalance)) return { error: 'Solde initial invalide.' }

  // The member (and the plan, if any) must belong to the agent's cooperative.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (supabase as any)
    .from('members').select('id')
    .eq('id', memberId).eq('cooperative_id', agent.cooperative_id)
    .maybeSingle()
  if (!member) return { error: 'Membre introuvable dans cette coopérative.' }

  const plan = planId && planId !== '' ? planId : null
  if (plan) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product } = await (supabase as any)
      .from('savings_products').select('id')
      .eq('id', plan).eq('cooperative_id', agent.cooperative_id)
      .maybeSingle()
    if (!product) return { error: 'Plan d’épargne introuvable.' }
  }

  // ── 1. Create the account row (balance starts at 0 — the trigger on
  //       transactions will set it to the opening deposit below, then
  //       every future dépôt/retrait keeps it in sync automatically).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error } = await (supabase as any).from('accounts').insert({
    cooperative_id:     agent.cooperative_id,
    member_id:          member.id,
    account_number:     accountNumber,
    account_type:       accountType,
    currency,
    balance:            0,
    status:             'active',
    savings_product_id: plan,
  }).select('id').single()

  if (error) {
    if (error.code === '23505') return { error: 'Ce numéro de compte est déjà utilisé.' }
    return { error: error.message }
  }

  // ── 2. If the operator entered an opening amount, log it as a real
  //       deposit transaction so it's counted by the balance trigger and
  //       cumulates with every future dépôt. Also keeps the audit trail
  //       and history complete.
  let openingDepositError: string | null = null
  if (account?.id && openingBalance > 0) {
    const now = new Date()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: txErr } = await (supabase as any).from('transactions').insert({
      cooperative_id:   agent.cooperative_id,
      account_id:       account.id,
      agent_id:         agent.id,
      transaction_type: 'deposit',
      amount:           Math.round(openingBalance * 100) / 100,
      motif:            'Solde d’ouverture',
      reference:        makeReference('OPEN', now),
      status:           'completed',
      transaction_date: now.toISOString(),
    })

    // If the opening-deposit insert fails we don't roll back the account
    // (it's still a valid empty account). The failure is recorded in the
    // audit entry below so an admin can investigate.
    if (txErr) openingDepositError = txErr.message
  }

  await logAudit({
    action: 'account.open',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'accounts',
    targetId: account?.id,
    metadata: {
      account_number: accountNumber,
      opening_balance: openingBalance,
      ...(openingDepositError ? { opening_deposit_failed: openingDepositError } : {}),
    },
  })

  revalidatePath('/tableau-de-bord/comptes')
  if (account?.id) {
    revalidatePath(`/tableau-de-bord/comptes/${account.id}`)
  }
  if (openingDepositError) {
    return { error: `Compte créé, mais le dépôt d’ouverture a échoué : ${openingDepositError}` }
  }
  return null
}

export async function closeAccount(
  accountId: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }
  if (!isManager(agent.role)) {
    return { error: 'Seul un administrateur ou un gérant peut fermer un compte.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account, error: accErr } = await (supabase as any)
    .from('accounts')
    .select('balance, currency, status, account_number, member_id')
    .eq('id', accountId)
    .eq('cooperative_id', agent.cooperative_id)
    .maybeSingle()
  if (accErr || !account) return { error: 'Compte introuvable' }
  if (account.status === 'closed') return { error: 'Ce compte est déjà fermé' }

  // Étape 1 — passe le compte en 'closed' de façon conditionnelle : si deux
  // clics arrivent en même temps, un seul obtient la ligne, l'autre reçoit
  // 0 ligne et s'arrête (pas de double frais).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const claimQuery = (supabase as any)
    .from('accounts')
    .update({ status: 'closed' })
    .eq('id', accountId)
    .eq('cooperative_id', agent.cooperative_id)
  const { data: claimed, error: updateErr } = await (account.status == null
    ? claimQuery.is('status', null)
    : claimQuery.eq('status', account.status)
  ).select('id, balance')
  if (updateErr) return { error: updateErr.message }
  if (!claimed || claimed.length === 0) return { error: 'Ce compte est déjà fermé' }

  // Frais fixes de fermeture, en HTG. Ils ne sont pas convertis : un compte
  // dans une autre devise est fermé sans frais (le prélèvement de « 200 »
  // sur un compte USD aurait coûté ~130 fois le tarif prévu).
  // Le solde utilisé est celui de la ligne verrouillée par la fermeture, pas
  // celui lu plus haut (un retrait a pu être enregistré entre-temps).
  const CLOSING_FEE_HTG = 200
  const currentBalance = Number(claimed[0].balance ?? account.balance)
  const feeApplies     = (account.currency ?? 'HTG') === 'HTG'
  // On ne prélève que ce que le compte peut supporter, pas de découvert involontaire.
  const feeToCharge    = feeApplies ? Math.min(CLOSING_FEE_HTG, Math.max(0, currentBalance)) : 0
  const newBalance     = Math.max(0, currentBalance - feeToCharge)

  // Étape 2 — frais de fermeture sous forme de RETRAIT (pas adjustment) pour
  // que le trigger trg_account_balance_from_transaction l'enregistre dans
  // accounts.balance via la formule cumulative. Si feeToCharge=0 on n'insère
  // rien (compte vide, solde négatif ou autre devise).
  let tx: { id?: string } | null = null
  if (feeToCharge > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: txErr } = await (supabase as any).from('transactions').insert({
      cooperative_id:   agent.cooperative_id,
      account_id:       accountId,
      agent_id:         agent.id,
      transaction_type: 'withdrawal',
      amount:           feeToCharge,
      motif:            `Frais de fermeture — compte ${account.account_number}`,
      reference:        makeReference('CLOSE'),
      status:           'completed',
    }).select('id').single()
    if (txErr) {
      // Le compte n'a pas été débité : on le rouvre dans son état précédent.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('accounts')
        .update({ status: account.status })
        .eq('id', accountId)
        .eq('cooperative_id', agent.cooperative_id)
      return { error: txErr.message }
    }
    tx = inserted
  }

  await logAudit({
    action: 'account.close',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'accounts',
    targetId: accountId,
    metadata: {
      account_number: account.account_number,
      closing_fee:    feeToCharge,
      final_balance:  newBalance,
      ...(feeApplies ? {} : { closing_fee_skipped_currency: account.currency }),
    },
  })

  // Fraud check sur la transaction de fermeture
  if (tx?.id && account.member_id) {
    await runFraudCheck({
      cooperativeId: agent.cooperative_id,
      memberId: account.member_id,
      transactionId: tx.id,
      amount: feeToCharge,
      currency: account.currency,
    })
  }

  revalidatePath('/tableau-de-bord/comptes')
  revalidatePath('/tableau-de-bord/transactions')
  return null
}

/* ─── Record a deposit / withdrawal + emit ticket ─────────────────────────── */
/**
 * Records a single deposit or withdrawal on an active account, logs audit,
 * runs fraud check, and returns the data needed to print a paper ticket.
 *
 * accounts.balance and cash_vault.current_balance are both maintained by
 * database triggers (trg_account_balance_from_transaction, trg_sync_vault):
 * this action only inserts the transaction row.
 *
 * `idempotencyKey` is generated once per form on the client. Submitting the
 * same key twice (double click, network retry) returns the ticket of the
 * transaction already recorded instead of creating a second one.
 *
 * Refuses any operation on a closed/suspended account, or a withdrawal that
 * would overdraft the balance.
 */
export async function recordTransaction(input: {
  accountId: string
  type: 'deposit' | 'withdrawal'
  amount: number
  motif?: string | null
  idempotencyKey?: string | null
}): Promise<{ error: string } | { ticket: TransactionTicketData }> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  if (input.type !== 'deposit' && input.type !== 'withdrawal') {
    return { error: 'Type de transaction invalide.' }
  }
  if (!input.accountId) return { error: 'Compte manquant.' }
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Montant invalide.' }
  if (input.idempotencyKey != null && !isUuid(input.idempotencyKey)) {
    return { error: 'Clé de soumission invalide. Rechargez la page.' }
  }
  const idempotencyKey = input.idempotencyKey ?? null

  // Round to 2 decimals to keep stored balance clean
  const amt   = Math.round(amount * 100) / 100
  const motif = (input.motif ?? '').trim() || null

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

  // ── Replay of an already-recorded submission ──────────────────────────
  if (idempotencyKey) {
    const existing = await findByIdempotencyKey(supabase, agent.cooperative_id, idempotencyKey)
    if (existing) {
      if (existing.account_id !== account.id) {
        return { error: 'Cette soumission a déjà été utilisée pour un autre compte.' }
      }
      return { ticket: await buildTicket(supabase, agent, account, existing) }
    }
  }

  if (account.status !== 'active') {
    return { error: `Le compte est ${account.status} : opération refusée.` }
  }

  const balanceBefore = Number(account.balance ?? 0)
  if (input.type === 'withdrawal' && balanceBefore - amt < 0) {
    return { error: `Solde insuffisant (${balanceBefore.toFixed(2)} ${account.currency}).` }
  }

  // ── Insert transaction ────────────────────────────────────────────────
  // accounts.balance and cash_vault are updated by the triggers on insert.
  const createdAt = new Date().toISOString()
  let reference = makeReference('TX')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let inserted: { data: any; error: any } = { data: null, error: null }
  for (let attempt = 0; attempt < 2; attempt++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inserted = await (supabase as any).from('transactions').insert({
      cooperative_id:   agent.cooperative_id,
      account_id:       account.id,
      agent_id:         agent.id,
      transaction_type: input.type,
      amount:           amt,
      motif,
      reference,
      status:           'completed',
      idempotency_key:  idempotencyKey,
    }).select('id, reference, transaction_type, amount, motif, created_at, account_id').single()

    if (!inserted.error) break
    if (inserted.error.code !== '23505') break

    // Concurrent submit with the same key: the other request won the insert.
    if (idempotencyKey && String(inserted.error.message ?? '').includes(IDEMPOTENCY_INDEX)) {
      const existing = await findByIdempotencyKey(supabase, agent.cooperative_id, idempotencyKey)
      if (existing && existing.account_id === account.id) {
        return { ticket: await buildTicket(supabase, agent, account, existing) }
      }
      return { error: 'Cette soumission a déjà été enregistrée.' }
    }
    // Reference collision (unique index on reference): retry once with a new one.
    reference = makeReference('TX')
  }
  if (inserted.error) return { error: inserted.error.message }
  const tx = inserted.data as RecordedTx

  // ── Read the balance written by the trigger. If another operation on the
  //    same account commits in between, it is included in this figure.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fresh } = await (supabase as any)
    .from('accounts').select('balance').eq('id', account.id).maybeSingle()
  const balanceAfter = fresh?.balance != null
    ? Number(fresh.balance)
    : (input.type === 'deposit' ? balanceBefore + amt : balanceBefore - amt)

  // ── Audit + fraud check (best-effort, never blocking) ─────────────────
  await logAudit({
    action: input.type === 'deposit' ? 'transaction.deposit' : 'transaction.withdrawal',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'transactions',
    targetId: tx?.id,
    metadata: {
      reference: tx.reference,
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

  revalidatePath('/tableau-de-bord/comptes')
  revalidatePath(`/tableau-de-bord/comptes/${account.id}`)
  revalidatePath('/tableau-de-bord/transactions')
  revalidatePath('/tableau-de-bord/caisse')

  return {
    ticket: await buildTicket(supabase, agent, account, {
      ...tx,
      created_at: tx.created_at ?? createdAt,
    }, balanceAfter),
  }
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

interface RecordedTx {
  id:               string
  reference:        string
  transaction_type: 'deposit' | 'withdrawal'
  amount:           number | string
  motif:            string | null
  created_at:       string
  account_id:       string
}

async function findByIdempotencyKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cooperativeId: string,
  key: string,
): Promise<RecordedTx | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('transactions')
    .select('id, reference, transaction_type, amount, motif, created_at, account_id')
    .eq('cooperative_id', cooperativeId)
    .eq('idempotency_key', key)
    .maybeSingle()
  return (data as RecordedTx | null) ?? null
}

async function buildTicket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agent: { cooperative_id: string; name: string | null },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  account: any,
  tx: RecordedTx,
  knownBalanceAfter?: number,
): Promise<TransactionTicketData> {
  const amount = Number(tx.amount)
  let balanceAfter = knownBalanceAfter
  if (balanceAfter == null) {
    // Replay: the current balance is the best figure available.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fresh } = await (supabase as any)
      .from('accounts').select('balance').eq('id', account.id).maybeSingle()
    balanceAfter = Number(fresh?.balance ?? account.balance ?? 0)
  }
  const balanceBefore = tx.transaction_type === 'deposit'
    ? balanceAfter - amount
    : balanceAfter + amount

  // ── Fetch coop name (for the ticket header) ───────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coop } = await (supabase as any)
    .from('cooperatives').select('name').eq('id', agent.cooperative_id).single()

  const member = account.members
  return {
    reference:        tx.reference,
    transaction_type: tx.transaction_type,
    amount,
    motif:            tx.motif,
    created_at:       tx.created_at,
    account_number:   account.account_number,
    account_type:     account.account_type,
    currency:         account.currency ?? 'HTG',
    balance_before:   Math.round(balanceBefore * 100) / 100,
    balance_after:    Math.round(balanceAfter * 100) / 100,
    member_first_name: member?.first_name ?? '—',
    member_last_name:  member?.last_name  ?? '—',
    member_number:     member?.member_number ?? '—',
    agent_name:        agent.name ?? '—',
    coop_name:         coop?.name  ?? 'Bosal Credit Union',
  }
}
