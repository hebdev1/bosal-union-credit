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

// ── Ticket data returned after a successful transaction ───────────────────────
export interface ExchangeTicketData {
  ticket_number: string
  client_first_name: string
  client_last_name: string
  from_currency: string
  to_currency: string
  amount_given: number
  rate_applied: number
  amount_received: number
  notes: string | null
  created_at: string
  agent_name: string
  coop_name: string
}

export async function createExchangeTransaction(
  formData: FormData,
): Promise<{ error: string } | { ticket: ExchangeTicketData }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent, error: agentErr } = await (supabase as any)
    .from('agents').select('cooperative_id, id, name').eq('id', user.id).single()
  if (agentErr || !agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coop } = await (supabase as any)
    .from('cooperatives').select('name').eq('id', agent.cooperative_id).single()

  const amountGiven    = Number(formData.get('amount_given'))
  const rateApplied    = Number(formData.get('rate_applied'))
  const amountReceived = amountGiven * rateApplied
  const exchangeRateId = formData.get('exchange_rate_id') as string | null
  const ticketNumber   = `TK-${Date.now().toString(36).toUpperCase()}`
  const createdAt      = new Date().toISOString()

  const clientFirst = (formData.get('client_first_name') as string).trim()
  const clientLast  = (formData.get('client_last_name') as string).trim()
  const fromCcy     = formData.get('from_currency') as string
  const toCcy       = formData.get('to_currency') as string
  const notes       = (formData.get('notes') as string) || null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('exchange_transactions').insert({
    cooperative_id:    agent.cooperative_id,
    agent_id:          agent.id,
    exchange_rate_id:  exchangeRateId || undefined,
    client_first_name: clientFirst,
    client_last_name:  clientLast,
    from_currency:     fromCcy,
    to_currency:       toCcy,
    amount_given:      amountGiven,
    rate_applied:      rateApplied,
    amount_received:   amountReceived,
    ticket_number:     ticketNumber,
    notes,
  })

  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/bureau-de-change')

  return {
    ticket: {
      ticket_number:     ticketNumber,
      client_first_name: clientFirst,
      client_last_name:  clientLast,
      from_currency:     fromCcy,
      to_currency:       toCcy,
      amount_given:      amountGiven,
      rate_applied:      rateApplied,
      amount_received:   amountReceived,
      notes,
      created_at:        createdAt,
      agent_name:        agent.name ?? '—',
      coop_name:         coop?.name ?? 'Mache Kay BOSAL',
    },
  }
}
