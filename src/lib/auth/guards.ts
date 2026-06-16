type AdminGuardFailureReason = "forbidden" | "unauthenticated";

export type AdminSessionUser = {
  email: string | null;
};

export type AdminAuthState = {
  isAdmin: boolean;
  isAuthenticated: boolean;
  normalizedEmail: string | null;
};

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

export async function getAdminAuthState(input: {
  allowedEmails: string[];
  getSessionUser: () => Promise<AdminSessionUser | null>;
}): Promise<AdminAuthState> {
  const user = await input.getSessionUser();
  const normalizedEmail = user?.email ? normalizeEmail(user.email) : null;

  if (!user) {
    return {
      isAdmin: false,
      isAuthenticated: false,
      normalizedEmail: null,
    };
  }

  return {
    isAdmin: isAllowedAdminEmail(normalizedEmail, input.allowedEmails),
    isAuthenticated: true,
    normalizedEmail,
  };
}

export async function getAdminGuardResult(input: {
  getAdminAuthState?: () => Promise<AdminAuthState>;
  hasAdminSession?: () => Promise<boolean>;
}): Promise<AdminGuardResult> {
  if (input.getAdminAuthState) {
    const authState = await input.getAdminAuthState();

    if (authState.isAdmin) {
      return {
        ok: true,
      };
    }

    if (authState.isAuthenticated) {
      return {
        ok: false,
        reason: "forbidden",
        redirectTo: "/admin/login",
      };
    }

    const hasAdminSession = await input.hasAdminSession?.();

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

  const hasAdminSession = await input.hasAdminSession?.();

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
  getAdminAuthState?: () => Promise<AdminAuthState>;
  hasAdminSession?: () => Promise<boolean>;
}): Promise<void> {
  const result = await getAdminGuardResult(input);

  if (!result.ok) {
    throw new AdminAuthorizationError(result.reason);
  }
}
