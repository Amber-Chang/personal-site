# Blog Admin Implementation Spec

> 用途：把 blog admin MVP 從產品規格推進到可實作的系統設計與開發邊界。

## 1. 目標

這份文件回答的不是「要不要做 blog admin」，而是：

- 在目前網站架構下，blog admin 第一版要怎麼實作
- 哪些是 MVP 必做
- 哪些邊界要先切好，才能支援後續擴張

第一版目標：

- 站主可透過 allowlisted Google 帳號登入後台
- 可建立、編輯、存草稿、發佈 blog post
- 前台 `/blog` 與 `/blog/[slug]` 可穩定讀取已發佈文章
- 架構上不把內容邏輯綁死在 page 或 Supabase SDK 上

## 1.5 目前進度

### 已完成

- `Phase 1：資料與登入底座`
  - Supabase schema
  - 第一版 auth / session 底座
  - repository / service 邊界
  - trusted Next.js server + service-role admin content path
- `Phase 2：Admin CRUD skeleton`
  - `/admin/login`
  - `/admin/posts`
  - `/admin/posts/new`
  - `/admin/posts/[id]`
  - 共享 post form
  - 最小 create / update server actions
- `Phase 3：前台 blog 切換`
  - `/blog` 改讀 repository
  - `/blog/[slug]` 改讀 repository
  - public content path 使用 anon Supabase client 與 published-only repository read
  - admin posts pages 已標成 runtime dynamic，避免 build-time prerender 觸發 session / env 讀取
- `Phase 4：Migration tooling 與 Markdown-only 清點`
  - 新增 `npm run content:import-posts` 一次性匯入指令
  - 新增 `npm run content:sync-projects` project identity 同步指令
  - Markdown importer 會讀取 `content/posts/*.md` 並建立 `blog_posts`
  - project sync 會讀取 `content/projects/*.md` 並同步 `projects` identity table
  - 匯入時同 slug 既有文章會跳過，不覆蓋人工調整資料
  - project sync 以 `slug` 為 identity key，會更新既有項目而非重複建立
  - 首頁 writing 區塊改讀 public repository 的 published posts
  - 舊 `src/lib/posts.ts` 已移除，blog 前台不再依賴 Markdown reader
  - 已實際匯入 `ai-membership-system`
  - admin post form 已改成 `儲存變更 / 發佈文章 / 取消發佈` 的 publish UX
  - 當時先以單一密碼 + httpOnly session cookie 收斂 admin login MVP，避免被內建 email provider 限制卡住
  - 前台導覽列在 admin 已登入時會顯示 `後台` 入口，方便往返內容編輯流程
  - post form 已補上欄位說明文字，降低第一次使用後台的理解成本
  - publish intent 改為 hidden input 顯式傳遞，避免 button submit value 在 server action 流程中掉失
  - Supabase duplicate slug 等常見錯誤已翻成較可讀的中文訊息
- `Phase 5：Blog / Project linking`
  - public blog post page 已可顯示 related project 區塊
  - public project page 已可顯示 related published posts 區塊
  - blog / project 關聯資料已透過 content / repository 邊界組裝，不散落在 page 層
  - projects 仍維持 Markdown source，但 public content path 已可透過 adapter 與 Supabase project identity 對接
  - admin post form 的 `Related project` 選單已可透過 project sync 實際選用既有案例
- `Phase 6：Project identity admin`
  - 已新增 `/admin/projects`、`/admin/projects/new`、`/admin/projects/[id]`
  - 可在後台建立與編輯 project identity 的最小欄位：`title / slug / summary / status`
  - published project 會出現在文章關聯選單；draft project 不會出現在公開 relation options
  - 這一輪仍不包含完整 project body editor，public project page 內容主來源維持 Markdown
- `Phase 7：Google OAuth admin upgrade`
  - `/admin/login` 已改為 Google OAuth 主入口
  - admin 權限改由 allowlisted authenticated user 判斷
  - `/admin/posts`、`/admin/projects` 與相關 mutation 已改接同一套 auth guard
  - admin logout 已改為清理 Supabase-backed session
  - 舊單一密碼流程已不再是正式主登入模型

### 已完成但後續仍可補強

