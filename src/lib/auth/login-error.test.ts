import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("getAdminLoginErrorMessage maps invalid callback failures to a controlled message", async () => {
  const loginErrorModule = await loadModule<{
    getAdminLoginErrorMessage: (error: string | null | undefined) => string | null;
  }>("./login-error.ts", "admin login error");

  assert.equal(
    loginErrorModule.getAdminLoginErrorMessage("invalid_auth_callback"),
    "Google 登入流程失敗，請重新再試一次。",
  );
});

test("getAdminLoginErrorMessage maps unauthorized Google accounts to a controlled message", async () => {
  const loginErrorModule = await loadModule<{
    getAdminLoginErrorMessage: (error: string | null | undefined) => string | null;
  }>("./login-error.ts", "admin login error");

  assert.equal(
    loginErrorModule.getAdminLoginErrorMessage("admin_not_allowed"),
    "這個 Google 帳號沒有後台權限，請改用允許的帳號登入。",
  );
});

test("getAdminLoginErrorMessage maps cancelled Google sign-ins to a controlled message", async () => {
  const loginErrorModule = await loadModule<{
    getAdminLoginErrorMessage: (error: string | null | undefined) => string | null;
  }>("./login-error.ts", "admin login error");

  assert.equal(
    loginErrorModule.getAdminLoginErrorMessage("oauth_cancelled"),
    "你已取消 Google 登入，若要進入後台請重新操作。",
  );
});

test("getAdminLoginErrorMessage keeps unknown error codes controlled", async () => {
  const loginErrorModule = await loadModule<{
    getAdminLoginErrorMessage: (error: string | null | undefined) => string | null;
  }>("./login-error.ts", "admin login error");

  assert.equal(loginErrorModule.getAdminLoginErrorMessage("raw_provider_error"), "登入失敗，請稍後再試一次。");
  assert.equal(loginErrorModule.getAdminLoginErrorMessage(null), null);
});
