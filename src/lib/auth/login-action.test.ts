import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("createAdminLoginAction sets an admin session when password is correct", async () => {
  const loginActionModule = await loadModule<{
    createAdminLoginAction: (input: {
      adminPassword: string;
      createAdminSession: () => Promise<string> | string;
      setAdminSession: (sessionToken: string) => void;
    }) => (formData: FormData) => Promise<{ ok: true }>;
  }>("./login-action.ts", "admin login action");

  let receivedSessionToken: string | null = null;
  let createAdminSessionCalls = 0;

  const action = loginActionModule.createAdminLoginAction({
    adminPassword: "super-secret",
    createAdminSession: () => {
      createAdminSessionCalls += 1;
      return "server-session-token";
    },
    setAdminSession: (sessionToken) => {
      receivedSessionToken = sessionToken;
    },
  });

  const formData = new FormData();
  formData.set("password", "super-secret");

  const result = await action(formData);

  assert.equal(createAdminSessionCalls, 1);
  assert.equal(receivedSessionToken, "server-session-token");
  assert.deepEqual(result, { ok: true });
});

test("createAdminLoginAction returns a field error when password is missing", async () => {
  const loginActionModule = await loadModule<{
    createAdminLoginAction: (input: {
      adminPassword: string;
      createAdminSession: () => Promise<string> | string;
      setAdminSession: (sessionToken: string) => void;
    }) => (formData: FormData) => Promise<{ error: string; ok: false } | { ok: true }>;
  }>("./login-action.ts", "admin login action");

  const action = loginActionModule.createAdminLoginAction({
    adminPassword: "super-secret",
    createAdminSession: () => "server-session-token",
    setAdminSession: () => undefined,
  });

  const result = await action(new FormData());

  assert.deepEqual(result, {
    ok: false,
    error: "請輸入密碼",
  });
});

test("createAdminLoginAction returns a controlled error when password is wrong", async () => {
  const loginActionModule = await loadModule<{
    createAdminLoginAction: (input: {
      adminPassword: string;
      createAdminSession: () => Promise<string> | string;
      setAdminSession: (sessionToken: string) => void;
    }) => (formData: FormData) => Promise<{ error: string; ok: false } | { ok: true }>;
  }>("./login-action.ts", "admin login action");

  let createAdminSessionCalls = 0;
  const action = loginActionModule.createAdminLoginAction({
    adminPassword: "super-secret",
    createAdminSession: () => {
      createAdminSessionCalls += 1;
      return "server-session-token";
    },
    setAdminSession: () => undefined,
  });

  const formData = new FormData();
  formData.set("password", "wrong-password");

  const result = await action(formData);

  assert.deepEqual(result, {
    ok: false,
    error: "密碼錯誤",
  });
  assert.equal(createAdminSessionCalls, 0);
});

test("createAdminLoginAction rejects blocked identifiers without creating a session", async () => {
  const loginActionModule = await loadModule<{
    createAdminLoginAction: (input: {
      adminPassword: string;
      createAdminSession: () => Promise<string> | string;
      loginIdentifier: string;
      getRateLimitState: (identifier: string) => { blockedUntil: number | null; remainingAttempts: number };
      recordFailedAttempt: (identifier: string) => void;
      resetAttempts: (identifier: string) => void;
      setAdminSession: (sessionToken: string) => void;
    }) => (formData: FormData) => Promise<{ error: string; ok: false } | { ok: true }>;
  }>("./login-action.ts", "admin login action");

  let sessionCreated = false;
  let recordedFailures = 0;
  let resetCalls = 0;

  const action = loginActionModule.createAdminLoginAction({
    adminPassword: "super-secret",
    createAdminSession: () => "server-session-token",
    loginIdentifier: "127.0.0.1",
    getRateLimitState: () => ({
      blockedUntil: Date.now() + 60_000,
      remainingAttempts: 0,
    }),
    recordFailedAttempt: () => {
      recordedFailures += 1;
    },
    resetAttempts: () => {
      resetCalls += 1;
    },
    setAdminSession: () => {
      sessionCreated = true;
    },
  });

  const formData = new FormData();
  formData.set("password", "super-secret");

  const result = await action(formData);

  assert.deepEqual(result, {
    ok: false,
    error: "登入嘗試過於頻繁，請稍後再試",
  });
  assert.equal(sessionCreated, false);
  assert.equal(recordedFailures, 0);
  assert.equal(resetCalls, 0);
});

test("createAdminLoginAction resets prior failures after a successful login", async () => {
  const loginActionModule = await loadModule<{
    createAdminLoginAction: (input: {
      adminPassword: string;
      createAdminSession: () => Promise<string> | string;
      loginIdentifier: string;
      getRateLimitState: (identifier: string) => { blockedUntil: number | null; remainingAttempts: number };
      recordFailedAttempt: (identifier: string) => void;
      resetAttempts: (identifier: string) => void;
      setAdminSession: (sessionToken: string) => void;
    }) => (formData: FormData) => Promise<{ error: string; ok: false } | { ok: true }>;
  }>("./login-action.ts", "admin login action");

  const recordedFailures: string[] = [];
  const resetIdentifiers: string[] = [];
  let sessionCreated = false;

  const action = loginActionModule.createAdminLoginAction({
    adminPassword: "super-secret",
    createAdminSession: () => "server-session-token",
    loginIdentifier: "127.0.0.1",
    getRateLimitState: () => ({
      blockedUntil: null,
      remainingAttempts: 4,
    }),
    recordFailedAttempt: (identifier) => {
      recordedFailures.push(identifier);
    },
    resetAttempts: (identifier) => {
      resetIdentifiers.push(identifier);
    },
    setAdminSession: () => {
      sessionCreated = true;
    },
  });

  const formData = new FormData();
  formData.set("password", "super-secret");

  const result = await action(formData);

  assert.deepEqual(result, { ok: true });
  assert.equal(sessionCreated, true);
  assert.deepEqual(recordedFailures, []);
  assert.deepEqual(resetIdentifiers, ["127.0.0.1"]);
});
