# Projects Supabase-First Spec

> 用途：把 `projects` 從目前的 Markdown-first 公開內容模型，升級成 Supabase-first 的公開與後台內容模型，讓後台新增/編輯的專案可以直接出現在前台。

## 1. 目標

這一輪要解決的不是單一 bug，而是目前 `projects` 資料來源分裂帶來的整體問題：

- 後台新增 project 後，前台 `/projects` 不會出現
- `project identity` 與 `project page content` 分屬不同來源
- 站主無法在 production 後台完成一個真正可上線的專案內容流程

因此這一輪的目標是：

- 前台 `/projects`
- 前台 `/projects/[slug]`
- 首頁代表案例區塊

全部改為以 Supabase `projects` table 為主來源。

## 2. 產品意圖

`projects` 是這個網站的核心內容軸之一，不只是關聯用的 identity。若後台可建立專案，但前台看不到，就會讓整個內容管理體驗斷裂。

把 `projects` 升級成 Supabase-first，代表站主可以：

- 在後台新增一個 project
- 立刻讓它成為可被關聯、可被公開瀏覽、可出現在首頁與 `/projects` 的內容

這樣 `projects` 才真正從半靜態內容集合，升級成網站內可持續維護的第一級內容型別。

## 3. 範圍

本輪包含：

- 擴充 Supabase `projects` schema，支援公開 project page 所需欄位
- `/projects` 改讀 public repository / service
- `/projects/[slug]` 改讀 Supabase-first project record
- 首頁代表案例區塊改讀 public project repository
- `/admin/projects` 表單擴充成可管理最小公開內容欄位
- 建立或更新 Markdown -> Supabase project import / migration tooling
- 文件與內容邊界同步更新

本輪不包含：

- media library
- rich editor
- draft preview
- version history
- 多人 project workflow

## 4. 資料來源決策

這一輪完成後，`projects` 的新分工如下：

- Supabase `projects` table`
  - 成為 public project read 的主來源
  - 成為 admin project write 的主來源
  - 成為 blog relation target
- `content/projects/*.md`
  - 退為 migration source / 歷史匯入來源
  - 不再作為前台主要讀取來源

## 5. 使用情境

### 情境 A：後台新增 project 後可立即公開

- 站主在 `/admin/projects/new` 建立 project
- 若狀態為 `published`
- 該專案會出現在：
  - `/projects`
  - 首頁代表案例區塊（若標示為 featured）
  - 對應 `/projects/[slug]`
  - 文章表單的 `Related project`

### 情境 B：站主在後台完整調整公開 project 內容

- 站主在 `/admin/projects/[id]` 編輯 title、summary、role、period、tags、outcomes、content、featured、status
- 儲存後，前台 project 頁與列表使用最新內容

### 情境 C：Markdown 內容作為 migration source

- 舊 `content/projects/*.md` 可作為一次性或重複匯入來源
- 但 production 公開站不再直接依賴 repo 內 Markdown 才能顯示 project

## 6. 需要的欄位

Supabase `projects` 至少需要完整承接目前前台 project card 與 project page 使用的欄位：

- `title`
- `slug`
- `summary`
- `role`
- `period`
- `tags`
- `outcomes`
- `content_markdown`
- `featured`
- `status`
- `published_at`

## 7. 架構邊界

- `page`
  - 只拿 page data，不直接碰 provider-specific query
- `service layer`
  - 組裝 project list、project page、featured projects
- `repository layer`
  - 封裝 public/admin 的 projects read/write
- `migration tooling`
  - 處理舊 Markdown content 的匯入，不混進 page 行為

## 8. 成功標準

- 後台新增 `published` project 後，前台 `/projects` 可直接看到
- `/projects/[slug]` 可不依賴 Markdown 檔而正常渲染
- 首頁代表案例區塊可讀取 featured projects
- `Related project` 選單與公開 project source 不再分裂
- 公開頁只顯示 `published` project

## 9. 驗證重點

- public project list 只顯示 published projects
- public project page 可正確渲染內容欄位
- featured projects 可出現在首頁
- admin project create / update 後，public read 可立即反映
- 舊 Markdown 匯入後資料正確落到 DB

## 10. 決策界線

這一輪要明確跨過的界線是：

- `projects` 不再只是 identity table

這一輪仍不做：

- 富文字 / block editor
- 檔案上傳
- 複雜版本治理

## 11. 目前進度

- repo 內實作已完成：
  - `projects` schema 已補 migration
  - `/admin/projects` 可管理目前公開 project 欄位
  - `/projects`、`/projects/[slug]`、首頁代表案例已改讀 Supabase-first content path
  - Markdown project sync 已擴充，會同步 `role / period / tags / outcomes / featured / content_markdown`
- 已在實際 Supabase / production 環境完成：
  - 已套用新 migration
  - 已重跑 `npm run content:sync-projects`
  - 已確認 production `/`、`/projects`、`/projects/ai-writing-review-product`、`/projects/sms-management-platform` 可正常顯示
- 仍待補：
  - `/admin/projects` 建立 / 編輯流程的 production 手動 smoke check
