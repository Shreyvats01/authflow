import { NextRequest, NextResponse } from "next/server";

export interface AuthFlowMiddlewareOptions {
  signInUrl?: string;
  onboardingUrl?: string;
  publicRoutes?: string[];
}

export function authFlowMiddleware(authInstance: any, options: AuthFlowMiddlewareOptions = {}) {
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
      : null; // Stub

    // Redirect unauthenticated users
    if (!session) {
      return NextResponse.redirect(new URL(signInUrl, req.url));
    }

    // Redirect un-onboarded users
    if (session.user && !session.user.onboarded && path !== onboardingUrl) {
      return NextResponse.redirect(new URL(onboardingUrl, req.url));
    }

    return NextResponse.next();
  };
}