- admin login 錯誤處理已受控，但 UI 訊息仍可再打磨
- admin post form 已可新增 / 編輯，但還不是 rich editor 體驗
- admin content path 已可用，但還沒接上 preview
- `content/posts/*.md` 仍保留作為 migration source，實際匯入完成後再決定是否移除
- 真實 Google 帳號的 production / 可互動環境 smoke check 紀錄仍需再補一輪；截至 2026-07-17，`npm test` 已全綠，但互動式 OAuth 驗證仍需站主帳號完成最後紀錄

### 尚未完成

- `Phase 7：Google OAuth 實機驗證補記錄`
  - 用 allowlisted Google 帳號登入 `/admin/posts`
  - 驗證登入、草稿、編輯、發佈、公開顯示整條流程
  - 驗證登出後 admin 保護仍成立
  - 驗證非 allowlisted 帳號會被拒絕
- 後續體驗補強
  - preview
  - Markdown editor 強化

### 建議下一個 round

- 在 production 或可互動 staging 環境重跑完整 Google OAuth admin smoke check，補 deploy 後登入 / 登出 / 發佈 / 取消發佈 / unauthorized rejection 驗證紀錄
- 視需要補 preview、`title -> slug` 自動建議與更完整的後台錯誤訊息

## 2. 決策摘要

- 應用後端使用 `Next.js Server Actions + Route Handlers`
- 後端基礎設施使用 `Supabase`
- blog 內容主來源會從 repo 內 Markdown 逐步切到資料庫
- 第一版後台只管理 `blog_posts`
- `projects` 暫時不做後台，但資料模型需可被 blog post 關聯
- 內容讀寫邏輯集中在 `service / repository / infra` 邊界層

## 3. 範圍

第一版包含：

- admin 登入頁
- admin 文章列表頁
- admin 新增文章頁
- admin 編輯文章頁
- blog post 草稿 / 發佈流程
- blog post 與 project 的選填關聯
- 前台 blog 列表與單篇文章改讀資料庫

第一版不包含：

- project 後台 CRUD
- about / homepage 內容管理
- 多人角色管理
- 媒體庫
- version history
- 排程發佈

## 4. 系統邊界

### 4.1 Next.js 責任

- 提供前台頁面與 admin 頁面
- 提供登入 callback 與需要的 route handlers
- 提供 server actions 處理 admin 表單操作
- 組裝 service layer，不直接承擔 provider-specific 存取邏輯

### 4.2 Supabase 責任

- 提供 `Postgres` 資料庫
- 提供基礎授權能力
- 未來若需要圖片，可延伸到 storage

### 4.3 App 內部責任切分

- `app/`：頁面、layout、UI 組裝
- `server actions`：新增 / 更新 / 發佈 / 取消發佈文章
- `route handlers`：auth callback、未來 preview 或 webhook
- `service layer`：發佈規則、slug 規則、存取條件
- `repository layer`：文章與 project 的讀寫介面
- `infra layer`：Supabase client 與 adapter 實作

## 5. 建議檔案結構

```text
src/
  app/
    admin/
      login/
      posts/
      posts/new/
      posts/[id]/
    auth/
      callback/
    blog/
    blog/[slug]/
  components/
    admin/
  lib/
    auth/
      session.ts
      guards.ts
    content/
      types.ts
      repository.ts
      services.ts
    infra/
      supabase/
        client.ts
        server.ts
        admin.ts
      repositories/
        supabase-posts-repository.ts
        supabase-projects-repository.ts
```

這份結構的重點不是一次建滿，而是先確保後續新增功能時不需要把資料邏輯再從 page 裡拆出來。

## 6. 資料模型

### 6.1 `projects`

第一版先建立可被 blog 關聯的最小欄位。

- `id` `uuid primary key`
- `slug` `text unique not null`
- `title` `text not null`
- `summary` `text`
- `content_markdown` `text`
- `status` `text not null default 'draft'`
- `published_at` `timestamptz null`
- `created_at` `timestamptz not null default now()`
- `updated_at` `timestamptz not null default now()`

### 6.2 `blog_posts`

