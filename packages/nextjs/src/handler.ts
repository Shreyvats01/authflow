import { NextRequest } from "next/server";

export function bolkAuthHandler(authInstance: any) {
  const handler = async (req: NextRequest) => {
    if (typeof authInstance.handleRequest === 'function') {
      return authInstance.handleRequest(req);
    }
    
    return new Response(JSON.stringify({ message: "BolkAuth handler" }), {
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

export const authFlowHandler = bolkAuthHandler;
