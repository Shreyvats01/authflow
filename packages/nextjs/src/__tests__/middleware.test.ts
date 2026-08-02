import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { signJwt } from "@bolkauth/core";
import { compilePublicRoutes, bolkAuthMiddleware } from "../middleware";

describe("compilePublicRoutes", () => {
  it("matches exact routes using Set and pattern routes using RegExp for '/', '/sign-in', '/api/auth/*'", () => {
    const isPublic = compilePublicRoutes(["/", "/sign-in", "/api/auth/*"]);

    // Exact matches via Set lookup
    expect(isPublic("/")).toBe(true);
    expect(isPublic("/sign-in")).toBe(true);

    // Pattern matches via compiled RegExp
    expect(isPublic("/api/auth")).toBe(true);
    expect(isPublic("/api/auth/")).toBe(true);
    expect(isPublic("/api/auth/callback")).toBe(true);
    expect(isPublic("/api/auth/session/token")).toBe(true);

    // Non-public protected routes
    expect(isPublic("/dashboard")).toBe(false);
    expect(isPublic("/settings")).toBe(false);
    expect(isPublic("/api/user")).toBe(false);
    expect(isPublic("/sign-in-extra")).toBe(false);
  });
});

describe("bolkAuthMiddleware", () => {
  const secret = "test-middleware-secret-key-1234567890";
  const authInstance = {
    config: {
      secret,
    },
  };

  it("bypasses public routes with latency < 0.2ms without checking cookies or verifying JWTs", async () => {
    const middleware = bolkAuthMiddleware(authInstance, {
      publicRoutes: ["/", "/sign-in", "/api/auth/*"],
    });

    const req = new NextRequest("http://localhost:3000/sign-in");

    // Warm up execution
    await middleware(req);

    const start = performance.now();
    const res = await middleware(req);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10);
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("returns HTTP 307 redirect to /sign-in for unauthenticated requests", async () => {
    const middleware = bolkAuthMiddleware(authInstance, {
      signInUrl: "/sign-in",
      publicRoutes: ["/", "/sign-in"],
    });

    const req = new NextRequest("http://localhost:3000/dashboard");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/sign-in");
  });

  it("returns HTTP 307 redirect to custom signInUrl for unauthenticated requests", async () => {
    const middleware = bolkAuthMiddleware(authInstance, {
      signInUrl: "/login",
      publicRoutes: ["/login"],
    });

    const req = new NextRequest("http://localhost:3000/protected");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("returns HTTP 307 redirect to /onboarding for un-onboarded users", async () => {
    const middleware = bolkAuthMiddleware(authInstance, {
      signInUrl: "/sign-in",
      onboardingUrl: "/onboarding",
    });

    const jwt = await signJwt(
      {
        user: { id: "u_123", onboarded: false },
        sessionId: "s_123",
      },
      secret
    );

    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `bolkauth.session=${jwt}`,
      },
    });

    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/onboarding");
  });

  it("allows access to onboardingUrl without infinite redirect loop for un-onboarded users", async () => {
    const middleware = bolkAuthMiddleware(authInstance, {
      onboardingUrl: "/onboarding",
    });

    const jwt = await signJwt(
      {
        user: { id: "u_123", onboarded: false },
        sessionId: "s_123",
      },
      secret
    );

    const req = new NextRequest("http://localhost:3000/onboarding", {
      headers: {
        cookie: `bolkauth.session=${jwt}`,
      },
    });

    const res = await middleware(req);

    expect(res.status).toBe(200);
  });

  it("performs lightweight Edge Web Crypto JWT verification without hitting the database", async () => {
    const mockDbAdapter = {
      findUserById: vi.fn(),
      getSession: vi.fn(),
    };

    const authWithDb = {
      config: {
        secret,
        adapter: mockDbAdapter,
      },
    };

    const middleware = bolkAuthMiddleware(authWithDb);

    const jwt = await signJwt(
      {
        user: { id: "u_999", onboarded: true },
        sessionId: "s_999",
      },
      secret
    );

    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `bolkauth.session=${jwt}`,
      },
    });

    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(mockDbAdapter.findUserById).not.toHaveBeenCalled();
    expect(mockDbAdapter.getSession).not.toHaveBeenCalled();
  });

  it("redirects to signInUrl if JWT verification fails", async () => {
    const middleware = bolkAuthMiddleware(authInstance);

    const invalidJwt = "invalid.jwt.signature";

    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `bolkauth.session=${invalidJwt}`,
      },
    });

    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/sign-in");
  });
});
