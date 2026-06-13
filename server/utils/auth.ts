/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'multi_vendor_ecommerce_secret_key_2026';

/**
 * Creates an HMAC-SHA256 signature for a string
 */
function sign(input: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(input).digest('base64url');
}

/**
 * Generates a standard JWT token representation
 */
export function generateToken(payload: Record<string, any>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  
  const tokenString = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(tokenString, JWT_SECRET);
  
  return `${tokenString}.${signature}`;
}

/**
 * Verifies and decodes a custom JWT token
 */
export function verifyToken(token: string): Record<string, any> | null {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const tokenString = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = sign(tokenString, JWT_SECRET);
    
    if (signature !== expectedSignature) {
      return null; // Signature verification failed
    }
    
    const decodedPayloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    return JSON.parse(decodedPayloadStr);
  } catch (err) {
    return null;
  }
}

/**
 * Hashes a password using SHA256 with a static salt
 */
export function hashPassword(password: string): string {
  const salt = 'marketplace_salt_2026';
  return crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

/**
 * Compares plain text password with hashed value
 */
export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
