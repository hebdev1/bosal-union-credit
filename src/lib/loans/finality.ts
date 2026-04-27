/**
 * Loan finality rules — once a loan reaches one of these statuses,
 * it is sealed: no status change, no further repayment edits.
 *
 * Same goes for individual installment rows in `loan_repayments`:
 * once a row's status is `paid`, the amount is frozen.
 */

export const FINAL_LOAN_STATUSES = ['paid', 'closed', 'rejected', 'defaulted', 'completed'] as const
export type FinalLoanStatus = (typeof FINAL_LOAN_STATUSES)[number]

export function isFinalLoanStatus(s: string | null | undefined): boolean {
  return !!s && (FINAL_LOAN_STATUSES as readonly string[]).includes(s)
}

export const FINAL_INSTALLMENT_STATUSES = ['paid'] as const
export function isFinalInstallmentStatus(s: string | null | undefined): boolean {
  return !!s && (FINAL_INSTALLMENT_STATUSES as readonly string[]).includes(s)
}

/** Human-readable French label for a final loan status (used in toasts/UI). */
export function finalLoanStatusLabel(s: string | null | undefined): string {
  switch (s) {
    case 'paid':      return 'Soldé'
    case 'closed':    return 'Clôturé'
    case 'rejected':  return 'Rejeté'
    case 'defaulted': return 'En défaut'
    case 'completed': return 'Complété'
    default:          return 'Final'
  }
}
