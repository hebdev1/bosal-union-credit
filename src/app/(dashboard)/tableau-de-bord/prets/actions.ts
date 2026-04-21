'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications/inapp'
import { evaluateApproval, APPROVAL_RULES, type Role } from '@/lib/approvals/four-eyes'

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
    .from('agents').select('cooperative_id, id, role').eq('id', user.id).single()
  if (!agent) return { error: 'Agent introuvable' }

  // Fetch loan for notification + metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loan } = await (supabase as any)
    .from('loans')
    .select('id, loan_number, member_id, status, agent_id, created_at, principal_amount, monthly_payment')
    .eq('id', loanId)
    .eq('cooperative_id', agent.cooperative_id)
    .single()
  if (!loan) return { error: 'Prêt introuvable' }

  // Four-eyes check when transitioning to 'active' (i.e. approving)
  if (newStatus === 'active' && loan.status !== 'active') {
    const rule = APPROVAL_RULES['loan.approve']
    const evalResult = evaluateApproval({
      state: {
        initiatorId: loan.agent_id,
        initiatorRole: 'agent',
        initiatedAt: new Date(loan.created_at ?? Date.now()),
        approverId: agent.id,
        approverRole: (agent.role ?? 'agent') as Role,
        approvedAt: new Date(),
      },
      amount: Number(loan.principal_amount),
      rule,
    })
    if (!evalResult.allowed) {
      const reasons: Record<string, string> = {
        'missing-approver': 'Approbateur manquant.',
        'same-person': "L'initiateur ne peut pas s'auto-approuver (principe des 4 yeux).",
        'wrong-role': 'Votre rôle ne vous permet pas d\'approuver ce prêt.',
        'expired': 'Approbation expirée.',
      }
      return { error: reasons[evalResult.reason] ?? 'Approbation refusée.' }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('loans')
    .update({ status: newStatus })
    .eq('id', loanId)
    .eq('cooperative_id', agent.cooperative_id)

  if (error) return { error: error.message }

  // Audit trail
  const action =
    newStatus === 'active'    ? 'loan.approve'   :
    newStatus === 'rejected'  ? 'loan.reject'    :
    newStatus === 'defaulted' ? 'loan.writeoff'  :
    'loan.approve'
  await logAudit({
    action,
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'loans',
    targetId: loanId,
    metadata: { loan_number: loan.loan_number, previous_status: loan.status, new_status: newStatus },
  })

  // In-app notification to the borrower
  if (newStatus === 'active' && loan.member_id) {
    await createNotification({
      cooperativeId: agent.cooperative_id,
      memberId: loan.member_id,
      type: 'loan_approved',
      message: `Votre prêt ${loan.loan_number} a été approuvé. Mensualité : ${Number(loan.monthly_payment).toLocaleString('fr-FR')} HTG.`,
    })
  }

  revalidatePath('/tableau-de-bord/prets')
  revalidatePath(`/tableau-de-bord/prets/${loanId}`)
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
  const { data: inserted, error } = await (supabase as any).from('loans').insert({
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
  }).select('id').single()

  if (error) return { error: error.message }

  await logAudit({
    action: 'loan.approve', // creation event — will be reviewed
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'loans',
    targetId: inserted?.id,
    metadata: { loan_number: loanNumber, principal, purpose, duration_months: durationMonths, status: 'pending' },
  })

  revalidatePath('/tableau-de-bord/prets')
  return null
}