- `id` `uuid primary key`
- `slug` `text unique not null`
- `title` `text not null`
- `excerpt` `text`
- `content_markdown` `text not null default ''`
- `status` `text not null default 'draft'`
- `published_at` `timestamptz null`
- `related_project_id` `uuid null references projects(id)`
- `created_at` `timestamptz not null default now()`
- `updated_at` `timestamptz not null default now()`

### 6.3 狀態規則

- 第一版只使用 `draft` 與 `published`
- 當文章從 `draft` 轉成 `published` 時：
  - 若 `published_at` 為空，補上目前時間
- 當文章從 `published` 改回 `draft` 時：
  - 第一版可保留原 `published_at`
  - 公開前台仍只讀 `status = 'published'`

### 6.4 未來預留但第一版不做

- `cover_image_url`
- `seo_title`
- `seo_description`
- `updated_by`
- `content_format`

## 7. Auth 與權限

### 7.1 登入方式

- 第一版正式模型使用 `Supabase Auth + Google OAuth`
- admin 身分以 allowlisted email 判斷
- 第一版仍只有站主登入，不做多人帳號管理 UI
- 若部署環境尚未完成 env 命名遷移，可暫時接受 `SUPABASE_ADMIN_EMAILS` fallback，但正式設定以 `ADMIN_ALLOWED_EMAILS` 為準

### 7.2 Session 流程

- `/admin/login` 由 server action 啟動 Google OAuth
- callback route 完成 session 交換與 allowlist 驗證
- 驗證通過後直接導向 `/admin/posts`

### 7.3 Admin 存取規則

- 未登入不可進入任何 `/admin/*` 內容頁
- 已登入但 email 不在 allowlist 的使用者也不可進入任何 `/admin/*` 內容頁
- 未登入存取 admin server actions 時應直接拒絕
- `guards.ts` 負責集中處理登入檢查，不在每頁重複散寫

### 7.4 資料授權規則

- 公開前台只可讀 `published` 的 `blog_posts`
- admin 可讀寫所有 `blog_posts`
- 第一版因為只有一位使用者，可採 allowlisted Google 帳號的最小可行授權規則
- 但 DB / app 邊界要保留未來多人使用的延伸空間

## 8. RLS 與資料存取策略

第一版建議採這個方向：

- 公開讀取：只允許讀取 `published` 文章
- admin 讀寫：只允許已通過單一 admin 密碼驗證並持有有效 session 的使用者操作

實作上有兩種路徑：

### 路徑 A：以 Supabase RLS 為主

- 優點：資料庫層邊界較清楚
- 缺點：初期開發與除錯稍微複雜

### 路徑 B：第一版以 server-side service guard 為主，RLS 採最小保護

- 優點：MVP 實作速度較快
- 缺點：授權邏輯較偏 app 層

目前建議：

- 第一版採 `server-side service guard + 基本 RLS`
- 不為了第一版把授權規則做得過重
- 但 schema、session 與 repository 邊界仍以未來可強化 RLS 為前提

## 9. 資料存取介面

為了避免之後整站被 Supabase SDK 綁死，第一版就先定介面。

### 9.1 `posts repository` 需要的能力

- `listPublishedPosts()`
- `getPublishedPostBySlug(slug)`
- `listAdminPosts()`
- `getAdminPostById(id)`
- `createPost(input)`
- `updatePost(id, input)`
- `publishPost(id)`
- `unpublishPost(id)`

### 9.2 `projects repository` 需要的能力

- `listProjectOptions()`
- `getProjectById(id)`

第一版可以只有最小方法集合，但 page / action 不應直接碰 Supabase query builder。

## 10. 前台切換策略

### 10.1 切換原則

- `projects` 前台暫時維持既有 Markdown 流程
- `blog` 前台改由資料庫讀取
- 不一次把所有內容來源都切掉

### 10.2 blog 前台行為

- `/blog` 只列出 `published` 文章
- `/blog/[slug]` 只顯示 `published` 文章
- 找不到或未發佈時回 `notFound()`

### 10.3 舊 `src/lib/posts.ts` 的策略

- 第一階段先保留檔案，但把新頁面改接 repository
- 等 blog 前台與 admin 完整切換後，再評估是否移除 Markdown 文章邏輯

## 11. Markdown Migration 策略

