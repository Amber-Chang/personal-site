# Google OAuth Admin Upgrade Spec

> 用途：定義目前 `/admin` 後台從單一密碼登入升級到 Google OAuth 的目標、邊界與實作方向，讓後續開發有單一主文件可依循。

## 1. 目標

這份文件回答的不是「Google OAuth 好不好」，而是：

- 在目前網站架構下，`/admin` 後台要如何升級成 Google OAuth
- 哪些 auth 邊界需要一起收斂，避免留下兩套平行主流程
- 這一輪要做到哪裡，哪些故意不做

本輪升級目標：

- admin 登入由單一密碼改為 `Supabase Auth + Google OAuth`
- admin 權限以 allowlisted email 為第一版判斷依據
- `/admin` 存取守門邏輯收斂到同一套 auth guard
- 移除目前主流程對共享 admin 密碼的依賴
- 保持既有內容 repository / service 邊界不被 auth 變更污染

## 1.5 目前狀態

- Google OAuth admin 升級的主要程式碼已落地：
  - `/admin/login` 已改為 Google OAuth 主入口
  - `/app/auth/callback` 已改為 session 交換 + allowlist 驗證主路徑
  - `/admin/posts`、`/admin/projects` 與相關 mutation 已改接 authenticated admin guard
  - admin logout 已改為清理目前 Supabase-backed session
- 自動化驗證現況：
  - auth / callback / logout / admin guard 相關 targeted tests 已通過
  - 受影響的 admin posts / projects flow 測試已通過
  - `npm run lint` 歷史上已通過
  - `npm test` 已在 2026-07-17 回到全綠（`282 pass / 0 fail`）
- 仍待補的最後一段驗證：
  - 需要在可實際完成 Google 帳號互動登入的環境，再補一次 login / logout / draft / publish / unpublish / unauthorized-account rejection 的實機 smoke check
  - 目前這份 spec 應視為「實作已完成、文件已同步、互動式 OAuth 驗證待補紀錄」

## 2. 背景與問題

目前 `/admin` 後台主登入路徑為：

- 使用者在 `/admin/login` 輸入單一 admin 密碼
- server action 驗證 `ADMIN_LOGIN_PASSWORD`
- 驗證成功後寫入 `httpOnly` cookie
- server-side session record 負責後續 admin 存取驗證

這套模型在單人、低頻、固定裝置使用時是可接受的 MVP，但目前已出現以下升級訊號：

- 站主會跨裝置登入後台
- shared password 管理成本開始升高
- 單一密碼外流即等於完整 admin 權限
- 目前 auth 心智模型不利於未來多人或更正式的 admin 使用情境

因此這一輪的重點不是只把登入按鈕改成 Google，而是把 admin auth 底座正式收斂回 `Supabase`。

## 3. 決策摘要

- `Supabase` 繼續作為登入與基本授權基礎設施
- `Google OAuth` 作為第一個也是唯一的 admin 登入 provider
- `Next.js Route Handlers + auth helpers` 負責 callback、權限判斷與 app flow
- admin 權限第一版使用 `ADMIN_ALLOWED_EMAILS` allowlist，並暫時保留 `SUPABASE_ADMIN_EMAILS` fallback 以支援 env 遷移
- `/admin` guard 改判斷「是否為 allowlisted authenticated user」
- 不保留「單一密碼登入」作為正式主流程並行存在

## 4. 範圍

本輪包含：

- `/admin/login` 改成 Google OAuth 登入入口
- Google OAuth callback flow
- allowlisted admin email 驗證
- `/admin` guard 改寫
- admin logout flow 收斂
- auth 相關 env 與部署設定更新
- 測試、文件與手動驗證流程更新

本輪不包含：

- 多人角色管理
- 非 Google 的第二登入 provider
- 後台使用者管理 UI
- session 裝置管理
- audit log
- MFA 自建流程

## 5. 為什麼選這條路

本專案不建議走「Google 登入後，仍補發自建 `admin_session`」的混合做法，原因如下：

- 它只替換登入入口，沒有真正收斂 auth 模型
- 後續 logout、guard、session 問題會分成兩層維護
- 會讓 repo 同時維持 Supabase session 與自建 session 兩套正式主邏輯
- 與目前「Supabase 是登入基礎設施」的架構方向不一致

因此建議直接採用：

- `Supabase Auth session` 作為主 session
- app 內只保留一套 admin guard 心智模型

## 6. 系統邊界

### 6.1 Next.js 責任

