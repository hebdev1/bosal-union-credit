/**
 * Human-readable references for money movements.
 *
 * Format: `${PREFIX}-${YYYYMMDD}-${6 base36 chars}` — e.g. TX-20261020-K3F9QZ.
 * The random part comes from crypto.getRandomValues (36^6 ≈ 2.2 billion
 * values per prefix and day). The previous generator used 4 digits from
 * Math.random(), which already produced a duplicate reference in production.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const RANDOM_LENGTH = 6

export type ReferencePrefix = 'TX' | 'HIST' | 'OPEN' | 'CLOSE' | 'TK' | 'PRE'

function randomPart(length = RANDOM_LENGTH): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  // 252 = 7 × 36: rejecting bytes ≥ 252 keeps every character equally likely.
  for (let i = 0; i < length; i++) {
    let b = bytes[i]
    while (b >= 252) {
      const retry = new Uint8Array(1)
      crypto.getRandomValues(retry)
      b = retry[0]
    }
    out += ALPHABET[b % 36]
  }
  return out
}

export function makeReference(prefix: ReferencePrefix, now: Date = new Date()): string {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  return `${prefix}-${datePart}-${randomPart()}`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** True when `value` is an RFC 4122 UUID (used to validate client idempotency keys). */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}
