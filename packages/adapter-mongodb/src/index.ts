import type { Db, MongoClient } from "mongodb";
import type {
  BolkAuthAdapter,
  User,
  Session,
  Account,
  VerificationToken,
  UserMetadata,
} from "@bolkauth/core";
import { createHash, randomUUID } from "crypto";
import { getCollections } from "./collections";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createMongoAdapter(target: Db | MongoClient): BolkAuthAdapter {
  const db = "db" in target && typeof target.db === "function" ? target.db() : (target as Db);
  const { users, sessions, accounts, verificationTokens, userMetadata } = getCollections(db);

  return {
    async createUser(data): Promise<User> {
      const id = randomUUID();
      const now = new Date();

      const doc = {
        _id: id,
        email: data.email,
        name: data.name ?? null,
        image: data.image ?? null,
        password: data.password ?? null,
        emailVerified: data.emailVerified ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await users.insertOne(doc as any);

      return {
        id: doc._id,
        email: doc.email,
        name: doc.name ?? undefined,
        image: doc.image ?? undefined,
        password: doc.password ?? undefined,
        emailVerified: doc.emailVerified ?? null,
        createdAt: now,
        updatedAt: now,
      };
    },

    async findUserById(id: string): Promise<User | null> {
      const doc = await users.findOne({ _id: id as any });
      if (!doc) return null;

      return {
        id: doc._id as unknown as string,
        email: doc.email,
        name: doc.name ?? undefined,
        image: doc.image ?? undefined,
        password: doc.password ?? undefined,
        emailVerified: doc.emailVerified ?? null,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      };
    },

    async findUserByEmail(email: string): Promise<User | null> {
      const doc = await users.findOne({ email });
      if (!doc) return null;

      return {
        id: doc._id as unknown as string,
        email: doc.email,
        name: doc.name ?? undefined,
        image: doc.image ?? undefined,
        password: doc.password ?? undefined,
        emailVerified: doc.emailVerified ?? null,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      };
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (data.name !== undefined) update.name = data.name;
      if (data.email !== undefined) update.email = data.email;
      if (data.image !== undefined) update.image = data.image;
      if (data.password !== undefined) update.password = data.password;
      if (data.emailVerified !== undefined) update.emailVerified = data.emailVerified;

      const updated = await users.findOneAndUpdate(
        { _id: id as any },
        { $set: update },
        { returnDocument: "after" }
      );
      if (!updated) throw new Error(`User ${id} not found`);

      return {
        id: updated._id as unknown as string,
        email: updated.email,
        name: updated.name ?? undefined,
        image: updated.image ?? undefined,
        password: updated.password ?? undefined,
        emailVerified: updated.emailVerified ?? null,
        createdAt: updated.createdAt ?? new Date(),
        updatedAt: updated.updatedAt ?? new Date(),
      };
    },

    async deleteUser(id: string): Promise<void> {
      await Promise.all([
        users.deleteOne({ _id: id as any }),
        sessions.deleteMany({ userId: id }),
        accounts.deleteMany({ userId: id }),
        verificationTokens.deleteMany({ identifier: id }),
        userMetadata.deleteMany({ userId: id }),
      ]);
    },

    async createSession(data): Promise<Session> {
      const id = randomUUID();
      const now = new Date();
      const hashedToken = hashToken(data.token);

      const doc = {
        _id: id,
        sessionToken: hashedToken,
        userId: data.userId,
        expires: data.expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      await sessions.insertOne(doc as any);

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
      const doc = await sessions.findOne({ sessionToken: hashedToken });
      if (!doc) return null;

      return {
        id: doc._id as unknown as string,
        userId: doc.userId,
        token,
        expiresAt: doc.expires,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      };
    },

    async updateSession(id: string, data: Partial<Session>): Promise<Session> {
      const update: Record<string, unknown> = { updatedAt: new Date() };
      if (data.expiresAt) update.expires = data.expiresAt;
      if (data.token) update.sessionToken = hashToken(data.token);

      const updated = await sessions.findOneAndUpdate(
        { $or: [{ _id: id as any }, { sessionToken: id }, { sessionToken: hashToken(id) }] },
        { $set: update },
        { returnDocument: "after" }
      );
      if (!updated) throw new Error(`Session ${id} not found`);

      return {
        id: updated._id as unknown as string,
        userId: updated.userId,
        token: data.token ?? id,
        expiresAt: updated.expires,
        createdAt: updated.createdAt ?? new Date(),
        updatedAt: updated.updatedAt ?? new Date(),
      };
    },

    async deleteSession(id: string): Promise<void> {
      await sessions.deleteOne({
        $or: [{ _id: id as any }, { sessionToken: id }, { sessionToken: hashToken(id) }],
      });
    },

    async deleteUserSessions(userId: string): Promise<void> {
      await sessions.deleteMany({ userId });
    },

    async createAccount(data): Promise<Account> {
      const id = randomUUID();
      const now = new Date();

      const doc = {
        _id: id,
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        accessToken: data.accessToken ?? null,
        refreshToken: data.refreshToken ?? null,
        expiresAt: data.expiresAt ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await accounts.insertOne(doc as any);

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

    async findAccountByProvider(provider: string, providerAccountId: string): Promise<Account | null> {
      const doc = await accounts.findOne({ provider, providerAccountId });
      if (!doc) return null;

      return {
        id: doc._id as unknown as string,
        userId: doc.userId,
        provider: doc.provider,
        providerAccountId: doc.providerAccountId,
        accessToken: doc.accessToken ?? undefined,
        refreshToken: doc.refreshToken ?? undefined,
        expiresAt: doc.expiresAt ?? undefined,
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      };
    },

    async createVerificationToken(data): Promise<VerificationToken> {
      const now = new Date();
      const hashed = hashToken(data.token);

      const doc = {
        identifier: data.identifier,
        token: hashed,
        expiresAt: data.expiresAt,
        createdAt: now,
      };

      await verificationTokens.insertOne(doc as any);

      return {
        identifier: data.identifier,
        token: data.token,
        expiresAt: data.expiresAt,
        createdAt: now,
      };
    },

    async findVerificationToken(identifier: string, token: string): Promise<VerificationToken | null> {
      const hashed = hashToken(token);
      const doc = await verificationTokens.findOne({ identifier, token: hashed });
      if (!doc) return null;

      return {
        identifier: doc.identifier,
        token,
        expiresAt: doc.expiresAt,
        createdAt: doc.createdAt ?? new Date(),
      };
    },

    async deleteVerificationToken(identifier: string, token: string): Promise<void> {
      const hashed = hashToken(token);
      await verificationTokens.deleteOne({ identifier, token: hashed });
    },

    async getUserMetadata(userId: string, key: string): Promise<UserMetadata | null> {
      const doc = await userMetadata.findOne({ userId, key });
      if (!doc) return null;

      return {
        userId: doc.userId,
        key: doc.key,
        value: typeof doc.value === "string" ? doc.value : JSON.stringify(doc.value),
        createdAt: doc.createdAt ?? new Date(),
        updatedAt: doc.updatedAt ?? new Date(),
      };
    },

    async updateUserMetadata(userId: string, key: string, value: string): Promise<UserMetadata> {
      const now = new Date();

      await userMetadata.updateOne(
        { userId, key },
        {
          $set: {
            userId,
            key,
            value,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );

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

export * from "./collections";
