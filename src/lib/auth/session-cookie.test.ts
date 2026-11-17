import assert from "node:assert/strict";
import test from "node:test";

import { hasSupabaseSessionCookie, isSupabaseSessionCookieName } from "./session-cookie.ts";

test("isSupabaseSessionCookieName accepts the session cookie and its chunks only", () => {
  assert.equal(isSupabaseSessionCookieName("sb-okigjvoemyryhfmqrdoc-auth-token"), true);
  assert.equal(isSupabaseSessionCookieName("sb-127-auth-token"), true);
  assert.equal(isSupabaseSessionCookieName("sb-127-auth-token.0"), true);
  assert.equal(isSupabaseSessionCookieName("sb-127-auth-token.12"), true);

  // PKCE 登入流程中途的 code-verifier 不是 session。
  assert.equal(isSupabaseSessionCookieName("sb-127-auth-token-code-verifier"), false);
  assert.equal(isSupabaseSessionCookieName("analytics-consent"), false);
  assert.equal(isSupabaseSessionCookieName("admin_session"), false);
  assert.equal(isSupabaseSessionCookieName(""), false);
});

test("hasSupabaseSessionCookie reads a document.cookie style string", () => {
  assert.equal(hasSupabaseSessionCookie(""), false);
  assert.equal(hasSupabaseSessionCookie("ph_consent=1; theme=light"), false);
  assert.equal(hasSupabaseSessionCookie("sb-127-auth-token-code-verifier=abc"), false);
  assert.equal(hasSupabaseSessionCookie("sb-127-auth-token=base64-abc"), true);
  assert.equal(hasSupabaseSessionCookie("theme=light; sb-127-auth-token.0=base64-abc; sb-127-auth-token.1=def"), true);
  // 名稱前後的空白不影響判斷；值裡出現名稱不算。
  assert.equal(hasSupabaseSessionCookie("  sb-127-auth-token =x"), true);
  assert.equal(hasSupabaseSessionCookie("note=sb-127-auth-token"), false);
});
