import type { BolkAuthConfig } from './types';
import { hashPassword, verifyPassword } from './password';
import { hashToken, signJwt, verifyJwt } from './session';
import { buildAuthorizationUrl, exchangeCodeForToken, fetchUserInfo } from './oauth';
import { generateOTPCode, hashOTPCode } from './otp';

export function successResponse<T>(data: T, headers?: HeadersInit, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function errorResponse(
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
  status = 400
) {
  return new Response(JSON.stringify({ error: { code, message, fieldErrors } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseCookie(cookieHeader: string | null, cookieName = 'bolkauth.session'): string | null {
  if (!cookieHeader) return null;
  const targetPrefix = cookieName + '=';
  const cookies = cookieHeader.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(targetPrefix)) {
      return cookie.slice(targetPrefix.length);
    }
  }
  return null;
}

function createSessionCookie(jwt: string, maxAge: number, cookieName = 'bolkauth.session') {
  return `${cookieName}=${jwt}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function createClearCookie(cookieName = 'bolkauth.session') {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

type RouteHandler = (auth: BolkAuthInstance, req: Request) => Promise<Response>;

const ROUTE_MAP = new Map<string, RouteHandler>([
  ['POST:/sign-up', (auth, req) => (auth as any).signUp(req)],
  ['POST:/sign-in/email', (auth, req) => (auth as any).signInEmail(req)],
  ['POST:/sign-in/magic-link', (auth, req) => (auth as any).signInMagicLink(req)],
  ['GET:/verify', (auth, req) => (auth as any).verifyMagicLink(req)],
  ['POST:/otp/send', (auth, req) => (auth as any).sendOTP(req)],
  ['POST:/otp/verify', (auth, req) => (auth as any).verifyOTP(req)],
  ['POST:/sign-out', (auth, req) => (auth as any).signOut(req)],
  ['GET:/session', (auth, req) => (auth as any).getSession(req)],
  ['POST:/user/metadata', (auth, req) => (auth as any).updateMetadata(req)],
  ['GET:/user/metadata', (auth, req) => (auth as any).getMetadata(req)],
  ['POST:/onboarding/step', (auth, req) => (auth as any).onboardingStep(req)],
  ['POST:/onboarding/complete', (auth, req) => (auth as any).onboardingComplete(req)],
]);

const OAUTH_CALLBACK_REGEX = /\/oauth\/([^/]+)\/callback$/;
const OAUTH_REDIRECT_REGEX = /\/oauth\/([^/]+)$/;

function getRouteHandler(method: string, path: string): RouteHandler | undefined {
  const directKey = `${method}:${path}`;
  const directHandler = ROUTE_MAP.get(directKey);
  if (directHandler) return directHandler;

  for (const [key, handler] of ROUTE_MAP) {
    const colonIndex = key.indexOf(':');
    const routeMethod = key.slice(0, colonIndex);
    const routePath = key.slice(colonIndex + 1);
    if (routeMethod === method && path.endsWith(routePath)) {
      return handler;
    }
  }

  return undefined;
}

export class BolkAuthInstance {
  config: BolkAuthConfig;

  constructor(config: BolkAuthConfig) {
    this.config = config;
  }

  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      const handler = getRouteHandler(req.method, path);
      if (handler) {
        return await handler(this, req);
      }

      // OAuth Routes
      if (req.method === 'GET') {
        const callbackMatch = path.match(OAUTH_CALLBACK_REGEX);
        if (callbackMatch) {
          return await this.oauthCallback(req, callbackMatch[1]);
        }
        const redirectMatch = path.match(OAUTH_REDIRECT_REGEX);
        if (redirectMatch) {
          return await this.oauthRedirect(req, redirectMatch[1]);
        }
      }

      return new Response('Not found', { status: 404 });
    } catch (e: any) {
      return errorResponse('internal_error', e.message || 'Internal error', undefined, 500);
    }
  }

  private async createSessionAndCookie(userId: string) {
    const token = crypto.randomUUID();
    const maxAge = this.config.session?.maxAge || 30 * 24 * 60 * 60;
    const session = await this.config.adapter.createSession({
      userId,
      token: await hashToken(token),
      expiresAt: new Date(Date.now() + maxAge * 1000),
    });

    const jwt = await signJwt({ sessionId: session.id, userId }, this.config.secret);
    const cookieName = this.config.session?.cookieName || 'bolkauth.session';
    const cookie = createSessionCookie(jwt, maxAge, cookieName);
    
    return { session, token, jwt, cookie };
  }

  private async getAuthSession(req: Request) {
    const cookieHeader = req.headers.get('Cookie');
    const cookieName = this.config.session?.cookieName || 'bolkauth.session';
    const jwt = parseCookie(cookieHeader, cookieName);
    if (!jwt) return null;

    try {
      const payload = await verifyJwt(jwt, this.config.secret) as { sessionId: string; userId: string };
      if (!payload || !payload.sessionId || !payload.userId) return null;
      return payload;
    } catch {
      return null;
    }
  }

  private async signUp(req: Request) {
    const { email, password, name } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('invalid_email', 'Invalid email address', { email: ['Invalid email'] }, 400);
    }
    const minLen = this.config.emailAndPassword?.minPasswordLength ?? 8;
    if (!password || password.length < minLen) {
      return errorResponse('weak_password', `Password must be at least ${minLen} characters`, { password: [`Min ${minLen} characters`] }, 400);
    }

    const existing = await this.config.adapter.findUserByEmail(email);
    if (existing) {
      return errorResponse('user_exists', 'User already exists', undefined, 400);
    }
    const hashedPassword = await hashPassword(password);
    const user = await this.config.adapter.createUser({
      email,
      password: hashedPassword,
      name,
      emailVerified: null,
    });
    
    const { session, token, jwt, cookie } = await this.createSessionAndCookie(user.id);

    return successResponse({ user, session, token, jwt }, { 'Set-Cookie': cookie });
  }

  private async signInEmail(req: Request) {
    const { email, password } = await req.json();
    if (!email || !password) {
      return errorResponse('invalid_credentials', 'Email and password are required', undefined, 400);
    }
    const user = await this.config.adapter.findUserByEmail(email);
    if (!user || !user.password) {
      return errorResponse('invalid_credentials', 'Invalid credentials', undefined, 401);
    }
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return errorResponse('invalid_credentials', 'Invalid credentials', undefined, 401);
    }

    const { session, token, jwt, cookie } = await this.createSessionAndCookie(user.id);

    return successResponse({ user, session, token, jwt }, { 'Set-Cookie': cookie });
  }

  private async signInMagicLink(req: Request) {
    const { email } = await req.json();
    if (!email) return errorResponse('invalid_email', 'Email required', undefined, 400);
    const token = crypto.randomUUID();
    await this.config.adapter.createVerificationToken({
      identifier: email,
      token: await hashToken(token),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    if (this.config.email?.sendMagicLink) {
      const verifyUrl = `${new URL(req.url).origin}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
      await this.config.email.sendMagicLink({ identifier: email, url: verifyUrl, token });
    }
    return successResponse({ success: true });
  }

  private async verifyMagicLink(req: Request) {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');
    if (!token || !email) return errorResponse('bad_request', 'Missing token or email', undefined, 400);

    const hashed = await hashToken(token);
    const vt = await this.config.adapter.findVerificationToken(email, hashed);
    if (!vt || vt.expiresAt < new Date()) {
      return errorResponse('invalid_token', 'Token invalid or expired', undefined, 400);
    }
    await this.config.adapter.deleteVerificationToken(email, hashed);
    let user = await this.config.adapter.findUserByEmail(email);
    if (!user) {
      user = await this.config.adapter.createUser({ email, emailVerified: new Date() });
    } else {
      user = await this.config.adapter.updateUser(user.id, { emailVerified: new Date() });
    }
    const { cookie } = await this.createSessionAndCookie(user.id);
    const redirectUrl = this.config.email?.verifyRedirectUrl ?? '/';
    return new Response(null, { status: 302, headers: { Location: redirectUrl, 'Set-Cookie': cookie } });
  }

  private async sendOTP(req: Request) {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('invalid_email', 'Valid email address is required', undefined, 400);
    }

    if (!this.config.email?.sendOTP) {
      return errorResponse(
        'otp_not_configured',
        'OTP email sending is not configured. Set config.email.sendOTP.',
        undefined,
        500
      );
    }

    const codeLength = this.config.otp?.codeLength ?? 6;
    const expiresIn = this.config.otp?.expiresIn ?? 600; // 10 minutes
    const code = generateOTPCode(codeLength);
    const hashed = await hashOTPCode(code);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Store hashed OTP using the existing VerificationToken mechanism.
    // identifier = email, token = SHA-256(code), type discriminator = "otp:" prefix.
    await this.config.adapter.createVerificationToken({
      identifier: `otp:${email}`,
      token: hashed,
      expiresAt,
    });

    // Call user-supplied email sender
    await this.config.email.sendOTP({ email, code, expiresAt });

    return successResponse({ success: true, expiresAt });
  }

  private async verifyOTP(req: Request) {
    const { email, code } = await req.json();
    if (!email || !code) {
      return errorResponse('bad_request', 'Email and code are required', undefined, 400);
    }

    // Sanitize: strip whitespace, ensure numeric string
    const sanitizedCode = String(code).trim().replace(/\s/g, '');
    if (!/^\d{4,8}$/.test(sanitizedCode)) {
      return errorResponse('invalid_otp', 'Invalid OTP format', undefined, 400);
    }

    const hashed = await hashOTPCode(sanitizedCode);
    const identifier = `otp:${email}`;
    const vt = await this.config.adapter.findVerificationToken(identifier, hashed);

    if (!vt || vt.expiresAt < new Date()) {
      // Don't distinguish between "wrong code" and "expired" to prevent oracle attacks
      return errorResponse('invalid_otp', 'Invalid or expired OTP code', undefined, 401);
    }

    // Consume the token immediately (one-time use)
    await this.config.adapter.deleteVerificationToken(identifier, hashed);

    // Find or create the user
    let user = await this.config.adapter.findUserByEmail(email);
    if (!user) {
      // Auto-create account on first OTP sign-in (same pattern as magic link)
      user = await this.config.adapter.createUser({
        email,
        emailVerified: new Date(),
      });
    } else if (!user.emailVerified) {
      user = await this.config.adapter.updateUser(user.id, { emailVerified: new Date() });
    }

    // Create session and return cookie
    const { cookie } = await this.createSessionAndCookie(user.id);
    return successResponse(
      { user, verified: true },
      { 'Set-Cookie': cookie }
    );
  }

  private async signOut(req: Request) {
    const payload = await this.getAuthSession(req);
    if (payload) {
      await this.config.adapter.deleteSession(payload.sessionId);
    }
    const cookieName = this.config.session?.cookieName || 'bolkauth.session';
    const clearCookie = createClearCookie(cookieName);
    
    return successResponse({ success: true }, { 'Set-Cookie': clearCookie });
  }

  private async getSession(req: Request) {
    const payload = await this.getAuthSession(req);
    if (!payload) {
      return errorResponse('unauthorized', 'No active session', undefined, 401);
    }
    const user = await this.config.adapter.findUserById(payload.userId);
    if (!user) {
      return errorResponse('unauthorized', 'User not found', undefined, 401);
    }
    return successResponse({ session: { id: payload.sessionId, userId: payload.userId }, user });
  }

  private async updateMetadata(req: Request) {
    const payload = await this.getAuthSession(req);
    if (!payload) return errorResponse('unauthorized', 'No active session', undefined, 401);
    const data = await req.json();
    const results: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      results[key] = await this.config.adapter.updateUserMetadata(
        payload.userId,
        key,
        typeof value === 'string' ? value : JSON.stringify(value)
      );
    }
    return successResponse(results);
  }

  private async getMetadata(req: Request) {
    const payload = await this.getAuthSession(req);
    if (!payload) return errorResponse('unauthorized', 'No active session', undefined, 401);
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (!key) return errorResponse('bad_request', 'Missing key param', undefined, 400);
    const meta = await this.config.adapter.getUserMetadata(payload.userId, key);
    return successResponse(meta);
  }

  private async onboardingStep(req: Request) {
    const payload = await this.getAuthSession(req);
    if (!payload) return errorResponse('unauthorized', 'No active session', undefined, 401);

    const data = await req.json();
    await this.config.adapter.updateUserMetadata(payload.userId, 'onboarding_step', JSON.stringify(data));
    return successResponse({ success: true });
  }

  private async onboardingComplete(req: Request) {
    const payload = await this.getAuthSession(req);
    if (!payload) return errorResponse('unauthorized', 'No active session', undefined, 401);

    await this.config.adapter.updateUserMetadata(payload.userId, 'onboarding_complete', 'true');
    return successResponse({ success: true });
  }

  private async oauthRedirect(req: Request, provider: string) {
    const providerConfig = this.config.socialProviders?.[provider];
    if (!providerConfig) return errorResponse('not_found', `Provider ${provider} not configured`, undefined, 404);
    const state = crypto.randomUUID();
    const callbackUrl = `${new URL(req.url).origin}/api/auth/oauth/${provider}/callback`;
    const url = buildAuthorizationUrl(provider, providerConfig, callbackUrl, state);
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
      },
    });
  }

  private async oauthCallback(req: Request, provider: string) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookieHeader = req.headers.get('Cookie');
    const storedState = parseCookie(cookieHeader, 'oauth_state');
    if (!code || !state || state !== storedState) {
      return errorResponse('oauth_error', 'Invalid OAuth state', undefined, 400);
    }
    const providerConfig = this.config.socialProviders?.[provider];
    if (!providerConfig) return errorResponse('not_found', `Provider ${provider} not configured`, undefined, 404);

    const callbackUrl = `${url.origin}/api/auth/oauth/${provider}/callback`;
    try {
      const accessToken = await exchangeCodeForToken(provider, code, providerConfig, callbackUrl);
      const userInfo = await fetchUserInfo(provider, accessToken);
      let account = await this.config.adapter.findAccountByProvider(provider, userInfo.id);
      let user;
      if (account) {
        user = await this.config.adapter.findUserById(account.userId);
      } else {
        user = userInfo.email ? await this.config.adapter.findUserByEmail(userInfo.email) : null;
        if (!user) {
          user = await this.config.adapter.createUser({
            email: userInfo.email ?? `${provider}_${userInfo.id}@noemail.bolkauth`,
            name: userInfo.name,
            image: userInfo.image,
            emailVerified: new Date(),
          });
        }
        await this.config.adapter.createAccount({
          userId: user!.id,
          provider,
          providerAccountId: userInfo.id,
          accessToken,
        });
      }
      const { cookie } = await this.createSessionAndCookie(user!.id);
      const redirectUrl = this.config.social?.redirectUrl ?? '/';
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl, 'Set-Cookie': cookie },
      });
    } catch (e: any) {
      return errorResponse('oauth_error', e.message || 'OAuth failure', undefined, 500);
    }
  }
}

export function createBolkAuth(config: BolkAuthConfig) {
  return new BolkAuthInstance(config);
}
