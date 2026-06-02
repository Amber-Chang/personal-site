import { AdminAuthorizationError, isAllowedAdminEmail } from "./guards.ts";

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

  const user = await input.getUser();

  if (!user?.email) {
    return {
      redirectTo: INVALID_CALLBACK_REDIRECT,
    };
  }

  if (!isAllowedAdminEmail(user.email, input.allowedEmails)) {
    await input.signOut();

    return {
      redirectTo: NOT_ALLOWED_REDIRECT,
    };
  }

  return {
    redirectTo: "/admin/posts",
  };
}
