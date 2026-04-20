import { describe, it, expect } from 'vitest'
import {
  quoteExchange,
  dailyMargin,
  rateSpread,
  type ExchangeRate,
} from './exchange'

const USD_HTG: ExchangeRate = {
  from: 'USD',
  to: 'HTG',
  buy: 130, // 1 USD acheté par la caisse = 130 HTG payés
  sell: 135, // 1 USD vendu par la caisse = 135 HTG encaissés
}

describe('quoteExchange', () => {
  it('applique buy quand la caisse achète', () => {
    const q = quoteExchange(100, 'buy', USD_HTG)
    expect(q.rate).toBe(130)
    expect(q.amountOut).toBe(13_000)
  })

  it('applique sell quand la caisse vend', () => {
    const q = quoteExchange(100, 'sell', USD_HTG)
    expect(q.rate).toBe(135)
    expect(q.amountOut).toBe(13_500)
  })

  it('calcule la marge = |sell − buy| × amountIn', () => {
    const q = quoteExchange(100, 'sell', USD_HTG)
    expect(q.margin).toBe(500) // (135 − 130) × 100
  })

  it('rejette les montants ≤ 0', () => {
    expect(() => quoteExchange(0, 'buy', USD_HTG)).toThrow()
    expect(() => quoteExchange(-1, 'buy', USD_HTG)).toThrow()
  })

  it('rejette les taux invalides', () => {
    expect(() =>
      quoteExchange(100, 'buy', { ...USD_HTG, buy: 0 }),
    ).toThrow()
    expect(() =>
      quoteExchange(100, 'buy', { ...USD_HTG, sell: 120 }),
    ).toThrow()
  })
})

describe('dailyMargin', () => {
  it('somme les marges', () => {
    const qs = [
      quoteExchange(100, 'sell', USD_HTG),
      quoteExchange(200, 'buy', USD_HTG),
      quoteExchange(50, 'sell', USD_HTG),
    ]
    // 500 + 1000 + 250
    expect(dailyMargin(qs)).toBe(1750)
  })

  it('retourne 0 si aucune transaction', () => {
    expect(dailyMargin([])).toBe(0)
  })
})

describe('rateSpread', () => {
  it('calcule (sell − buy) / buy × 100', () => {
    // (135 − 130) / 130 × 100 ≈ 3.8462 %
    expect(rateSpread(USD_HTG)).toBeCloseTo(3.8462, 3)
  })

  it('spread = 0 si buy = sell', () => {
    expect(rateSpread({ ...USD_HTG, buy: 130, sell: 130 })).toBe(0)
  })
})
