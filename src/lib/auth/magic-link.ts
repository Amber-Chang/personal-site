import { AdminAuthorizationError, getAdminAuthState, isAllowedAdminEmail } from "./guards.ts";

export { AdminAuthorizationError } from "./guards.ts";

const INVALID_CALLBACK_REDIRECT = "/admin/login?error=invalid_auth_callback";
const NOT_ALLOWED_REDIRECT = "/admin/login?error=admin_not_allowed";

export class AdminAuthFlowError extends Error {
  code: "magic_link_request_failed";

  constructor(message: string) {
    super(message);
    this.name = "AdminAuthFlowError";
    this.code = "magic_link_request_failed";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function requestAdminMagicLink(input: {
  allowedEmails: string[];
  email: string;
  emailRedirectTo: string;
  signInWithOtp: (input: {
    email: string;
    options: { emailRedirectTo: string };
  }) => Promise<{ error: Error | null }>;
}): Promise<void> {
  const email = normalizeEmail(input.email);

  if (!isAllowedAdminEmail(email, input.allowedEmails)) {
    throw new AdminAuthorizationError("forbidden");
  }

  const { error } = await input.signInWithOtp({
    email,
    options: {
      emailRedirectTo: input.emailRedirectTo,
    },
  });

  if (error) {
    throw new AdminAuthFlowError(error.message);
  }
}

export async function completeAdminAuthCallback(input: {
  allowedEmails: string[];
  code: string | null;
  exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
  getUser: () => Promise<{ email: string | null } | null>;
  signOut: () => Promise<void>;
}): Promise<{ redirectTo: string }> {
  if (!input.code) {
    return {
      redirectTo: INVALID_CALLBACK_REDIRECT,
    };
  }

  const { error } = await input.exchangeCodeForSession(input.code);

  if (error) {
    return {
      redirectTo: INVALID_CALLBACK_REDIRECT,
    };
  }

  const authState = await getAdminAuthState({
    allowedEmails: input.allowedEmails,
    getSessionUser: input.getUser,
  });

  if (!authState.isAuthenticated || !authState.normalizedEmail) {
    return {
      redirectTo: INVALID_CALLBACK_REDIRECT,
    };
  }

  if (!authState.isAdmin) {
    try {
      await input.signOut();
    } catch (error) {
      console.error("admin auth callback sign out failed", error);
    }

    return {
      redirectTo: NOT_ALLOWED_REDIRECT,
    };
  }

  return {
    redirectTo: "/admin/posts",
  };
}
