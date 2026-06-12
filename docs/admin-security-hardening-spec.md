# Admin Security Hardening Spec

> 用途：定義目前 `/admin` 單人後台的防護補強範圍，讓這一輪修補有清楚邊界，不把 MVP auth 無限制擴張成完整 IAM 專案。

## 1. 目標

這一輪要解決的不是「做一套完整企業級後台登入」，而是先補上目前最明顯的 admin 暴露面缺口，讓單人站主可接受地維持內容後台上線。

本 round 目標：

- 把 login rate limit 從 process memory 提升為可跨 instance 的 server-side 狀態
- 在 admin mutation path 補上 trusted origin 檢查，降低跨站請求風險
- 收斂 session policy，降低長時間 cookie 暴露風險
- 讓 `/admin` 頁面明確標示不應被搜尋引擎索引
- 保持既有 `service / repository / infra` 邊界，不把防護邏輯散寫在 page 與 component

## 2. 非目標

這一輪不包含：

- 多人帳號、角色與權限模型
- OAuth、SSO、magic link 回歸
- 裝置管理 UI
- 完整 audit dashboard
- CAPTCHA
- Vercel Dashboard 內的 WAF / Bot Protection 自動化設定

後者仍重要，但屬於 repo 外部的 deployment 設定，應在交付時另列清單。

## 3. 現況問題

### 3.1 In-memory rate limit 不夠

目前 `/admin/login` 的失敗次數存在 process memory。

這在本機可用，但在 Vercel production 會有幾個問題：

- instance 切換時狀態遺失
- cold start 後重新計數
- 多個並行 instance 無法共享 block 狀態

因此它只能算最小 UX 提示，不足以當 production 防暴力登入基線。

### 3.2 Admin action 缺少明確 trusted origin 檢查

雖然目前主要依賴 `httpOnly + sameSite=lax` cookie 與 server action 內 session guard，但 repo 內還沒有集中化的 trusted origin 驗證。

這代表：

- login / logout / content mutation 對 request source 的假設不夠明確
- 若部署設定或 host 組合日後變複雜，風險會逐漸上升

### 3.3 Session 生命週期偏長

7 天 session 對單人站主很方便，但對個人網站後台來說偏鬆。

目前也沒有：

- idle timeout
- session rotation
- 裝置可視化 revoke

因此應先把 session policy 收斂到更保守的基線。

## 4. 本輪決策

### 4.1 Login rate limit 改為 Supabase-backed

- 新增 `admin_login_attempts` table
- 以 `identifier` 作為 key 儲存登入失敗狀態
- identifier 第一版仍採 request IP
- 失敗、block、reset 都走 trusted Next.js server + service role path
- rate limit 演算法仍維持目前規則：
  - 最多 5 次失敗
  - cooldown 15 分鐘

### 4.2 Trusted origin 檢查集中化

- 新增 auth helper，集中驗證 admin mutation request 的 `origin` / `referer`
- 允許來源至少包含：
  - `NEXT_PUBLIC_SITE_URL`
  - 目前 request host 對應 origin
- 在 login、logout 與 admin content mutation path 一律套用

### 4.3 Session policy 收斂

- admin session 從 7 天縮短為 24 小時
- 維持：
  - random session token
  - cookie 僅存 token
  - DB 存 token hash
  - 密碼版本變更可讓舊 session 失效

### 4.4 `/admin` robots policy

- `/admin` segment 應統一標示 `noindex, nofollow`
- 這不是 access control，但可避免被正常搜尋索引誤收錄

## 5. 架構切分

### 5.1 `lib/auth/login-rate-limit.ts`

- 保留純規則層
- 不直接綁定某個儲存實作
- 讓 unit test 可在不碰資料庫下驗證規則

### 5.2 `lib/auth/login-rate-limit-server.ts`

- 放 Supabase-backed repository 與 server-side orchestration
- 對外提供：
  - `getRateLimitState`
  - `recordFailedAttempt`
  - `resetAttempts`

### 5.3 `lib/auth/trusted-origin.ts`

- 集中驗證 admin mutation request 的來源可信度
- 不把來源判斷散寫在各個 action

### 5.4 `app/admin/...`

- page guard 維持既有 session redirect 模型
- mutation path 補 trusted origin + session guard

## 6. 驗證

本 round 至少要驗證：

- auth / session / login rate limit 單元測試通過
- migration test 覆蓋新增 table
- trusted origin helper 有正常 / 拒絕案例
- login action 可接受 async rate limit 依賴

## 7. Repo 外仍需手動處理

這輪做完後，仍建議在 Vercel 另外補：

1. `/admin` 路徑 WAF / Bot Protection
2. 視需求加 challenge 或額外 rate limit
3. 若未來有固定管理來源，再評估 IP allowlist

這些不應被 repo 內的程式碼修補取代。
