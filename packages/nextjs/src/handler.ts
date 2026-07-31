import { NextRequest } from "next/server";

export function authFlowHandler(authInstance: any) {
  const handler = async (req: NextRequest) => {
    // Delegate the request to the core authInstance
    if (typeof authInstance.handleRequest === 'function') {
      return authInstance.handleRequest(req);
    }
    
    // Fallback stub for standard HTTP methods
    return new Response(JSON.stringify({ message: "AuthFlow handler" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  return {
    GET: handler,
    POST: handler,
    PATCH: handler,
    DELETE: handler,
  };
}
