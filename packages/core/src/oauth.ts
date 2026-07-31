export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  getUserInfo: (data: any) => { id: string; email: string; name?: string; image?: string };
}

export const OAUTH_PROVIDERS: Record<string, Omit<OAuthProviderConfig, 'clientId' | 'clientSecret'>> = {
  github: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
    getUserInfo: (data) => ({
      id: String(data.id),
      email: data.email,
      name: data.name ?? data.login,
      image: data.avatar_url,
    }),
  },
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
    getUserInfo: (data) => ({
      id: data.id,
      email: data.email,
      name: data.name,
      image: data.picture,
    }),
  },
};

export function buildAuthorizationUrl(
  provider: string,
  config: { clientId: string; scopes?: string[] },
  callbackUrl: string,
  state: string
): string {
  const base = OAUTH_PROVIDERS[provider];
  if (!base) throw new Error(`Unknown OAuth provider: ${provider}`);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: (config.scopes ?? base.scopes).join(' '),
    state,
  });
  return `${base.authorizationUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  provider: string,
  code: string,
  config: { clientId: string; clientSecret: string },
  callbackUrl: string
): Promise<string> {
  const base = OAUTH_PROVIDERS[provider];
  const res = await fetch(base.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || 'Failed to exchange code for token');
  return data.access_token;
}

export async function fetchUserInfo(provider: string, accessToken: string) {
  const base = OAUTH_PROVIDERS[provider];
  const res = await fetch(base.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  const data = await res.json();
  return base.getUserInfo(data);
}
