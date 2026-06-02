type AdminGuardFailureReason = "forbidden" | "unauthenticated";

export type AdminGuardResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: AdminGuardFailureReason;
      redirectTo: "/admin/login";
    };

export class AdminAuthorizationError extends Error {
  code: AdminGuardFailureReason;

  constructor(code: AdminGuardFailureReason) {
    super(code === "forbidden" ? "Admin access is not allowed." : "Admin session is required.");
    this.name = "AdminAuthorizationError";
    this.code = code;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedAdminEmail(email: string | null, allowedEmails: string[]): boolean {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeEmail(email);

  return allowedEmails.map(normalizeEmail).includes(normalizedEmail);
}

export async function getAdminGuardResult(input: {
  hasAdminSession: () => Promise<boolean>;
}): Promise<AdminGuardResult> {
  const hasAdminSession = await input.hasAdminSession();

  if (hasAdminSession) {
    return {
      ok: true,
    };
  }

  return {
    ok: false,
    reason: "unauthenticated",
    redirectTo: "/admin/login",
  };
}

export async function requireAdminMutationSession(input: {
  hasAdminSession: () => Promise<boolean>;
}): Promise<void> {
  const result = await getAdminGuardResult(input);

  if (!result.ok) {
    throw new AdminAuthorizationError(result.reason);
  }
}
