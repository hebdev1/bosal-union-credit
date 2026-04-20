/**
 * Clôture de caisse — calculs purs.
 * Aucune dépendance externe, 100 % testable.
 */

export interface CashMovement {
  type: 'in' | 'out'
  amount: number
}

export interface CashClosureSummary {
  opening: number
  inflows: number
  outflows: number
  expected: number
  counted: number
  variance: number
  isBalanced: boolean
}

/**
 * Résume une journée de caisse à partir du fond d'ouverture,
 * des mouvements enregistrés, et du décompte physique final.
 *
 *   expected = opening + inflows − outflows
 *   variance = counted − expected
 *
 * Tolérance d'équilibre : 0,01 unité monétaire (arrondi cent).
 */
export function closeCashDay(
  opening: number,
  movements: CashMovement[],
  counted: number,
): CashClosureSummary {
  if (opening < 0) throw new Error('closeCashDay: ouverture négative interdite')
  if (counted < 0) throw new Error('closeCashDay: décompte négatif interdit')

  let inflows = 0
  let outflows = 0
  for (const m of movements) {
    if (m.amount < 0) throw new Error('closeCashDay: mouvement négatif interdit')
    if (m.type === 'in') inflows += m.amount
    else outflows += m.amount
  }

  const expected = round2(opening + inflows - outflows)
  const variance = round2(counted - expected)
  const isBalanced = Math.abs(variance) < 0.01

  return {
    opening: round2(opening),
    inflows: round2(inflows),
    outflows: round2(outflows),
    expected,
    counted: round2(counted),
    variance,
    isBalanced,
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
