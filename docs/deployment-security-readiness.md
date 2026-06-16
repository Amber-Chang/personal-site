# Deployment Security Readiness

## 1. 目的

這份文件是目前單人 admin 上線前的 readiness 主文件。

它回答三件事：

- 這一版 deployment readiness 的範圍是什麼
- 目前 admin / auth 模型成立的前提是什麼
- 上線前與上線後，哪些檢查完成後才算進入可接受狀態

這份文件定義的是「最低可接受基線」，不是多人後台或完整資安體系的終局方案。

## 2. 範圍

本文件涵蓋：

- `/admin/login` 與 `/admin/posts` 相關的單人 admin 上線前基線
- admin Google OAuth 登入、Supabase session、內容發佈流程的部署前後檢查
- production / preview 部署前需要確認的環境變數與操作假設
- 何時仍可接受維持目前 auth，何時應升級 auth

本文件不涵蓋：

- 多人帳號、角色與權限模型
- session revocation 後台、裝置管理、audit log 平台
- 一般網站內容編輯以外的營運後台需求

## 3. 單人 admin model 假設

目前 readiness 以以下假設成立：

- admin 使用者只有站主一人
- admin 僅用於 blog post 建立、編輯、發佈與取消發佈
- 登入模型為 `Supabase Auth + Google OAuth + allowlisted email`
- admin 內容讀寫走 trusted Next.js server path，不把 service-role 能力暴露到 client
- public blog read 仍維持 published-only read model
- 這一版目標是讓站主可安全部署與維護內容，不追求多人協作

只要以上任一假設失效，就不應再把這份文件視為足夠的最終 readiness 依據。

## 4. 上線基線

目前這一版至少應具備以下條件，才可視為進入「可部署」狀態：

- admin login 有最小防暴力登入保護
- admin login rate limit 狀態可跨 instance 持久化，不只存在 process memory
- admin session 採 production-safe 預設，且 session 驗證留在 server 端
- admin mutation path 有 trusted origin 檢查
- 必要 env 已在部署環境完整配置
- lint、test、production build 通過
- admin 發文流程手動驗證完成
- 已明確接受目前單人 admin + allowlist 模型的限制，而不是誤以為它已等同正式多用戶 auth

## 5. 必要環境變數

以下是目前 deployment readiness 依賴的最小 env 集合。

| 變數 | 用途 | 備註 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 前台與 server 端連線到 Supabase 專案 | 必填 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public read 與一般 Supabase client 初始化 | 必填 |
| `SUPABASE_SERVICE_ROLE_KEY` | trusted server 端 admin content path 寫入 | 只能放 server-side runtime |
| `NEXT_PUBLIC_SITE_URL` | 站點 URL、redirect 與部署環境判定相關設定 | preview / production 都需對應正確網址 |
| `ADMIN_ALLOWED_EMAILS` | allowlisted admin email 清單 | 必填，逗號分隔 |
| `SUPABASE_ADMIN_EMAILS` | 舊 allowlist env 名稱 | 僅 migration fallback，非首選 |

補充說明：

- `ADMIN_ALLOWED_EMAILS` 應以 normalize 後 email 寫入，避免大小寫或空白造成誤判
- Google OAuth client id / secret 與 callback URL 主要配置在 Supabase Auth provider 設定中，不是由 app runtime env 直接承載
- `ADMIN_LOGIN_PASSWORD` 若仍存在於個別本機環境，應視為 legacy 過渡值，不再是正式主登入流程必要條件

## 6. 上線前檢查表

### 6.1 架構與設定檢查

- [ ] 確認目前部署目標仍是單人 admin，而非多人協作
- [ ] 確認 admin 主登入路徑已是 Google OAuth，而不是舊密碼門
- [ ] 確認 `ADMIN_ALLOWED_EMAILS` 已正確配置，若仍使用 `SUPABASE_ADMIN_EMAILS`，已知那只是過渡 fallback
- [ ] 確認 `SUPABASE_SERVICE_ROLE_KEY` 只在 trusted server path 使用
- [ ] 確認 production 與 preview 的 `NEXT_PUBLIC_SITE_URL` 各自正確
- [ ] 確認 Supabase Auth 的 Google provider、callback URL 與站點網域設定正確

### 6.2 自動化驗證 gate

- [ ] `npm run lint` 通過
- [ ] `npm test` 通過
- [ ] `npm run build` 通過

若上述任一失敗，不能把該版本視為 deployment-ready。

### 6.3 Admin login / session 檢查

- [ ] Google OAuth 取消、callback 無效、未授權 email 等情境都會回到受控錯誤訊息
- [ ] 連續失敗登入或高頻請求會觸發最小 rate limit / cooldown
- [ ] 被 block 期間，不應能繞過登入限制建立可用 admin session
- [ ] login rate limit 狀態不依賴單一 process memory，可跨 deployment runtime 成立
- [ ] Supabase session cookie 在 production 具備 `httpOnly`、`secure`、`sameSite=lax` 等安全預設
- [ ] admin login / logout / content mutation 已限制 trusted origin
- [ ] session lifetime 已被明確定義並可接受目前單人站主管理情境

