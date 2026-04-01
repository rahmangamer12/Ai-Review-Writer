/**
 * Secure encryption/decryption utilities
 * Uses Node.js crypto module for production security
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY_ENV = 'ENCRYPTION_KEY' // Must be 32 bytes (256 bits)

/**
 * Get or create encryption key from environment
 * In production, this should be loaded from a secure vault
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY
  
  if (!keyEnv) {
    console.warn(
      '[SECURITY WARNING] ENCRYPTION_KEY not set in environment. ' +
      'Using fallback key. In production, set ENCRYPTION_KEY to a 64-character hex string (32 bytes).'
    )
    // Fallback: generate a consistent key from a default (NOT for production)
    return crypto.createHash('sha256').update('default-fallback-key-change-in-production').digest()
  }

  // Key should be 64 hex characters (32 bytes when decoded)
  if (keyEnv.length !== 64) {
    throw new Error(
      `ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got ${keyEnv.length} characters. ` +
      `Generate with: openssl rand -hex 32`
    )
  }

  return Buffer.from(keyEnv, 'hex')
}

/**
 * Encrypt sensitive data
 * Returns: iv:authTag:encryptedData (all hex-encoded)
 */
export function encryptSensitiveData(plaintext: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('[Encryption Error]', error)
    throw new Error(`Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt sensitive data
 * Input format: iv:authTag:encryptedData (hex-encoded)
 */
export function decryptSensitiveData(encrypted: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encrypted.split(':')

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected: iv:authTag:encryptedData')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encryptedData = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('[Decryption Error]', error)
    throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Hash a value (one-way, for validation)
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Verify a hashed value
 */
export function verifyHash(value: string, hash: string): boolean {
  return hashValue(value) === hash
}