### 11.1 第一版原則

- 現有 `content/posts/*.md` 不立即刪除
- 先做一次性匯入，讓資料庫成為 blog admin 與 blog 前台的新來源

### 11.2 匯入建議欄位對應

- frontmatter `title` -> `title`
- frontmatter `date` -> `published_at`
- 檔名 -> `slug`
- 內文 -> `content_markdown`
- `draft` -> `status`

### 11.3 匯入方式

- 使用 `npm run content:import-posts` 執行一次性 import script
- 匯入時若 slug 已存在，預設跳過
- 第一版不覆蓋，避免不小心覆蓋人工調整資料
- script 需要完整 Supabase env：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `ADMIN_ALLOWED_EMAILS`

## 12. UI 與互動規格

### 12.1 Admin 列表頁

- 顯示 title、status、updated_at、published_at
- 可進入新增頁與編輯頁

### 12.2 Admin 編輯頁

- 欄位：
  - title
  - slug
  - excerpt
  - content_markdown
  - related_project_id
  - status
- 操作：
  - 儲存草稿
  - 發佈文章
  - 取消發佈

### 12.3 Markdown Editor

- 第一版以簡單、穩定為主
- 不追求 block editor 或 Notion-like rich text
- 若要加套件，優先選擇整合成本低、可直接輸出 Markdown 字串的方案

## 13. 實作順序

### Phase 1：資料與登入底座

- 建立 Supabase 專案與環境變數
- 建立 `projects` 與 `blog_posts` schema
- 建立 auth callback 與 admin guard
- 建立最小 repository / service 骨架

### Phase 2：Admin CRUD

- 建 `/admin/login`
- 建 `/admin/posts`
- 建 `/admin/posts/new`
- 建 `/admin/posts/[id]`
- 接上 server actions

#### 目前 round 2 範圍

- 把 `/admin/posts` 從 foundation placeholder 改成真正的文章列表頁
- 建立 `/admin/posts/new` 的最小可用新增表單，預設支援建立草稿
- 建立 `/admin/posts/[id]` 的最小可用編輯表單，可讀取並更新既有文章
- 表單欄位先支援：
  - `title`
  - `slug`
  - `excerpt`
  - `content_markdown`
  - `status`
  - `related_project_id`
- 使用既有 `service / repository / service-role admin path`

#### 目前 round 2 明確不包含

- Markdown editor 強化
- preview
- 發佈流程的完整 UX 打磨
- markdown migration
- `projects` 後台管理

### Phase 3：前台 blog 切換

- `/blog` 改讀 repository
- `/blog/[slug]` 改讀 repository
- 驗證只有 `published` 文章可見

### Phase 4：Migration 與驗證

- 匯入既有 Markdown 文章
- 驗證登入、草稿、編輯、發佈、公開顯示
- 清點哪些 Markdown-only 邏輯可移除

## 14. 驗證清單

- 可以用 allowlisted Google 帳號完成登入並進入 `/admin/posts`
- 未登入時不可使用 admin 功能
- 已登入但非 allowlisted 帳號不可使用 admin 功能
- 可以建立草稿文章
- 可以編輯既有文章
- 可以發佈文章並在前台看到
- 未發佈文章不可透過 `/blog/[slug]` 被公開讀到
- 文章可選擇關聯 project
- blog 前台已不依賴 `content/posts/*.md`
- 實際 import 需在具備 Supabase env 與資料庫連線的環境執行

## 15. 風險與取捨

### 15.1 目前接受的取捨

- 第一版不追求多人協作
- 第一版不追求完整 CMS
- 第一版授權規則可先偏簡化

### 15.2 需要避免的風險

- 把 Supabase query 直接散寫進頁面，導致之後難抽換
- 讓 admin 與前台各自走不同內容模型
- 沒有 migration 策略就直接切資料來源，導致既有內容斷裂

## 16. 完成定義

做到以下狀態，才算第一版 implementation 到位：

- 有一套可運作的 Supabase schema
- 有可用的 admin 登入流程
- 有可用的 blog post CRUD 與發佈流程
- 前台 blog 已改讀資料庫
- 內容邏輯已經進入 service / repository 邊界，而不是散在 page 中
