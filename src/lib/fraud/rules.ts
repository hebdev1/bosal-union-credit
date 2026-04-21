/**
 * Moteur de règles anti-fraude — logique pure, sans I/O.
 *
 * Chaque règle prend un contexte (transaction courante + historique) et
 * renvoie zéro ou plusieurs `FraudFlag`. L'appelant (server action) persiste
 * ensuite les flags dans `fraud_flags` et déclenche les notifications.
 *
 * Règles implémentées :
 *   1. velocity  — N transactions en X minutes
 *   2. threshold — transaction au-dessus d'un seuil absolu
 *   3. duplicate — même montant + même bénéficiaire en peu de temps
 *   4. round-amount — montant rond suspect (10_000, 50_000, 100_000)
 *   5. off-hours — opération hors heures ouvrables
 *   6. geo-jump  — IP/agence différente en peu de temps (si fournie)
 */

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical'

export type FraudRuleId =
  | 'velocity'
  | 'threshold'
  | 'duplicate'
  | 'round-amount'
  | 'off-hours'
  | 'geo-jump'

export interface FraudFlag {
  rule: FraudRuleId
  severity: FraudSeverity
  message: string
  details?: Record<string, unknown>
}

export interface TxContext {
  id: string
  memberId: string
  amount: number
  currency: string
  occurredAt: Date
  counterpartyId?: string
  branchId?: string
  ipAddress?: string
}

export interface HistoryEntry {
  id: string
  memberId: string
  amount: number
  occurredAt: Date
  counterpartyId?: string
  branchId?: string
  ipAddress?: string
}

export interface FraudConfig {
  /** Velocity : max N transactions dans windowMinutes */
  velocity?: { maxCount: number; windowMinutes: number }
  /** Threshold absolu (dans la devise de la transaction) */
  threshold?: { amount: number }
  /** Duplicate : même montant+bénéficiaire dans windowMinutes */
  duplicate?: { windowMinutes: number }
  /** Montants ronds à surveiller */
  roundAmounts?: number[]
  /** Heures ouvrables : [startHour, endHour] en heure locale 0-23 */
  officeHours?: { start: number; end: number }
  /** Geo-jump : fenêtre dans laquelle un changement d'agence est suspect */
  geoJump?: { windowMinutes: number }
}

export const DEFAULT_FRAUD_CONFIG: FraudConfig = {
  velocity: { maxCount: 5, windowMinutes: 10 },
  threshold: { amount: 500_000 },
  duplicate: { windowMinutes: 5 },
  roundAmounts: [10_000, 50_000, 100_000, 500_000, 1_000_000],
  officeHours: { start: 7, end: 19 },
  geoJump: { windowMinutes: 60 },
}

/** Évalue toutes les règles actives et renvoie la liste des flags. */
export function evaluateFraud(
  tx: TxContext,
  history: HistoryEntry[],
  config: FraudConfig = DEFAULT_FRAUD_CONFIG,
): FraudFlag[] {
  const flags: FraudFlag[] = []

  // ── Velocity ─────────────────────────────────────────────────
  if (config.velocity) {
    const { maxCount, windowMinutes } = config.velocity
    const windowStart = new Date(tx.occurredAt.getTime() - windowMinutes * 60_000)
    const recent = history.filter(
      (h) => h.memberId === tx.memberId && h.occurredAt >= windowStart && h.occurredAt <= tx.occurredAt,
    )
    if (recent.length + 1 > maxCount) {
      flags.push({
        rule: 'velocity',
        severity: 'high',
        message: `${recent.length + 1} transactions en ${windowMinutes} min (max ${maxCount})`,
        details: { count: recent.length + 1, windowMinutes, maxCount },
      })
    }
  }

  // ── Threshold ────────────────────────────────────────────────
  if (config.threshold && tx.amount >= config.threshold.amount) {
    flags.push({
      rule: 'threshold',
      severity: 'medium',
      message: `Montant ${tx.amount} ≥ seuil ${config.threshold.amount}`,
      details: { amount: tx.amount, threshold: config.threshold.amount },
    })
  }

  // ── Duplicate ────────────────────────────────────────────────
  if (config.duplicate && tx.counterpartyId) {
    const { windowMinutes } = config.duplicate
    const windowStart = new Date(tx.occurredAt.getTime() - windowMinutes * 60_000)
    const dup = history.find(
      (h) =>
        h.memberId === tx.memberId &&
        h.counterpartyId === tx.counterpartyId &&
        Math.abs(h.amount - tx.amount) < 0.01 &&
        h.occurredAt >= windowStart &&
        h.occurredAt <= tx.occurredAt,
    )
    if (dup) {
      flags.push({
        rule: 'duplicate',
        severity: 'high',
        message: `Doublon possible du tx ${dup.id}`,
        details: { previousTxId: dup.id },
      })
    }
  }

  // ── Round amount ─────────────────────────────────────────────
  if (config.roundAmounts && config.roundAmounts.includes(tx.amount)) {
    flags.push({
      rule: 'round-amount',
      severity: 'low',
      message: `Montant rond suspect : ${tx.amount}`,
      details: { amount: tx.amount },
    })
  }

  // ── Off-hours ────────────────────────────────────────────────
  if (config.officeHours) {
    const hour = tx.occurredAt.getHours()
    if (hour < config.officeHours.start || hour >= config.officeHours.end) {
      flags.push({
        rule: 'off-hours',
        severity: 'low',
        message: `Opération hors heures ouvrables (${hour}h)`,
        details: { hour, officeHours: config.officeHours },
      })
    }
  }

  // ── Geo jump ─────────────────────────────────────────────────
  if (config.geoJump && tx.branchId) {
    const { windowMinutes } = config.geoJump
    const windowStart = new Date(tx.occurredAt.getTime() - windowMinutes * 60_000)
    const otherBranch = history.find(
      (h) =>
        h.memberId === tx.memberId &&
        h.branchId &&
        h.branchId !== tx.branchId &&
        h.occurredAt >= windowStart &&
        h.occurredAt <= tx.occurredAt,
    )
    if (otherBranch) {
      flags.push({
        rule: 'geo-jump',
        severity: 'critical',
        message: `Changement d'agence en moins de ${windowMinutes} min`,
        details: { fromBranch: otherBranch.branchId, toBranch: tx.branchId, previousTxId: otherBranch.id },
      })
    }
  }

  return flags
}

/** Renvoie la sévérité la plus haute parmi une liste de flags. */
export function maxSeverity(flags: FraudFlag[]): FraudSeverity | null {
  if (flags.length === 0) return null
  const order: FraudSeverity[] = ['low', 'medium', 'high', 'critical']
  return flags.reduce<FraudSeverity>(
    (acc, f) => (order.indexOf(f.severity) > order.indexOf(acc) ? f.severity : acc),
    'low',
  )
}
