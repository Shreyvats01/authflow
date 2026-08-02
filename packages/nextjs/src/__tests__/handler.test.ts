import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { bolkAuthHandler, authFlowHandler } from "../handler";

describe("bolkAuthHandler", () => {
  it("exports HTTP method handlers GET, POST, PATCH, DELETE, OPTIONS", () => {
    const handlers = bolkAuthHandler({});
    expect(handlers).toHaveProperty("GET");
    expect(handlers).toHaveProperty("POST");
    expect(handlers).toHaveProperty("PATCH");
    expect(handlers).toHaveProperty("DELETE");
    expect(handlers).toHaveProperty("OPTIONS");
    expect(typeof handlers.GET).toBe("function");
    expect(typeof handlers.POST).toBe("function");
    expect(typeof handlers.PATCH).toBe("function");
    expect(typeof handlers.DELETE).toBe("function");
    expect(typeof handlers.OPTIONS).toBe("function");
  });

  it("exports authFlowHandler as an alias for bolkAuthHandler", () => {
    expect(authFlowHandler).toBe(bolkAuthHandler);
  });

  it("forwards GET, POST, PATCH, and DELETE requests to authInstance.handleRequest", async () => {
    const mockHandleRequest = vi.fn().mockImplementation(async (req: NextRequest) => {
      return new Response(JSON.stringify({ method: req.method, path: req.nextUrl.pathname }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const authInstance = { handleRequest: mockHandleRequest };
    const handlers = bolkAuthHandler(authInstance);

    const methods = ["GET", "POST", "PATCH", "DELETE"] as const;

    for (const method of methods) {
      const req = new NextRequest(`http://localhost:3000/api/auth/session`, { method });
      const res = await handlers[method](req);

      expect(mockHandleRequest).toHaveBeenCalledWith(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ method, path: "/api/auth/session" });
    }
  });

  it("propagates Set-Cookie header and sets Cache-Control header", async () => {
    const cookieHeader = "bolkauth.session=token_123; Path=/; HttpOnly; SameSite=Lax";
    const mockHandleRequest = vi.fn().mockImplementation(async () => {
      const headers = new Headers();
      headers.append("Set-Cookie", cookieHeader);
      headers.set("Content-Type", "application/json");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers,
      });
    });

    const handlers = bolkAuthHandler({ handleRequest: mockHandleRequest });
    const req = new NextRequest("http://localhost:3000/api/auth/login", { method: "POST" });
    const res = await handlers.POST(req);

    expect(res.headers.get("Set-Cookie")).toBe(cookieHeader);
    expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0, must-revalidate");
  });

  it("preserves custom Cache-Control header if already set", async () => {
    const customCacheControl = "public, max-age=3600";
    const mockHandleRequest = vi.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Cache-Control": customCacheControl },
      });
    });

    const handlers = bolkAuthHandler({ handleRequest: mockHandleRequest });
    const req = new NextRequest("http://localhost:3000/api/auth/config", { method: "GET" });
    const res = await handlers.GET(req);

    expect(res.headers.get("Cache-Control")).toBe(customCacheControl);
  });

  it("returns fallback JSON response when handleRequest is not defined on authInstance", async () => {
    const handlers = bolkAuthHandler({});
    const req = new NextRequest("http://localhost:3000/api/auth/test", { method: "GET" });
    const res = await handlers.GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ message: "BolkAuth handler" });
    expect(res.headers.get("Cache-Control")).toBe("no-store, max-age=0, must-revalidate");
  });
});
