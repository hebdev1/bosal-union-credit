'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications/inapp'
import { evaluateApproval, APPROVAL_RULES, type Role } from '@/lib/approvals/four-eyes'
import { isFinalLoanStatus } from '@/lib/loans/finality'
import { getCurrentAgent, isManager } from '@/lib/auth/agent'
import { makeReference } from '@/lib/transactions/reference'
import type { AuditAction } from '@/lib/audit'

/** Values of the Postgres enum public.loan_status. */
const LOAN_STATUSES = ['pending', 'active', 'completed', 'defaulted', 'rejected'] as const

/* ─── Update loan status ──────────────────────────────────────────────────── */
export async function updateLoanStatus(
  loanId: string,
  newStatus: string,
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  if (!(LOAN_STATUSES as readonly string[]).includes(newStatus)) {
    return { error: 'Statut de prêt invalide.' }
  }
  // Approving, rejecting, writing off or closing a loan is a back-office
  // decision. (Below the four-eyes threshold the approval rule alone let any
  // agent, cashier included, approve a loan.)
  if (!isManager(agent.role)) {
    return { error: 'Seul un administrateur ou un gérant peut changer le statut d’un prêt.' }
  }

  // Fetch loan for notification + metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loan } = await (supabase as any)
    .from('loans')
    .select('id, loan_number, member_id, status, agent_id, created_at, principal_amount, monthly_payment')
    .eq('id', loanId)
    .eq('cooperative_id', agent.cooperative_id)
    .single()
  if (!loan) return { error: 'Prêt introuvable' }

  // Irreversibility guard — once a loan reaches a terminal status, no further
  // transitions are accepted (paid / closed / rejected / defaulted / completed).
  if (isFinalLoanStatus(loan.status) && loan.status !== newStatus) {
    return { error: `Statut « ${loan.status} » irréversible : aucune transition possible.` }
  }

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

  // Conditional on the status we just read: two concurrent changes cannot
  // both apply (the second one updates 0 rows).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusUpdate = (supabase as any)
    .from('loans')
    .update({ status: newStatus })
    .eq('id', loanId)
    .eq('cooperative_id', agent.cooperative_id)
  const { data: updated, error } = await (loan.status == null
    ? statusUpdate.is('status', null)
    : statusUpdate.eq('status', loan.status)
  ).select('id')

  if (error) return { error: error.message }
  if (!updated || updated.length === 0) {
    return { error: 'Le statut du prêt a changé entre-temps. Rechargez la page.' }
  }

  // Audit trail
  const action: AuditAction =
    newStatus === 'active'    ? 'loan.approve'   :
    newStatus === 'rejected'  ? 'loan.reject'    :
    newStatus === 'defaulted' ? 'loan.writeoff'  :
    'loan.status_change'
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

/* ─── Record / update one monthly repayment ──────────────────────────────── */
/**
 * Upsert a `loan_repayments` row for a specific installment_no. The
 * trigger trg_loan_amount_paid keeps `loans.amount_paid` equal to the sum
 * of all repayments; this action then marks the loan 'completed' when it is
 * fully reimbursed.
 */
export async function recordLoanRepayment(input: {
  loanId: string
  installmentNo: number
  amountPaid: number
  amountDue: number
  dueDate: string // ISO date 'YYYY-MM-DD'
}): Promise<{ error: string } | { ok: true; totalPaid: number; closed: boolean }> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  if (!input.loanId) return { error: 'Prêt manquant.' }
  if (!Number.isFinite(input.installmentNo) || input.installmentNo < 1) {
    return { error: 'Numéro de versement invalide.' }
  }
  if (!Number.isFinite(input.amountPaid) || input.amountPaid < 0) {
    return { error: 'Montant invalide.' }
  }
  if (!Number.isFinite(input.amountDue) || input.amountDue < 0) {
    return { error: 'Mensualité due invalide.' }
  }
  if (!input.dueDate) return { error: 'Date d\'échéance manquante.' }

  // Verify loan ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loan } = await (supabase as any)
    .from('loans')
    .select('id, loan_number, member_id, total_amount_due, duration_months, status, cooperative_id')
    .eq('id', input.loanId)
    .eq('cooperative_id', agent.cooperative_id)
    .single()
  if (!loan) return { error: 'Prêt introuvable.' }

  // Irreversibility guard — block any repayment edit on a sealed loan.
  if (isFinalLoanStatus(loan.status)) {
    return { error: `Prêt « ${loan.status} » irréversible : versements verrouillés.` }
  }
  // Repayments only apply to an approved loan (the database enforces the
  // same rule): otherwise a cashier could take a never-approved loan to
  // 'completed' by entering installments.
  if (loan.status !== 'active') {
    return { error: 'Les versements ne sont acceptés que sur un prêt actif (approuvé).' }
  }

  const paid = Math.round(input.amountPaid * 100) / 100
  const due  = Math.round(input.amountDue  * 100) / 100
  const status: 'paid' | 'pending' | 'late' =
    paid >= due && paid > 0 ? 'paid' :
    paid > 0                ? 'late' :
    'pending'
  const paidAt = paid > 0 ? new Date().toISOString() : null

  // Look up existing row (loan_id + installment_no) — also need its current
  // status to enforce per-installment immutability.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('loan_repayments')
    .select('id, status, amount_paid')
    .eq('loan_id', input.loanId)
    .eq('installment_no', input.installmentNo)
    .maybeSingle()

  // Per-installment irreversibility — once a row is fully paid, freeze it.
  if (existing?.status === 'paid') {
    return { error: `Versement #${input.installmentNo} déjà soldé : modification interdite.` }
  }

  if (existing?.id) {
    // `neq('status', 'paid')`: an installment settled by a concurrent request
    // between the read above and this write stays frozen.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedRows, error } = await (supabase as any)
      .from('loan_repayments')
      .update({
        amount_paid: paid,
        amount_due:  due,
        due_date:    input.dueDate,
        paid_at:     paidAt,
        status,
        agent_id:    agent.id,
      })
      .eq('id', existing.id)
      .eq('cooperative_id', agent.cooperative_id)
      .neq('status', 'paid')
      .select('id')
    if (error) return { error: error.message }
    if (!updatedRows || updatedRows.length === 0) {
      return { error: `Versement #${input.installmentNo} déjà soldé : modification interdite.` }
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('loan_repayments')
      .insert({
        cooperative_id: agent.cooperative_id,
        loan_id:        input.loanId,
        agent_id:       agent.id,
        installment_no: input.installmentNo,
        amount_due:     due,
        amount_paid:    paid,
        due_date:       input.dueDate,
        paid_at:        paidAt,
        status,
      })
    if (error) {
      if (error.code === '23505') {
        return { error: `Versement #${input.installmentNo} enregistré entre-temps. Rechargez la page.` }
      }
      return { error: error.message }
    }
  }

  // loans.amount_paid is recomputed by the trigger trg_loan_amount_paid
  // (sum of all repayments, in the same statement) — read it back.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: refreshed } = await (supabase as any)
    .from('loans')
    .select('amount_paid')
    .eq('id', input.loanId)
    .eq('cooperative_id', agent.cooperative_id)
    .maybeSingle()
  const totalPaid = Math.round(Number(refreshed?.amount_paid ?? 0) * 100) / 100

  const totalDue = Number(loan.total_amount_due)
  const fullyClosed = totalPaid >= totalDue && totalDue > 0

  // 'completed' is the loan_status value for a fully reimbursed loan
  // (the enum has no 'paid': the previous update failed on the last
  // installment with "invalid input value for enum loan_status").
  // Conditional on 'active': a status set by a manager in the meantime
  // (e.g. 'defaulted') is not overwritten. The repayment is already
  // committed at this point, so a failed completion must not skip the audit.
  let closed = false
  let warning: string | null = null
  if (fullyClosed) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: completed, error: updErr } = await (supabase as any)
      .from('loans')
      .update({ status: 'completed' })
      .eq('id', input.loanId)
      .eq('cooperative_id', agent.cooperative_id)
      .eq('status', 'active')
      .select('id')
    if (updErr) warning = `Versement enregistré, mais la clôture du prêt a échoué : ${updErr.message}`
    else if (!completed || completed.length === 0) warning = 'Versement enregistré, mais le statut du prêt a changé entre-temps. Rechargez la page.'
    else closed = true
  }

  await logAudit({
    action: 'loan.repayment',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'loan_repayments',
    targetId: input.loanId,
    metadata: {
      loan_number: loan.loan_number,
      installment_no: input.installmentNo,
      amount_paid: paid,
      amount_due: due,
      total_paid: totalPaid,
      closed,
      ...(warning ? { completion_warning: warning } : {}),
    },
  })

  revalidatePath('/tableau-de-bord/prets')
  revalidatePath(`/tableau-de-bord/prets/${input.loanId}`)
  if (warning) return { error: warning }
  return { ok: true, totalPaid, closed }
}

