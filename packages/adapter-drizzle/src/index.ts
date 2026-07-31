import { eq, and } from "drizzle-orm";
import type {
  AuthFlowAdapter,
  User,
  Session,
  Account,
  VerificationToken,
  UserMetadata,
} from "@authflow/core";
import {
  authUsers,
  authAccounts,
  authSessions,
  authVerificationTokens,
  authUserMetadata,
} from "./schema";
import { createHash, randomUUID } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createDrizzleAdapter(db: any): AuthFlowAdapter {
  return {
    async createUser(data): Promise<User> {
      const id = randomUUID();
      const now = new Date();
      const [newUser] = await db
        .insert(authUsers)
        .values({
          id,
          name: data.name ?? null,
          email: data.email,
          emailVerified: data.emailVerified ?? null,
          image: data.image ?? null,
          password: data.password ?? null,
        })
        .returning();

      return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name ?? undefined,
        image: newUser.image ?? undefined,
        password: newUser.password ?? undefined,
        emailVerified: newUser.emailVerified ?? null,
        createdAt: now,
        updatedAt: now,
      };
    },

    async findUserById(id: string): Promise<User | null> {
      const [user] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.id, id));
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        password: user.password ?? undefined,
        emailVerified: user.emailVerified ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async findUserByEmail(email: string): Promise<User | null> {
      const [user] = await db
        .select()
        .from(authUsers)
        .where(eq(authUsers.email, email));
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
        password: user.password ?? undefined,
        emailVerified: user.emailVerified ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
      const [updated] = await db
        .update(authUsers)
        .set({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.image !== undefined && { image: data.image }),
          ...(data.password !== undefined && { password: data.password }),
          ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
        })
        .where(eq(authUsers.id, id))
        .returning();

      return {
        id: updated.id,
        email: updated.email,
        name: updated.name ?? undefined,
        image: updated.image ?? undefined,
        password: updated.password ?? undefined,
        emailVerified: updated.emailVerified ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async deleteUser(id: string): Promise<void> {
      await db.delete(authUsers).where(eq(authUsers.id, id));
    },

    async createSession(data): Promise<Session> {
      const id = randomUUID();
      const now = new Date();
      const hashedToken = hashToken(data.token);

      await db.insert(authSessions).values({
        sessionToken: hashedToken,
        userId: data.userId,
        expires: data.expiresAt,
      });

      return {
        id,
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: now,
        updatedAt: now,
      };
    },

    async findSessionByToken(token: string): Promise<Session | null> {
      const hashedToken = hashToken(token);
      const [session] = await db
        .select()
        .from(authSessions)
        .where(eq(authSessions.sessionToken, hashedToken));

      if (!session) return null;
      return {
        id: session.sessionToken,
        userId: session.userId,
        token,
        expiresAt: session.expires,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async updateSession(id: string, data: Partial<Session>): Promise<Session> {
      const updates: any = {};
      if (data.expiresAt) updates.expires = data.expiresAt;
      if (data.token) updates.sessionToken = hashToken(data.token);

      const [updated] = await db
        .update(authSessions)
        .set(updates)
        .where(eq(authSessions.sessionToken, id))
        .returning();

      return {
        id: updated.sessionToken,
        userId: updated.userId,
        token: data.token ?? id,
        expiresAt: updated.expires,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async deleteSession(id: string): Promise<void> {
      await db
        .delete(authSessions)
        .where(eq(authSessions.sessionToken, id));
    },

    async deleteUserSessions(userId: string): Promise<void> {
      await db.delete(authSessions).where(eq(authSessions.userId, userId));
    },

    async createAccount(data): Promise<Account> {
      const id = randomUUID();
      const now = new Date();

      await db.insert(authAccounts).values({
        userId: data.userId,
        type: "oauth",
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        access_token: data.accessToken ?? null,
        refresh_token: data.refreshToken ?? null,
        expires_at: data.expiresAt ?? null,
      });

      return {
        id,
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        createdAt: now,
        updatedAt: now,
      };
    },

    async findAccountByProvider(
      provider: string,
      providerAccountId: string
    ): Promise<Account | null> {
      const [account] = await db
        .select()
        .from(authAccounts)
        .where(
          and(
            eq(authAccounts.provider, provider),
            eq(authAccounts.providerAccountId, providerAccountId)
          )
        );

      if (!account) return null;
      return {
        id: `${provider}:${providerAccountId}`,
        userId: account.userId,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        accessToken: account.access_token ?? undefined,
        refreshToken: account.refresh_token ?? undefined,
        expiresAt: account.expires_at ?? undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async createVerificationToken(data): Promise<VerificationToken> {
      const now = new Date();
      const hashed = hashToken(data.token);

      await db.insert(authVerificationTokens).values({
        identifier: data.identifier,
        token: hashed,
        expires: data.expiresAt,
      });

      return {
        identifier: data.identifier,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: now,
      };
    },

    async findVerificationToken(
      identifier: string,
      token: string
    ): Promise<VerificationToken | null> {
      const hashed = hashToken(token);
      const [vt] = await db
        .select()
        .from(authVerificationTokens)
        .where(
          and(
            eq(authVerificationTokens.identifier, identifier),
            eq(authVerificationTokens.token, hashed)
          )
        );

      if (!vt) return null;
      return {
        identifier: vt.identifier,
        token,
        expiresAt: vt.expires,
        createdAt: new Date(),
      };
    },

    async deleteVerificationToken(
      identifier: string,
      token: string
    ): Promise<void> {
      const hashed = hashToken(token);
      await db
        .delete(authVerificationTokens)
        .where(
          and(
            eq(authVerificationTokens.identifier, identifier),
            eq(authVerificationTokens.token, hashed)
          )
        );
    },

    async getUserMetadata(
      userId: string,
      key: string
    ): Promise<UserMetadata | null> {
      const [row] = await db
        .select()
        .from(authUserMetadata)
        .where(
          and(
            eq(authUserMetadata.userId, userId),
            eq(authUserMetadata.key, key)
          )
        );

      if (!row) return null;
      return {
        userId: row.userId,
        key: row.key,
        value: typeof row.value === "string" ? row.value : JSON.stringify(row.value),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },

    async updateUserMetadata(
      userId: string,
      key: string,
      value: string
    ): Promise<UserMetadata> {
      const now = new Date();
      const id = `${userId}:${key}`;

      await db
        .insert(authUserMetadata)
        .values({
          id,
          userId,
          key,
          value,
        })
        .onConflictDoUpdate({
          target: [authUserMetadata.id],
          set: { value },
        });

      return {
        userId,
        key,
        value,
        createdAt: now,
        updatedAt: now,
      };
    },
  };
}

export * from "./schema";
