import { describe, it, expect } from 'vitest'
import { getAllPersonas, getPersona, desiPersonas } from '../desiPersonas'

describe('Desi Personas Utilities', () => {
  it('should return all personas', () => {
    const personas = getAllPersonas()
    expect(personas).toHaveLength(desiPersonas.length)
    expect(personas[0]).toHaveProperty('id')
    expect(personas[0]).toHaveProperty('name')
  })

  it('should find a persona by id', () => {
    const professional = getPersona('professional')
    expect(professional).toBeDefined()
    expect(professional?.name).toBe('Professional')
    
    const nonExistent = getPersona('non-existent')
    expect(nonExistent).toBeUndefined()
  })

  it('should have valid example responses for all personas', () => {
    desiPersonas.forEach(persona => {
      expect(persona.examples.positive.length).toBeGreaterThan(10)
      expect(persona.examples.negative.length).toBeGreaterThan(10)
    })
  })
})