- 提供 `/admin/login`
- 提供 OAuth callback route handler
- 在 server 端判斷目前 user 是否具有 admin 存取資格
- 保持 admin page / action 對 auth provider 細節低耦合

### 6.2 Supabase 責任

- 提供 Google OAuth provider 整合
- 提供 authenticated user session
- 提供 server / client 端取得目前 user 的基礎能力

### 6.3 App 內責任切分

- `app/admin/*`：只依賴 admin guard，不直接處理 provider-specific 細節
- `app/auth/*`：處理 callback 與 auth 流程轉向
- `lib/auth/*`：集中 allowlist、guard、session helper、錯誤轉譯
- `lib/infra/supabase/*`：集中 Supabase client 初始化

## 7. Auth 與權限模型

### 7.1 登入方式

- `/admin/login` 顯示「使用 Google 登入」
- 使用者透過 Supabase Auth 啟動 Google OAuth
- 完成授權後回到站內 callback route

### 7.2 Admin 判斷

- 第一版以 `ADMIN_ALLOWED_EMAILS` 為唯一 admin 判斷來源
- email 比對需做 normalize：
  - `trim`
  - `lowercase`

### 7.3 Callback 驗證

callback 完成後：

1. 交換 session
2. 讀取目前 user
3. 若 user 不存在或 email 為空：
   - 導回 `/admin/login?error=invalid_auth_callback`
4. 若 email 不在 allowlist：
   - 主動 sign out
   - 導回 `/admin/login?error=admin_not_allowed`
5. 若通過：
   - 導向 `/admin/posts`

### 7.4 Guard 模型

`/admin` 相關頁面與 mutation 需改為檢查：

- 是否存在有效 authenticated session
- 該 session 對應 user email 是否在 allowlist

第一版不做更細的 role / permission matrix。

### 7.5 Logout 模型

- admin logout 需同時清掉目前 Supabase session
- logout 後應回到 `/admin/login`
- 不再依賴舊 `admin_session` cookie 清理作為主流程

## 8. UI / UX 變更

### 8.1 `/admin/login`

頁面文案需從「使用密碼登入後台」改為：

- 明確說明目前使用 Google 帳號登入
- 若登入失敗或未授權，顯示可理解錯誤訊息
- 保持目前 admin login 頁面的簡潔感，不把它擴寫成完整帳號中心

### 8.2 錯誤情境

至少要能處理：

- callback 無效
- Google OAuth 完成但 email 不在 allowlist
- 使用者取消 Google 登入
- Supabase / provider 臨時錯誤

## 9. 環境變數與部署設定

