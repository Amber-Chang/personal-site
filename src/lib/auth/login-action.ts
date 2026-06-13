import { timingSafeEqual } from "node:crypto";

import {
  ADMIN_LOGIN_RATE_LIMIT_FALLBACK_IDENTIFIER,
  type LoginRateLimitState,
} from "./login-rate-limit.ts";

function passwordMatches(inputPassword: string, adminPassword: string): boolean {
  const inputBuffer = Buffer.from(inputPassword);
  const expectedBuffer = Buffer.from(adminPassword);

  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

export function createAdminLoginAction(input: {
  adminPassword: string;
  createAdminSession: () => Promise<string> | string;
  loginIdentifier?: string;
  getRateLimitState?: (identifier: string) => LoginRateLimitState | Promise<LoginRateLimitState>;
  recordFailedAttempt?: (identifier: string) => void | Promise<void>;
  resetAttempts?: (identifier: string) => void | Promise<void>;
  setAdminSession: (sessionToken: string) => void;
}) {
  return async function adminLoginAction(
    formData: FormData,
  ): Promise<{ error: string; ok: false } | { ok: true }> {
    const loginIdentifier = input.loginIdentifier ?? ADMIN_LOGIN_RATE_LIMIT_FALLBACK_IDENTIFIER;
    const rateLimitState = await input.getRateLimitState?.(loginIdentifier);

    if (rateLimitState?.blockedUntil && rateLimitState.blockedUntil > Date.now()) {
      return {
        ok: false,
        error: "登入嘗試過於頻繁，請稍後再試",
      };
    }

    const passwordValue = formData.get("password");
    const password = typeof passwordValue === "string" ? passwordValue : "";

    if (!password) {
      return {
        ok: false,
        error: "請輸入密碼",
      };
    }

    if (!passwordMatches(password, input.adminPassword)) {
      await input.recordFailedAttempt?.(loginIdentifier);

      return {
        ok: false,
        error: "密碼錯誤",
      };
    }

    input.setAdminSession(await input.createAdminSession());
    await input.resetAttempts?.(loginIdentifier);

    return {
      ok: true,
    };
  };
}