目前 session lifetime 定義為 24 小時（`60 * 60 * 24` 秒），cookie 只保存隨機 session token，本體驗證則走 server-side session record。

採 24 小時的理由：

- 對單人站主管理情境來說，仍保留可接受的登入摩擦，不需要每次刷新頁面都重登
- 相比 7 天 cookie，24 小時更能收斂裝置遺失、共用裝置或忘記登出的風險
- 這一版尚未提供完整 session revocation、裝置管理與 rotation，因此先採較保守基線

### 6.4 Admin 發文手動驗證 gate

至少要完整走過一次以下流程：

- [ ] 未登入直接進入 `/admin/posts` 會被拒絕或導回登入
- [ ] 以 allowlisted Google 帳號登入成功並進入 `/admin/posts`
- [ ] 新增一篇 draft
- [ ] 編輯 draft 內容並成功儲存
- [ ] 發佈文章後，前台 `/blog` 與 `/blog/[slug]` 可看見該文章
- [ ] 取消發佈後，前台文章會消失或不可公開存取
- [ ] 登出後重新進入 `/admin/posts` 會被擋下
- [ ] 非 allowlisted Google 帳號完成 OAuth 後會被 sign out 並導回登入頁
- [ ] duplicate slug 等常見錯誤會以可理解訊息呈現

### 6.5 最近一次手動驗證結果

- 驗證日期：2026-06-07
- 驗證環境：本機 `http://localhost:3000`（使用 `.env.local`）
- 驗證方式：瀏覽器自動化跑完整 admin flow
- 驗證結果：通過
- migration 狀態：`public.admin_sessions` 已成功套用到實際 Supabase 環境

本次已實際驗證以下流程：

- 以 admin 密碼登入 `/admin/login`
- 建立新 draft
- 從 admin 編輯頁發佈文章
- 確認前台 `/blog` 與 `/blog/[slug]` 可見
- 從 admin 編輯頁取消發佈
- 確認 `/blog` 列表隱藏，且 `/blog/[slug]` 回到不可公開存取
- 再次發佈後，確認前台重新可見

本次驗證使用並保留的 smoke test 樣本為：

- `slug`: `admin-flow-check-20260607-0215`
- `id`: `347c90c6-a881-4a7b-b232-4431f362e0c0`
- 狀態：`published`

建議 production deploy 後優先用這篇文章做 smoke check：

- `/blog/admin-flow-check-20260607-0215` 應可公開讀取
- 後台重新登入後應可在 `/admin/posts/347c90c6-a881-4a7b-b232-4431f362e0c0` 正常編輯

### 6.5.1 Production deploy 後補充確認

- 確認日期：2026-06-08
- production 網址：`https://personal-site-two-opal.vercel.app/`
- 確認方式：實際開啟 production 頁面並檢查公開路由
- 已確認可正常載入：
  - `/`
  - `/blog`
  - `/blog/test-post-2026`
  - `/blog/admin-flow-check-20260607-0215`
  - `/admin/login`
- 目前發現：
  - `admin-flow-check-20260607-0215` 目前仍存在於 production，可繼續作為 smoke sample
  - 未登入直接開啟 `/admin/posts` 會被導回 `/admin/login`
  - `admin-flow-check-20260607-0215` 文章頁可連到關聯 project 頁，前台 article -> project 鏈路正常

### 6.5.2 Projects Supabase-first migration 後補充確認

- 確認日期：2026-06-09
- 變更內容：
  - 已套用 `supabase/migrations/202606090001_expand_projects_for_public_content.sql`
  - 已重跑 `npm run content:sync-projects`
- sync 結果：
  - `Created: 0`
  - `Updated: 2`
  - `Updated slugs: ai-writing-review-product, sms-management-platform`
- production 公開路由確認：
  - `/`
  - `/projects`
  - `/projects/ai-writing-review-product`
  - `/projects/sms-management-platform`
- 目前判定：
  - public `projects` 內容已可由 Supabase-first source 正常提供
  - production `/projects` 清單已反映 DB-driven project entries
  - `projects` 相關的公開讀取基線已成立
- 仍待補：
  - 把已手動完成的 `/admin/projects` 建立 / 編輯流程驗證記錄回填到文件
  - project admin 對 public 頁面反映速度與 revalidation 行為的實際驗證描述再收斂成固定格式

### 6.5.3 Admin security hardening deploy 後補充確認