/* ─── Adjust loan terms (pending loans only, before any repayment) ────────── */
/**
 * Edit principal / rate / duration / purpose on a `pending` loan that has
 * no repayments yet. Recomputes monthly_payment, total_amount_due, due_date.
 * Refuses any change once the loan is approved/active or has activity.
 */
export async function adjustLoan(input: {
  loanId: string
  principal: number
  interestRate: number
  durationMonths: number
  purpose?: string | null
}): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  if (!input.loanId) return { error: 'Prêt manquant.' }
  if (!Number.isFinite(input.principal)     || input.principal     <= 0)  return { error: 'Capital invalide.' }
  if (!Number.isFinite(input.interestRate)  || input.interestRate  <  0)  return { error: 'Taux invalide.' }
  if (!Number.isFinite(input.durationMonths)|| input.durationMonths <= 0) return { error: 'Durée invalide.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loan } = await (supabase as any)
    .from('loans')
    .select('id, loan_number, status, created_at, agent_id')
    .eq('id', input.loanId)
    .eq('cooperative_id', agent.cooperative_id)
    .single()
  if (!loan) return { error: 'Prêt introuvable.' }

  // The agent who entered the loan, or a manager, may adjust it before approval.
  if (!isManager(agent.role) && loan.agent_id !== agent.id) {
    return { error: 'Seul l’agent qui a saisi le prêt, un gérant ou un administrateur peut l’ajuster.' }
  }

  if (loan.status !== 'pending') {
    return { error: `Seuls les prêts en attente peuvent être ajustés (statut actuel : ${loan.status}).` }
  }

  // Block if any repayment has already been recorded.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('loan_repayments')
    .select('id', { count: 'exact', head: true })
    .eq('loan_id', input.loanId)
  if ((count ?? 0) > 0) {
    return { error: 'Versements déjà enregistrés : ajustement interdit.' }
  }

  // Flat-rate calc, identical to createLoan, to keep stored fields consistent.
  const totalInterest   = input.principal * (input.interestRate / 100) * (input.durationMonths / 12)
  const totalAmountDue  = input.principal + totalInterest
  const monthlyPayment  = totalAmountDue / input.durationMonths

  // Due date = created_at (or today) + duration months
  const base = loan.created_at ? new Date(loan.created_at) : new Date()
  const due  = new Date(base)
  due.setMonth(due.getMonth() + input.durationMonths)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('loans')
    .update({
      principal_amount: input.principal,
      interest_rate:    input.interestRate,
      duration_months:  input.durationMonths,
      monthly_payment:  Math.round(monthlyPayment * 100) / 100,
      total_amount_due: Math.round(totalAmountDue * 100) / 100,
      due_date:         due.toISOString().split('T')[0],
      purpose:          input.purpose ?? null,
    })
    .eq('id', input.loanId)
    .eq('cooperative_id', agent.cooperative_id)
  if (error) return { error: error.message }

  await logAudit({
    action: 'loan.adjust',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'loans',
    targetId: input.loanId,
    metadata: {
      loan_number: loan.loan_number,
      principal: input.principal,
      interest_rate: input.interestRate,
      duration_months: input.durationMonths,
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      total_amount_due: Math.round(totalAmountDue * 100) / 100,
    },
  })

  revalidatePath('/tableau-de-bord/prets')
  revalidatePath(`/tableau-de-bord/prets/${input.loanId}`)
  revalidatePath(`/tableau-de-bord/emprunteurs`, 'layout')
  return { ok: true }
}

