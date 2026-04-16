'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createExchangeRate(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent, error: agentErr } = await (supabase as any)
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (agentErr || !agent) return { error: 'Agent introuvable' }

  const fromCurrency    = formData.get('from_currency') as string
  const toCurrency      = formData.get('to_currency') as string
  const rate            = Number(formData.get('rate'))
  const replacePrevious = formData.get('replace_previous') === 'true'

  if (fromCurrency === toCurrency) return { error: 'Les devises doivent être différentes' }
  if (rate <= 0) return { error: 'Le taux doit être supérieur à 0' }

  // Optionally deactivate existing rates for this pair
  if (replacePrevious) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('exchange_rates')
      .update({ is_active: false })
      .eq('cooperative_id', agent.cooperative_id)
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('is_active', true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('exchange_rates').insert({
    cooperative_id:  agent.cooperative_id,
    set_by_agent_id: agent.id,
    from_currency:   fromCurrency,
    to_currency:     toCurrency,
    rate,
    is_active:       true,
  })

  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/bureau-de-change')
  return null
}

export async function createExchangeTransaction(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent, error: agentErr } = await (supabase as any)
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (agentErr || !agent) return { error: 'Agent introuvable' }

  const amountGiven    = Number(formData.get('amount_given'))
  const rateApplied    = Number(formData.get('rate_applied'))
  const amountReceived = amountGiven * rateApplied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('exchange_transactions').insert({
    cooperative_id:    agent.cooperative_id,
    agent_id:          agent.id,
    client_first_name: (formData.get('client_first_name') as string).trim(),
    client_last_name:  (formData.get('client_last_name') as string).trim(),
    from_currency:     formData.get('from_currency') as string,
    to_currency:       formData.get('to_currency') as string,
    amount_given:      amountGiven,
    rate_applied:      rateApplied,
    amount_received:   amountReceived,
    ticket_number:     `TK-${Date.now().toString(36).toUpperCase()}`,
    notes:             (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/bureau-de-change')
  return null
}
