import type { Db, Collection } from 'mongodb';

export const COLLECTION_NAMES = {
  USERS: 'bolkauth_users',
  SESSIONS: 'bolkauth_sessions',
  ACCOUNTS: 'bolkauth_accounts',
  VERIFICATION_TOKENS: 'bolkauth_verification_tokens',
  USER_METADATA: 'bolkauth_user_metadata',
} as const;

export interface MongoCollections {
  users: Collection;
  sessions: Collection;
  accounts: Collection;
  verificationTokens: Collection;
  userMetadata: Collection;
}

export function getCollections(db: Db): MongoCollections {
  return {
    users: db.collection(COLLECTION_NAMES.USERS),
    sessions: db.collection(COLLECTION_NAMES.SESSIONS),
    accounts: db.collection(COLLECTION_NAMES.ACCOUNTS),
    verificationTokens: db.collection(COLLECTION_NAMES.VERIFICATION_TOKENS),
    userMetadata: db.collection(COLLECTION_NAMES.USER_METADATA),
  };
}

export async function ensureIndexes(db: Db): Promise<void> {
  const collections = getCollections(db);
  await Promise.all([
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.sessions.createIndex({ token: 1 }, { unique: true }),
    collections.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.accounts.createIndex({ provider: 1, providerAccountId: 1 }, { unique: true }),
    collections.verificationTokens.createIndex({ identifier: 1, token: 1 }, { unique: true }),
    collections.verificationTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.userMetadata.createIndex({ userId: 1, key: 1 }, { unique: true }),
  ]);
}
