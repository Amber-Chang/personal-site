// 功能：GET /api/admin/session，回答目前的瀏覽器是不是允許的管理員（只回 { isAdmin }，不快取）。
// 只有帶著 Supabase 登入 cookie 的瀏覽器才會呼叫（見 src/components/HeaderAdminLinks.tsx）。
// 只匯出 GET，其他方法由 Next.js 回 405。邏輯在 status-core.ts；規格見 docs/02-spec/SPEC-005。

import { readServerAdminAuthState } from "@/lib/auth/server-admin-auth.ts";

import { createAdminSessionStatusHandler } from "./status-core.ts";

export const dynamic = "force-dynamic";

export const GET = createAdminSessionStatusHandler({
  getAdminAuthState: () => readServerAdminAuthState(),
});
