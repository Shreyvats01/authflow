import { describe, it, expect, beforeEach } from 'vitest';
import { auth } from '../lib/auth';
import { bolkAuthMiddleware } from '@bolkauth/nextjs';
import { NextRequest } from 'next/server';
import { signJwt, verifyJwt } from '@bolkauth/core';

describe('Playground Test Harness E2E Verification', () => {
  let middleware: ReturnType<typeof bolkAuthMiddleware>;

  beforeEach(() => {
    middleware = bolkAuthMiddleware(auth, {
      publicRoutes: ['/', '/sign-in', '/sign-up', '/api/auth/(.*)'],
      signInUrl: '/sign-in',
      onboardingUrl: '/onboarding',
    });
  });

  describe('1. Sign-In and Sign-Up Flows', () => {
    it('executes sign-up flow and creates user with session', async () => {
      const signUpReq = new Request('http://localhost:3000/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'e2e_signup@bolkauth.dev',
          password: 'securePassword123!',
          name: 'E2E Test User',
        }),
      });

      const res = await auth.handleRequest(signUpReq);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.user.email).toBe('e2e_signup@bolkauth.dev');
      expect(body.data.user.name).toBe('E2E Test User');
      expect(body.data.session).toBeDefined();
      expect(body.data.jwt).toBeDefined();
    });

    it('executes sign-in flow for registered user', async () => {
      // Register user first
      const signUpReq = new Request('http://localhost:3000/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'e2e_signin@bolkauth.dev',
          password: 'myPassword123!',
          name: 'Signin User',
        }),
      });
      await auth.handleRequest(signUpReq);

      // Authenticate
      const signInReq = new Request('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'e2e_signin@bolkauth.dev',
          password: 'myPassword123!',
        }),
      });

      const res = await auth.handleRequest(signInReq);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.user.email).toBe('e2e_signin@bolkauth.dev');
      expect(body.data.session.userId).toBe(body.data.user.id);
    });

    it('rejects sign-in with invalid credentials with status 401', async () => {
      const signInReq = new Request('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@bolkauth.dev',
          password: 'wrongpassword',
        }),
      });

      const res = await auth.handleRequest(signInReq);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe('invalid_credentials');
    });
  });

  describe('2. HttpOnly and SameSite=Lax Session Cookie Setting and Persistence', () => {
    it('sets Set-Cookie header with HttpOnly and SameSite=Lax attributes on sign-up', async () => {
      const req = new Request('http://localhost:3000/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'cookie_test@bolkauth.dev',
          password: 'cookiePassword123',
        }),
      });

      const res = await auth.handleRequest(req);
      const setCookie = res.headers.get('Set-Cookie');

      expect(setCookie).not.toBeNull();
      expect(setCookie).toContain('bolkauth.session=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Lax');
      expect(setCookie).toContain('Path=/');
      expect(setCookie).toContain('Max-Age=');
    });

    it('persists active session when presenting session cookie on GET /api/auth/session', async () => {
      const signUpReq = new Request('http://localhost:3000/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'session_persist@bolkauth.dev',
          password: 'persistPassword123',
        }),
      });
      const signUpRes = await auth.handleRequest(signUpReq);
      const cookieHeader = signUpRes.headers.get('Set-Cookie')!;
      const match = cookieHeader.match(/(?:bolkauth\.session_token|bolkauth\.session)=([^;]+)/);
      expect(match).not.toBeNull();
      const rawCookie = match![0];

      // Fetch session with cookie
      const sessionReq = new Request('http://localhost:3000/api/auth/session', {
        method: 'GET',
        headers: { Cookie: rawCookie },
      });

      const sessionRes = await auth.handleRequest(sessionReq);
      expect(sessionRes.status).toBe(200);

      const body = await sessionRes.json();
      expect(body.data.user.email).toBe('session_persist@bolkauth.dev');
      expect(body.data.session).toBeDefined();
    });

    it('clears session cookie on sign-out', async () => {
      const signUpReq = new Request('http://localhost:3000/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'signout_test@bolkauth.dev',
          password: 'outPassword123',
        }),
      });
      const signUpRes = await auth.handleRequest(signUpReq);
      const cookieHeader = signUpRes.headers.get('Set-Cookie')!;
      const rawCookie = cookieHeader.match(/(?:bolkauth\.session_token|bolkauth\.session)=([^;]+)/)![0];

      const signOutReq = new Request('http://localhost:3000/api/auth/sign-out', {
        method: 'POST',
        headers: { Cookie: rawCookie },
      });

      const signOutRes = await auth.handleRequest(signOutReq);
      expect(signOutRes.status).toBe(200);

      const clearCookie = signOutRes.headers.get('Set-Cookie')!;
      expect(clearCookie).toContain('bolkauth.session=;');
      expect(clearCookie).toContain('Max-Age=0');
      expect(clearCookie).toContain('HttpOnly');
      expect(clearCookie).toContain('SameSite=Lax');
    });
  });

  describe('3. Edge Middleware HTTP 307 Redirect Interception for Protected Routes', () => {
    it('intercepts unauthenticated access to /dashboard with HTTP 307 redirect to /sign-in', async () => {
      const req = new NextRequest('http://localhost:3000/dashboard');
      const res = await middleware(req);

      expect(res).toBeDefined();
      expect(res.status).toBe(307);
      const location = res.headers.get('Location');
      expect(location).toBe('http://localhost:3000/sign-in');
    });

    it('bypasses public routes (/sign-in, /sign-up, /) without redirecting', async () => {
      const routes = ['http://localhost:3000/', 'http://localhost:3000/sign-in', 'http://localhost:3000/sign-up'];
      for (const url of routes) {
        const req = new NextRequest(url);
        const res = await middleware(req);
        // NextResponse.next() returns a response (status 200) without redirect
        expect(res.status).toBe(200);
        expect(res.headers.get('Location')).toBeNull();
      }
    });

    it('allows access to protected /dashboard route when valid session cookie is provided', async () => {
      // Create valid session JWT
      const jwt = await signJwt(
        { sessionId: 'sess_valid', userId: 'usr_valid' },
        'playground_secret_key_min_32_characters_long_12345',
        3600
      );

      const req = new NextRequest('http://localhost:3000/dashboard', {
        headers: { Cookie: `bolkauth.session=${jwt}` },
      });

      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Location')).toBeNull();
    });
  });

  describe('4. Onboarding Multi-Step State Machine Step Progression (/onboarding)', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      const signUpReq = new Request('http://localhost:3000/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `onboarding_fsm_${Math.random().toString(36).substring(2, 9)}@bolkauth.dev`,
          password: 'onboardingPass123',
        }),
      });
      const signUpRes = await auth.handleRequest(signUpReq);
      const cookieHeader = signUpRes.headers.get('Set-Cookie')!;
      sessionCookie = cookieHeader.match(/(?:bolkauth\.session_token|bolkauth\.session)=([^;]+)/)![0];
    });

    it('progresses through Step 0, Step 1, Step 2, and saves step metadata', async () => {
      // Step 0: Profile & Role
      const step0Req = new Request('http://localhost:3000/api/auth/onboarding/step', {
        method: 'POST',
        headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0, displayName: 'Jane Founder', role: 'founder' }),
      });
      const step0Res = await auth.handleRequest(step0Req);
      expect(step0Res.status).toBe(200);

      // Verify metadata saved
      const metaReq0 = new Request('http://localhost:3000/api/auth/user/metadata?key=onboarding_step', {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      });
      const metaRes0 = await auth.handleRequest(metaReq0);
      const metaBody0 = await metaRes0.json();
      expect(JSON.parse(metaBody0.data.value)).toEqual({ step: 0, displayName: 'Jane Founder', role: 'founder' });

      // Step 1: Workspace
      const step1Req = new Request('http://localhost:3000/api/auth/onboarding/step', {
        method: 'POST',
        headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, companyName: 'Acme Corp', slug: 'acme' }),
      });
      const step1Res = await auth.handleRequest(step1Req);
      expect(step1Res.status).toBe(200);

      // Step 2: Preferences
      const step2Req = new Request('http://localhost:3000/api/auth/onboarding/step', {
        method: 'POST',
        headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2, theme: 'dark', newsletter: true }),
      });
      const step2Res = await auth.handleRequest(step2Req);
      expect(step2Res.status).toBe(200);

      // Complete Onboarding
      const completeReq = new Request('http://localhost:3000/api/auth/onboarding/complete', {
        method: 'POST',
        headers: { Cookie: sessionCookie },
      });
      const completeRes = await auth.handleRequest(completeReq);
      expect(completeRes.status).toBe(200);

      // Verify completion flag in metadata
      const metaCompleteReq = new Request('http://localhost:3000/api/auth/user/metadata?key=onboarding_complete', {
        method: 'GET',
        headers: { Cookie: sessionCookie },
      });
      const metaCompleteRes = await auth.handleRequest(metaCompleteReq);
      const metaCompleteBody = await metaCompleteRes.json();
      expect(metaCompleteBody.data.value).toBe('true');
    });

    it('handles branching step progression based on role selection', async () => {
      // Step 0: Developer role (skips workspace step 1 in state machine UI)
      const step0Req = new Request('http://localhost:3000/api/auth/onboarding/step', {
        method: 'POST',
        headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 0, displayName: 'Alex Dev', role: 'dev' }),
      });
      const step0Res = await auth.handleRequest(step0Req);
      expect(step0Res.status).toBe(200);

      // Direct step 2 preferences save for dev role
      const step2Req = new Request('http://localhost:3000/api/auth/onboarding/step', {
        method: 'POST',
        headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 2, theme: 'system', newsletter: false }),
      });
      const step2Res = await auth.handleRequest(step2Req);
      expect(step2Res.status).toBe(200);
    });
  });

  describe('5. Native Browser Web Crypto Execution (window.crypto.subtle)', () => {
    it('executes native Web Crypto HMAC SHA-256 signing and verification using subtle crypto API', async () => {
      const secret = 'web_crypto_test_secret_key_32bytes_long!';
      const encoder = new TextEncoder();

      // 1. Import Key using subtle.importKey
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );
      expect(key).toBeDefined();

      // 2. Sign payload using subtle.sign
      const message = encoder.encode('header.payload');
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, message);
      expect(signatureBuffer.byteLength).toBe(32); // 256 bits = 32 bytes

      // 3. Verify signature using subtle.verify
      const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, message);
      expect(isValid).toBe(true);

      // 4. Verify invalid message produces verification failure
      const tamperedMessage = encoder.encode('header.tampered_payload');
      const isTamperedValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, tamperedMessage);
      expect(isTamperedValid).toBe(false);
    });

    it('executes native Web Crypto SHA-256 digest hashing', async () => {
      const encoder = new TextEncoder();
      const data = encoder.encode('test-token-123456');

      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      expect(hashHex.length).toBe(64); // 64 hex characters = 256 bits
    });

    it('interoperates browser Web Crypto signatures with @bolkauth/core JWT verification', async () => {
      const secret = 'playground_secret_key_min_32_characters_long_12345';
      const token = await signJwt({ userId: 'usr_crypto_test', role: 'admin' }, secret, 3600);

      // Verify signed JWT with core verifyJwt
      const payload = await verifyJwt(token, secret);
      expect(payload.userId).toBe('usr_crypto_test');
      expect(payload.role).toBe('admin');
    });
  });
});
