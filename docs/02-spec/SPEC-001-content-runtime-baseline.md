---
id: SPEC-001
status: active
title: "Runtime Baseline for public-content, content-runtime, admin-content, admin-auth, analytics-consent"
related_prd: PRD-001
---

# Runtime Baseline for public-content, content-runtime, admin-content, admin-auth, analytics-consent

## 目標

- 將目前 personal-site 已成立的 runtime module 邊界正式寫入 SPEC
- 讓 `.context/modules/*` 與 formal spec coverage 對齊
- 為後續新增功能或重構提供共用的責任切分基線

## 非目標

- 不新增新的內容型別
- 不改寫既有 auth / analytics / repository 行為
- 不定義未實作欄位的 schema 細節

## 驗收條件

- [ ] `public-content` 的責任被明確定義為公開頁面資料組裝與呈現
- [ ] `content-runtime` 的責任被明確定義為 domain model、service 規則與 repository 邊界
- [ ] `admin-content` 的責任被明確定義為後台內容生命週期操作入口
- [ ] `admin-auth` 的責任被明確定義為 allowlisted admin access 與 auth callback / guard 邊界
- [ ] `analytics-consent` 的責任被明確定義為 consent-gated public pageview tracking

## 實作注意事項

- 這份 SPEC 是 runtime baseline，不取代各主題功能 spec。
- 若未來功能改動碰到上述 module，應先更新對應主題 spec，再視需要回來同步這份 baseline。
- `content_format`、`cover_image_url`、`seo_title`、`seo_description`、`updated_by` 目前仍是保留中的規格名詞，不應視為已在 runtime 生效。

## 方案與流程

### 1. public-content

- 負責首頁、`/about`、`/blog`、`/blog/[slug]`、`/projects`、`/projects/[slug]` 的 page data 組裝與公開呈現。
- 只顯示 `published` 內容，不直接呼叫 provider-specific query。

### 2. content-runtime

- 負責 `BlogPostRecord`、`ProjectRecord` 等 domain model。
- 負責 service 規則，例如：
  - `published` 內容補 `publishedAt`
  - 已上架內容不能直接刪除
  - reorder 必須提交完整 id 清單
- 負責 repository 介面與 Supabase 實作隔離。

### 3. admin-content

- 負責 `/admin/posts`、`/admin/projects` 的 create / update / publish / unpublish / reorder / delete 入口。
- UI 與 Server Actions 只承接操作入口，真正規則仍落在 `content-runtime`。

### 4. admin-auth

- 負責 `/admin/login`、OAuth callback、server guard、logout、trusted origin 與 allowlisted email access。
- live production 目前還有一層 Vercel challenge 在 `/admin/posts` 前方，因此 app-level redirect 不一定是第一個 observable behavior。

### 5. analytics-consent

- 負責 consent banner、本地 consent 狀態、PostHog 初始化與 public pageview payload。
- 只在使用者同意後初始化 PostHog，且不追蹤 `/admin`。
