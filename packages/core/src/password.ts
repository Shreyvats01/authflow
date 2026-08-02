export const ENCODER = new TextEncoder();

const HEX_LUT = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += HEX_LUT[bytes[i]];
  }
  return hex;
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
export function timingSafeEqual(a: string, b: string): boolean;
export function timingSafeEqual(a: Uint8Array | string, b: Uint8Array | string): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    if (a.length !== b.length) return false;
    let c = 0;
    for (let i = 0; i < a.length; i++) {
      c |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return c === 0;
  }
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    if (a.length !== b.length) return false;
    let c = 0;
    for (let i = 0; i < a.length; i++) {
      c |= a[i] ^ b[i];
    }
    return c === 0;
  }
  return false;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    bytes[i] = byte;
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = bytesToHex(new Uint8Array(hash));
  const saltHex = bytesToHex(salt);

  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;

  const salt = hexToBytes(saltHex);
  const targetHash = hexToBytes(hashHex);
  if (!salt || !targetHash) return false;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return timingSafeEqual(new Uint8Array(hash), targetHash);
}
