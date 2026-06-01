import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("createAdminLoginAction forwards normalized allowlist and callback URL", async () => {
  const loginActionModule = await loadModule<{
    createAdminLoginAction: (input: {
      adminAllowedEmails: string[];
      emailRedirectTo: string;
      requestAdminMagicLink: (input: {
        allowedEmails: string[];
        email: string;
        emailRedirectTo: string;
        signInWithOtp: (input: {
          email: string;
          options: { emailRedirectTo: string };
        }) => Promise<{ error: Error | null }>;
      }) => Promise<void>;
      signInWithOtp: (input: {
        email: string;
        options: { emailRedirectTo: string };
      }) => Promise<{ error: Error | null }>;
    }) => (formData: FormData) => Promise<{ ok: true }>;
  }>("./login-action.ts", "admin login action");

  let received:
    | {
        allowedEmails: string[];
        email: string;
        emailRedirectTo: string;
      }
    | null = null;

  const action = loginActionModule.createAdminLoginAction({
    adminAllowedEmails: ["owner@example.com"],
    emailRedirectTo: "https://amber.test/auth/callback",
    requestAdminMagicLink: async (input) => {
      received = {
        allowedEmails: input.allowedEmails,
        email: input.email,
        emailRedirectTo: input.emailRedirectTo,
      };
    },
    signInWithOtp: async () => ({ error: null }),
  });

  const formData = new FormData();
  formData.set("email", "OWNER@example.com ");

  const result = await action(formData);

  assert.deepEqual(received, {
    allowedEmails: ["owner@example.com"],
    email: "OWNER@example.com ",
    emailRedirectTo: "https://amber.test/auth/callback",
  });
  assert.deepEqual(result, { ok: true });
});

test("createAdminLoginAction returns a field error when email is missing", async () => {
  const loginActionModule = await loadModule<{
    createAdminLoginAction: (input: {
      adminAllowedEmails: string[];
      emailRedirectTo: string;
      requestAdminMagicLink: (input: {
        allowedEmails: string[];
        email: string;
        emailRedirectTo: string;
        signInWithOtp: (input: {
          email: string;
          options: { emailRedirectTo: string };
        }) => Promise<{ error: Error | null }>;
      }) => Promise<void>;
      signInWithOtp: (input: {
        email: string;
        options: { emailRedirectTo: string };
      }) => Promise<{ error: Error | null }>;
    }) => (formData: FormData) => Promise<{ error: string; ok: false } | { ok: true }>;
  }>("./login-action.ts", "admin login action");

  const action = loginActionModule.createAdminLoginAction({
    adminAllowedEmails: ["owner@example.com"],
    emailRedirectTo: "https://amber.test/auth/callback",
    requestAdminMagicLink: async () => undefined,
    signInWithOtp: async () => ({ error: null }),
  });

  const result = await action(new FormData());

  assert.deepEqual(result, {
    ok: false,
    error: "請輸入 email",
  });
});

test("createAdminLoginAction returns a controlled error for disallowed admin emails", async () => {
  const [loginActionModule, guardsModule] = await Promise.all([
    loadModule<{
      createAdminLoginAction: (input: {
        adminAllowedEmails: string[];
        emailRedirectTo: string;
        requestAdminMagicLink: (input: {
          allowedEmails: string[];
          email: string;
          emailRedirectTo: string;
          signInWithOtp: (input: {
            email: string;
            options: { emailRedirectTo: string };
          }) => Promise<{ error: Error | null }>;
        }) => Promise<void>;
        signInWithOtp: (input: {
          email: string;
          options: { emailRedirectTo: string };
        }) => Promise<{ error: Error | null }>;
      }) => (formData: FormData) => Promise<{ error: string; ok: false } | { ok: true }>;
    }>("./login-action.ts", "admin login action"),
    loadModule<{
      AdminAuthorizationError: new (code: "forbidden" | "unauthenticated") => Error;
    }>("./guards.ts", "auth guards"),
  ]);

  const action = loginActionModule.createAdminLoginAction({
    adminAllowedEmails: ["owner@example.com"],
    emailRedirectTo: "https://amber.test/auth/callback",
    requestAdminMagicLink: async () => {
      throw new guardsModule.AdminAuthorizationError("forbidden");
    },
    signInWithOtp: async () => ({ error: null }),
  });

  const formData = new FormData();
  formData.set("email", "guest@example.com");

  const result = await action(formData);

  assert.deepEqual(result, {
    ok: false,
    error: "這個 email 沒有 admin 權限",
  });
});

test("createAdminLoginAction returns a controlled error when magic link request fails", async () => {
  const [loginActionModule, magicLinkModule] = await Promise.all([
    loadModule<{
      createAdminLoginAction: (input: {
        adminAllowedEmails: string[];
        emailRedirectTo: string;
        requestAdminMagicLink: (input: {
          allowedEmails: string[];
          email: string;
          emailRedirectTo: string;
          signInWithOtp: (input: {
            email: string;
            options: { emailRedirectTo: string };
          }) => Promise<{ error: Error | null }>;
        }) => Promise<void>;
        signInWithOtp: (input: {
          email: string;
          options: { emailRedirectTo: string };
        }) => Promise<{ error: Error | null }>;
      }) => (formData: FormData) => Promise<{ error: string; ok: false } | { ok: true }>;
    }>("./login-action.ts", "admin login action"),
    loadModule<{
      AdminAuthFlowError: new (message: string) => Error;
    }>("./magic-link.ts", "magic link auth"),
  ]);

  const action = loginActionModule.createAdminLoginAction({
    adminAllowedEmails: ["owner@example.com"],
    emailRedirectTo: "https://amber.test/auth/callback",
    requestAdminMagicLink: async () => {
      throw new magicLinkModule.AdminAuthFlowError("otp failed");
    },
    signInWithOtp: async () => ({ error: null }),
  });

  const formData = new FormData();
  formData.set("email", "owner@example.com");

  const result = await action(formData);

  assert.deepEqual(result, {
    ok: false,
    error: "magic link 寄送失敗，請稍後再試",
  });
});
