'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createExchangeTransaction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: agent, error: agentErr } = await supabase
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (agentErr || !agent) throw new Error('Agent introuvable')

  const amountGiven    = Number(formData.get('amount_given'))
  const rateApplied    = Number(formData.get('rate_applied'))
  const amountReceived = amountGiven * rateApplied

  const { error } = await supabase.from('exchange_transactions').insert({
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

  if (error) throw new Error(error.message)
  revalidatePath('/tableau-de-bord/bureau-de-change')
}
