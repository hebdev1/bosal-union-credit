import { describe, it, expect } from 'vitest'
import { safeInternalPath } from './redirect'

describe('safeInternalPath', () => {
  it('garde les chemins internes', () => {
    expect(safeInternalPath('/tableau-de-bord/comptes')).toBe('/tableau-de-bord/comptes')
    expect(safeInternalPath('/tableau-de-bord?x=1#y')).toBe('/tableau-de-bord?x=1#y')
  })

  it('retombe sur le tableau de bord sans valeur', () => {
    expect(safeInternalPath(null)).toBe('/tableau-de-bord')
    expect(safeInternalPath('')).toBe('/tableau-de-bord')
  })

  it('refuse les redirections vers un autre site', () => {
    expect(safeInternalPath('https://evil.example')).toBe('/tableau-de-bord')
    expect(safeInternalPath('//evil.example')).toBe('/tableau-de-bord')
    expect(safeInternalPath('/\\evil.example')).toBe('/tableau-de-bord')
    expect(safeInternalPath('/\t/evil.example')).toBe('/tableau-de-bord')
    expect(safeInternalPath('javascript:alert(1)')).toBe('/tableau-de-bord')
  })
})
