'use server'
import { createClient } from '@/lib/supabase/server'

export interface SessionTxDetail {
  id: string
  created_at: string
  transaction_type: string
  amount: number
  status: string
  reference: string | null
  motif: string | null
  account_number: string | null
  member_name: string | null
  currency: string | null
}

export interface SessionExchangeDetail {
  id: string
  created_at: string
  from_currency: string
  to_currency: string
  amount_given: number
  amount_received: number
  rate_applied: number
  ticket_number: string | null
}

export interface SessionRepaymentDetail {
  id: string
  created_at: string
  amount_paid: number
  status: string
  loan_number: string | null
  member_name: string | null
}

export interface SessionDetail {
  closingId: string
  closingDate: string
  transactions: SessionTxDetail[]
  exchanges: SessionExchangeDetail[]
  repayments: SessionRepaymentDetail[]
}

/**
 * Fetch every operation (transactions, exchanges, loan repayments) that
 * happened during the given session (closing_date). The session spans the
 * previous session's closed_at (or start-of-day) through this session's
 * closed_at (or end-of-day if still open).
 */
export async function getSessionDetail(closingId: string): Promise<SessionDetail | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: thisClosing } = await (supabase as any)
    .from('daily_closings')
    .select('id, closing_date, closed_at, status')
    .eq('id', closingId)
    .eq('cooperative_id', agent.cooperative_id)
    .single()
  if (!thisClosing) return { error: 'Clôture introuvable' }

  // Determine session window: the preceding closed session's closed_at
  // defines the start; this session's closed_at (or now) defines the end.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prevClosing } = await (supabase as any)
    .from('daily_closings')
    .select('closed_at')
    .eq('cooperative_id', agent.cooperative_id)
    .eq('status', 'closed')
    .lt('closing_date', thisClosing.closing_date)
    .not('closed_at', 'is', null)
    .order('closing_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const startIso = prevClosing?.closed_at ?? `${thisClosing.closing_date}T00:00:00`
  const endIso   = thisClosing.closed_at ?? `${thisClosing.closing_date}T23:59:59.999`

  const [txRes, exRes, repRes] = await Promise.allSettled([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('transactions')
      .select('id, created_at, transaction_type, amount, status, reference, motif, accounts(account_number, currency, members(first_name, last_name))')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startIso).lte('created_at', endIso)
      .order('created_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('exchange_transactions')
      .select('id, created_at, from_currency, to_currency, amount_given, amount_received, rate_applied, ticket_number')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startIso).lte('created_at', endIso)
      .order('created_at', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('loan_repayments')
      .select('id, created_at, amount_paid, status, loans(loan_number, members(first_name, last_name))')
      .eq('cooperative_id', agent.cooperative_id)
      .gte('created_at', startIso).lte('created_at', endIso)
      .order('created_at', { ascending: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawTx = txRes.status === 'fulfilled' ? ((txRes.value as any).data ?? []) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEx = exRes.status === 'fulfilled' ? ((exRes.value as any).data ?? []) : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRep = repRes.status === 'fulfilled' ? ((repRes.value as any).data ?? []) : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions: SessionTxDetail[] = rawTx.map((t: any) => {
    const acct = Array.isArray(t.accounts) ? t.accounts[0] : t.accounts
    const member = acct ? (Array.isArray(acct.members) ? acct.members[0] : acct.members) : null
    return {
      id: t.id,
      created_at: t.created_at,
      transaction_type: t.transaction_type,
      amount: Number(t.amount ?? 0),
      status: t.status,
      reference: t.reference,
      motif: t.motif,
      account_number: acct?.account_number ?? null,
      currency: acct?.currency ?? null,
      member_name: member ? `${member.first_name} ${member.last_name}` : null,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exchanges: SessionExchangeDetail[] = rawEx.map((e: any) => ({
    id: e.id,
    created_at: e.created_at,
    from_currency: e.from_currency,
    to_currency: e.to_currency,
    amount_given: Number(e.amount_given ?? 0),
    amount_received: Number(e.amount_received ?? 0),
    rate_applied: Number(e.rate_applied ?? 0),
    ticket_number: e.ticket_number,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repayments: SessionRepaymentDetail[] = rawRep.map((r: any) => {
    const loan = Array.isArray(r.loans) ? r.loans[0] : r.loans
    const member = loan ? (Array.isArray(loan.members) ? loan.members[0] : loan.members) : null
    return {
      id: r.id,
      created_at: r.created_at,
      amount_paid: Number(r.amount_paid ?? 0),
      status: r.status,
      loan_number: loan?.loan_number ?? null,
      member_name: member ? `${member.first_name} ${member.last_name}` : null,
    }
  })

  return {
    closingId,
    closingDate: thisClosing.closing_date,
    transactions,
    exchanges,
    repayments,
  }
}
