import { describe, it, expect } from 'vitest'
import { closeCashDay } from './cash'

describe('closeCashDay', () => {
  it('calcule expected = opening + inflows − outflows', () => {
    const summary = closeCashDay(
      1000,
      [
        { type: 'in', amount: 500 },
        { type: 'in', amount: 300 },
        { type: 'out', amount: 200 },
      ],
      1600,
    )
    expect(summary.inflows).toBe(800)
    expect(summary.outflows).toBe(200)
    expect(summary.expected).toBe(1600)
    expect(summary.variance).toBe(0)
    expect(summary.isBalanced).toBe(true)
  })

  it('détecte un écart positif (caisse excédentaire)', () => {
    const summary = closeCashDay(500, [{ type: 'in', amount: 100 }], 650)
    expect(summary.expected).toBe(600)
    expect(summary.variance).toBe(50)
    expect(summary.isBalanced).toBe(false)
  })

  it('détecte un écart négatif (caisse déficitaire)', () => {
    const summary = closeCashDay(500, [{ type: 'in', amount: 100 }], 590)
    expect(summary.variance).toBe(-10)
    expect(summary.isBalanced).toBe(false)
  })

  it('tolère un écart d\'arrondi inférieur à 0,01', () => {
    const summary = closeCashDay(100.001, [], 100)
    expect(summary.isBalanced).toBe(true)
  })

  it('rejette les valeurs négatives', () => {
    expect(() => closeCashDay(-1, [], 0)).toThrow()
    expect(() => closeCashDay(0, [], -1)).toThrow()
    expect(() => closeCashDay(0, [{ type: 'in', amount: -5 }], 0)).toThrow()
  })

  it('gère une journée sans mouvement', () => {
    const summary = closeCashDay(1000, [], 1000)
    expect(summary.inflows).toBe(0)
    expect(summary.outflows).toBe(0)
    expect(summary.isBalanced).toBe(true)
  })
})
