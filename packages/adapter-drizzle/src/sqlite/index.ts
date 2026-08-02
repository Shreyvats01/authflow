import { eq, and, or } from "drizzle-orm";
import type {
  BolkAuthAdapter,
  User,
  Session,
  Account,
  VerificationToken,
  UserMetadata,
} from "@bolkauth/core";
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

export function createDrizzleAdapter(db: any): BolkAuthAdapter {
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
        .where(eq(authUsers.id, id))
        .limit(1);
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
        .where(eq(authUsers.email, email))
        .limit(1);
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
      const updates: any = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.email !== undefined) updates.email = data.email;
      if (data.image !== undefined) updates.image = data.image;
      if (data.password !== undefined) updates.password = data.password;
      if (data.emailVerified !== undefined) updates.emailVerified = data.emailVerified;

      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(authUsers)
          .set(updates)
          .where(eq(authUsers.id, id))
          .returning();

        if (updated) {
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
        }
      }

      return (await this.findUserById(id))!;
    },

    async deleteUser(id: string): Promise<void> {
      await db.delete(authUsers).where(eq(authUsers.id, id));
    },

    async createSession(data): Promise<Session> {
      const now = new Date();
      const hashedToken = hashToken(data.token);

      await db.insert(authSessions).values({
        sessionToken: hashedToken,
        userId: data.userId,
        expires: data.expiresAt,
      });

      return {
        id: hashedToken,
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
        .where(eq(authSessions.sessionToken, hashedToken))
        .limit(1);

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

      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(authSessions)
          .set(updates)
          .where(
            or(
              eq(authSessions.sessionToken, id),
              eq(authSessions.sessionToken, hashToken(id))
            )
          )
          .returning();

        if (updated) {
          return {
            id: updated.sessionToken,
            userId: updated.userId,
            token: data.token ?? id,
            expiresAt: updated.expires,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }

      return (await this.findSessionByToken(data.token ?? id))!;
    },

    async deleteSession(id: string): Promise<void> {
      await db
        .delete(authSessions)
        .where(
          or(
            eq(authSessions.sessionToken, id),
            eq(authSessions.sessionToken, hashToken(id))
          )
        );
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
        .select({
          userId: authAccounts.userId,
          provider: authAccounts.provider,
          providerAccountId: authAccounts.providerAccountId,
          access_token: authAccounts.access_token,
          refresh_token: authAccounts.refresh_token,
          expires_at: authAccounts.expires_at,
        })
        .from(authAccounts)
        .where(
          and(
            eq(authAccounts.provider, provider),
            eq(authAccounts.providerAccountId, providerAccountId)
          )
        )
        .limit(1);

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
        .select({
          identifier: authVerificationTokens.identifier,
          expires: authVerificationTokens.expires,
        })
        .from(authVerificationTokens)
        .where(
          and(
            eq(authVerificationTokens.identifier, identifier),
            eq(authVerificationTokens.token, hashed)
          )
        )
        .limit(1);

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
        .select({
          userId: authUserMetadata.userId,
          key: authUserMetadata.key,
          value: authUserMetadata.value,
        })
        .from(authUserMetadata)
        .where(
          and(
            eq(authUserMetadata.userId, userId),
            eq(authUserMetadata.key, key)
          )
        )
        .limit(1);

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
          target: authUserMetadata.id,
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
