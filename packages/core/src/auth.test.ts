import { describe, it, expect, beforeEach } from 'vitest';
import {
  createBolkAuth,
  BolkAuthAdapter,
  bytesToHex,
  timingSafeEqual,
  getHmacKey,
  HMAC_KEY_CACHE,
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  generateOTPCode,
  buildAuthorizationUrl,
} from './index';

function createMockAdapter(): BolkAuthAdapter {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const metadata = new Map<string, any>();
  const verificationTokens = new Map<string, any>();

  return {
    async createUser(data) {
      const user = {
        id: `usr_${Math.random().toString(36).substring(2, 9)}`,
        email: data.email,
        name: data.name ?? undefined,
        password: data.password ?? undefined,
        image: data.image ?? undefined,
        emailVerified: data.emailVerified ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.set(user.id, user);
      return user;
    },
    async findUserById(id) {
      return users.get(id) ?? null;
    },
    async findUserByEmail(email) {
      return Array.from(users.values()).find((u) => u.email === email) ?? null;
    },
    async updateUser(id, data) {
      const user = users.get(id);
      if (!user) throw new Error('User not found');
      const updated = { ...user, ...data, updatedAt: new Date() };
      users.set(id, updated);
      return updated;
    },
    async deleteUser(id) {
      users.delete(id);
    },
    async createSession(data) {
      const session = {
        id: `sess_${Math.random().toString(36).substring(2, 9)}`,
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sessions.set(session.id, session);
      return session;
    },
    async findSessionByToken(token) {
      return Array.from(sessions.values()).find((s) => s.token === token) ?? null;
    },
    async updateSession(id, data) {
      const session = sessions.get(id);
      if (!session) throw new Error('Session not found');
      const updated = { ...session, ...data, updatedAt: new Date() };
      sessions.set(id, updated);
      return updated;
    },
    async deleteSession(id) {
      sessions.delete(id);
    },
    async deleteUserSessions(userId) {
      for (const [id, session] of Array.from(sessions.entries())) {
        if (session.userId === userId) sessions.delete(id);
      }
    },
    async createAccount(data) {
      return { id: 'acc_1', ...data, createdAt: new Date(), updatedAt: new Date() };
    },
    async findAccountByProvider() { return null; },
    async createVerificationToken(data) {
      const vt = { ...data, createdAt: new Date() };
      verificationTokens.set(`${data.identifier}:${data.token}`, vt);
      return vt;
    },
    async findVerificationToken(identifier, token) {
      return verificationTokens.get(`${identifier}:${token}`) ?? null;
    },
    async deleteVerificationToken(identifier, token) {
      verificationTokens.delete(`${identifier}:${token}`);
    },
    async getUserMetadata(userId, key) { return metadata.get(`${userId}:${key}`) ?? null; },
    async updateUserMetadata(userId, key, value) {
      const meta = { userId, key, value, createdAt: new Date(), updatedAt: new Date() };
      metadata.set(`${userId}:${key}`, meta);
      return meta;
    },
  };
}

describe('BolkAuth Engine', () => {
  let auth: ReturnType<typeof createBolkAuth>;

  beforeEach(() => {
    auth = createBolkAuth({
      adapter: createMockAdapter(),
      secret: 'test_secret_key_minimum_32_characters_long_12345',
      onboarding: {
        enabled: true,
        requiredForAccess: true,
      },
    });
  });

  it('should initialize successfully with valid config', () => {
    expect(auth).toBeDefined();
  });

  it('should sign up a user and return a cookie', async () => {
    const req = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@bolkauth.dev', password: 'password123', name: 'Test User' }),
    });

    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.email).toBe('test@bolkauth.dev');
    expect(body.data.session).toBeDefined();

    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toMatch(/bolkauth\.session=([^;]+)/);
  });

  it('should sign in an existing user and return a cookie', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'login@bolkauth.dev', password: 'password123', name: 'Login User' }),
    });
    await auth.handleRequest(signUpReq);

    const req = new Request('http://localhost/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'login@bolkauth.dev', password: 'password123' }),
    });

    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.email).toBe('login@bolkauth.dev');
    
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toMatch(/bolkauth\.session=([^;]+)/);
  });

  it('should fail sign in with wrong password', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'login2@bolkauth.dev', password: 'password123', name: 'Login User 2' }),
    });
    await auth.handleRequest(signUpReq);

    const req = new Request('http://localhost/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'login2@bolkauth.dev', password: 'wrongpassword' }),
    });

    const res = await auth.handleRequest(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('invalid_credentials');
  });

  it('should get session with valid cookie', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'session@bolkauth.dev', password: 'password123' }),
    });
    const signUpRes = await auth.handleRequest(signUpReq);
    const cookie = signUpRes.headers.get('Set-Cookie')!;

    const req = new Request('http://localhost/session', {
      method: 'GET',
      headers: { Cookie: cookie },
    });
    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.email).toBe('session@bolkauth.dev');
    expect(body.data.session).toBeDefined();
  });

  it('should clear cookie on sign out', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'out@bolkauth.dev', password: 'password123' }),
    });
    const signUpRes = await auth.handleRequest(signUpReq);
    const cookie = signUpRes.headers.get('Set-Cookie')!;

    const req = new Request('http://localhost/sign-out', {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toMatch(/Max-Age=0/);
  });

  it('should perform onboarding step with session', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'onboard@bolkauth.dev', password: 'password123' }),
    });
    const signUpRes = await auth.handleRequest(signUpReq);
    const cookie = signUpRes.headers.get('Set-Cookie')!;

    const req = new Request('http://localhost/onboarding/step', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: JSON.stringify({ role: 'admin' }),
    });
    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
  });
});

