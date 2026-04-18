'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/* ─── Update loan status ──────────────────────────────────────────────────── */
export async function updateLoanStatus(
  loanId: string,
  newStatus: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('loans')
    .update({ status: newStatus })
    .eq('id', loanId)
    .eq('cooperative_id', agent.cooperative_id)

  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/prets')
  return null
}

/* ─── Create loan ─────────────────────────────────────────────────────────── */
export async function createLoan(formData: FormData): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agent } = await (supabase as any)
    .from('agents').select('cooperative_id, id').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  const memberId       = formData.get('member_id') as string
  const accountId      = formData.get('account_id') as string
  const principal      = parseFloat(formData.get('principal_amount') as string)
  const interestRate   = parseFloat(formData.get('interest_rate') as string)
  const durationMonths = parseInt(formData.get('duration_months') as string, 10)
  const purpose        = (formData.get('purpose') as string).trim() || null

  if (!memberId)          return { error: 'Veuillez sélectionner un membre.' }
  if (!accountId)         return { error: 'Veuillez sélectionner un compte.' }
  if (isNaN(principal) || principal <= 0) return { error: 'Montant du capital invalide.' }
  if (isNaN(interestRate) || interestRate < 0) return { error: 'Taux d\'intérêt invalide.' }
  if (isNaN(durationMonths) || durationMonths <= 0) return { error: 'Durée invalide.' }

  // Flat-rate calculation
  const totalInterest    = principal * (interestRate / 100) * (durationMonths / 12)
  const totalAmountDue   = principal + totalInterest
  const monthlyPayment   = totalAmountDue / durationMonths

  // Generate loan number: PRE-YYYYMMDD-XXXX
  const now       = new Date()
  const datePart  = now.toISOString().slice(0, 10).replace(/-/g, '')
  const randPart  = String(Math.floor(1000 + Math.random() * 9000))
  const loanNumber = `PRE-${datePart}-${randPart}`

  // Due date = today + duration months
  const dueDate = new Date(now)
  dueDate.setMonth(dueDate.getMonth() + durationMonths)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('loans').insert({
    cooperative_id:    agent.cooperative_id,
    agent_id:          agent.id,
    member_id:         memberId,
    account_id:        accountId,
    loan_number:       loanNumber,
    principal_amount:  principal,
    interest_rate:     interestRate,
    duration_months:   durationMonths,
    monthly_payment:   Math.round(monthlyPayment * 100) / 100,
    total_amount_due:  Math.round(totalAmountDue * 100) / 100,
    amount_paid:       0,
    status:            'pending',
    purpose,
    due_date:          dueDate.toISOString().split('T')[0],
  })

  if (error) return { error: error.message }
  revalidatePath('/tableau-de-bord/prets')
  return null
}
