import { AdminAuthorizationError } from "./guards.ts";
import { AdminAuthFlowError } from "./magic-link.ts";

export function createAdminLoginAction(input: {
  adminAllowedEmails: string[];
  emailRedirectTo: string;
  requestAdminMagicLink: (input: {
    allowedEmails: string[];
    email: string;
    emailRedirectTo: string;
    signInWithOtp: (input: {
      email: string;
      options: { emailRedirectTo: string };
    }) => Promise<{ error: Error | null }>;
  }) => Promise<void>;
  signInWithOtp: (input: {
    email: string;
    options: { emailRedirectTo: string };
  }) => Promise<{ error: Error | null }>;
}) {
  return async function adminLoginAction(
    formData: FormData,
  ): Promise<{ error: string; ok: false } | { ok: true }> {
    const emailValue = formData.get("email");
    const email = typeof emailValue === "string" ? emailValue : "";

    if (!email.trim()) {
      return {
        ok: false,
        error: "請輸入 email",
      };
    }

    try {
      await input.requestAdminMagicLink({
        allowedEmails: input.adminAllowedEmails,
        email,
        emailRedirectTo: input.emailRedirectTo,
        signInWithOtp: input.signInWithOtp,
      });
    } catch (error) {
      if (error instanceof AdminAuthorizationError) {
        return {
          ok: false,
          error: "這個 email 沒有 admin 權限",
        };
      }

      if (error instanceof AdminAuthFlowError) {
        return {
          ok: false,
          error: "magic link 寄送失敗，請稍後再試",
        };
      }

      throw error;
    }

    return {
      ok: true,
    };
  };
}