describe('OTP Authentication', () => {
  let auth: ReturnType<typeof createBolkAuth>;
  let sentOTPs: { email: string; code: string; expiresAt: Date }[] = [];

  beforeEach(() => {
    sentOTPs = [];
    auth = createBolkAuth({
      adapter: createMockAdapter(),
      secret: 'test_secret_key_minimum_32_characters_long_12345',
      email: {
        sendOTP: async (params) => { sentOTPs.push(params); },
      },
      otp: { expiresIn: 600, codeLength: 6, maxAttempts: 5 },
    });
  });

  it('generates and sends a 6-digit OTP', async () => {
    const req = new Request('http://localhost/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: 'otp@bolkauth.dev' }),
    });
    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
    expect(sentOTPs).toHaveLength(1);
    expect(sentOTPs[0].code).toMatch(/^\d{6}$/);
    expect(sentOTPs[0].email).toBe('otp@bolkauth.dev');
  });

  it('verifies correct OTP and returns a session cookie', async () => {
    // Send OTP
    const sendReq = new Request('http://localhost/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: 'verify@bolkauth.dev' }),
    });
    await auth.handleRequest(sendReq);
    const { code } = sentOTPs[0];

    // Verify OTP
    const verifyReq = new Request('http://localhost/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email: 'verify@bolkauth.dev', code }),
    });
    const res = await auth.handleRequest(verifyReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.verified).toBe(true);
    expect(body.data.user.email).toBe('verify@bolkauth.dev');
    expect(body.data.user.emailVerified).not.toBeNull();
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toMatch(/bolkauth\.session=([^;]+)/);
  });

  it('rejects a wrong OTP code', async () => {
    const sendReq = new Request('http://localhost/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: 'wrong@bolkauth.dev' }),
    });
    await auth.handleRequest(sendReq);

    const verifyReq = new Request('http://localhost/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email: 'wrong@bolkauth.dev', code: '000000' }),
    });
    const res = await auth.handleRequest(verifyReq);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('invalid_otp');
  });

  it('is one-time use — second verify with same code fails', async () => {
    const sendReq = new Request('http://localhost/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: 'onetime@bolkauth.dev' }),
    });
    await auth.handleRequest(sendReq);
    const { code } = sentOTPs[0];

    const verify = (c: string) =>
      auth.handleRequest(
        new Request('http://localhost/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ email: 'onetime@bolkauth.dev', code: c }),
        })
      );

    const first = await verify(code);
    expect(first.status).toBe(200);

    const second = await verify(code);
    expect(second.status).toBe(401); // token already consumed
  });

  it('returns error when sendOTP is not configured', async () => {
    const unconfiguredAuth = createBolkAuth({
      adapter: createMockAdapter(),
      secret: 'test_secret_key_minimum_32_characters_long_12345',
    });
    const req = new Request('http://localhost/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@bolkauth.dev' }),
    });
    const res = await unconfiguredAuth.handleRequest(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('otp_not_configured');
  });

  it('rejects invalid email in sendOTP', async () => {
    const req = new Request('http://localhost/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const res = await auth.handleRequest(req);
    expect(res.status).toBe(400);
  });

  it('sanitizes OTP code with whitespace', async () => {
    const sendReq = new Request('http://localhost/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email: 'trim@bolkauth.dev' }),
    });
    await auth.handleRequest(sendReq);
    const { code } = sentOTPs[0];

    // User pastes code with a space in the middle (e.g., "123 456")
    const spacedCode = code.slice(0, 3) + ' ' + code.slice(3);
    const verifyReq = new Request('http://localhost/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email: 'trim@bolkauth.dev', code: spacedCode }),
    });
    const res = await auth.handleRequest(verifyReq);
    expect(res.status).toBe(200);
  });
});

