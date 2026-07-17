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

## 運作方式

- admin login 從 `/admin/login` 進入，完成 Supabase OAuth callback 後建立可供 server 讀取的 auth state。
- server guard 以目前登入使用者的 email 是否在 `adminAllowedEmails` 內決定是否放行。
- callback handler 會處理 provider error、code exchange、not-allowed user sign-out 與 redirect。
- auth 邊界同時包含 trusted origin 檢查與登入節流，避免後台入口被濫用。

## 邊界

- admin access 的最終判斷在 server 端，不在 client 端做信任決策。
- 不應回到「頁面內自己判斷 cookie 就算登入」的做法。
