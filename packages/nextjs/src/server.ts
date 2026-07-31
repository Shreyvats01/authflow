import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "@bolkauth/core";

export function createServerHelpers(authInstance: { config: { secret: string; session?: { cookieName?: string }; adapter?: any } }) {
  return {
    async getSession() {
      const cookieStore = await cookies();
      const cookieName = authInstance.config.session?.cookieName ?? "bolkauth.session";
      const jwt = cookieStore.get(cookieName)?.value;
      if (!jwt) return null;
      try {
        const payload = (await verifyJwt(jwt, authInstance.config.secret)) as { sessionId: string; userId: string };
        if (!payload || !payload.sessionId || !payload.userId) return null;
        return { id: payload.sessionId, userId: payload.userId, token: jwt };
      } catch {
        return null;
      }
    },
    async getUser() {
      const session = await this.getSession();
      if (!session || !authInstance.config.adapter) return null;
      return await authInstance.config.adapter.findUserById(session.userId);
    },
    async requireAuth(signInUrl = "/sign-in") {
      const user = await this.getUser();
      if (!user) redirect(signInUrl);
      return user;
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get("bolkauth.session")?.value || cookieStore.get("authflow.session")?.value;
  if (!jwt) return null;
  return { id: "session", token: jwt, user: { id: "user" } };
}

export async function getUser() {
  const session = await getSession();
  if (!session) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  return user;
}
