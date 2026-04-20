import { describe, it, expect } from 'vitest'
import {
  simpleInterest,
  monthlyPayment,
  amortizationSchedule,
  latePenalty,
} from './interest'

describe('simpleInterest', () => {
  it('calcule I = P × r × t', () => {
    expect(simpleInterest(10_000, 12, 12)).toBe(1200)
  })

  it('retourne 0 si durée nulle', () => {
    expect(simpleInterest(10_000, 12, 0)).toBe(0)
  })

  it('gère une durée fractionnaire (6 mois)', () => {
    expect(simpleInterest(10_000, 12, 6)).toBe(600)
  })

  it('rejette les valeurs négatives', () => {
    expect(() => simpleInterest(-100, 10, 12)).toThrow()
    expect(() => simpleInterest(100, -10, 12)).toThrow()
    expect(() => simpleInterest(100, 10, -1)).toThrow()
  })
})

describe('monthlyPayment', () => {
  it('calcule la mensualité standard (100k @ 12 % sur 12 mois)', () => {
    const m = monthlyPayment(100_000, 12, 12)
    // Formule vérifiable : ≈ 8884.88
    expect(m).toBeCloseTo(8884.88, 2)
  })

  it('répartit linéairement si taux = 0', () => {
    expect(monthlyPayment(12_000, 0, 12)).toBe(1000)
  })

  it('rejette principal ≤ 0 ou durée ≤ 0', () => {
    expect(() => monthlyPayment(0, 10, 12)).toThrow()
    expect(() => monthlyPayment(100, 10, 0)).toThrow()
    expect(() => monthlyPayment(100, -1, 12)).toThrow()
  })
})

describe('amortizationSchedule', () => {
  it('produit exactement n lignes', () => {
    expect(amortizationSchedule(10_000, 10, 24)).toHaveLength(24)
  })

  it('solde le capital à la dernière ligne (zéro exact)', () => {
    const rows = amortizationSchedule(50_000, 8, 36)
    expect(rows[rows.length - 1].balance).toBe(0)
  })

  it('somme des principaux = capital emprunté', () => {
    const rows = amortizationSchedule(25_000, 15, 18)
    const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0)
    expect(Math.round(totalPrincipal)).toBe(25_000)
  })

  it('chaque ligne a intérêt + principal ≈ mensualité (sauf dernière)', () => {
    const rows = amortizationSchedule(10_000, 12, 6)
    for (let i = 0; i < rows.length - 1; i++) {
      const sum = rows[i].principal + rows[i].interest
      expect(Math.abs(sum - rows[i].payment)).toBeLessThan(0.02)
    }
  })

  it('gère taux zéro (principal constant par période)', () => {
    const rows = amortizationSchedule(12_000, 0, 12)
    for (const r of rows) {
      expect(r.interest).toBe(0)
      expect(r.principal).toBe(1000)
    }
  })
})

describe('latePenalty', () => {
  it('applique P × (daily% /100) × days', () => {
    // 10 000 × 0.05 % × 10 jours = 50
    expect(latePenalty(10_000, 0.05, 10)).toBe(50)
  })

  it('0 jours → 0 pénalité', () => {
    expect(latePenalty(10_000, 0.05, 0)).toBe(0)
  })

  it('rejette valeurs négatives', () => {
    expect(() => latePenalty(-1, 0.05, 10)).toThrow()
    expect(() => latePenalty(1000, -0.05, 10)).toThrow()
    expect(() => latePenalty(1000, 0.05, -1)).toThrow()
  })
})