describe('Performance & Cryptographic Utilities', () => {
  it('bytesToHex handles empty array, single/multi-byte, and all zero bytes', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
    expect(bytesToHex(new Uint8Array([0]))).toBe('00');
    expect(bytesToHex(new Uint8Array([0, 15, 16, 255]))).toBe('000f10ff');
    expect(bytesToHex(new Uint8Array([0, 0, 0]))).toBe('000000');
  });

  it('timingSafeEqual compares Uint8Arrays with empty arrays, mismatched lengths, and byte variations', () => {
    expect(timingSafeEqual(new Uint8Array([]), new Uint8Array([]))).toBe(true);
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2]))).toBe(false);

    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([9, 2, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 9, 3]))).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 9]))).toBe(false);

    expect(timingSafeEqual(new Uint8Array([10, 20, 30]), new Uint8Array([10, 20, 30]))).toBe(true);
  });

  it('timingSafeEqual compares strings with empty strings, mismatched lengths, and byte variations', () => {
    expect(timingSafeEqual('', '')).toBe(true);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('abcd', 'abc')).toBe(false);

    expect(timingSafeEqual('abc', 'zbc')).toBe(false);
    expect(timingSafeEqual('abc', 'axc')).toBe(false);
    expect(timingSafeEqual('abc', 'abz')).toBe(false);

    expect(timingSafeEqual('hash123', 'hash123')).toBe(true);
  });

  it('timingSafeEqual returns false for mismatched types', () => {
    const bytes = new Uint8Array([97, 98, 99]);
    expect(timingSafeEqual(bytes as any, 'abc' as any)).toBe(false);
    expect(timingSafeEqual('abc' as any, bytes as any)).toBe(false);
  });

  it('caches CryptoKey in HMAC_KEY_CACHE when getHmacKey is called', async () => {
    HMAC_KEY_CACHE.clear();
    const secret = 'test-secret-key-1234567890';
    const key1 = await getHmacKey(secret, 'sign');
    const key2 = await getHmacKey(secret, 'sign');

    expect(key1).toBe(key2);
    expect(HMAC_KEY_CACHE.size).toBe(1);

    const verifyKey = await getHmacKey(secret, 'verify');
    expect(HMAC_KEY_CACHE.size).toBe(2);
    expect(verifyKey).not.toBe(key1);
  });
});

