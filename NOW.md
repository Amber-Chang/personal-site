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

## 目前最重要的事

- 持續調整網站視覺與品牌感
- 規劃文章後台的實作方式
- 釐清是否正式導入 Supabase 作為文章儲存與登入基礎

## 下一步建議

1. 打磨首頁視覺與文案
2. 決定 blog admin 是否正式採用 Supabase
3. 依 implementation slices 開始拆第一批實作任務

## 備註

- `FOUNDATION.md` 是新的核心方向文件
- 目前不保留舊規劃文件，避免干擾新的判斷
- 若未來調整 `docs/` 結構，需同步檢查 `AGENTS.md`、`NOW.md` 與直接相關文件
- 目前傾向的內容模型是 `projects` 與 `blog posts` 分開，blog post 可選擇關聯 project
