import { describe, it, expect } from 'vitest'
import { evaluateApproval, APPROVAL_RULES, type ApprovalState, type ApprovalRule } from './four-eyes'

const baseState: ApprovalState = {
  initiatorId: 'user-a',
  initiatorRole: 'agent',
  initiatedAt: new Date('2026-01-01T09:00:00Z'),
  approverId: 'user-b',
  approverRole: 'manager',
  approvedAt: new Date('2026-01-01T10:00:00Z'),
}

const baseRule: ApprovalRule = {
  approverRoles: ['supervisor', 'manager', 'admin'],
}

describe('evaluateApproval', () => {
  it('autorise single-eye si montant sous le seuil', () => {
    const rule: ApprovalRule = { ...baseRule, thresholdAmount: 100_000 }
    const result = evaluateApproval({
      state: { ...baseState, approverId: undefined, approverRole: undefined, approvedAt: undefined },
      amount: 50_000,
      rule,
    })
    expect(result).toEqual({ allowed: true, reason: 'single-eye' })
  })

  it('exige 4-eyes si montant >= seuil', () => {
    const rule: ApprovalRule = { ...baseRule, thresholdAmount: 100_000 }
    const result = evaluateApproval({
      state: baseState,
      amount: 100_000,
      now: new Date('2026-01-01T11:00:00Z'),
      rule,
    })
    expect(result).toEqual({ allowed: true, reason: 'four-eyes-complete' })
  })

  it('refuse si pas d\'approbateur', () => {
    const result = evaluateApproval({
      state: { ...baseState, approverId: undefined, approverRole: undefined, approvedAt: undefined },
      rule: baseRule,
    })
    expect(result).toEqual({ allowed: false, reason: 'missing-approver' })
  })

  it('refuse si initiateur = approbateur', () => {
    const result = evaluateApproval({
      state: { ...baseState, approverId: 'user-a' },
      now: new Date('2026-01-01T11:00:00Z'),
      rule: baseRule,
    })
    expect(result).toEqual({ allowed: false, reason: 'same-person' })
  })

  it('refuse si approbateur n\'a pas un rôle autorisé', () => {
    const result = evaluateApproval({
      state: { ...baseState, approverRole: 'agent' },
      now: new Date('2026-01-01T11:00:00Z'),
      rule: baseRule,
    })
    expect(result).toEqual({ allowed: false, reason: 'wrong-role' })
  })

  it('refuse si approbation expirée', () => {
    const result = evaluateApproval({
      state: baseState,
      now: new Date('2026-01-03T11:00:00Z'), // +49h
      rule: baseRule,
    })
    expect(result).toEqual({ allowed: false, reason: 'expired' })
  })

  it('refuse si approvedAt dans le futur (horloge incohérente)', () => {
    const result = evaluateApproval({
      state: { ...baseState, approvedAt: new Date('2026-01-02T00:00:00Z') },
      now: new Date('2026-01-01T11:00:00Z'),
      rule: baseRule,
    })
    expect(result).toEqual({ allowed: false, reason: 'expired' })
  })

  it('respecte maxAgeMs custom', () => {
    const rule: ApprovalRule = { ...baseRule, maxAgeMs: 30 * 60 * 1000 } // 30 min
    const result = evaluateApproval({
      state: baseState,
      now: new Date('2026-01-01T10:45:00Z'), // +45 min
      rule,
    })
    expect(result).toEqual({ allowed: false, reason: 'expired' })
  })

  it('APPROVAL_RULES: loan.approve exige manager/admin/supervisor avec seuil 100k', () => {
    const rule = APPROVAL_RULES['loan.approve']
    expect(rule.thresholdAmount).toBe(100_000)
    expect(rule.approverRoles).toContain('manager')
    expect(rule.approverRoles).not.toContain('cashier')
  })

  it('APPROVAL_RULES: role.grant réservé aux admins', () => {
    expect(APPROVAL_RULES['role.grant'].approverRoles).toEqual(['admin'])
  })
})
