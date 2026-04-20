/**
 * Bureau de change — calculs purs (HTG · USD · CAD · DOP).
 * Aucune dépendance externe, 100 % testable.
 */

export type Currency = 'HTG' | 'USD' | 'CAD' | 'DOP'

export interface ExchangeRate {
  from: Currency
  to: Currency
  /** Taux d'achat (la caisse achète `from` contre `to`) */
  buy: number
  /** Taux de vente (la caisse vend `from` contre `to`) */
  sell: number
}

export interface ExchangeQuote {
  amountIn: number
  amountOut: number
  rate: number
  margin: number
}

/**
 * Convertit un montant en appliquant le taux approprié.
 * Le client fournit `from` et demande `to`.
 *   - Si la caisse reçoit une devise étrangère contre HTG → taux d'achat
 *   - Si la caisse fournit une devise étrangère contre HTG → taux de vente
 *
 * Par convention, `rate.buy` et `rate.sell` expriment tous deux le
 * prix d'1 unité de `from` exprimé en `to`.
 */
export function quoteExchange(
  amountIn: number,
  direction: 'buy' | 'sell',
  rate: ExchangeRate,
): ExchangeQuote {
  if (amountIn <= 0) throw new Error('quoteExchange: montant doit être > 0')
  if (rate.buy <= 0 || rate.sell <= 0) {
    throw new Error('quoteExchange: taux doivent être > 0')
  }
  if (rate.sell < rate.buy) {
    throw new Error('quoteExchange: taux de vente doit être ≥ taux d\'achat')
  }

  const applied = direction === 'buy' ? rate.buy : rate.sell
  const amountOut = round2(amountIn * applied)
  const margin = round2(Math.abs(rate.sell - rate.buy) * amountIn)

  return { amountIn, amountOut, rate: applied, margin }
}

/**
 * Marge quotidienne totale réalisée par la caisse de change
 * en additionnant la marge de chaque transaction (exprimée en HTG).
 */
export function dailyMargin(quotes: ExchangeQuote[]): number {
  return round2(quotes.reduce((sum, q) => sum + q.margin, 0))
}

/**
 * Spread d'un couple de taux, en pourcentage.
 *   spread = (sell − buy) / buy × 100
 */
export function rateSpread(rate: ExchangeRate): number {
  if (rate.buy <= 0) throw new Error('rateSpread: taux d\'achat doit être > 0')
  return round4(((rate.sell - rate.buy) / rate.buy) * 100)
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000
}
