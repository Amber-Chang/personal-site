const ADMIN_LOGIN_ERROR_MESSAGES = {
  admin_not_allowed: "這個 Google 帳號沒有後台權限，請改用允許的帳號登入。",
  invalid_auth_callback: "Google 登入流程失敗，請重新再試一次。",
  legacy_session_sync_failed: "登入已完成，但後台 session 建立失敗，請重新再試一次。",
  oauth_cancelled: "你已取消 Google 登入，若要進入後台請重新操作。",
} as const;

type AdminLoginErrorCode = keyof typeof ADMIN_LOGIN_ERROR_MESSAGES;

export function getAdminLoginErrorMessage(error: string | null | undefined): string | null {
  if (!error) {
    return null;
  }

  if (error in ADMIN_LOGIN_ERROR_MESSAGES) {
    return ADMIN_LOGIN_ERROR_MESSAGES[error as AdminLoginErrorCode];
  }

  return "登入失敗，請稍後再試一次。";
}

export function resolveAdminLoginErrorCodeFromCallback(input: {
  error: string | null;
}): AdminLoginErrorCode {
  if (input.error === "access_denied") {
    return "oauth_cancelled";
  }

  return "invalid_auth_callback";
}

export function buildAdminLoginErrorRedirect(errorCode: string): string {
  return `/admin/login?error=${encodeURIComponent(errorCode)}`;
}
