import { describe, it, expect, beforeEach } from 'vitest';
import { createAuthFlow, AuthFlowAdapter } from './index';

function createMockAdapter(): AuthFlowAdapter {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const metadata = new Map<string, any>();

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
    async createVerificationToken(data) { return { ...data, createdAt: new Date() }; },
    async findVerificationToken() { return null; },
    async deleteVerificationToken() {},
    async getUserMetadata(userId, key) { return metadata.get(`${userId}:${key}`) ?? null; },
    async updateUserMetadata(userId, key, value) {
      const meta = { userId, key, value, createdAt: new Date(), updatedAt: new Date() };
      metadata.set(`${userId}:${key}`, meta);
      return meta;
    },
  };
}

describe('AuthFlow Engine', () => {
  let auth: ReturnType<typeof createAuthFlow>;

  beforeEach(() => {
    auth = createAuthFlow({
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
      body: JSON.stringify({ email: 'test@authflow.dev', password: 'password123', name: 'Test User' }),
    });

    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.email).toBe('test@authflow.dev');
    expect(body.data.session).toBeDefined();

    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toMatch(/authflow\.session=([^;]+)/);
  });

  it('should sign in an existing user and return a cookie', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'login@authflow.dev', password: 'password123', name: 'Login User' }),
    });
    await auth.handleRequest(signUpReq);

    const req = new Request('http://localhost/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'login@authflow.dev', password: 'password123' }),
    });

    const res = await auth.handleRequest(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.user.email).toBe('login@authflow.dev');
    
    const cookie = res.headers.get('Set-Cookie');
    expect(cookie).toMatch(/authflow\.session=([^;]+)/);
  });

  it('should fail sign in with wrong password', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'login2@authflow.dev', password: 'password123', name: 'Login User 2' }),
    });
    await auth.handleRequest(signUpReq);

    const req = new Request('http://localhost/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: 'login2@authflow.dev', password: 'wrongpassword' }),
    });

    const res = await auth.handleRequest(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('invalid_credentials');
  });

  it('should get session with valid cookie', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'session@authflow.dev', password: 'password123' }),
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
    expect(body.data.user.email).toBe('session@authflow.dev');
    expect(body.data.session).toBeDefined();
  });

  it('should clear cookie on sign out', async () => {
    const signUpReq = new Request('http://localhost/sign-up', {
      method: 'POST',
      body: JSON.stringify({ email: 'out@authflow.dev', password: 'password123' }),
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
      body: JSON.stringify({ email: 'onboard@authflow.dev', password: 'password123' }),
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
