import { NextRequest, NextResponse } from "next/server";

export interface BolkAuthMiddlewareOptions {
  signInUrl?: string;
  onboardingUrl?: string;
  publicRoutes?: string[];
}

export function bolkAuthMiddleware(authInstance: any, options: BolkAuthMiddlewareOptions = {}) {
  return async (req: NextRequest) => {
    const { 
      signInUrl = '/sign-in', 
      onboardingUrl = '/onboarding', 
      publicRoutes = [] 
    } = options;
    
    const path = req.nextUrl.pathname;

    // Bypass middleware for public routes
    if (publicRoutes.some(route => path.startsWith(route))) {
      return NextResponse.next();
    }

    const session = typeof authInstance.getSession === 'function' 
      ? await authInstance.getSession(req) 
      : null;

    if (!session) {
      return NextResponse.redirect(new URL(signInUrl, req.url));
    }

    if (session.user && !session.user.onboarded && path !== onboardingUrl) {
      return NextResponse.redirect(new URL(onboardingUrl, req.url));
    }

    return NextResponse.next();
  };
}

export const authFlowMiddleware = bolkAuthMiddleware;
export type AuthFlowMiddlewareOptions = BolkAuthMiddlewareOptions;
