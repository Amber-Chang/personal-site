// 功能：瀏覽器端判斷要不要顯示頁首的管理員入口（SPEC-005）。
// 沒有 Supabase 登入 cookie 的讀者（幾乎所有人）直接當成不是管理員，不送出任何請求；
// 有 cookie 時才問伺服器（GET /api/admin/session），允許清單仍由伺服器判斷。
// 任何失敗（網路、伺服器錯誤、回應格式不對、請求被取消）都當成不是管理員，不丟錯。

import { hasSupabaseSessionCookie } from "./session-cookie.ts";

export const ADMIN_SESSION_STATUS_PATH = "/api/admin/session";

export async function readIsAdminFromBrowser(input: {
  cookie: string;
  fetch: typeof fetch;
  signal?: AbortSignal;
}): Promise<boolean> {
  if (!hasSupabaseSessionCookie(input.cookie)) {
    return false;
  }

  try {
    const response = await input.fetch(ADMIN_SESSION_STATUS_PATH, {
      cache: "no-store",
      credentials: "same-origin",
      signal: input.signal,
    });

    if (!response.ok) {
      return false;
    }

    const body: unknown = await response.json();

    return typeof body === "object" && body !== null && (body as { isAdmin?: unknown }).isAdmin === true;
  } catch {
    return false;
  }
}
