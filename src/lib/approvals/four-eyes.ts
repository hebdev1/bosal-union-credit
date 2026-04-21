/**
 * Four-eyes principle — double approbation pour les opérations sensibles.
 * Logique pure : prend un état d'approbation, renvoie si l'action est autorisée.
 *
 * Règles :
 *   - initiator et approver doivent être des personnes différentes
 *   - approver doit avoir un rôle "autorisé" (configurable par op)
 *   - approval expire après `maxAgeMs` (default 24 h)
 */

export type Role = 'agent' | 'cashier' | 'supervisor' | 'manager' | 'admin' | 'auditor'

export interface ApprovalState {
  initiatorId: string
  initiatorRole: Role
  initiatedAt: Date
  approverId?: string
  approverRole?: Role
  approvedAt?: Date
}

export interface ApprovalRule {
  /** Rôles autorisés à APPROUVER cette opération */
  approverRoles: Role[]
  /** Durée max de validité de l'approbation (ms) */
  maxAgeMs?: number
  /** Montant à partir duquel 4-eyes est requis (sinon 1 œil suffit) */
  thresholdAmount?: number
}

export interface EvaluationInput {
  state: ApprovalState
  amount?: number
  now?: Date
  rule: ApprovalRule
}

export type EvaluationResult =
  | { allowed: true; reason: 'single-eye' | 'four-eyes-complete' }
  | { allowed: false; reason: 'missing-approver' | 'same-person' | 'wrong-role' | 'expired' }

export function evaluateApproval({
  state,
  amount,
  now = new Date(),
  rule,
}: EvaluationInput): EvaluationResult {
  // Si seuil défini et montant sous le seuil → un seul œil suffit
  const requiresFourEyes =
    rule.thresholdAmount === undefined ||
    amount === undefined ||
    amount >= rule.thresholdAmount

  if (!requiresFourEyes) {
    return { allowed: true, reason: 'single-eye' }
  }

  if (!state.approverId || !state.approverRole || !state.approvedAt) {
    return { allowed: false, reason: 'missing-approver' }
  }

  if (state.approverId === state.initiatorId) {
    return { allowed: false, reason: 'same-person' }
  }

  if (!rule.approverRoles.includes(state.approverRole)) {
    return { allowed: false, reason: 'wrong-role' }
  }

  const maxAge = rule.maxAgeMs ?? 24 * 60 * 60 * 1000
  const age = now.getTime() - state.approvedAt.getTime()
  if (age < 0 || age > maxAge) {
    return { allowed: false, reason: 'expired' }
  }

  return { allowed: true, reason: 'four-eyes-complete' }
}

/** Catalogue des règles par opération — à ajuster métier. */
export const APPROVAL_RULES: Record<string, ApprovalRule> = {
  'loan.approve':      { approverRoles: ['supervisor', 'manager', 'admin'], thresholdAmount: 100_000 },
  'loan.disburse':     { approverRoles: ['supervisor', 'manager', 'admin'] },
  'loan.writeoff':     { approverRoles: ['manager', 'admin'] },
  'cash.closure.close':{ approverRoles: ['supervisor', 'manager', 'admin'] },
  'cash.transfer':     { approverRoles: ['supervisor', 'manager', 'admin'], thresholdAmount: 50_000 },
  'account.close':     { approverRoles: ['manager', 'admin'] },
  'role.grant':        { approverRoles: ['admin'] },
  'settings.update':   { approverRoles: ['admin'] },
}
