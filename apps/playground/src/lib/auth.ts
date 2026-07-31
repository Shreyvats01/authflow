import { createBolkAuth, BolkAuthAdapter } from "@bolkauth/core";

const memoryUsers = new Map<string, any>();
const memorySessions = new Map<string, any>();
const memoryMetadata = new Map<string, any>();

export const memoryAdapter: BolkAuthAdapter = {
  async createUser(data) {
    const user = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email: data.email,
      name: data.name ?? undefined,
      image: data.image ?? undefined,
      emailVerified: data.emailVerified ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.set(user.id, user);
    return user;
  },

  async findUserById(id) {
    return memoryUsers.get(id) ?? null;
  },

  async findUserByEmail(email) {
    const users = Array.from(memoryUsers.values());
    return users.find((u) => u.email === email) ?? null;
  },

  async updateUser(id, data) {
    const user = memoryUsers.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...data, updatedAt: new Date() };
    memoryUsers.set(id, updated);
    return updated;
  },

  async deleteUser(id) {
    memoryUsers.delete(id);
  },

  async createSession(data) {
    const session = {
      id: `sess_${Math.random().toString(36).substring(2, 9)}`,
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memorySessions.set(data.token, session);
    return session;
  },

  async findSessionByToken(token) {
    return memorySessions.get(token) ?? null;
  },

  async updateSession(id, data) {
    const session = memorySessions.get(id);
    if (!session) throw new Error("Session not found");
    const updated = { ...session, ...data, updatedAt: new Date() };
    memorySessions.set(id, updated);
    return updated;
  },

  async deleteSession(id) {
    memorySessions.delete(id);
  },

  async deleteUserSessions(userId) {
    const entries = Array.from(memorySessions.entries());
    for (const [token, session] of entries) {
      if (session.userId === userId) {
        memorySessions.delete(token);
      }
    }
  },

  async createAccount(data) {
    return {
      id: `acc_${Math.random().toString(36).substring(2, 9)}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async findAccountByProvider() {
    return null;
  },

  async createVerificationToken(data) {
    return {
      ...data,
      createdAt: new Date(),
    };
  },

  async findVerificationToken() {
    return null;
  },

  async deleteVerificationToken() {},

  async getUserMetadata(userId, key) {
    const meta = memoryMetadata.get(`${userId}:${key}`);
    return meta ?? null;
  },

  async updateUserMetadata(userId, key, value) {
    const meta = {
      userId,
      key,
      value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryMetadata.set(`${userId}:${key}`, meta);
    return meta;
  },
};

export const auth = createBolkAuth({
  adapter: memoryAdapter,
  secret: "playground_secret_key_min_32_characters_long_12345",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: "mock_github_client_id",
      clientSecret: "mock_github_client_secret",
    },
  },
  onboarding: {
    enabled: true,
    requiredForAccess: true,
    redirectUrl: "/onboarding",
  },
});