- 確認日期：2026-06-12
- 執行內容：
  - 已在 Supabase SQL Editor 套用 `supabase/migrations/202606120001_add_admin_login_attempts.sql`
  - 已在 Vercel `personal-site` project publish 以下 live firewall rules：
    - `Admin login rate limit`
    - `Admin area challenge`
- live 規則內容：
  - `Admin login rate limit`
    - path equals `/admin/login`
    - `5 requests / 900s / ip`
    - exceeded action: `deny`
  - `Admin area challenge`
    - path starts with `/admin/posts`
    - OR path starts with `/admin/projects`
    - action: `challenge`
    - duration: `30m`
- 實測結果：
  - 直接開啟 production `/admin/login` 可正常回 `200`
  - 連續請求 `/admin/login` 6 次時，前 5 次回 `200`，第 6 次回 `403`
- 目前判定：
  - 外層 `/admin/login` request throttling 已在 production 生效
  - `/admin/login` 不會再被過寬的 challenge 規則誤攔

### 6.5.4 Google OAuth auth upgrade 自動化驗證

- 驗證日期：2026-06-17
- 驗證環境：本機開發環境與測試 runner
- 已完成：
  - auth / callback / logout / server-admin-auth targeted tests 通過
  - 受影響的 admin posts / projects / header 測試通過
  - `npm run lint` 通過
- 額外觀察：
  - `npm run build` 已通過 TypeScript 與編譯階段，但在 `/projects/[slug]` page data collection 因外部 `fetch` 失敗中止，判定較接近目前環境無法完成 build-time remote fetch，而不是本輪 Google OAuth 程式碼 regression
  - 完整 `npm test` 仍有一個既有不相關失敗：`src/app/blog/[slug]/page.test.ts` 的 brittle source assertion
- 尚未在此環境完成：
  - 真實 Google 帳號互動登入
  - 非 allowlisted 帳號 rejection 的實機紀錄
  - login / logout / draft / publish / unpublish 的完整瀏覽器 smoke check

目前結論：

- 這一輪的 auth 升級程式碼、targeted verification 與主文件同步已完成
- 若要把這份 readiness 視為 Google OAuth round 的最終 deploy gate，仍需在可互動環境補一輪手動 smoke check

### 6.6 可重複執行的 admin publish / unpublish checklist

以下流程設計成同一環境可重複執行，不依賴一次性資料狀態：

1. 開始前準備
   - 確認 `NEXT_PUBLIC_SITE_URL` 指向這次要驗證的實際站點
   - 確認 `ADMIN_ALLOWED_EMAILS`、Supabase URL、anon key、service role key 都已正確配置
   - 確認 Supabase Auth 的 Google provider 與 callback URL 設定正確
   - 準備一個本次驗證專用 slug，例如 `manual-check-YYYYMMDD-HHMM`

2. 驗證未登入保護
   - 直接開啟 `/admin/posts`
   - 確認頁面被導回 `/admin/login` 或明確拒絕存取

3. 驗證登入
   - 在 `/admin/login` 點擊 Google 登入，並使用 allowlisted Google 帳號完成授權
   - 確認成功進入 `/admin/posts`
   - 重新整理一次 `/admin/posts`，確認 session 仍有效

4. 建立 draft
   - 建立一篇新文章，title 可用 `Manual verification post`
   - slug 使用本次專用 slug
   - 先以 draft 儲存
   - 回到列表頁，確認文章存在且狀態為 draft

5. 驗證 draft 不外露
   - 直接開啟 `/blog/[slug]`
   - 確認 draft 狀態下不可被公開讀取

6. 編輯並發佈
   - 回到 `/admin/posts/[id]` 編輯剛建立的文章
   - 更新 excerpt 或內文，儲存後再按發佈
   - 確認列表頁狀態變成 published
   - 開啟 `/blog` 與 `/blog/[slug]`，確認前台已可看到文章與最新內容

7. 取消發佈
   - 回到 admin 編輯頁按取消發佈
   - 確認列表頁狀態回到 draft
   - 重新整理 `/blog` 與 `/blog/[slug]`，確認前台不再顯示該文章

8. 重新發佈
   - 再次發佈同一篇文章
   - 確認 `/blog` 與 `/blog/[slug]` 恢復可見

9. 驗證常見錯誤
   - 嘗試把另一篇既有文章的 slug 改成相同值，或重建相同 slug 的文章
   - 確認 UI 顯示可理解的 duplicate slug 錯誤訊息，而不是原始資料庫錯誤

10. 驗證未授權帳號
   - 使用不在 `ADMIN_ALLOWED_EMAILS` 內的 Google 帳號完成一次 OAuth flow
   - 確認系統會主動 sign out 並導回 `/admin/login`

11. 收尾
   - 視需要保留該文章作為驗證樣本，或改回 draft 避免干擾公開列表
   - 記錄本次驗證日期、環境（preview / production）與結果

## 7. 上線後檢查表

