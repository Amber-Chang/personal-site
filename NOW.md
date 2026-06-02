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
- 內容來源目前是：
  - blog：Supabase repository
  - projects：Markdown 檔案

## 最近完成

- 完成網站最小治理集合與核心方向整理，確立 `AGENTS.md`、`FOUNDATION.md`、`NOW.md`、`docs/` 的責任分工
- 完成 blog admin MVP 的主 spec、系統架構原則與標準開發流程規則
- 完成 blog admin 前四個主要 round：foundation 底座、admin posts skeleton、前台 blog 切 repository、Markdown import tooling

## 目前最重要的事

- 持續調整網站視覺與品牌感
- 完成 blog admin 的登入後台流程驗證
- 目前卡點：Supabase 內建 email provider 觸發 `over_email_send_rate_limit`，需等約 1 小時後再寄 magic link，或後續改接自訂 SMTP
- 讓後續開發工作可依標準流程規則化執行

## 下一步建議

1. 打磨首頁視覺與文案
2. 等 Supabase email rate limit 解除後，重新寄 magic link 並驗證 `/admin/posts`
3. 驗證草稿、編輯、發佈、公開顯示整條流程

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
- blog admin spec 的目前完成度與剩餘範圍已記在 [docs/blog-admin-implementation-spec.md](/Users/amberchang/Documents/New%20project/docs/blog-admin-implementation-spec.md) 的「目前進度」
- `/blog`、`/blog/[slug]` 與首頁 writing 區塊已改由 public repository 讀取 `published` posts；舊 `content/posts/*.md` 仍保留作為 import source
- `npm run content:import-posts` 已成功匯入 `ai-membership-system`
- admin magic link callback 已支援 `?code=` 與 `#access_token=` 兩種回傳格式
- admin post form 已改成 publish UX 按鈕，不再以 status dropdown 作為主要操作
- 目前未完成 admin 後台登入後驗證，原因是 Supabase email rate limit 暫時擋住重新寄送 magic link
