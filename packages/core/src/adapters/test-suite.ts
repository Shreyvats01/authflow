import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { BolkAuthAdapter } from "./types";

export function runAdapterTests(
  setupFn: () => Promise<BolkAuthAdapter> | BolkAuthAdapter,
  teardownFn?: (adapter: BolkAuthAdapter) => Promise<void> | void
) {
  describe("BolkAuthAdapter Contract Test Suite", () => {
    let adapter: BolkAuthAdapter;

    beforeEach(async () => {
      adapter = await setupFn();
    });

    afterEach(async () => {
      if (teardownFn) {
        await teardownFn(adapter);
      }
    });

    describe("User Management", () => {
      it("createUser — creates user with all fields and returns valid User", async () => {
        const email = `test-${Date.now()}-${Math.random()}@example.com`;
        const emailVerified = new Date("2025-01-01T00:00:00.000Z");
        const user = await adapter.createUser({
          email,
          name: "John Doe",
          image: "https://example.com/avatar.png",
          password: "hashedpassword123",
          emailVerified,
        });

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(typeof user.id).toBe("string");
        expect(user.email).toBe(email);
        expect(user.name).toBe("John Doe");
        expect(user.image).toBe("https://example.com/avatar.png");
        expect(user.password).toBe("hashedpassword123");
        expect(user.emailVerified).not.toBeNull();
        expect(Math.abs(new Date(user.emailVerified!).getTime() - emailVerified.getTime())).toBeLessThan(1000);
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();
      });

      it("createUser — creates user with minimal fields (email only)", async () => {
        const email = `minimal-${Date.now()}-${Math.random()}@example.com`;
        const user = await adapter.createUser({ email });

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.email).toBe(email);
      });

      it("findUserById — retrieves created user by ID, returns null for non-existent ID", async () => {
        const email = `findid-${Date.now()}-${Math.random()}@example.com`;
        const created = await adapter.createUser({ email, name: "Alice" });

        const found = await adapter.findUserById(created.id);
        expect(found).not.toBeNull();
        expect(found?.id).toBe(created.id);
        expect(found?.email).toBe(email);

        const notFound = await adapter.findUserById("non-existent-id-12345");
        expect(notFound).toBeNull();
      });

      it("findUserByEmail — retrieves created user by email, returns null for non-existent email", async () => {
        const email = `findemail-${Date.now()}-${Math.random()}@example.com`;
        const created = await adapter.createUser({ email, name: "Bob" });

        const found = await adapter.findUserByEmail(email);
        expect(found).not.toBeNull();
        expect(found?.id).toBe(created.id);
        expect(found?.email).toBe(email);

        const notFound = await adapter.findUserByEmail("unknown@example.com");
        expect(notFound).toBeNull();
      });

      it("updateUser — updates user fields and persists changes", async () => {
        const email = `update-${Date.now()}-${Math.random()}@example.com`;
        const created = await adapter.createUser({ email, name: "Charlie" });

        const newEmail = `updated-${Date.now()}-${Math.random()}@example.com`;
        const updated = await adapter.updateUser(created.id, {
          name: "Charlie Updated",
          email: newEmail,
        });

        expect(updated.name).toBe("Charlie Updated");
        expect(updated.email).toBe(newEmail);

        const refetched = await adapter.findUserById(created.id);
        expect(refetched?.name).toBe("Charlie Updated");
        expect(refetched?.email).toBe(newEmail);
      });

      it("deleteUser — removes user and verify findUserById returns null", async () => {
        const email = `delete-${Date.now()}-${Math.random()}@example.com`;
        const created = await adapter.createUser({ email });

        await adapter.deleteUser(created.id);

        const found = await adapter.findUserById(created.id);
        expect(found).toBeNull();
      });
    });

    describe("Session Management", () => {
      it("createSession — creates session for a user", async () => {
        const user = await adapter.createUser({ email: `sess-${Date.now()}-${Math.random()}@example.com` });
        const token = `token-${Date.now()}-${Math.random()}`;
        const expiresAt = new Date(Date.now() + 3600 * 1000);

        const session = await adapter.createSession({
          userId: user.id,
          token,
          expiresAt,
        });

        expect(session).toBeDefined();
        expect(session.id).toBeDefined();
        expect(session.userId).toBe(user.id);
        expect(session.token).toBe(token);
        expect(Math.abs(new Date(session.expiresAt).getTime() - expiresAt.getTime())).toBeLessThan(1000);
      });

      it("findSessionByToken — returns session for valid token, null for invalid token", async () => {
        const user = await adapter.createUser({ email: `findsess-${Date.now()}-${Math.random()}@example.com` });
        const token = `token-find-${Date.now()}-${Math.random()}`;
        const expiresAt = new Date(Date.now() + 3600 * 1000);

        await adapter.createSession({ userId: user.id, token, expiresAt });

        const found = await adapter.findSessionByToken(token);
        expect(found).not.toBeNull();
        expect(found?.userId).toBe(user.id);
        expect(found?.token).toBe(token);

        const notFound = await adapter.findSessionByToken("non-existent-token");
        expect(notFound).toBeNull();
      });

      it("updateSession — updates session expiration and token", async () => {
        const user = await adapter.createUser({ email: `updatesess-${Date.now()}-${Math.random()}@example.com` });
        const token = `token-orig-${Date.now()}-${Math.random()}`;
        const expiresAt = new Date(Date.now() + 3600 * 1000);

        const created = await adapter.createSession({ userId: user.id, token, expiresAt });

        const newExpiresAt = new Date(Date.now() + 7200 * 1000);
        const updated = await adapter.updateSession(created.id, {
          expiresAt: newExpiresAt,
        });

        expect(Math.abs(new Date(updated.expiresAt).getTime() - newExpiresAt.getTime())).toBeLessThan(1000);

        const refetched = await adapter.findSessionByToken(token);
        expect(refetched).not.toBeNull();
        expect(Math.abs(new Date(refetched!.expiresAt).getTime() - newExpiresAt.getTime())).toBeLessThan(1000);
      });

      it("deleteSession — removes a single session by ID or token", async () => {
        const user = await adapter.createUser({ email: `delsess-${Date.now()}-${Math.random()}@example.com` });
        const token = `token-del-${Date.now()}-${Math.random()}`;
        const created = await adapter.createSession({
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        });

        await adapter.deleteSession(created.id);

        const found = await adapter.findSessionByToken(token);
        expect(found).toBeNull();
      });

      it("deleteUserSessions — removes all sessions associated with a user", async () => {
        const user = await adapter.createUser({ email: `delall-${Date.now()}-${Math.random()}@example.com` });
        const token1 = `token-all-1-${Date.now()}-${Math.random()}`;
        const token2 = `token-all-2-${Date.now()}-${Math.random()}`;

        await adapter.createSession({ userId: user.id, token: token1, expiresAt: new Date(Date.now() + 3600 * 1000) });
        await adapter.createSession({ userId: user.id, token: token2, expiresAt: new Date(Date.now() + 3600 * 1000) });

        await adapter.deleteUserSessions(user.id);

        expect(await adapter.findSessionByToken(token1)).toBeNull();
        expect(await adapter.findSessionByToken(token2)).toBeNull();
      });
    });

    describe("Account Management", () => {
      it("createAccount — links OAuth account to a user", async () => {
        const user = await adapter.createUser({ email: `acc-${Date.now()}-${Math.random()}@example.com` });
        const provider = "github";
        const providerAccountId = `gh_${Date.now()}_${Math.random()}`;

        const account = await adapter.createAccount({
          userId: user.id,
          provider,
          providerAccountId,
          accessToken: "access_token_123",
          refreshToken: "refresh_token_456",
          expiresAt: 1700000000,
        });

        expect(account).toBeDefined();
        expect(account.id).toBeDefined();
        expect(account.userId).toBe(user.id);
        expect(account.provider).toBe(provider);
        expect(account.providerAccountId).toBe(providerAccountId);
        expect(account.accessToken).toBe("access_token_123");
        expect(account.refreshToken).toBe("refresh_token_456");
      });

      it("findAccountByProvider — retrieves account by provider & providerAccountId, returns null for non-existent", async () => {
        const user = await adapter.createUser({ email: `findacc-${Date.now()}-${Math.random()}@example.com` });
        const provider = "google";
        const providerAccountId = `google_${Date.now()}_${Math.random()}`;

        await adapter.createAccount({
          userId: user.id,
          provider,
          providerAccountId,
        });

        const found = await adapter.findAccountByProvider(provider, providerAccountId);
        expect(found).not.toBeNull();
        expect(found?.userId).toBe(user.id);
        expect(found?.provider).toBe(provider);
        expect(found?.providerAccountId).toBe(providerAccountId);

        const notFound = await adapter.findAccountByProvider(provider, "non-existent-account");
        expect(notFound).toBeNull();
      });
    });

    describe("Verification Token Management", () => {
      it("createVerificationToken — creates verification token record", async () => {
        const identifier = `user-${Date.now()}-${Math.random()}@example.com`;
        const token = `vt-${Date.now()}-${Math.random()}`;
        const expiresAt = new Date(Date.now() + 1800 * 1000);

        const vt = await adapter.createVerificationToken({
          identifier,
          token,
          expiresAt,
        });

        expect(vt).toBeDefined();
        expect(vt.identifier).toBe(identifier);
        expect(vt.token).toBe(token);
        expect(Math.abs(new Date(vt.expiresAt).getTime() - expiresAt.getTime())).toBeLessThan(1000);
      });

      it("findVerificationToken — returns token for matching identifier and token, null otherwise", async () => {
        const identifier = `findvt-${Date.now()}-${Math.random()}@example.com`;
        const token = `vt-find-${Date.now()}-${Math.random()}`;
        const expiresAt = new Date(Date.now() + 1800 * 1000);

        await adapter.createVerificationToken({ identifier, token, expiresAt });

        const found = await adapter.findVerificationToken(identifier, token);
        expect(found).not.toBeNull();
        expect(found?.identifier).toBe(identifier);
        expect(found?.token).toBe(token);

        const wrongToken = await adapter.findVerificationToken(identifier, "wrong-token");
        expect(wrongToken).toBeNull();
      });

      it("deleteVerificationToken — deletes token by identifier and token", async () => {
        const identifier = `delvt-${Date.now()}-${Math.random()}@example.com`;
        const token = `vt-del-${Date.now()}-${Math.random()}`;
        await adapter.createVerificationToken({
          identifier,
          token,
          expiresAt: new Date(Date.now() + 1800 * 1000),
        });

        await adapter.deleteVerificationToken(identifier, token);

        const found = await adapter.findVerificationToken(identifier, token);
        expect(found).toBeNull();
      });
    });

    describe("User Metadata Management", () => {
      it("getUserMetadata & updateUserMetadata — set, retrieve, and update user metadata", async () => {
        const user = await adapter.createUser({ email: `meta-${Date.now()}-${Math.random()}@example.com` });
        const key = "theme";

        const initial = await adapter.getUserMetadata(user.id, key);
        expect(initial).toBeNull();

        const created = await adapter.updateUserMetadata(user.id, key, "dark");
        expect(created).toBeDefined();
        expect(created.userId).toBe(user.id);
        expect(created.key).toBe(key);
        expect(created.value).toBe("dark");

        const found = await adapter.getUserMetadata(user.id, key);
        expect(found).not.toBeNull();
        expect(found?.value).toBe("dark");

        const updated = await adapter.updateUserMetadata(user.id, key, "light");
        expect(updated.value).toBe("light");

        const refetched = await adapter.getUserMetadata(user.id, key);
        expect(refetched?.value).toBe("light");
      });
    });
  });
}
