import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptSensitiveData, decryptSensitiveData, hashValue, verifyHash } from '../encryption';
import { SanitizationService } from '../sanitization';
import { validateRedirect, generateOAuthState, validateOAuthState } from '../oauthSecurity';

describe('Encryption', () => {
  const testKey = 'a'.repeat(64); // 32 bytes hex
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  it('should encrypt and decrypt data correctly', () => {
    const plaintext = 'sensitive-data-123';
    const encrypted = encryptSensitiveData(plaintext);
    const decrypted = decryptSensitiveData(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(':'); // Format: iv:authTag:data
  });

  it('should produce different ciphertext for same plaintext', () => {
    const plaintext = 'test-data';
    const encrypted1 = encryptSensitiveData(plaintext);
    const encrypted2 = encryptSensitiveData(plaintext);

    expect(encrypted1).not.toBe(encrypted2); // Different IV each time
  });

  it('should hash and verify values correctly', () => {
    const value = 'secret-value';
    const hash = hashValue(value);

    expect(verifyHash(value, hash)).toBe(true);
    expect(verifyHash('wrong-value', hash)).toBe(false);
  });

  it('should throw if encryption key is invalid length', () => {
    process.env.ENCRYPTION_KEY = 'short-key';
    expect(() => encryptSensitiveData('test')).toThrow();
  });
});

describe('Sanitization', () => {
  it('should strip HTML tags from input', () => {
    const input = '<script>alert("xss")</script>Hello World';
    const result = SanitizationService.sanitizeInput(input);

    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello World');
  });

  it('should remove javascript: protocol', () => {
    const input = 'javascript:alert("xss")';
    const result = SanitizationService.sanitizeInput(input);

    expect(result).not.toContain('javascript:');
  });

  it('should limit input length', () => {
    const input = 'a'.repeat(10000);
    const result = SanitizationService.sanitizeInput(input, { maxLength: 5000 });

    expect(result.length).toBe(5000);
  });

  it('should validate UUID format', () => {
    expect(SanitizationService.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(SanitizationService.isValidUUID('not-a-uuid')).toBe(false);
    expect(SanitizationService.isValidUUID('')).toBe(false);
  });

  it('should validate rating range', () => {
    expect(SanitizationService.isValidRating(1)).toBe(true);
    expect(SanitizationService.isValidRating(5)).toBe(true);
    expect(SanitizationService.isValidRating(3)).toBe(true);
    expect(SanitizationService.isValidRating(0)).toBe(false);
    expect(SanitizationService.isValidRating(6)).toBe(false);
    expect(SanitizationService.isValidRating(2.5)).toBe(false);
  });

  it('should validate platform names', () => {
    expect(SanitizationService.isValidPlatform('google')).toBe(true);
    expect(SanitizationService.isValidPlatform('facebook')).toBe(true);
    expect(SanitizationService.isValidPlatform('invalid')).toBe(false);
  });

  it('should sanitize review data comprehensively', () => {
    const result = SanitizationService.validateReviewData({
      reviewText: '<b>Great service!</b>',
      rating: 5,
      authorName: 'John Doe',
      platform: 'google',
      reviewId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect((result.sanitizedData.reviewText as string)).not.toContain('<b>');
  });
});

describe('OAuth Security', () => {
  it('should validate allowed redirect URLs', () => {
    expect(validateRedirect('/dashboard')).toBe('/dashboard');
    expect(validateRedirect('/reviews')).toBe('/reviews');
    expect(validateRedirect('/settings')).toBe('/settings');
  });

  it('should block non-whitelisted redirects', () => {
    expect(validateRedirect('/admin')).toBe('/dashboard'); // Default fallback
    expect(validateRedirect('https://evil.com')).toBe('/dashboard');
    expect(validateRedirect('//evil.com')).toBe('/dashboard');
  });

  it('should block dangerous URI schemes', () => {
    expect(validateRedirect('javascript:alert(1)')).toBe('/dashboard');
    expect(validateRedirect('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
    expect(validateRedirect('vbscript:msgbox(1)')).toBe('/dashboard');
  });

  it('should generate unique OAuth state', () => {
    const state1 = generateOAuthState();
    const state2 = generateOAuthState();

    expect(state1).not.toBe(state2);
    expect(state1.length).toBeGreaterThan(0);
  });

  it('should validate OAuth state correctly', () => {
    const state = generateOAuthState();

    expect(validateOAuthState(state, state)).toBe(true);
    expect(validateOAuthState(state, 'different')).toBe(false);
    expect(validateOAuthState(null, state)).toBe(false);
    expect(validateOAuthState(state, null)).toBe(false);
  });
});
