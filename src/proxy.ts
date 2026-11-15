// 功能：Next.js 的 request proxy（Next 16 起取代 middleware）。在頁面渲染前換發 admin 的 Supabase 登入 session，
// 把新的 token 同時交給這次渲染與瀏覽器。只處理帶著 Supabase session cookie 的 GET／HEAD 請求；
// 一般訪客直接放行、不呼叫 Supabase。不做權限判斷與轉址，那是既有 guard 的工作。邏輯在 src/lib/auth/session-refresh.ts。

import type { NextRequest } from "next/server.js";

import { createSessionRefreshProxy } from "./lib/auth/session-refresh.ts";
import { createServerSupabaseClient } from "./lib/infra/supabase/server.ts";

const refreshSessionBeforeRender = createSessionRefreshProxy({ createServerSupabaseClient });

export async function proxy(request: NextRequest) {
  return refreshSessionBeforeRender(request);
}

export const config = {
  // 不經過 proxy：Next 的靜態檔與圖片、public 裡的檔案、社群分享圖、robots／sitemap、
  // 登入 callback（自己處理 cookie）與 Supabase 防暫停排程。
  matcher: [
    "/((?!_next/static|_next/image|api/cron|auth/|opengraph-image|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)",
  ],
};
