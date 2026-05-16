#!/usr/bin/env node
/**
 * Generate secure secrets for AutoReview AI
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('='.repeat(60));
console.log('🔐 AutoReview AI - Secret Generator');
console.log('='.repeat(60));
console.log('');
console.log('Add these to your .env.local file:');
console.log('');
console.log(`ENCRYPTION_KEY=${generateSecret(32)}`);
console.log(`SCHEDULER_SECRET=${generateSecret(32)}`);
console.log(`ADMIN_KEY=${generateSecret(16)}`);
console.log(`CLERK_WEBHOOK_SECRET=whsec_${generateSecret(24)}`);
console.log('');
console.log('⚠️  NEVER commit these to git!');
console.log('⚠️  Each value is randomly generated - run again for new secrets.');
console.log('='.repeat(60));
