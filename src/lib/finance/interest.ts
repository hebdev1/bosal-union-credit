/**
 * Calculs d'intérêts pour prêts coopératifs.
 * Fonctions pures — 100 % testables, aucune dépendance externe.
 */

/**
 * Intérêts simples.
 *   I = P × r × t
 * @param principal    Capital emprunté (devise identique à la sortie)
 * @param annualRate   Taux annuel en pourcentage (ex: 12 pour 12 %)
 * @param termMonths   Durée en mois
 */
export function simpleInterest(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal < 0 || annualRate < 0 || termMonths < 0) {
    throw new Error('simpleInterest: valeurs négatives interdites')
  }
  const t = termMonths / 12
  return round2(principal * (annualRate / 100) * t)
}

/**
 * Mensualité d'un prêt amortissable à taux fixe (formule standard).
 *   M = P × i / (1 − (1 + i)^−n)
 * @param principal    Capital emprunté
 * @param annualRate   Taux annuel en pourcentage
 * @param termMonths   Durée en mois
 */
export function monthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (principal <= 0) throw new Error('monthlyPayment: principal doit être > 0')
  if (termMonths <= 0) throw new Error('monthlyPayment: durée doit être > 0')
  if (annualRate < 0) throw new Error('monthlyPayment: taux négatif interdit')

  // Taux zéro → remboursement linéaire
  if (annualRate === 0) return round2(principal / termMonths)

  const i = annualRate / 100 / 12
  const m = (principal * i) / (1 - Math.pow(1 + i, -termMonths))
  return round2(m)
}

export interface AmortizationRow {
  period: number
  payment: number
  principal: number
  interest: number
  balance: number
}

/**
 * Échéancier d'amortissement complet.
 * Le dernier paiement ajuste les arrondis pour que le solde retombe à 0.
 */
export function amortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
): AmortizationRow[] {
  const m = monthlyPayment(principal, annualRate, termMonths)
  const i = annualRate / 100 / 12
  const rows: AmortizationRow[] = []
  let balance = principal

  for (let period = 1; period <= termMonths; period++) {
    const interest = round2(balance * i)
    let principalPart = round2(m - interest)
    let payment = m

    // Dernier paiement : solder tout exactement
    if (period === termMonths) {
      principalPart = round2(balance)
      payment = round2(principalPart + interest)
    }

    balance = round2(balance - principalPart)
    rows.push({ period, payment, principal: principalPart, interest, balance: Math.max(0, balance) })
  }

  return rows
}

/**
 * Pénalité de retard appliquée quotidiennement sur le capital restant dû.
 * @param outstanding   Capital restant dû
 * @param dailyRate     Taux de pénalité journalier en pourcentage (ex: 0.05 = 0,05 %/jour)
 * @param daysLate      Nombre de jours de retard
 */
export function latePenalty(
  outstanding: number,
  dailyRate: number,
  daysLate: number,
): number {
  if (outstanding < 0 || dailyRate < 0 || daysLate < 0) {
    throw new Error('latePenalty: valeurs négatives interdites')
  }
  return round2(outstanding * (dailyRate / 100) * daysLate)
}

/** Arrondi à 2 décimales, stable pour les cents. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
