/**
 * Shared types + display helpers for the credit-scoring engine.
 * Server side: see supabase/migrations/20260427140*_credit_scoring_*.sql
 */

export type RiskLevel = 'EXCELLENT' | 'GOOD' | 'MEDIUM' | 'HIGH_RISK'

export interface CreditScoreRow {
  member_id:                string
  cooperative_id:           string
  payment_score:            number
  repayment_score:          number
  activity_score:           number
  stability_score:          number
  total_score:              number
  risk_level:               RiskLevel
  payments_total:           number
  payments_on_time:         number
  loan_repayments_total:    number
  loan_repayments_on_time:  number
  total_late_days:          number
  transactions_count:       number
  months_active:            number
  last_calculated_at:       string
}

export const SCORE_MAX = 1000

export const COMPONENT_MAX = {
  payment:    400,
  repayment:  300,
  activity:   200,
  stability:  100,
} as const

export const RISK_META: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  EXCELLENT: { label: 'Excellent',    color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.30)' },
  GOOD:      { label: 'Bon',          color: '#60A5FA', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)' },
  MEDIUM:    { label: 'Moyen',        color: '#FCD34D', bg: 'rgba(252,211,77,0.12)',  border: 'rgba(252,211,77,0.30)' },
  HIGH_RISK: { label: 'Risque élevé', color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.30)' },
}

/** Returns the risk bucket for any total score, mirrors the SQL CASE. */
export function riskFromTotal(total: number): RiskLevel {
  if (total >= 800) return 'EXCELLENT'
  if (total >= 600) return 'GOOD'
  if (total >= 400) return 'MEDIUM'
  return 'HIGH_RISK'
}
