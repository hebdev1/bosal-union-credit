'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ClosureResult {
  closingDate: string
  closedAt: string
  agentName: string
  coopName: string
  coopAddress: string
  openingBalance: number
  totalDeposits: number
  totalWithdrawals: number
  totalLoanDisbursements: number
  totalLoanRepayments: number
  totalExchangeIn: number
  totalExchangeOut: number
  totalFeesCollected: number
  closingBalance: number
  depositCount: number
  withdrawalCount: number
  adjustmentCount: number
  repaymentCount: number
  exchangeCount: number
  transactions: { type: string; amount: number; reference: string; motif: string | null }[]
  exchanges: { from: string; to: string; given: number; received: number; ticket: string }[]
  notes?: string
}

export async function getTodayStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return null

  // Find open daily closing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: openClosing } = await (supabase as any)
    .from('daily_closings')
    .select('closing_date, opening_balance')
    .eq('cooperative_id', agent.cooperative_id)
    .eq('status', 'open')
    .single()

  if (!openClosing) return null

  const closingDate = openClosing.closing_date
  const startOfDay = `${closingDate}T00:00:00`
  const endOfDay   = `${closingDate}T23:59:59.999`

  const [txRes, repRes, exchRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('transactions')
      .select('transaction_type, amount')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startOfDay).lte('created_at', endOfDay),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('loan_repayments')
      .select('amount_paid')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startOfDay).lte('created_at', endOfDay)
      .eq('status', 'paid'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('exchange_transactions')
      .select('amount_given, amount_received, from_currency, to_currency')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startOfDay).lte('created_at', endOfDay),
  ])

  const txs       = (txRes.data ?? []) as any[]
  const repayments = (repRes.data ?? []) as any[]
  const exchanges  = (exchRes.data ?? []) as any[]

  return {
    closingDate,
    openingBalance: Number(openClosing.opening_balance),
    deposits:        txs.filter(t => t.transaction_type === 'deposit').reduce((s: number, t: any) => s + Number(t.amount), 0),
    withdrawals:     txs.filter(t => t.transaction_type === 'withdrawal').reduce((s: number, t: any) => s + Number(t.amount), 0),
    repayments:      repayments.reduce((s: number, r: any) => s + Number(r.amount_paid), 0),
    exchangeIn:      exchanges.filter((e: any) => e.to_currency === 'HTG').reduce((s: number, e: any) => s + Number(e.amount_received), 0),
    exchangeOut:     exchanges.filter((e: any) => e.from_currency === 'HTG').reduce((s: number, e: any) => s + Number(e.amount_given), 0),
    depositCount:    txs.filter(t => t.transaction_type === 'deposit').length,
    withdrawalCount: txs.filter(t => t.transaction_type === 'withdrawal').length,
    adjustmentCount: txs.filter(t => t.transaction_type === 'adjustment').length,
    repaymentCount:  repayments.length,
    exchangeCount:   exchanges.length,
  }
}

