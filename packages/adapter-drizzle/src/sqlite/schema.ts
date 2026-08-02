import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";

export const authUsers = sqliteTable("bolkauth_users", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"),
});

export const authAccounts = sqliteTable(
  "bolkauth_accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("auth_accounts_user_id_idx").on(account.userId),
  })
);

export const authSessions = sqliteTable(
  "bolkauth_sessions",
  {
    sessionToken: text("session_token").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("auth_sessions_user_id_idx").on(session.userId),
  })
);

export const authVerificationTokens = sqliteTable(
  "bolkauth_verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

export const authUserMetadata = sqliteTable(
  "bolkauth_user_metadata",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value", { mode: "json" }).notNull(),
  },
  (metadata) => ({
    userIdIdx: index("auth_user_metadata_user_id_idx").on(metadata.userId),
  })
);