部署完成後，至少做一次 smoke check：

- [ ] 首頁、`/blog`、`/projects`、`/about` 正常載入
- [ ] `/admin/login` 可正常開啟
- [ ] admin 可成功登入與登出
- [ ] 非 allowlisted Google 帳號不可取得 admin 存取
- [ ] 已發佈文章在前台正常顯示
- [ ] 未發佈文章不會誤出現在公開前台
- [ ] 新增或更新文章後，前台顯示與預期一致
- [ ] 若有 rate limit，錯誤訊息仍維持受控，不暴露系統內部資訊

若是第一次 public deployment，建議再額外確認：

- [ ] production 網址與 `NEXT_PUBLIC_SITE_URL` 一致
- [ ] 瀏覽器實際 cookie 行為符合 production 預期
- [ ] allowlisted admin email 設定與實際登入帳號一致
- [ ] Vercel `/admin` 路徑已補 WAF / Bot Protection / rate limit 類規則

## 8. 已知限制

這一版明確接受以下限制：

- 不是多人後台最終方案
- 不支援角色與權限分級
- 雖然已改成 server-side session，但目前仍不支援完整的 session 管理 UI 或批次撤銷流程
- 不支援完整 audit log / 操作追蹤
- 若 rate limit 採 app-layer 或 in-memory 方案，跨 instance 一致性有限
- 目前 readiness 仍只保證單人站主管理情境，不保證協作型營運流程
- Google OAuth provider / callback 設定若在 preview、production、localhost 之間漂移，容易造成只有部分環境可登入

這些限制不是隱性風險，而是目前方案的一部分；只要需求跨過這條線，就不應再用「小補強」處理。

## 9. 何時該升級 auth

只要出現以下任一情況，就應把 auth 升級列為主線工作，而不是繼續沿用目前單人 allowlist 模型：

- admin 使用者不再只有站主一人
- 需要區分作者、編輯、審核者等角色
- 需要遠端協作、邀請制登入或人員異動管理
- 需要可撤銷 session、強制登出或裝置層級控管
- 需要更強的 brute-force / abuse 防護，且單機或 app-layer rate limit 已不夠
- 需要 audit log、操作追溯或合規要求
- 需要把 admin 能力擴大到 blog 以外的更多內容或營運功能

建議升級方向：

- 先重新定義 auth 邊界，再決定是否延伸現有 Supabase Auth、補角色模型、加入第二 provider 或導入更正式的組織級 SSO
- 升級時應同時重看 session、repository 授權邏輯、部署 secret 與營運流程，而不是只換登入畫面

## 10. 目前 readiness 判準

目前這個站只適合在以下條件下被視為 ready：

- 是單人 admin 維運模型
- deployment 目標明確接受 Google OAuth + email allowlist 的 MVP 等級 auth 限制
- 自動化驗證與手動發佈驗證皆完成
- maintainer 清楚知道目前是「可上線的最低基線」，不是完整後台安全方案

若上述條件無法同時成立，應先補 Task 2 之後的 auth hardening 與驗證工作，再決定是否進入 public production deployment。

## 11. 目前判定

- 判定日期：2026-06-17
- 自動化 gate：targeted auth / admin flow tests 與 `npm run lint` 通過；完整 `npm test` 與 `npm run build` 仍各有一個目前判定非本輪 auth regression 的阻礙
- 手動 flow gate：歷史上的密碼門 flow 已通過，但這一輪 Google OAuth 實機登入 / 登出 / unauthorized rejection 紀錄尚未在本環境補完
- production 狀態：
  - `https://personal-site-two-opal.vercel.app/` 已上線
  - 首頁、`/blog`、既有公開文章與 `/admin/login` 已確認可正常載入
  - 首頁、`/projects`、`/projects/ai-writing-review-product`、`/projects/sms-management-platform` 已確認可正常載入
  - deploy 後完整 Google OAuth admin smoke check 尚未重新記錄
- 目前結論：**Google OAuth admin 升級的實作、targeted 驗證與主文件同步已完成；在把這一輪視為最終 deployment-ready 前，仍需補一輪真實 Google 帳號的 admin smoke check**

這代表：

- 若目標是站主自己維運 blog admin，這一版已接近可上線的最低基線，但還差最後一段 OAuth 實機驗證紀錄
- 若目標改成多人後台、角色分級、可撤銷 session 或更完整的操作追蹤，則不應把目前狀態視為足夠

## 12. 本輪 session hardening 狀態

- 已完成：deterministic cookie -> 隨機 server-side session 的程式碼與 migration
- 已完成：`npm test`、`npm run build` 驗證通過
- 已完成：`supabase/migrations/202606070002_add_admin_sessions.sql` 已套用到實際 Supabase 環境
- 待補記錄：把已完成的 production admin 手動驗證與目前 smoke sample 狀態整理回文件