export async function closeDay(notes?: string): Promise<ClosureResult | { error: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, id, name').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // Find today's open closing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: openClosing } = await (supabase as any)
    .from('daily_closings')
    .select('*')
    .eq('cooperative_id', agent.cooperative_id)
    .eq('status', 'open')
    .single()

  if (!openClosing) return { error: 'Aucune journée ouverte à clôturer' }

  const closingDate = openClosing.closing_date
  const startOfDay  = `${closingDate}T00:00:00`
  const endOfDay    = `${closingDate}T23:59:59.999`

  // Fetch all today's data
  const [txRes, repRes, exchRes, coopRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('transactions')
      .select('transaction_type, amount, reference, motif')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startOfDay).lte('created_at', endOfDay)
      .order('created_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('loan_repayments')
      .select('amount_paid')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startOfDay).lte('created_at', endOfDay)
      .eq('status', 'paid'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('exchange_transactions')
      .select('amount_given, amount_received, from_currency, to_currency, ticket_number')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startOfDay).lte('created_at', endOfDay),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('cooperatives').select('name, address').eq('id', agent.cooperative_id).single(),
  ])

  const txs        = (txRes.data ?? []) as any[]
  const repayments = (repRes.data ?? []) as any[]
  const exchanges  = (exchRes.data ?? []) as any[]
  const coop       = coopRes.data as any

  // Compute totals
  const totalDeposits    = txs.filter(t => t.transaction_type === 'deposit').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const totalWithdrawals = txs.filter(t => t.transaction_type === 'withdrawal').reduce((s: number, t: any) => s + Number(t.amount), 0)
  const totalRepayments  = repayments.reduce((s: number, r: any) => s + Number(r.amount_paid), 0)
  const totalExchangeIn  = exchanges.filter((e: any) => e.to_currency === 'HTG').reduce((s: number, e: any) => s + Number(e.amount_received), 0)
  const totalExchangeOut = exchanges.filter((e: any) => e.from_currency === 'HTG').reduce((s: number, e: any) => s + Number(e.amount_given), 0)
  const closingBalance   =
    Number(openClosing.opening_balance) + totalDeposits - totalWithdrawals + totalRepayments + totalExchangeIn - totalExchangeOut

  const now = new Date().toISOString()

  // Close the day
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('daily_closings').update({
    total_deposits:           totalDeposits,
    total_withdrawals:        totalWithdrawals,
    total_loan_repayments:    totalRepayments,
    total_exchange_in:        totalExchangeIn,
    total_exchange_out:       totalExchangeOut,
    total_fees_collected:     0,
    total_loan_disbursements: 0,
    closing_balance:          closingBalance,
    closed_by:                agent.id,
    status:                   'closed',
    closed_at:                now,
    notes:                    notes ?? null,
  }).eq('id', openClosing.id)

  // Open the next day with today's closing balance as opening
  const nextDate = new Date(closingDate)
  nextDate.setDate(nextDate.getDate() + 1)
  const nextDateStr = nextDate.toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('daily_closings').upsert({
    cooperative_id:  agent.cooperative_id,
    closing_date:    nextDateStr,
    opening_balance: closingBalance,
    status:          'open',
  }, { onConflict: 'cooperative_id,closing_date' })

  revalidatePath('/tableau-de-bord/cloture')
  revalidatePath('/tableau-de-bord')

  return {
    closingDate,
    closedAt: now,
    agentName: agent.name,
    coopName:    coop?.name    ?? 'Coopérative',
    coopAddress: coop?.address ?? '',
    openingBalance:          Number(openClosing.opening_balance),
    totalDeposits,
    totalWithdrawals,
    totalLoanDisbursements:  0,
    totalLoanRepayments:     totalRepayments,
    totalExchangeIn,
    totalExchangeOut,
    totalFeesCollected:      0,
    closingBalance,
    depositCount:    txs.filter((t: any) => t.transaction_type === 'deposit').length,
    withdrawalCount: txs.filter((t: any) => t.transaction_type === 'withdrawal').length,
    adjustmentCount: txs.filter((t: any) => t.transaction_type === 'adjustment').length,
    repaymentCount:  repayments.length,
    exchangeCount:   exchanges.length,
    transactions:    txs.map(t => ({ type: t.transaction_type, amount: Number(t.amount), reference: t.reference ?? '', motif: t.motif })),
    exchanges:       exchanges.map(e => ({ from: e.from_currency, to: e.to_currency, given: Number(e.amount_given), received: Number(e.amount_received), ticket: e.ticket_number ?? '' })),
    notes,
  }
}

export async function openNewDay(
  openingBalance: number,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  const today = new Date().toISOString().split('T')[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('daily_closings').upsert({
    cooperative_id:  agent.cooperative_id,
    closing_date:    today,
    opening_balance: openingBalance,
    status:          'open',
  }, { onConflict: 'cooperative_id,closing_date' })

  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/cloture')
  return null
}
