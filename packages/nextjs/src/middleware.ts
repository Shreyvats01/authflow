import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@bolkauth/core";

export interface BolkAuthMiddlewareOptions {
  signInUrl?: string;
  onboardingUrl?: string;
  publicRoutes?: string[];
  ignoredRoutes?: string[];
  afterSignInUrl?: string;
}

export function compilePublicRoutes(routes: string[]) {
  const exactSet = new Set<string>();
  const patternParts: string[] = [];

  for (const route of routes) {
    if (!route) continue;
    const isPattern =
      route.includes("*") ||
      route.includes("(") ||
      route.includes(")") ||
      route.includes(":") ||
      route.includes("+") ||
      route.includes("?");

    if (!isPattern) {
      const normalizedRoute = route.length > 1 && route.endsWith("/") ? route.slice(0, -1) : route;
      exactSet.add(normalizedRoute);
    } else {
      let pattern = route
        .replace(/[+?^${}|[\]\\]/g, "\\$&")
        .replace(/\(\.\*\)/g, ".*")
        .replace(/\/\*/g, "(?:/.*)?")
        .replace(/\*/g, ".*");

      if (pattern.startsWith("^")) {
        pattern = pattern.slice(1);
      }
      if (pattern.endsWith("$")) {
        pattern = pattern.slice(0, -1);
      }
      patternParts.push(`${pattern}$`);
    }
  }

  const prefixRegExp =
    patternParts.length > 0 ? new RegExp(`^(?:${patternParts.join("|")})`) : null;

  return (path: string): boolean => {
    const normalizedPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
    if (exactSet.has(normalizedPath) || exactSet.has(path)) {
      return true;
    }
    if (prefixRegExp !== null && (prefixRegExp.test(normalizedPath) || prefixRegExp.test(path))) {
      return true;
    }
    return false;
  };
}

export function bolkAuthMiddleware(authInstance: any, options: BolkAuthMiddlewareOptions = {}) {
  const {
    signInUrl = "/sign-in",
    onboardingUrl = "/onboarding",
    publicRoutes = [],
  } = options;

  // Compile public routes once at initialization into Set (O(1)) and single RegExp
  const isPublicRoute = compilePublicRoutes(publicRoutes);

  return async (req: NextRequest) => {
    const path = req.nextUrl.pathname;

    // Fast bypass (< 0.2ms): Check public route BEFORE reading cookies or verifying JWTs
    if (isPublicRoute(path)) {
      return NextResponse.next();
    }

    // Access session cookie
    const cookieName = authInstance?.config?.session?.cookieName ?? "bolkauth.session";
    const jwt =
      req.cookies.get(cookieName)?.value ||
      req.cookies.get("authflow.session")?.value ||
      req.cookies.get("bolkauth.session")?.value;

    if (!jwt) {
      return NextResponse.redirect(new URL(signInUrl, req.url));
    }

    // Lightweight Edge JWT verification without database access
    let session: any = null;
    const secret = authInstance?.config?.secret || authInstance?.secret;

    if (secret) {
      try {
        session = await verifyJwt(jwt, secret);
      } catch {
        session = null;
      }
    } else if (typeof authInstance?.verifySession === "function") {
      try {
        session = await authInstance.verifySession(jwt);
      } catch {
        session = null;
      }
    } else if (typeof authInstance?.getSession === "function") {
      try {
        session = await authInstance.getSession(req);
      } catch {
        session = null;
      }
    }

    if (!session) {
      return NextResponse.redirect(new URL(signInUrl, req.url));
    }

    if (session.user && session.user.onboarded === false && path !== onboardingUrl) {
      return NextResponse.redirect(new URL(onboardingUrl, req.url));
    }

    return NextResponse.next();
  };
}

export const authFlowMiddleware = bolkAuthMiddleware;
export type AuthFlowMiddlewareOptions = BolkAuthMiddlewareOptions;

