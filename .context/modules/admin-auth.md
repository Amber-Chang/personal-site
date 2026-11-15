# admin-auth

## 目的

保護 `/admin` 區域，只允許通過 Supabase auth 且 email 位於 allowlist 的使用者進入後台。

## 主要路徑

- `src/app/admin/login/`
- `src/app/auth/callback/route.ts`
- `src/lib/auth/server-admin-auth.ts`
- `src/lib/auth/admin-auth-callback-route.ts`
- `src/lib/auth/guards.ts`
- `src/lib/auth/login-rate-limit-server.ts`
- `src/lib/auth/trusted-origin.ts`
- `src/lib/infra/supabase/server.ts`
- `src/proxy.ts`、`src/lib/auth/session-refresh.ts`（渲染前換發 Supabase session）

## 運作方式

- admin login 從 `/admin/login` 進入，完成 Supabase OAuth callback 後建立可供 server 讀取的 auth state。
- server guard 以目前登入使用者的 email 是否在 `adminAllowedEmails` 內決定是否放行。
- callback handler 會處理 provider error、code exchange、not-allowed user sign-out 與 redirect。
- auth 邊界同時包含 trusted origin 檢查與登入節流，避免後台入口被濫用。

- `readServerAdminAuthState` 會被 Server Component（每頁的 `Header`、`/admin/login`、後台頁面的 guard）與 Server Action／Route Handler（後台寫入、圖片上傳端點）共用。Supabase 換發或清除 session 時會呼叫 `setAll` 寫 cookie：Server Action／Route Handler 照常寫入；Server Component 渲染時 Next 不允許寫 cookie，只略過 Next 的唯讀錯誤（`isReadonlyCookiesError`），仍回傳登入狀態，其他錯誤照常丟出。
- `src/proxy.ts`（Next 16 的 request proxy）在渲染前換發 session：只處理帶著 `sb-*-auth-token` cookie 的 GET／HEAD，呼叫 `auth.getUser()`，換發成功時把新的 cookie 同時寫進這次請求（渲染讀到新 token）與回應（瀏覽器存下來）；refresh token 無效時清掉 cookie（同時帶 `Max-Age=0` 與 `Expires=1970`），請求以未登入繼續。沒有 session cookie 的請求直接放行、不呼叫 Supabase；Supabase 5 秒內沒回應或出錯時也照常放行。proxy 不判斷權限、不轉址；POST（登入、登出、後台寫入、圖片上傳）不經過它。matcher 排除 `_next`、圖片與 public 檔案、社群分享圖、robots／sitemap、`/auth/*` callback 與 `/api/cron`。

## 邊界

- admin access 的最終判斷在 server 端，不在 client 端做信任決策。
- 不應回到「頁面內自己判斷 cookie 就算登入」的做法。
