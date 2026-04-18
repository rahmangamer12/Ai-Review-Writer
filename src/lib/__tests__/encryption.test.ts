import { describe, it, expect } from 'vitest'
import { encryptSensitiveData, decryptSensitiveData, hashValue, verifyHash } from '../encryption'

describe('Encryption Utilities', () => {
  const secretData = 'my-super-secret-api-key'

  it('should encrypt and decrypt data correctly', () => {
    const encrypted = encryptSensitiveData(secretData)
    expect(encrypted).toContain(':')
    expect(encrypted.split(':')).toHaveLength(3)

    const decrypted = decryptSensitiveData(encrypted)
    expect(decrypted).toBe(secretData)
  })

  it('should generate different IVs for same data', () => {
    const enc1 = encryptSensitiveData(secretData)
    const enc2 = encryptSensitiveData(secretData)
    expect(enc1).not.toBe(enc2)
  })

  it('should correctly hash and verify values', () => {
    const value = 'password123'
    const hash = hashValue(value)
    expect(verifyHash(value, hash)).toBe(true)
    expect(verifyHash('wrongpassword', hash)).toBe(false)
  })

  it('should throw error for invalid encrypted format', () => {
    expect(() => decryptSensitiveData('invalid-format')).toThrow('Invalid encrypted data format')
  })
})
