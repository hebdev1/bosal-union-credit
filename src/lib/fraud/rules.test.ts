import { describe, it, expect } from 'vitest'
import { evaluateFraud, maxSeverity, DEFAULT_FRAUD_CONFIG, type TxContext, type HistoryEntry } from './rules'

function tx(overrides: Partial<TxContext> = {}): TxContext {
  return {
    id: 't1',
    memberId: 'm1',
    amount: 1000,
    currency: 'HTG',
    occurredAt: new Date('2026-01-15T10:00:00'),
    ...overrides,
  }
}

function hist(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'h1',
    memberId: 'm1',
    amount: 1000,
    occurredAt: new Date('2026-01-15T09:58:00'),
    ...overrides,
  }
}

describe('evaluateFraud', () => {
  it('aucun flag pour une transaction normale', () => {
    const flags = evaluateFraud(tx({ amount: 1234 }), [])
    expect(flags).toEqual([])
  })

  it('détecte velocity', () => {
    const history: HistoryEntry[] = Array.from({ length: 5 }, (_, i) =>
      hist({ id: `h${i}`, occurredAt: new Date('2026-01-15T09:55:00') }),
    )
    const flags = evaluateFraud(tx({ amount: 1234 }), history)
    expect(flags.some((f) => f.rule === 'velocity')).toBe(true)
  })

  it('détecte threshold', () => {
    const flags = evaluateFraud(tx({ amount: 600_000 }), [])
    expect(flags.some((f) => f.rule === 'threshold')).toBe(true)
  })

  it('détecte duplicate', () => {
    const flags = evaluateFraud(
      tx({ amount: 1234, counterpartyId: 'cp1' }),
      [hist({ amount: 1234, counterpartyId: 'cp1', occurredAt: new Date('2026-01-15T09:58:00') })],
    )
    expect(flags.some((f) => f.rule === 'duplicate')).toBe(true)
  })

  it('ignore duplicate si bénéficiaire différent', () => {
    const flags = evaluateFraud(
      tx({ amount: 1234, counterpartyId: 'cp1' }),
      [hist({ amount: 1234, counterpartyId: 'cp2' })],
    )
    expect(flags.some((f) => f.rule === 'duplicate')).toBe(false)
  })

  it('détecte round-amount', () => {
    const flags = evaluateFraud(tx({ amount: 100_000 }), [])
    expect(flags.some((f) => f.rule === 'round-amount')).toBe(true)
  })

  it('détecte off-hours', () => {
    const flags = evaluateFraud(tx({ amount: 1234, occurredAt: new Date('2026-01-15T23:00:00') }), [])
    expect(flags.some((f) => f.rule === 'off-hours')).toBe(true)
  })

  it('détecte geo-jump', () => {
    const flags = evaluateFraud(
      tx({ amount: 1234, branchId: 'b2' }),
      [hist({ branchId: 'b1', occurredAt: new Date('2026-01-15T09:30:00') })],
    )
    expect(flags.some((f) => f.rule === 'geo-jump' && f.severity === 'critical')).toBe(true)
  })

  it('config vide = aucun flag', () => {
    const flags = evaluateFraud(tx({ amount: 10_000_000 }), [], {})
    expect(flags).toEqual([])
  })
})

describe('maxSeverity', () => {
  it('renvoie null pour liste vide', () => {
    expect(maxSeverity([])).toBeNull()
  })

  it('renvoie la sévérité la plus haute', () => {
    expect(
      maxSeverity([
        { rule: 'round-amount', severity: 'low', message: '' },
        { rule: 'threshold', severity: 'medium', message: '' },
        { rule: 'geo-jump', severity: 'critical', message: '' },
        { rule: 'velocity', severity: 'high', message: '' },
      ]),
    ).toBe('critical')
  })
})

describe('DEFAULT_FRAUD_CONFIG', () => {
  it('est configuré avec des valeurs sensées', () => {
    expect(DEFAULT_FRAUD_CONFIG.velocity?.maxCount).toBeGreaterThan(0)
    expect(DEFAULT_FRAUD_CONFIG.threshold?.amount).toBeGreaterThan(0)
    expect(DEFAULT_FRAUD_CONFIG.officeHours?.start).toBeLessThan(DEFAULT_FRAUD_CONFIG.officeHours!.end)
  })
})
