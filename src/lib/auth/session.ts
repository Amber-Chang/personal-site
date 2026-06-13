import { createHash, randomBytes } from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24;

export const ADMIN_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: ADMIN_SESSION_MAX_AGE,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export type AdminSessionRecord = {
  expiresAt: string;
  passwordVersionHash: string;
  sessionTokenHash: string;
};

export type AdminSessionRepository = {
  createSession: (input: AdminSessionRecord) => Promise<void>;
  getSessionByTokenHash: (sessionTokenHash: string) => Promise<AdminSessionRecord | null>;
  deleteSessionByTokenHash: (sessionTokenHash: string) => Promise<void>;
};

function hashValue(input: { scope: string; value: string }): string {
  return createHash("sha256").update(`${input.scope}:${input.value}`).digest("hex");
}

export function buildAdminPasswordVersionHash(adminPassword: string): string {
  return hashValue({
    scope: "admin-password-version",
    value: adminPassword,
  });
}

export function hashAdminSessionToken(sessionToken: string): string {
  return hashValue({
    scope: "admin-session-token",
    value: sessionToken,
  });
}

export function generateAdminSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function createAdminSessionManager(input: {
  repository: AdminSessionRepository;
  now?: () => Date;
}) {
  const now = input.now ?? (() => new Date());

  return {
    async createSession(session: {
      adminPassword: string;
    }): Promise<string> {
      const createdAt = now();
      const sessionToken = generateAdminSessionToken();

      await input.repository.createSession({
        expiresAt: new Date(createdAt.getTime() + ADMIN_SESSION_MAX_AGE * 1000).toISOString(),
        passwordVersionHash: buildAdminPasswordVersionHash(session.adminPassword),
        sessionTokenHash: hashAdminSessionToken(sessionToken),
      });

      return sessionToken;
    },
    async hasValidSession(session: {
      adminPassword: string;
      sessionToken: string | null | undefined;
    }): Promise<boolean> {
      const rawSessionToken = session.sessionToken?.trim();

      if (!rawSessionToken) {
        return false;
      }

      const storedSession = await input.repository.getSessionByTokenHash(hashAdminSessionToken(rawSessionToken));

      if (!storedSession) {
        return false;
      }

      if (storedSession.passwordVersionHash !== buildAdminPasswordVersionHash(session.adminPassword)) {
        return false;
      }

      if (new Date(storedSession.expiresAt).getTime() <= now().getTime()) {
        return false;
      }

      return true;
    },
  };
}
