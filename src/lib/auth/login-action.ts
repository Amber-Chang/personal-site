import { timingSafeEqual } from "node:crypto";

import { createAdminSessionToken } from "./session.ts";

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
  setAdminSession: (sessionToken: string) => void;
}) {
  return async function adminLoginAction(
    formData: FormData,
  ): Promise<{ error: string; ok: false } | { ok: true }> {
    const passwordValue = formData.get("password");
    const password = typeof passwordValue === "string" ? passwordValue : "";

    if (!password) {
      return {
        ok: false,
        error: "請輸入密碼",
      };
    }

    if (!passwordMatches(password, input.adminPassword)) {
      return {
        ok: false,
        error: "密碼錯誤",
      };
    }

    input.setAdminSession(createAdminSessionToken(input.adminPassword));

    return {
      ok: true,
    };
  };
}
