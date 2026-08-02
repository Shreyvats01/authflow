export interface User {
  id: string;
  email: string;
  emailVerified?: Date | null;
  name?: string;
  image?: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface UserMetadata {
  userId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BolkAuthAdapter {
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session>;
  findSessionByToken(token: string): Promise<Session | null>;
  updateSession(id: string, session: Partial<Session>): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;

  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account>;
  findAccountByProvider(provider: string, providerAccountId: string): Promise<Account | null>;

  createVerificationToken(token: Omit<VerificationToken, 'createdAt'>): Promise<VerificationToken>;
  findVerificationToken(identifier: string, token: string): Promise<VerificationToken | null>;
  deleteVerificationToken(identifier: string, token: string): Promise<void>;

  getUserMetadata(userId: string, key: string): Promise<UserMetadata | null>;
  updateUserMetadata(userId: string, key: string, value: string): Promise<UserMetadata>;
}
