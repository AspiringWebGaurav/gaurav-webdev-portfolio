/**
 * Encryption/Decryption utilities for secure dev login
 * High-priority secure implementation for development authentication
 */

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_DEV_AUTH_KEY || "dev-auth-secure-key-2024-gp";

/**
 * Encrypt data using simple XOR + Base64 (sufficient for localhost)
 */
export async function encryptDevAuth(data: string): Promise<string> {
  try {
    const key = ENCRYPTION_KEY;
    
    if (typeof window !== 'undefined') {
      // Browser: Use TextEncoder for proper byte handling
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);
      const keyBytes = encoder.encode(key);
      
      // XOR encryption
      const encrypted = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      
      // Convert to base64 properly
      let binary = '';
      encrypted.forEach(byte => binary += String.fromCharCode(byte));
      return btoa(binary);
    } else {
      // Node.js
      const dataBytes = Buffer.from(data, 'utf8');
      const keyBytes = Buffer.from(key, 'utf8');
      
      const encrypted = Buffer.alloc(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      
      return encrypted.toString('base64');
    }
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Server-only: Decrypt incoming encrypted payload
 */
export async function serverDecryptDevAuth(encryptedData: string): Promise<string> {
  try {
    const key = ENCRYPTION_KEY;
    
    // Base64 decode
    const encryptedBytes = Buffer.from(encryptedData, 'base64');
    const keyBytes = Buffer.from(key, 'utf8');
    
    // XOR decrypt
    const decrypted = Buffer.alloc(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Server decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Generate a secure timestamp-based challenge
 */
export function generateDevAuthChallenge(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${timestamp}:${random}`;
}

/**
 * Validate timestamp challenge (within 5 minutes)
 */
export function validateDevAuthChallenge(challenge: string): boolean {
  try {
    const [timestampStr] = challenge.split(':');
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (now - timestamp) < fiveMinutes;
  } catch {
    return false;
  }
}
