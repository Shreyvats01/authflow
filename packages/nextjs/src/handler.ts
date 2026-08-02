import { NextRequest } from "next/server";

export function bolkAuthHandler(authInstance: any) {
  const handler = async (req: NextRequest) => {
    let response: Response;

    if (typeof authInstance?.handleRequest === "function") {
      response = await authInstance.handleRequest(req);
    } else {
      response = new Response(JSON.stringify({ message: "BolkAuth handler" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fast forwarding & header propagation
    const propagatedHeaders = new Headers(response.headers);

    // Propagate Cache-Control to ensure auth responses avoid downstream proxy caching
    if (!propagatedHeaders.has("Cache-Control")) {
      propagatedHeaders.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: propagatedHeaders,
    });
  };

  return {
    GET: handler,
    POST: handler,
    PATCH: handler,
    DELETE: handler,
    OPTIONS: handler,
  };
}

export const authFlowHandler = bolkAuthHandler;