/* ─── Create loan ─────────────────────────────────────────────────────────── */
export async function createLoan(formData: FormData): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const agent = await getCurrentAgent(supabase)
  if (!agent) return { error: 'Non authentifié' }

  const memberId       = String(formData.get('member_id') ?? '')
  const accountId      = String(formData.get('account_id') ?? '')
  const principal      = parseFloat(formData.get('principal_amount') as string)
  const interestRate   = parseFloat(formData.get('interest_rate') as string)
  const durationMonths = parseInt(formData.get('duration_months') as string, 10)
  const purpose        = String(formData.get('purpose') ?? '').trim() || null

  if (!memberId)          return { error: 'Veuillez sélectionner un membre.' }
  if (!accountId)         return { error: 'Veuillez sélectionner un compte.' }
  if (!Number.isFinite(principal) || principal <= 0) return { error: 'Montant du capital invalide.' }
  if (!Number.isFinite(interestRate) || interestRate < 0) return { error: 'Taux d\'intérêt invalide.' }
  if (!Number.isFinite(durationMonths) || durationMonths <= 0) return { error: 'Durée invalide.' }

  // The account must exist in this cooperative and belong to the borrower.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: account } = await (supabase as any)
    .from('accounts')
    .select('id, member_id')
    .eq('id', accountId)
    .eq('cooperative_id', agent.cooperative_id)
    .maybeSingle()
  if (!account) return { error: 'Compte introuvable dans cette coopérative.' }
  if (account.member_id !== memberId) {
    return { error: 'Ce compte n’appartient pas au membre sélectionné.' }
  }

  // Flat-rate calculation
  const totalInterest    = principal * (interestRate / 100) * (durationMonths / 12)
  const totalAmountDue   = principal + totalInterest
  const monthlyPayment   = totalAmountDue / durationMonths

  // Loan number: PRE-YYYYMMDD-XXXXXX
  const now        = new Date()
  const loanNumber = makeReference('PRE', now)

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
    action: 'loan.create',
    cooperativeId: agent.cooperative_id,
    userId: agent.id,
    targetTable: 'loans',
    targetId: inserted?.id,
    metadata: { loan_number: loanNumber, principal, purpose, duration_months: durationMonths, status: 'pending' },
  })

  revalidatePath('/tableau-de-bord/prets')
  return null
}
