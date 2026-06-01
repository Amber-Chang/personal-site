# NOW

> 用途：只記現在，不記歷史。

## 現況

- branch：`main`
- 網站已具備：
  - 首頁改版版本
  - `/about`
  - `/blog`
  - `/blog/[slug]`
  - `/projects`
  - `/projects/[slug]`
- 內容來源目前仍是 Markdown 檔案

## 最近完成

- 建立 `projects` 內容模型
- 新增案例列表頁與案例詳頁
- 把首頁改成偏編輯式的 portfolio 首頁
- 封存舊治理文件，改成最小治理集合
- 建立新的 `FOUNDATION.md` 並移除舊 `.context/`
- 補上文件治理規則，明確區分 `AGENTS.md`、`FOUNDATION.md`、`NOW.md` 與 `docs/` 的責任
- 建立 `docs/blog-admin-mvp.md`，確認文章後台第一版只處理 blog posts
- 補上 blog admin MVP 的 implementation slices，明確切分資料庫、後台、前台與整合驗證
- 補上系統架構原則文件，明確後續 implementation spec 需考慮可擴展性
- 補上目前後端技術決策，確認以 Next.js 當應用後端、Supabase 當基礎設施
- 建立 `docs/blog-admin-implementation-spec.md`，補齊 schema、auth、權限、migration 與前台切換策略
- 建立標準開發流程文件，明確區分標準流程與快速流程
- 建立 blog admin foundation 第一版：Supabase schema、magic link auth 底座、repository/service 邊界與最小 admin 入口
- 完成 `add-admin-posts-skeleton`：接上 `/admin/posts` 列表、`/admin/posts/new` 新增草稿、`/admin/posts/[id]` 編輯既有文章，以及共享表單與最小 create/update server actions

## 目前最重要的事

- 持續調整網站視覺與品牌感
- 規劃文章後台的實作方式
- 依 Supabase 方案開始 blog admin MVP 第一批實作
- 依 implementation spec 繼續把前台 blog data source 從 Markdown 切到 repository
- 讓後續開發工作可依標準流程規則化執行

## 下一步建議

1. 打磨首頁視覺與文案
2. 規劃 blog 前台從 Markdown 切到 repository 的切換驗證
3. 補後續 publish UX、preview 與 markdown migration 策略

## 備註

- `FOUNDATION.md` 是新的核心方向文件
- 目前不保留舊規劃文件，避免干擾新的判斷
- 若未來調整 `docs/` 結構，需同步檢查 `AGENTS.md`、`NOW.md` 與直接相關文件
- 目前傾向的內容模型是 `projects` 與 `blog posts` 分開，blog post 可選擇關聯 project
- blog admin MVP 已決定正式採用 Supabase，但第一版只處理 blog posts，不擴大成全站 CMS
- 後續 implementation spec 需以 [docs/system-architecture-principles.md](/Users/amberchang/Documents/New%20project/docs/system-architecture-principles.md) 作為最小架構參考
- 目前後端分工是 Next.js 負責應用層，Supabase 負責資料庫與登入基礎
- blog admin 的可實作規格已集中在 [docs/blog-admin-implementation-spec.md](/Users/amberchang/Documents/New%20project/docs/blog-admin-implementation-spec.md)
- 開發流程規則已集中在 [docs/development-workflow.md](/Users/amberchang/Documents/New%20project/docs/development-workflow.md)
- admin 內容讀寫第一版採 trusted Next.js server + Supabase service-role path，public published reads 則維持 RLS published-read policy
