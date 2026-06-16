import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(path: string, label: string): Promise<TModule> {
  const loadedModule = await import(path).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${path}`);

  return loadedModule as TModule;
}

test("getAdminGuardResult redirects unauthenticated requests to admin login", async () => {
  const guardsModule = await loadModule<{
    getAdminGuardResult: (input: {
      hasAdminSession: () => Promise<boolean>;
      getAdminAuthState?: () => Promise<unknown>;
    }) => Promise<unknown>;
  }>("./guards.ts", "auth guards");

  const result = await guardsModule.getAdminGuardResult({
    hasAdminSession: async () => false,
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "unauthenticated",
    redirectTo: "/admin/login",
  });
});

test("getAdminAuthState marks an allowlisted authenticated user as admin", async () => {
  const guardsModule = await loadModule<{
    getAdminAuthState: (input: {
      allowedEmails: string[];
      getSessionUser: () => Promise<{ email: string | null } | null>;
    }) => Promise<unknown>;
  }>("./guards.ts", "auth guards");

  const result = await guardsModule.getAdminAuthState({
    allowedEmails: ["owner@example.com"],
    getSessionUser: async () => ({
      email: " OWNER@EXAMPLE.COM ",
    }),
  });

  assert.deepEqual(result, {
    isAdmin: true,
    isAuthenticated: true,
    normalizedEmail: "owner@example.com",
  });
});

test("getAdminGuardResult rejects authenticated users outside the admin allowlist", async () => {
  const guardsModule = await loadModule<{
    getAdminGuardResult: (input: {
      getAdminAuthState: () => Promise<{
        isAdmin: boolean;
        isAuthenticated: boolean;
        normalizedEmail: string | null;
      }>;
      hasAdminSession?: () => Promise<boolean>;
    }) => Promise<unknown>;
  }>("./guards.ts", "auth guards");

  const result = await guardsModule.getAdminGuardResult({
    getAdminAuthState: async () => ({
      isAdmin: false,
      isAuthenticated: true,
      normalizedEmail: "guest@example.com",
    }),
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "forbidden",
    redirectTo: "/admin/login",
  });
});

test("getAdminGuardResult allows admin auth state without consulting legacy session fallback", async () => {
  const guardsModule = await loadModule<{
    getAdminGuardResult: (input: {
      getAdminAuthState: () => Promise<{
        isAdmin: boolean;
        isAuthenticated: boolean;
        normalizedEmail: string | null;
      }>;
      hasAdminSession?: () => Promise<boolean>;
    }) => Promise<unknown>;
  }>("./guards.ts", "auth guards");

  let legacySessionChecked = false;

  const result = await guardsModule.getAdminGuardResult({
    getAdminAuthState: async () => ({
      isAdmin: true,
      isAuthenticated: true,
      normalizedEmail: "owner@example.com",
    }),
    hasAdminSession: async () => {
      legacySessionChecked = true;
      return false;
    },
  });

  assert.deepEqual(result, {
    ok: true,
  });
  assert.equal(legacySessionChecked, false);
});

test("getAdminGuardResult falls back to legacy admin session when auth state is unauthenticated", async () => {
  const guardsModule = await loadModule<{
    getAdminGuardResult: (input: {
      getAdminAuthState: () => Promise<{
        isAdmin: boolean;
        isAuthenticated: boolean;
        normalizedEmail: string | null;
      }>;
      hasAdminSession: () => Promise<boolean>;
    }) => Promise<unknown>;
  }>("./guards.ts", "auth guards");

  const result = await guardsModule.getAdminGuardResult({
    getAdminAuthState: async () => ({
      isAdmin: false,
      isAuthenticated: false,
      normalizedEmail: null,
    }),
    hasAdminSession: async () => true,
  });

  assert.deepEqual(result, {
    ok: true,
  });
});

test("requireAdminMutationSession rejects missing admin session", async () => {
  const guardsModule = await loadModule<{
    AdminAuthorizationError: new (code: string) => Error & { code: string };
    requireAdminMutationSession: (input: {
      hasAdminSession: () => Promise<boolean>;
      getAdminAuthState?: () => Promise<unknown>;
    }) => Promise<void>;
  }>("./guards.ts", "auth guards");

  await assert.rejects(
    () =>
      guardsModule.requireAdminMutationSession({
        hasAdminSession: async () => false,
      }),
    (error: unknown) =>
      error instanceof guardsModule.AdminAuthorizationError &&
      error.code === "unauthenticated",
  );
});

test("requireAdminMutationSession rejects authenticated non-admin users", async () => {
  const guardsModule = await loadModule<{
    AdminAuthorizationError: new (code: string) => Error & { code: string };
    requireAdminMutationSession: (input: {
      getAdminAuthState: () => Promise<{
        isAdmin: boolean;
        isAuthenticated: boolean;
        normalizedEmail: string | null;
      }>;
      hasAdminSession?: () => Promise<boolean>;
    }) => Promise<void>;
  }>("./guards.ts", "auth guards");

  await assert.rejects(
    () =>
      guardsModule.requireAdminMutationSession({
        getAdminAuthState: async () => ({
          isAdmin: false,
          isAuthenticated: true,
          normalizedEmail: "guest@example.com",
        }),
      }),
    (error: unknown) =>
      error instanceof guardsModule.AdminAuthorizationError &&
      error.code === "forbidden",
  );
});

test("isAllowedAdminEmail matches normalized allowlist entries", async () => {
  const guardsModule = await loadModule<{
    isAllowedAdminEmail: (email: string | null, allowedEmails: string[]) => boolean;
  }>("./guards.ts", "auth guards");

  assert.equal(guardsModule.isAllowedAdminEmail("OWNER@example.com ", ["owner@example.com"]), true);
  assert.equal(guardsModule.isAllowedAdminEmail("guest@example.com", ["owner@example.com"]), false);
});

test("requestAdminMagicLink rejects emails outside the admin allowlist", async () => {
  const magicLinkModule = await loadModule<{
    AdminAuthorizationError: new (code: string) => Error & { code: string };
    requestAdminMagicLink: (input: {
      allowedEmails: string[];
      email: string;
      emailRedirectTo: string;
      signInWithOtp: (input: {
        email: string;
        options: { emailRedirectTo: string };
      }) => Promise<{ error: Error | null }>;
    }) => Promise<void>;
  }>("./magic-link.ts", "magic link auth");

  let called = false;

  await assert.rejects(
    () =>
      magicLinkModule.requestAdminMagicLink({
        allowedEmails: ["owner@example.com"],
        email: "guest@example.com",
        emailRedirectTo: "https://site.test/auth/callback",
        signInWithOtp: async () => {
          called = true;
          return { error: null };
        },
      }),
    (error: unknown) =>
      error instanceof magicLinkModule.AdminAuthorizationError &&
      error.code === "forbidden",
  );

  assert.equal(called, false);
});

test("requestAdminMagicLink forwards allowlisted emails to Supabase auth", async () => {
  const magicLinkModule = await loadModule<{
    requestAdminMagicLink: (input: {
      allowedEmails: string[];
      email: string;
      emailRedirectTo: string;
      signInWithOtp: (input: {
        email: string;
        options: { emailRedirectTo: string };
      }) => Promise<{ error: Error | null }>;
    }) => Promise<void>;
  }>("./magic-link.ts", "magic link auth");

  let receivedPayload: { email: string; options: { emailRedirectTo: string } } | null = null;

  await magicLinkModule.requestAdminMagicLink({
    allowedEmails: ["owner@example.com"],
    email: "owner@example.com",
    emailRedirectTo: "https://site.test/auth/callback",
    signInWithOtp: async (payload) => {
      receivedPayload = payload;
      return { error: null };
    },
  });

  assert.deepEqual(receivedPayload, {
    email: "owner@example.com",
    options: {
      emailRedirectTo: "https://site.test/auth/callback",
    },
  });
});

test("completeAdminAuthCallback redirects allowed users into admin posts", async () => {
  const magicLinkModule = await loadModule<{
    completeAdminAuthCallback: (input: {
      allowedEmails: string[];
      code: string | null;
      exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
      getUser: () => Promise<{ email: string | null } | null>;
      signOut: () => Promise<void>;
    }) => Promise<{ redirectTo: string }>;
  }>("./magic-link.ts", "magic link auth");

  const result = await magicLinkModule.completeAdminAuthCallback({
    allowedEmails: ["owner@example.com"],
    code: "valid-code",
    exchangeCodeForSession: async () => ({ error: null }),
    getUser: async () => ({ email: "owner@example.com" }),
    signOut: async () => undefined,
  });

  assert.deepEqual(result, { redirectTo: "/admin/posts" });
});

test("completeAdminAuthCallback redirects to a controlled login error when the callback code is missing", async () => {
  const magicLinkModule = await loadModule<{
    completeAdminAuthCallback: (input: {
      allowedEmails: string[];
      code: string | null;
      exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
      getUser: () => Promise<{ email: string | null } | null>;
      signOut: () => Promise<void>;
    }) => Promise<{ redirectTo: string }>;
  }>("./magic-link.ts", "magic link auth");

  const result = await magicLinkModule.completeAdminAuthCallback({
    allowedEmails: ["owner@example.com"],
    code: null,
    exchangeCodeForSession: async () => ({ error: null }),
    getUser: async () => ({ email: "owner@example.com" }),
    signOut: async () => undefined,
  });

  assert.deepEqual(result, {
    redirectTo: "/admin/login?error=invalid_auth_callback",
  });
});

test("completeAdminAuthCallback redirects to a controlled login error when session exchange fails", async () => {
  const magicLinkModule = await loadModule<{
    completeAdminAuthCallback: (input: {
      allowedEmails: string[];
      code: string | null;
      exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
      getUser: () => Promise<{ email: string | null } | null>;
      signOut: () => Promise<void>;
    }) => Promise<{ redirectTo: string }>;
  }>("./magic-link.ts", "magic link auth");

  const result = await magicLinkModule.completeAdminAuthCallback({
    allowedEmails: ["owner@example.com"],
    code: "bad-code",
    exchangeCodeForSession: async () => ({ error: new Error("exchange failed") }),
    getUser: async () => ({ email: "owner@example.com" }),
    signOut: async () => undefined,
  });

  assert.deepEqual(result, {
    redirectTo: "/admin/login?error=invalid_auth_callback",
  });
});

test("completeAdminAuthCallback signs out disallowed users and redirects to login", async () => {
  const magicLinkModule = await loadModule<{
    completeAdminAuthCallback: (input: {
      allowedEmails: string[];
      code: string | null;
      exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
      getUser: () => Promise<{ email: string | null } | null>;
      signOut: () => Promise<void>;
    }) => Promise<{ redirectTo: string }>;
  }>("./magic-link.ts", "magic link auth");

  let signedOut = false;

  const result = await magicLinkModule.completeAdminAuthCallback({
    allowedEmails: ["owner@example.com"],
    code: "valid-code",
    exchangeCodeForSession: async () => ({ error: null }),
    getUser: async () => ({ email: "guest@example.com" }),
    signOut: async () => {
      signedOut = true;
    },
  });

  assert.equal(signedOut, true);
  assert.deepEqual(result, {
    redirectTo: "/admin/login?error=admin_not_allowed",
  });
});

test("completeAdminAuthCallback still returns a controlled redirect when unauthorized signOut fails", async () => {
  const magicLinkModule = await loadModule<{
    completeAdminAuthCallback: (input: {
      allowedEmails: string[];
      code: string | null;
      exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
      getUser: () => Promise<{ email: string | null } | null>;
      signOut: () => Promise<void>;
    }) => Promise<{ redirectTo: string }>;
  }>("./magic-link.ts", "magic link auth");

  const result = await magicLinkModule.completeAdminAuthCallback({
    allowedEmails: ["owner@example.com"],
    code: "valid-code",
    exchangeCodeForSession: async () => ({ error: null }),
    getUser: async () => ({ email: "guest@example.com" }),
    signOut: async () => {
      throw new Error("sign out failed");
    },
  });

  assert.deepEqual(result, {
    redirectTo: "/admin/login?error=admin_not_allowed",
  });
});
