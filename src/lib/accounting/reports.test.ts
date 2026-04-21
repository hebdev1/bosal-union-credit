import { describe, it, expect } from 'vitest'
import {
  agedLoanBalance,
  par30,
  balanceSheet,
  incomeStatement,
  keyRatios,
  type LoanSnapshot,
} from './reports'

function loan(dpd: number, principal = 1000, status: LoanSnapshot['status'] = 'active'): LoanSnapshot {
  return { id: `L${dpd}`, outstandingPrincipal: principal, nextDueDate: null, daysPastDue: dpd, status }
}

describe('agedLoanBalance', () => {
  it('classe les prêts dans les bons buckets', () => {
    const bal = agedLoanBalance([
      loan(0, 1000),
      loan(15, 500),
      loan(45, 300),
      loan(75, 200),
      loan(120, 100),
    ])
    expect(bal).toEqual({
      current: 1000,
      bucket_1_30: 500,
      bucket_31_60: 300,
      bucket_61_90: 200,
      bucket_90_plus: 100,
      total: 2100,
    })
  })

  it('ignore les prêts soldés et passés en perte', () => {
    const bal = agedLoanBalance([
      loan(0, 1000),
      loan(0, 500, 'paid_off'),
      loan(120, 200, 'written_off'),
    ])
    expect(bal.total).toBe(1000)
  })

  it('liste vide → tout à zéro', () => {
    expect(agedLoanBalance([])).toEqual({
      current: 0, bucket_1_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0, total: 0,
    })
  })
})

describe('par30', () => {
  it('calcule le % en retard > 30j', () => {
    const ratio = par30([loan(0, 700), loan(45, 200), loan(120, 100)])
    expect(ratio).toBeCloseTo(0.3, 5)
  })

  it('0 si pas de portefeuille', () => {
    expect(par30([])).toBe(0)
  })
})

describe('balanceSheet', () => {
  it('équilibré quand actif = passif + capitaux', () => {
    const bs = balanceSheet({
      cashOnHand: 1000, bankAccounts: 5000, loansOutstanding: 10_000,
      memberDeposits: 12_000, externalBorrowings: 1000,
      paidInCapital: 2000, retainedEarnings: 1000,
    })
    expect(bs.balanced).toBe(true)
    expect(bs.assets.total).toBe(16_000)
    expect(bs.liabilities.total + bs.equity.total).toBe(16_000)
  })

  it('détecte un déséquilibre', () => {
    const bs = balanceSheet({
      cashOnHand: 100, bankAccounts: 0, loansOutstanding: 0,
      memberDeposits: 0, paidInCapital: 0, retainedEarnings: 0,
    })
    expect(bs.balanced).toBe(false)
    expect(bs.variance).toBe(100)
  })
})

describe('incomeStatement', () => {
  it('calcule le résultat net', () => {
    const s = incomeStatement({
      interestIncome: 10_000, feeIncome: 2000, exchangeIncome: 500,
      interestExpense: 1000,
      salaries: 3000, rent: 500, operatingExpenses: 1000,
      loanLossProvision: 800, taxes: 500,
    })
    expect(s.revenue).toBe(11_500) // 10000+2000+500-1000
    expect(s.operatingExpenses).toBe(4500)
    expect(s.operatingIncome).toBe(7000)
    expect(s.netIncome).toBe(5700) // 7000-800-500
  })
})

describe('keyRatios', () => {
  it('calcule LDR, ROA, ROE, CAR', () => {
    const r = keyRatios({
      loansOutstanding: 10_000, deposits: 20_000,
      totalAssets: 25_000, equity: 5000, netIncome: 1000, par30: 0.05,
    })
    expect(r.ldr).toBe(0.5)
    expect(r.roa).toBe(0.04)
    expect(r.roe).toBe(0.2)
    expect(r.car).toBe(0.2)
    expect(r.par30).toBe(0.05)
  })

  it('évite la division par zéro', () => {
    const r = keyRatios({
      loansOutstanding: 0, deposits: 0, totalAssets: 0, equity: 0, netIncome: 0, par30: 0,
    })
    expect(r.ldr).toBe(0)
    expect(r.roa).toBe(0)
    expect(r.roe).toBe(0)
    expect(r.car).toBe(0)
  })
})