本輪最小 env 集合預期為：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_ALLOWED_EMAILS`

本輪後預期：

- `ADMIN_LOGIN_PASSWORD` 不再作為正式主登入流程必要 env
- 若部署環境尚未完成 env 改名，可暫時接受 `SUPABASE_ADMIN_EMAILS` 作為 fallback，但主文件與新設定應以 `ADMIN_ALLOWED_EMAILS` 為準

Supabase / Google provider 需額外設定：

- Google OAuth client id
- Google OAuth client secret
- local callback URL
- production callback URL
- 必要時補上 preview callback 策略

## 10. 建議檔案改動範圍

預期會影響：

- `src/app/admin/login/page.tsx`
- `src/app/admin/login/*`
- `src/app/auth/callback/route.ts`
- `src/app/auth/client-callback/page.tsx`
- `src/app/admin/logout/actions.ts`
- `src/lib/auth/guards.ts`
- `src/lib/auth/*`
- `src/lib/infra/supabase/server.ts`
- auth 相關測試
- `docs/blog-admin-implementation-spec.md`
- `docs/deployment-security-readiness.md`
- `NOW.md`

## 11. Implementation Scope

本輪實作應聚焦在 auth flow 收斂，不應順手擴寫成更大的後台權限工程。

### 11.1 必做

- `/admin/login` 改為 Google OAuth 入口
- callback 完成 session 交換與 allowlist 驗證
- `/admin` 頁面與 mutation guard 改接新 auth 模型
- logout 正確清除目前登入 session
- admin login 文案與錯誤訊息更新
- 自動化測試與手動驗證更新
- 主文件同步更新

### 11.2 可延後

- preview 環境的完整多網址策略優化
- 更細的登入錯誤 UX 打磨
- admin 顯示目前登入 email
- provider 抽象化到支援多登入來源

### 11.3 明確不做

- admin 角色分級
- 後台 user management
- audit log
- MFA
- 裝置清單 / session revocation UI

## 12. File-by-File Change Map

### 12.1 Login UI 與入口

- `src/app/admin/login/page.tsx`
  - 改寫登入文案
  - 改成 Google OAuth 入口，而非密碼表單主流程
- `src/app/admin/login/*`
  - 移除或降級舊密碼送出 action 的主流程地位
  - 補上 OAuth 啟動 action 或對應 redirect flow

### 12.2 Callback 與 session flow

- `src/app/auth/callback/route.ts`
  - 收斂為 Google OAuth callback 主入口
  - 完成 session 交換、user 讀取、allowlist 驗證、redirect
- `src/app/auth/client-callback/page.tsx`
  - 重新評估是否仍需要存在
  - 若 Google OAuth flow 不再依賴目前 client callback 中繼頁，可移除或降級為 legacy path

### 12.3 Guard 與 auth helper

- `src/lib/auth/guards.ts`
  - 改以 authenticated user + allowlisted email 判斷 admin 存取
- `src/lib/auth/magic-link.ts`
  - 重新命名、重寫或拆分為較中性的 OAuth auth helper
- `src/lib/auth/*`
  - 補 allowlist parsing、email normalize、auth error mapping 等 helper

### 12.4 Logout 與 admin flow

- `src/app/admin/logout/actions.ts`
  - 改為清理 Supabase session
  - 避免只清舊 cookie 而未真正登出
- `src/app/admin/posts/admin-context.ts`
  - 改接新 guard
- `src/app/admin/posts/actions.ts`
  - 確保 mutation authorization 使用新 guard
- `src/app/admin/projects/actions.ts`
  - 確保 mutation authorization 使用新 guard

### 12.5 Supabase infra

- `src/lib/infra/supabase/server.ts`
  - 補齊 server-side auth flow 所需 helper
- `src/lib/infra/supabase/client.ts`
  - 若 login 頁面需 client-side 啟 OAuth，確認 client 初始化方式一致

### 12.6 測試與文件

- `src/lib/auth/*.test.ts`
  - 補 allowlist、guard、callback 測試
- `src/app/admin/*/*.test.ts`
  - 補 admin 路徑 auth binding 測試
- `docs/blog-admin-implementation-spec.md`
  - 更新主登入模型描述
- `docs/deployment-security-readiness.md`
  - 更新 env、登入流程與升級後基線
- `NOW.md`
  - 更新目前重點與下一步

## 12.7 已實際落地的檔案

本輪已經實際影響的核心檔案包含：

- `src/app/admin/login/page.tsx`
- `src/app/admin/login/login-form.tsx`
- `src/app/admin/login/actions.ts`
- `src/app/auth/callback/route.ts`
- `src/app/auth/client-callback/page.tsx`
- `src/app/admin/posts/admin-context.ts`
- `src/app/admin/logout/actions.ts`
- `src/components/Header.tsx`
- `src/lib/auth/guards.ts`
- `src/lib/auth/server-admin-auth.ts`
- `src/lib/auth/admin-login-oauth-action.ts`
- `src/lib/auth/admin-auth-callback-route.ts`
- `src/lib/auth/admin-logout-action.ts`
- `src/lib/auth/callback-url.ts`
- `src/lib/auth/login-error.ts`
- 對應 auth / login / callback / logout / header tests

## 13. Implementation Tasks

建議把本輪拆成以下 task。

### Task 1：收斂 auth helper 與 allowlist

- 建立 `ADMIN_ALLOWED_EMAILS` 解析 helper
- 建立 email normalize helper
- 建立「目前 user 是否為 admin」判斷 helper

完成標準：

- admin 判斷邏輯集中在 `lib/auth/*`
- page / action 不自行散寫 allowlist 判斷

### Task 2：改寫 login 入口

- `/admin/login` 改為 Google OAuth 主入口
- 補登入錯誤訊息對應
- 移除密碼表單作為主流程入口

完成標準：

- `/admin/login` 不再要求輸入共享密碼
- 使用者能從頁面明確理解登入方式已改變

### Task 3：完成 callback 與 redirect flow

- 使用 Supabase 完成 session 交換
- 驗證目前 user email
- 非 allowlisted user 強制 sign out
- 成功登入導到 `/admin/posts`

完成標準：

- callback 行為只存在單一主路徑
- allowlisted 與 non-allowlisted flow 行為一致可預期

### Task 4：改寫 admin guard 與 logout

- `/admin` page guard 改用新模型
- admin mutation guard 改用新模型
- logout 改為正確清 session

完成標準：

- `/admin/posts`、`/admin/projects`、相關 actions 都使用同一套 auth guard
- 登出後無法繼續存取 admin 路徑

### Task 5：清理舊密碼門主流程

- 移除或降級 `ADMIN_LOGIN_PASSWORD` 主流程依賴
- 移除舊 login action 的正式主責任
- 視實作結果清理舊 `admin_session` 路徑

完成標準：

- repo 不再同時維持兩套正式主登入入口
- 文件不再把單一密碼視為現行主模型

### Task 6：測試、文件與驗證

- 補 callback / guard / logout 測試
- 重跑 admin 發佈手動流程
- 更新主 spec、readiness 與 `NOW.md`

完成標準：

- 自動化驗證通過
- 手動驗證可重現
- 文件與實作一致

## 14. 資料與相容性策略

本輪不需要新增新的內容資料表。

但需明確處理以下相容性：

- 舊 `admin_sessions` 與密碼門邏輯會保留多久
- migration 期間是否允許短暫雙軌
- 最終是否移除舊密碼登入相關程式碼

建議策略：

- 開發期間可短暫保留舊程式碼作為遷移輔助
- 一旦 Google OAuth flow 驗證完成，應將舊密碼門降為非主流程
- 最終以移除舊主流程為目標，避免 repo 長期維持兩套正式入口

## 15. 驗證方式

### 12.1 自動化驗證

至少應補以下測試：

- allowlisted email 可通過 callback 並進入 `/admin/posts`
- 非 allowlisted email 會被 sign out 並導回 `/admin/login`
- unauthenticated user 進 `/admin/posts` 仍會被擋下
- authenticated 但非 admin user 進 `/admin/posts` 仍會被擋下
- logout 後無法繼續存取 admin 頁面

### 12.2 手動驗證

至少完整走過一次：

1. 從 `/admin/login` 點 Google 登入
2. 成功進入 `/admin/posts`
3. 建立 draft
4. 編輯並發佈文章
5. 前台 `/blog` 與 `/blog/[slug]` 正常反映
6. 登出後重新開啟 `/admin/posts` 會被導回登入
7. 用非 allowlisted Google 帳號登入時會被拒絕

補充說明：

- 2026-06-17 這一輪已完成自動化驗證與文件同步
- 但因目前工作環境無法在本機啟動可互動 dev server，且未在此 session 內完成真實 Google 帳號登入，因此這一條仍待在可互動環境補記錄

## 16. Acceptance Criteria

這份 spec 進入開發時，應以以下 acceptance criteria 作為驗收基線：

- `/admin/login` 已改為 Google OAuth 主入口
- allowlisted Google 帳號可登入並進入 `/admin/posts`
- 非 allowlisted Google 帳號會被拒絕並導回登入頁
- 未登入或已登出時不可存取 `/admin/posts`、`/admin/projects`
- admin create / update / publish / unpublish flow 在新 auth 模型下維持可用
- `ADMIN_LOGIN_PASSWORD` 不再是正式主流程必要條件
- 相關主文件已同步改寫為新 auth 模型

截至 2026-06-17：

- 上述條件中的程式碼、測試與文件同步已完成
- 尚待最後補齊的是「真實 Google 帳號互動登入」的手動驗證紀錄

## 17. 風險與注意事項

- local / preview / production callback URL 容易不一致
- allowlist 判斷若散落在多處，後續容易出現繞過或行為不一致
- logout 若只清 app 狀態、不清 Supabase session，可能留下錯誤登入體感
- 若保留舊密碼登入太久，會讓文件與真實主流程脫節

## 18. 分階段建議

### Phase 1：Auth flow 收斂

- 建立 allowlist helper
- 完成 Google OAuth login / callback / logout
- 改寫 admin guard

### Phase 2：Admin flow 驗證

- 補 auth 相關測試
- 重跑 admin 發文手動驗證
- 確認 production / local callback 設定

### Phase 3：文件與舊流程清理

- 更新 blog admin 主 spec
- 更新 deployment readiness
- 更新 `NOW.md`
- 移除或降級舊密碼門描述

## 19. 完成定義

此升級 round 完成需同時滿足：

- `/admin/login` 主登入方式已改為 Google OAuth
- admin 存取已由 allowlisted authenticated user 控制
- 既有 `/admin/posts`、`/admin/projects` 流程可正常使用
- 測試與手動驗證通過
- `NOW.md`、相關主 spec 與 readiness 文件已同步更新

若以 2026-06-17 的實際進度來看：

- `測試與文件同步` 已完成
- `互動式手動驗證` 尚待在可登入 Google 的環境補完最後紀錄；2026-07-17 已補 production HTTP 可達性刷新，但那不等於完成真實帳號互動驗證
