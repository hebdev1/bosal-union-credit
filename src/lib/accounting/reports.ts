/**
 * Moteur de rapports comptables — fonctions pures.
 *
 * Ne fait aucun I/O : prend des lignes de données brutes et produit un
 * rapport structuré. Les server actions branchent Supabase en amont et
 * appellent ces fonctions avec les enregistrements.
 *
 * Rapports :
 *   - balance âgée (loans) : 0-30 / 31-60 / 61-90 / 90+
 *   - ratio PAR (Portfolio At Risk) = prêts en retard > 30j / portefeuille total
 *   - bilan simplifié (actif / passif / capitaux)
 *   - compte de résultat (revenus / charges / résultat net)
 *   - ratios clés (PAR30, LDR, ROA, ROE, CAR)
 */

export interface LoanSnapshot {
  id: string
  outstandingPrincipal: number
  nextDueDate: Date | null
  daysPastDue: number
  status: 'active' | 'late' | 'defaulted' | 'paid_off' | 'written_off'
}

export interface AgedBalance {
  current: number // 0 j (pas en retard)
  bucket_1_30: number
  bucket_31_60: number
  bucket_61_90: number
  bucket_90_plus: number
  total: number
}

export function agedLoanBalance(loans: LoanSnapshot[]): AgedBalance {
  const out: AgedBalance = {
    current: 0,
    bucket_1_30: 0,
    bucket_31_60: 0,
    bucket_61_90: 0,
    bucket_90_plus: 0,
    total: 0,
  }
  for (const l of loans) {
    if (l.status === 'paid_off' || l.status === 'written_off') continue
    out.total += l.outstandingPrincipal
    const dpd = l.daysPastDue
    if (dpd <= 0) out.current += l.outstandingPrincipal
    else if (dpd <= 30) out.bucket_1_30 += l.outstandingPrincipal
    else if (dpd <= 60) out.bucket_31_60 += l.outstandingPrincipal
    else if (dpd <= 90) out.bucket_61_90 += l.outstandingPrincipal
    else out.bucket_90_plus += l.outstandingPrincipal
  }
  return out
}

/** PAR30 : % du portefeuille avec > 30 jours de retard. */
export function par30(loans: LoanSnapshot[]): number {
  const bal = agedLoanBalance(loans)
  if (bal.total === 0) return 0
  const atRisk = bal.bucket_31_60 + bal.bucket_61_90 + bal.bucket_90_plus
  return atRisk / bal.total
}

/* ───────── Bilan simplifié ───────── */

export interface BalanceSheetInput {
  cashOnHand: number
  bankAccounts: number
  loansOutstanding: number
  otherAssets?: number
  memberDeposits: number
  externalBorrowings?: number
  otherLiabilities?: number
  paidInCapital: number
  retainedEarnings: number
}

export interface BalanceSheet {
  assets: { cash: number; bank: number; loans: number; other: number; total: number }
  liabilities: { deposits: number; borrowings: number; other: number; total: number }
  equity: { capital: number; retained: number; total: number }
  balanced: boolean
  variance: number
}

export function balanceSheet(i: BalanceSheetInput): BalanceSheet {
  const assetsTotal = i.cashOnHand + i.bankAccounts + i.loansOutstanding + (i.otherAssets ?? 0)
  const liabilitiesTotal = i.memberDeposits + (i.externalBorrowings ?? 0) + (i.otherLiabilities ?? 0)
  const equityTotal = i.paidInCapital + i.retainedEarnings
  const variance = assetsTotal - (liabilitiesTotal + equityTotal)
  return {
    assets: {
      cash: i.cashOnHand,
      bank: i.bankAccounts,
      loans: i.loansOutstanding,
      other: i.otherAssets ?? 0,
      total: assetsTotal,
    },
    liabilities: {
      deposits: i.memberDeposits,
      borrowings: i.externalBorrowings ?? 0,
      other: i.otherLiabilities ?? 0,
      total: liabilitiesTotal,
    },
    equity: {
      capital: i.paidInCapital,
      retained: i.retainedEarnings,
      total: equityTotal,
    },
    balanced: Math.abs(variance) < 0.01,
    variance,
  }
}

/* ───────── Compte de résultat ───────── */

export interface IncomeStatementInput {
  interestIncome: number
  feeIncome: number
  exchangeIncome?: number
  otherIncome?: number
  interestExpense?: number
  salaries: number
  rent?: number
  operatingExpenses: number
  loanLossProvision?: number
  taxes?: number
}

export interface IncomeStatement {
  revenue: number
  operatingExpenses: number
  provisions: number
  operatingIncome: number
  netIncome: number
}

export function incomeStatement(i: IncomeStatementInput): IncomeStatement {
  const revenue =
    i.interestIncome + i.feeIncome + (i.exchangeIncome ?? 0) + (i.otherIncome ?? 0) - (i.interestExpense ?? 0)
  const operatingExpenses = i.salaries + (i.rent ?? 0) + i.operatingExpenses
  const provisions = i.loanLossProvision ?? 0
  const operatingIncome = revenue - operatingExpenses
  const netIncome = operatingIncome - provisions - (i.taxes ?? 0)
  return { revenue, operatingExpenses, provisions, operatingIncome, netIncome }
}

/* ───────── Ratios clés ───────── */

export interface KeyRatiosInput {
  loansOutstanding: number
  deposits: number
  totalAssets: number
  equity: number
  netIncome: number
  par30: number
}

export interface KeyRatios {
  /** Loan-to-Deposit Ratio */
  ldr: number
  /** Return On Assets */
  roa: number
  /** Return On Equity */
  roe: number
  /** Capital Adequacy Ratio (simplifié : equity / assets) */
  car: number
  par30: number
}

export function keyRatios(i: KeyRatiosInput): KeyRatios {
  return {
    ldr: i.deposits > 0 ? i.loansOutstanding / i.deposits : 0,
    roa: i.totalAssets > 0 ? i.netIncome / i.totalAssets : 0,
    roe: i.equity > 0 ? i.netIncome / i.equity : 0,
    car: i.totalAssets > 0 ? i.equity / i.totalAssets : 0,
    par30: i.par30,
  }
}