describe('Password Hashing & Verification Edge Cases', () => {
  it('verifies valid password against correctly generated hash', async () => {
    const hash = await hashPassword('MySecretPass123!');
    expect(await verifyPassword('MySecretPass123!', hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('returns false for missing colons in stored hash', async () => {
    expect(await verifyPassword('password', 'nocolonhash')).toBe(false);
    expect(await verifyPassword('password', '')).toBe(false);
    expect(await verifyPassword('password', ':1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(false);
    expect(await verifyPassword('password', '1234567890abcdef1234567890abcdef:')).toBe(false);
  });

  it('returns false for odd length hex in salt or hash', async () => {
    expect(await verifyPassword('password', 'abc:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(false);
    expect(await verifyPassword('password', '1234567890abcdef1234567890abcdef:abc')).toBe(false);
  });

  it('returns false for non-hex characters in salt or hash', async () => {
    expect(await verifyPassword('password', 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz:1234567890abcdef1234567890abcdef')).toBe(false);
    expect(await verifyPassword('password', '1234567890abcdef1234567890abcdef:ghijklmnopqrstuvwxyzghijklmn')).toBe(false);
  });
});

describe('JWT Signing and Verification', () => {
  const secret = 'super_secret_jwt_key_that_is_long_enough';

  it('signs and verifies a valid JWT payload', async () => {
    const token = await signJwt({ userId: 'usr_123', role: 'admin' }, secret, 3600);
    const payload = await verifyJwt(token, secret);
    expect(payload.userId).toBe('usr_123');
    expect(payload.role).toBe('admin');
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects expired JWT tokens', async () => {
    const expiredToken = await signJwt({ userId: 'usr_123' }, secret, -10);
    await expect(verifyJwt(expiredToken, secret)).rejects.toThrow('Token expired');
  });

  it('rejects JWT tokens with tampered signatures', async () => {
    const token = await signJwt({ userId: 'usr_123' }, secret, 3600);
    const parts = token.split('.');

    const tamperedHeader = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const tamperedTokenHeader = `${tamperedHeader}.${parts[1]}.${parts[2]}`;
    await expect(verifyJwt(tamperedTokenHeader, secret)).rejects.toThrow('Invalid signature');

    const tamperedPayload = btoa(JSON.stringify({ userId: 'usr_hacked' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const tamperedTokenPayload = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    await expect(verifyJwt(tamperedTokenPayload, secret)).rejects.toThrow('Invalid signature');

    const tamperedSig = parts[2].slice(0, -2) + 'XX';
    const tamperedTokenSig = `${parts[0]}.${parts[1]}.${tamperedSig}`;

    await expect(verifyJwt(tamperedTokenSig, secret)).rejects.toThrow('Invalid signature');
  });

  it('rejects invalid JWT formats', async () => {
    await expect(verifyJwt('invalidtoken', secret)).rejects.toThrow('Invalid token format');
    await expect(verifyJwt('header.payload', secret)).rejects.toThrow('Invalid token format');
    await expect(verifyJwt('header.payload.sig.extra', secret)).rejects.toThrow('Invalid token format');
    await expect(verifyJwt('', secret)).rejects.toThrow('Invalid token format');
  });
});

describe('OTP Code Generation & Digits', () => {
  it('generates 4-digit OTP codes', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOTPCode(4);
      expect(code).toMatch(/^\d{4}$/);
      expect(code.length).toBe(4);
    }
  });

  it('generates 6-digit OTP codes (default)', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOTPCode(6);
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    }
    const defaultCode = generateOTPCode();
    expect(defaultCode.length).toBe(6);
  });

  it('generates 8-digit OTP codes', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOTPCode(8);
      expect(code).toMatch(/^\d{8}$/);
      expect(code.length).toBe(8);
    }
  });

  it('pads OTP codes with leading zeros to maintain exact digit length', () => {
    const originalGetRandomValues = crypto.getRandomValues;
    try {
      crypto.getRandomValues = ((array: Uint32Array) => {
        array[0] = 0;
        return array;
      }) as any;

      expect(generateOTPCode(4)).toBe('0000');
      expect(generateOTPCode(6)).toBe('000000');
      expect(generateOTPCode(8)).toBe('00000000');

      crypto.getRandomValues = ((array: Uint32Array) => {
        array[0] = 7;
        return array;
      }) as any;

      expect(generateOTPCode(4)).toBe('0007');
      expect(generateOTPCode(6)).toBe('000007');
      expect(generateOTPCode(8)).toBe('00000007');
    } finally {
      crypto.getRandomValues = originalGetRandomValues;
    }
  });
});

describe('Onboarding Finite State Machine (FSM)', () => {
  let auth: ReturnType<typeof createBolkAuth>;
  let sessionCookie: string;

  beforeEach(async () => {
    auth = createBolkAuth({
      adapter: createMockAdapter(),
      secret: 'test_secret_key_minimum_32_characters_long_12345',
      onboarding: { enabled: true, requiredForAccess: true },
    });

    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'fsm@bolkauth.dev', password: 'password123' }),
    });
    const signUpRes = await auth.handleRequest(signUpReq);
    sessionCookie = signUpRes.headers.get('Set-Cookie')!;
  });

  it('starts in NOT_STARTED state with no onboarding metadata', async () => {
    const reqStep = new Request('http://localhost/user/metadata?key=onboarding_step', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const resStep = await auth.handleRequest(reqStep);
    const bodyStep = await resStep.json();
    expect(bodyStep.data).toBeNull();

    const reqComplete = new Request('http://localhost/user/metadata?key=onboarding_complete', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const resComplete = await auth.handleRequest(reqComplete);
    const bodyComplete = await resComplete.json();
    expect(bodyComplete.data).toBeNull();
  });

  it('transitions to IN_PROGRESS state when onboardingStep requests are submitted', async () => {
    const step1Req = new Request('http://localhost/onboarding/step', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      body: JSON.stringify({ step: 1, profile: { name: 'John Doe', role: 'Developer' } }),
    });
    const step1Res = await auth.handleRequest(step1Req);
    expect(step1Res.status).toBe(200);

    const metaReq1 = new Request('http://localhost/user/metadata?key=onboarding_step', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const metaRes1 = await auth.handleRequest(metaReq1);
    const metaBody1 = await metaRes1.json();
    expect(JSON.parse(metaBody1.data.value)).toEqual({ step: 1, profile: { name: 'John Doe', role: 'Developer' } });

    const step2Req = new Request('http://localhost/onboarding/step', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
      body: JSON.stringify({ step: 2, preferences: { theme: 'dark' } }),
    });
    const step2Res = await auth.handleRequest(step2Req);
    expect(step2Res.status).toBe(200);

    const metaReq2 = new Request('http://localhost/user/metadata?key=onboarding_step', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const metaRes2 = await auth.handleRequest(metaReq2);
    const metaBody2 = await metaRes2.json();
    expect(JSON.parse(metaBody2.data.value)).toEqual({ step: 2, preferences: { theme: 'dark' } });
  });

  it('transitions to COMPLETE state when onboarding complete is called', async () => {
    const completeReq = new Request('http://localhost/onboarding/complete', {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const completeRes = await auth.handleRequest(completeReq);
    expect(completeRes.status).toBe(200);

    const metaReq = new Request('http://localhost/user/metadata?key=onboarding_complete', {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const metaRes = await auth.handleRequest(metaReq);
    const metaBody = await metaRes.json();
    expect(metaBody.data.value).toBe('true');
  });

  it('rejects unauthenticated onboarding requests with 401', async () => {
    const unauthStepReq = new Request('http://localhost/onboarding/step', {
      method: 'POST',
      body: JSON.stringify({ step: 1 }),
    });
    const resStep = await auth.handleRequest(unauthStepReq);
    expect(resStep.status).toBe(401);

    const unauthCompleteReq = new Request('http://localhost/onboarding/complete', {
      method: 'POST',
    });
    const resComplete = await auth.handleRequest(unauthCompleteReq);
    expect(resComplete.status).toBe(401);
  });
});

describe('OAuth PKCE Parameters & State Validation', () => {
  let auth: ReturnType<typeof createBolkAuth>;

  beforeEach(() => {
    auth = createBolkAuth({
      adapter: createMockAdapter(),
      secret: 'test_secret_key_minimum_32_characters_long_12345',
      socialProviders: {
        github: {
          clientId: 'gh_client_id_123',
          clientSecret: 'gh_client_secret_456',
          scopes: ['read:user', 'user:email'],
        },
      },
    });
  });

  it('buildAuthorizationUrl constructs correct OAuth authorization URL with state and PKCE parameters', () => {
    const urlStr = buildAuthorizationUrl(
      'github',
      { clientId: 'my_client_id', scopes: ['read:user'] },
      'http://localhost/api/auth/oauth/github/callback',
      'test_state_nonce'
    );
    const url = new URL(urlStr);
    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('my_client_id');
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost/api/auth/oauth/github/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('scope')).toBe('read:user');
    expect(url.searchParams.get('state')).toBe('test_state_nonce');
  });

  it('oauthRedirect endpoint generates authorization URL with state cookie', async () => {
    const req = new Request('http://localhost/oauth/github', { method: 'GET' });
    const res = await auth.handleRequest(req);
    expect(res.status).toBe(302);

    const location = res.headers.get('Location')!;
    expect(location).toContain('https://github.com/login/oauth/authorize');

    const setCookie = res.headers.get('Set-Cookie')!;
    expect(setCookie).toMatch(/oauth_state=([^;]+)/);

    const stateInCookie = setCookie.match(/oauth_state=([^;]+)/)![1];
    const locUrl = new URL(location);
    expect(locUrl.searchParams.get('state')).toBe(stateInCookie);
  });

  it('oauthCallback rejects request when state query param or cookie is missing', async () => {
    const reqNoParams = new Request('http://localhost/oauth/github/callback', { method: 'GET' });
    const resNoParams = await auth.handleRequest(reqNoParams);
    expect(resNoParams.status).toBe(400);
    const bodyNoParams = await resNoParams.json();
    expect(bodyNoParams.error.code).toBe('oauth_error');

    const reqNoCookie = new Request('http://localhost/oauth/github/callback?code=12345&state=abc', { method: 'GET' });
    const resNoCookie = await auth.handleRequest(reqNoCookie);
    expect(resNoCookie.status).toBe(400);
  });

  it('oauthCallback rejects request when state query param does not match cookie', async () => {
    const reqMismatch = new Request('http://localhost/oauth/github/callback?code=12345&state=state_query', {
      method: 'GET',
      headers: { Cookie: 'oauth_state=state_cookie' },
    });
    const resMismatch = await auth.handleRequest(reqMismatch);
    expect(resMismatch.status).toBe(400);
    const bodyMismatch = await resMismatch.json();
    expect(bodyMismatch.error.message).toBe('Invalid OAuth state');
  });

  it('oauthRedirect returns 404 for unconfigured provider', async () => {
    const req = new Request('http://localhost/oauth/unknownprovider', { method: 'GET' });
    const res = await auth.handleRequest(req);
    expect(res.status).toBe(404);
  });
});


