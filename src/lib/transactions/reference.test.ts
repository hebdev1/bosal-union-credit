import { describe, it, expect } from 'vitest'
import { makeReference, isUuid } from './reference'

describe('makeReference', () => {
  it('suit le format PREFIX-YYYYMMDD-XXXXXX', () => {
    const ref = makeReference('TX', new Date('2026-10-20T15:00:00Z'))
    expect(ref).toMatch(/^TX-20261020-[0-9A-Z]{6}$/)
  })

  it('utilise la date UTC du jour fourni', () => {
    expect(makeReference('OPEN', new Date('2026-01-02T00:30:00Z'))).toMatch(/^OPEN-20260102-/)
  })

  it('ne produit pas de doublon sur 20 000 tirages du même jour', () => {
    const day = new Date('2026-10-20T12:00:00Z')
    const seen = new Set<string>()
    for (let i = 0; i < 20_000; i++) seen.add(makeReference('TX', day))
    // 36^6 ≈ 2,2 milliards : une collision ici signalerait un générateur cassé.
    // (L'ancien générateur, 4 chiffres, en produisait dès ~100 tirages.)
    expect(seen.size).toBe(20_000)
  })
})

describe('isUuid', () => {
  it('accepte un UUID v4', () => {
    expect(isUuid(crypto.randomUUID())).toBe(true)
  })

  it('refuse les valeurs non UUID', () => {
    expect(isUuid('')).toBe(false)
    expect(isUuid('abc')).toBe(false)
    expect(isUuid(null)).toBe(false)
    expect(isUuid(42)).toBe(false)
    expect(isUuid("'; drop table transactions; --")).toBe(false)
  })
})
