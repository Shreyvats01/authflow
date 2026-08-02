import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  primaryKey,
  json,
  index,
} from "drizzle-orm/mysql-core";

export const authUsers = mysqlTable("bolkauth_users", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: varchar("image", { length: 2048 }),
  password: text("password"),
});

export const authAccounts = mysqlTable(
  "bolkauth_accounts",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("auth_accounts_user_id_idx").on(account.userId),
  })
);

export const authSessions = mysqlTable(
  "bolkauth_sessions",
  {
    sessionToken: varchar("session_token", { length: 255 }).primaryKey().notNull(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("auth_sessions_user_id_idx").on(session.userId),
  })
);

export const authVerificationTokens = mysqlTable(
  "bolkauth_verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const authUserMetadata = mysqlTable(
  "bolkauth_user_metadata",
  {
    id: varchar("id", { length: 255 }).primaryKey().notNull(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 255 }).notNull(),
    value: json("value").notNull(),
  },
  (metadata) => ({
    userIdIdx: index("auth_user_metadata_user_id_idx").on(metadata.userId),
  })
);
