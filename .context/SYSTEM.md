# 系統總覽（SYSTEM）

## 系統目的

`personal-site` 是 Amber 的個人品牌網站，主要讓潛在雇主與合作對象快速理解她如何用 AI-native workflow 做產品、累積案例與公開寫作。

## 主要模組

- `public-content`：公開首頁、`/about`、`/blog`、`/projects` 與內容內頁，負責呈現已發佈內容與品牌敘事。
- `content-runtime`：集中 `blog posts` 與 `projects` 的型別、service 規則、repository 介面與 Supabase 實作。
- `admin-content`：`/admin/posts` 與 `/admin/projects` 的建立、編輯、排序、發佈、下架與刪除流程。
- `admin-auth`：Supabase OAuth callback、allowlisted admin access、登出、trusted origin 與登入節流保護。
- `analytics-consent`：同意後才啟用的 PostHog public pageview 追蹤。

## 資料流

1. 公開內容讀取：`src/app/**/data.ts` 與頁面 loader 先向 `content-runtime` 取資料，再由 repository 從 Supabase 讀取 `published` 內容，最後映射成頁面需要的 view model。
2. 公開內容關聯：文章可透過 `related_project_id` 關聯單一 project；文章頁與 project 頁會各自補出 related section。
3. 後台內容寫入：`Server Actions -> action-core -> content service -> Supabase repositories / reorder RPC`，商業規則先在 service 層判斷，再交由 repository 寫入。
4. 後台身分驗證：admin login 走 Supabase auth callback，server guard 再用 allowlisted email 決定是否可進入 `/admin`。
5. 分析追蹤：client 先讀 consent 狀態；只有同意後才 bootstrap PostHog，公開頁面再送出 pageview properties。

## 外部整合

- `Supabase`：資料庫、公開內容來源、admin auth/session 基礎設施。
- `PostHog`：公開頁面 analytics，需經訪客同意後才啟用。

## 目前邊界

- `content/posts/*.md` 與 `content/projects/*.md` 目前主要是 migration / import source，不是前台即時內容來源。
- 公開頁面只顯示 `published` 內容；`draft` 內容留在 admin workflow。
- `Next.js` 負責頁面、Server Actions 與 Route Handlers；Supabase-specific 存取應收斂在 repository / infra layer。
