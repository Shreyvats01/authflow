import { ENCODER, bytesToHex } from './password';

export const HMAC_KEY_CACHE = new Map<string, CryptoKey>();

export async function getHmacKey(secret: string, usage: KeyUsage): Promise<CryptoKey> {
  const cacheKey = `${secret}:${usage}`;
  let key = HMAC_KEY_CACHE.get(cacheKey);
  if (!key) {
    key = await crypto.subtle.importKey(
      'raw',
      ENCODER.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      [usage]
    );
    HMAC_KEY_CACHE.set(cacheKey, key);
  }
  return key;
}

export async function hashToken(token: string): Promise<string> {
  const data = ENCODER.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

export async function signJwt(payload: any, secret: string, expiresIn?: number): Promise<string> {
  const key = await getHmacKey(secret, 'sign');

  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Header = btoa(JSON.stringify(header));
  const fullPayload = expiresIn
    ? { ...payload, exp: Math.floor(Date.now() / 1000) + expiresIn }
    : payload;
  const base64Payload = btoa(JSON.stringify(fullPayload));

  const data = `${base64Header}.${base64Payload}`;
  const signature = await crypto.subtle.sign('HMAC', key, ENCODER.encode(data));

  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${data}.${base64Signature}`.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyJwt(token: string, secret: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error('Invalid token format');
  }
  const [base64Header, base64Payload, base64Signature] = parts;

  const key = await getHmacKey(secret, 'verify');

  const data = `${base64Header}.${base64Payload}`;

  let sig = base64Signature.replace(/-/g, '+').replace(/_/g, '/');
  while (sig.length % 4) {
    sig += '=';
  }
  const binarySig = atob(sig);
  const sigArray = new Uint8Array(binarySig.length);
  for (let i = 0; i < binarySig.length; i++) {
    sigArray[i] = binarySig.charCodeAt(i);
  }

  const isValid = await crypto.subtle.verify('HMAC', key, sigArray, ENCODER.encode(data));

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  const payloadStr = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadStr);

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}
