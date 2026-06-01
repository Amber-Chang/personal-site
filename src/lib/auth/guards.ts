type AdminUser = {
  email: string | null;
};

type AdminGuardFailureReason = "forbidden" | "unauthenticated";

export type AdminGuardResult =
  | {
      ok: true;
      user: AdminUser;
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
  allowedEmails: string[];
  getUser: () => Promise<AdminUser | null>;
}): Promise<AdminGuardResult> {
  const user = await input.getUser();

  if (!user?.email) {
    return {
      ok: false,
      reason: "unauthenticated",
      redirectTo: "/admin/login",
    };
  }

  if (!isAllowedAdminEmail(user.email, input.allowedEmails)) {
    return {
      ok: false,
      reason: "forbidden",
      redirectTo: "/admin/login",
    };
  }

  return {
    ok: true,
    user,
  };
}

export async function requireAdminMutationSession(input: {
  allowedEmails: string[];
  getUser: () => Promise<AdminUser | null>;
}): Promise<AdminUser> {
  const result = await getAdminGuardResult(input);

  if (!result.ok) {
    throw new AdminAuthorizationError(result.reason);
  }

  return result.user;
}
