import type { BolkAuthAdapter } from '@bolkauth/core';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Dialect schema paths
export const postgresqlSchemaPath = path.join(__dirname, '../prisma/postgresql.prisma');
export const mysqlSchemaPath = path.join(__dirname, '../prisma/mysql.prisma');
export const sqliteSchemaPath = path.join(__dirname, '../prisma/sqlite.prisma');

/**
 * @deprecated Use `postgresqlSchemaPath` instead.
 */
export const schemaPath = postgresqlSchemaPath;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createPrismaAdapter(db: any): BolkAuthAdapter {
  return {
    async createUser(user) {
      return await db.authUser.create({ data: user });
    },
    async findUserById(id) {
      return await db.authUser.findUnique({ where: { id } });
    },
    async findUserByEmail(email) {
      return await db.authUser.findUnique({ where: { email } });
    },
    async updateUser(id, user) {
      return await db.authUser.update({ where: { id }, data: user });
    },
    async deleteUser(id) {
      await db.authUser.delete({ where: { id } });
    },

    async createSession(session) {
      return await db.authSession.create({
        data: {
          ...session,
          token: hashToken(session.token),
        },
      });
    },
    async findSessionByToken(token) {
      const session = await db.authSession.findUnique({
        where: { token: hashToken(token) },
        select: {
          id: true,
          userId: true,
          token: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return session;
    },
    async updateSession(id, session) {
      if (session.token) {
        session = { ...session, token: hashToken(session.token) };
      }
      return await db.authSession.update({ where: { id }, data: session });
    },
    async deleteSession(id) {
      await db.authSession.delete({ where: { id } });
    },
    async deleteUserSessions(userId) {
      await db.authSession.deleteMany({ where: { userId } });
    },

    async createAccount(account) {
      return await db.authAccount.create({ data: account });
    },
    async findAccountByProvider(provider, providerAccountId) {
      return await db.authAccount.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    async createVerificationToken(token) {
      return await db.authVerificationToken.create({
        data: {
          ...token,
          token: hashToken(token.token),
        },
      });
    },
    async findVerificationToken(identifier, token) {
      return await db.authVerificationToken.findUnique({
        where: { identifier_token: { identifier, token: hashToken(token) } },
      });
    },
    async deleteVerificationToken(identifier, token) {
      await db.authVerificationToken.delete({
        where: { identifier_token: { identifier, token: hashToken(token) } },
      });
    },

    async getUserMetadata(userId, key) {
      return await db.authUserMetadata.findUnique({
        where: { userId_key: { userId, key } },
      });
    },
    async updateUserMetadata(userId, key, value) {
      return await db.authUserMetadata.upsert({
        where: { userId_key: { userId, key } },
        update: { value },
        create: { userId, key, value },
      });
    },
  };
}
