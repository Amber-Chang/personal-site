import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

async function loadSessionModuleWithNodeEnv(nodeEnv: string | undefined) {
  const previousNodeEnv = process.env.NODE_ENV;

  if (nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = nodeEnv;
  }

  try {
    return await loadModule<{
      ADMIN_SESSION_COOKIE_OPTIONS: {
        httpOnly: boolean;
        maxAge: number;
        path: string;
        sameSite: "lax";
        secure: boolean;
      };
      ADMIN_SESSION_MAX_AGE: number;
      createAdminSessionToken: (adminPassword: string) => string;
      hasValidAdminSessionToken: (input: {
        adminPassword: string;
        sessionToken: string | null | undefined;
      }) => boolean;
    }>(`./session.ts?node-env=${nodeEnv ?? "undefined"}-${Date.now()}`, "admin session");
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

test("hasValidAdminSessionToken accepts the matching password token", async () => {
  const sessionModule = await loadModule<{
    createAdminSessionManager: (input: {
      repository: {
        createSession: (input: {
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        }) => Promise<void>;
        getSessionByTokenHash: (sessionTokenHash: string) => Promise<{
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        } | null>;
      };
      now?: () => Date;
    }) => {
      createSession: (input: { adminPassword: string }) => Promise<string>;
      hasValidSession: (input: { adminPassword: string; sessionToken: string | null | undefined }) => Promise<boolean>;
    };
  }>("./session.ts", "admin session");
  const storedSessions: Array<{
    expiresAt: string;
    passwordVersionHash: string;
    sessionTokenHash: string;
  }> = [];

  const manager = sessionModule.createAdminSessionManager({
    repository: {
      createSession: async (input) => {
        storedSessions.push(input);
      },
      getSessionByTokenHash: async (sessionTokenHash) => storedSessions.find((session) => session.sessionTokenHash === sessionTokenHash) ?? null,
    },
    now: () => new Date("2026-06-07T12:00:00.000Z"),
  });

  const sessionToken = await manager.createSession({
    adminPassword: "super-secret",
  });

  assert.equal(typeof sessionToken, "string");
  assert.notEqual(sessionToken, storedSessions[0]?.sessionTokenHash);
  assert.equal(storedSessions.length, 1);
  assert.equal(
    await manager.hasValidSession({
      adminPassword: "super-secret",
      sessionToken,
    }),
    true,
  );
});

test("hasValidAdminSessionToken rejects mismatched tokens", async () => {
  const sessionModule = await loadModule<{
    createAdminSessionManager: (input: {
      repository: {
        createSession: (input: {
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        }) => Promise<void>;
        getSessionByTokenHash: (sessionTokenHash: string) => Promise<{
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        } | null>;
      };
      now?: () => Date;
    }) => {
      createSession: (input: { adminPassword: string }) => Promise<string>;
      hasValidSession: (input: { adminPassword: string; sessionToken: string | null | undefined }) => Promise<boolean>;
    };
  }>("./session.ts", "admin session");
  const manager = sessionModule.createAdminSessionManager({
    repository: {
      createSession: async () => undefined,
      getSessionByTokenHash: async () => null,
    },
    now: () => new Date("2026-06-07T12:00:00.000Z"),
  });

  assert.equal(
    await manager.hasValidSession({
      adminPassword: "super-secret",
      sessionToken: "invalid-token",
    }),
    false,
  );
});

test("admin session cookie defaults use 7 day lifetime with httpOnly and lax sameSite", async () => {
  const sessionModule = await loadSessionModuleWithNodeEnv("test");

  assert.equal(sessionModule.ADMIN_SESSION_MAX_AGE, 60 * 60 * 24 * 7);
  assert.deepEqual(sessionModule.ADMIN_SESSION_COOKIE_OPTIONS, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: false,
  });
});

test("admin session cookie is secure in production", async () => {
  const sessionModule = await loadSessionModuleWithNodeEnv("production");

  assert.equal(sessionModule.ADMIN_SESSION_COOKIE_OPTIONS.secure, true);
});

test("admin session rejects expired server-side sessions", async () => {
  const sessionModule = await loadModule<{
    createAdminSessionManager: (input: {
      repository: {
        createSession: (input: {
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        }) => Promise<void>;
        getSessionByTokenHash: (sessionTokenHash: string) => Promise<{
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        } | null>;
      };
      now?: () => Date;
    }) => {
      createSession: (input: { adminPassword: string }) => Promise<string>;
      hasValidSession: (input: { adminPassword: string; sessionToken: string | null | undefined }) => Promise<boolean>;
    };
  }>("./session.ts", "admin session");

  const storedSessions: Array<{
    expiresAt: string;
    passwordVersionHash: string;
    sessionTokenHash: string;
  }> = [];

  const issueTime = new Date("2026-06-07T12:00:00.000Z");
  const validateTime = new Date("2026-06-15T12:00:01.000Z");

  const issuingManager = sessionModule.createAdminSessionManager({
    repository: {
      createSession: async (input) => {
        storedSessions.push(input);
      },
      getSessionByTokenHash: async (sessionTokenHash) => storedSessions.find((session) => session.sessionTokenHash === sessionTokenHash) ?? null,
    },
    now: () => issueTime,
  });

  const sessionToken = await issuingManager.createSession({
    adminPassword: "super-secret",
  });

  const validatingManager = sessionModule.createAdminSessionManager({
    repository: {
      createSession: async () => undefined,
      getSessionByTokenHash: async (sessionTokenHash) => storedSessions.find((session) => session.sessionTokenHash === sessionTokenHash) ?? null,
    },
    now: () => validateTime,
  });

  assert.equal(
    await validatingManager.hasValidSession({
      adminPassword: "super-secret",
      sessionToken,
    }),
    false,
  );
});

test("admin session rejects sessions created under an older password version", async () => {
  const sessionModule = await loadModule<{
    createAdminSessionManager: (input: {
      repository: {
        createSession: (input: {
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        }) => Promise<void>;
        getSessionByTokenHash: (sessionTokenHash: string) => Promise<{
          expiresAt: string;
          passwordVersionHash: string;
          sessionTokenHash: string;
        } | null>;
      };
      now?: () => Date;
    }) => {
      createSession: (input: { adminPassword: string }) => Promise<string>;
      hasValidSession: (input: { adminPassword: string; sessionToken: string | null | undefined }) => Promise<boolean>;
    };
  }>("./session.ts", "admin session");

  const storedSessions: Array<{
    expiresAt: string;
    passwordVersionHash: string;
    sessionTokenHash: string;
  }> = [];

  const manager = sessionModule.createAdminSessionManager({
    repository: {
      createSession: async (input) => {
        storedSessions.push(input);
      },
      getSessionByTokenHash: async (sessionTokenHash) => storedSessions.find((session) => session.sessionTokenHash === sessionTokenHash) ?? null,
    },
    now: () => new Date("2026-06-07T12:00:00.000Z"),
  });

  const sessionToken = await manager.createSession({
    adminPassword: "old-password",
  });

  assert.equal(
    await manager.hasValidSession({
      adminPassword: "new-password",
      sessionToken,
    }),
    false,
  );
});
