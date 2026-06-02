import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export const ADMIN_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: ADMIN_SESSION_MAX_AGE,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function buildAdminSessionDigest(adminPassword: string): string {
  return createHash("sha256").update(`admin-session:${adminPassword}`).digest("hex");
}

export function createAdminSessionToken(adminPassword: string): string {
  return buildAdminSessionDigest(adminPassword);
}

export function hasValidAdminSessionToken(input: {
  adminPassword: string;
  sessionToken: string | null | undefined;
}): boolean {
  const sessionToken = input.sessionToken ?? "";
  const expectedToken = createAdminSessionToken(input.adminPassword);
  const receivedBuffer = Buffer.from(sessionToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}
