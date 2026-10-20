'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { getCurrentAgent, isManager } from '@/lib/auth/agent'
import { makeReference, isUuid } from '@/lib/transactions/reference'

/** Values of the Postgres enum public.currency_code. */
const CURRENCY_CODES = ['HTG', 'USD', 'CAD', 'DOP'] as const
type CurrencyCode = (typeof CURRENCY_CODES)[number]

function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value)
}

export async function createExchangeRate(
  formData: FormData,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }
  if (!isManager(agent.role)) {
    return { error: 'Seul un administrateur ou un gérant peut définir un taux.' }
  }

  const fromCurrency    = String(formData.get('from_currency') ?? '')
  const toCurrency      = String(formData.get('to_currency') ?? '')
  const rate            = Number(formData.get('rate'))
  const replacePrevious = formData.get('replace_previous') === 'true'

  if (!isCurrencyCode(fromCurrency) || !isCurrencyCode(toCurrency)) {
    return { error: 'Devise non prise en charge.' }
  }
  if (fromCurrency === toCurrency) return { error: 'Les devises doivent être différentes' }
  if (!Number.isFinite(rate) || rate <= 0) return { error: 'Le taux doit être supérieur à 0' }

  // Insert first, then retire the previous rates: if the insert fails the
  // pair keeps its current active rate instead of being left with none.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (supabase as any).from('exchange_rates').insert({
    cooperative_id:  agent.cooperative_id,
    set_by_agent_id: agent.id,
    from_currency:   fromCurrency,
    to_currency:     toCurrency,
    rate,
    is_active:       true,
  }).select('id').single()

  if (error) return { error: error.message }

  if (replacePrevious && created?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('exchange_rates')
      .update({ is_active: false })
      .eq('cooperative_id', agent.cooperative_id)
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('is_active', true)
      .neq('id', created.id)
  }

  await logAudit({
    action: 'exchange.rate.create',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'exchange_rates',
    targetId: created?.id,
    metadata: { from_currency: fromCurrency, to_currency: toCurrency, rate, replace_previous: replacePrevious },
  })

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

/**
 * Records a currency exchange.
 *
 * Currencies and rate are read from the selected exchange_rates row, never
 * from the form: the browser only sends the rate id and the amount. (The
 * modal used to post hidden from/to fields that could be empty when the rate
 * list changed after the page loaded — "invalid input value for enum
 * currency_code".)
 */
export async function createExchangeTransaction(
  formData: FormData,
): Promise<{ error: string } | { ticket: ExchangeTicketData }> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  const exchangeRateId = String(formData.get('exchange_rate_id') ?? '')
  const amountGiven    = Math.round(Number(formData.get('amount_given')) * 100) / 100
  const clientFirst    = String(formData.get('client_first_name') ?? '').trim()
  const clientLast     = String(formData.get('client_last_name') ?? '').trim()
  const notes          = String(formData.get('notes') ?? '').trim() || null

  if (!isUuid(exchangeRateId)) return { error: 'Sélectionnez un taux de change.' }
  if (!Number.isFinite(amountGiven) || amountGiven <= 0) return { error: 'Montant invalide.' }
  if (!clientFirst || !clientLast) return { error: 'Nom et prénom du client requis.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rateRow } = await (supabase as any)
    .from('exchange_rates')
    .select('id, from_currency, to_currency, rate, is_active')
    .eq('id', exchangeRateId)
    .eq('cooperative_id', agent.cooperative_id)
    .maybeSingle()
  if (!rateRow) return { error: 'Taux de change introuvable. Rechargez la page.' }
  if (rateRow.is_active === false) {
    return { error: 'Ce taux a été remplacé entre-temps. Rechargez la page pour utiliser le taux actuel.' }
  }

  const fromCcy        = String(rateRow.from_currency)
  const toCcy          = String(rateRow.to_currency)
  const rateApplied    = Number(rateRow.rate)
  if (!Number.isFinite(rateApplied) || rateApplied <= 0) return { error: 'Taux de change invalide.' }
  const amountReceived = Math.round(amountGiven * rateApplied * 100) / 100
  const ticketNumber   = makeReference('TK')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (supabase as any).from('exchange_transactions').insert({
    cooperative_id:    agent.cooperative_id,
    agent_id:          agent.id,
    exchange_rate_id:  rateRow.id,
    client_first_name: clientFirst,
    client_last_name:  clientLast,
    from_currency:     fromCcy,
    to_currency:       toCcy,
    amount_given:      amountGiven,
    rate_applied:      rateApplied,
    amount_received:   amountReceived,
    ticket_number:     ticketNumber,
    notes,
  }).select('id, created_at, from_currency, to_currency, rate_applied, amount_received').single()

  if (error) {
    if (error.code === '22P02') return { error: 'Devise invalide pour ce taux. Rechargez la page.' }
    return { error: error.message }
  }

  // The database derives currencies, rate and amount from the rate row
  // (trg_guard_exchange_transactions_write); the ticket prints what was stored.
  const storedFrom     = String(inserted?.from_currency ?? fromCcy)
  const storedTo       = String(inserted?.to_currency ?? toCcy)
  const storedRate     = Number(inserted?.rate_applied ?? rateApplied)
  const storedReceived = Number(inserted?.amount_received ?? amountReceived)

  await logAudit({
    action: 'exchange.create',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'exchange_transactions',
    targetId: inserted?.id,
    metadata: {
      ticket_number: ticketNumber,
      from_currency: storedFrom, to_currency: storedTo,
      amount_given: amountGiven, rate_applied: storedRate, amount_received: storedReceived,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: coop } = await (supabase as any)
    .from('cooperatives').select('name').eq('id', agent.cooperative_id).single()

  revalidatePath('/tableau-de-bord/bureau-de-change')

  return {
    ticket: {
      ticket_number:     ticketNumber,
      client_first_name: clientFirst,
      client_last_name:  clientLast,
      from_currency:     storedFrom,
      to_currency:       storedTo,
      amount_given:      amountGiven,
      rate_applied:      storedRate,
      amount_received:   storedReceived,
      notes,
      created_at:        inserted?.created_at ?? new Date().toISOString(),
      agent_name:        agent.name ?? '—',
      coop_name:         coop?.name ?? 'Bosal Credit Union',
    },
  }
}
