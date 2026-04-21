'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { runFraudCheck } from '@/lib/fraud/check'

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
