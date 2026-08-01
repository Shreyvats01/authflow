import { describe, it, expect, beforeEach } from 'vitest';
import { createBolkAuth, BolkAuthAdapter } from './index';

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

