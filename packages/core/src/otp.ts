/**
 * Generate a cryptographically random N-digit numeric OTP code.
 * Uses crypto.getRandomValues — NOT Math.random().
 *
 * @param length Number of digits (4, 6, or 8). Default: 6.
 */
export function generateOTPCode(length: 6 | 4 | 8 = 6): string {
  const max = Math.pow(10, length);
  // Generate a 4-byte unsigned integer, map to [0, max)
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const code = buffer[0] % max;
  // Pad with leading zeros to ensure exactly `length` digits
  return code.toString().padStart(length, '0');
}

/**
 * Hash an OTP code with SHA-256 for safe database storage.
 * Identical to the hashToken() used for magic links.
 */
export async function hashOTPCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if a === b, without leaking timing information.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
