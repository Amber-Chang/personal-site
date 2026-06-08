# Admin Project Identity Management Spec

> 用途：定義輕量 project identity admin，讓站主可在後台管理可被 blog post 關聯的 project 名單，而不把 `projects` 一次升級成完整 CMS。
>
> 註：這份 spec 已完成其原始目標；後續 `projects` 已另起 [docs/projects-supabase-first-spec.md](/Users/amberchang/Documents/New%20project/docs/projects-supabase-first-spec.md) 往完整公開內容來源升級。

## 1. 目標

這一輪要解決的不是「project page 全面改成後台可編輯」，而是：

- 站主可以在後台看到目前有哪些可關聯的 project
- 站主可以直接新增新的 project identity，不必先手改 Markdown 檔才能在文章表單選到
- 站主可以編輯最小 identity 欄位，讓 blog relation 與前台 project routing 維持一致

## 2. 產品意圖

目前 blog post 已可關聯 project，前台也已能在文章頁與 project 頁顯示雙向內容關係。

真正的缺口是：若沒有現成 project identity，站主仍無法在後台順手建立新的關聯目標。這會讓內容關聯流程停在「理論上可用，但日常維護仍不順」。

因此這一輪的目的，是把 project 從「只能被 sync 進來的半靜態選單項目」提升成「可被後台管理的關聯實體」。

## 3. 範圍

本輪包含：

- `/admin/projects` 列表頁
- `/admin/projects/new` 新增頁
- `/admin/projects/[id]` 編輯頁
- 最小 project form 欄位：
  - `title`
  - `slug`
  - `summary`
  - `status`
- admin content service / repository 擴充，支援 project identity list / create / update
- 後台 routing 與驗證流程

本輪不包含：

- project body / Markdown 正文編輯器
- `tags`、`outcomes`、`role`、`period` 的完整後台管理
- project page 主來源改成 Supabase-first
- rich preview / draft preview
- project 與 Markdown 檔案雙向同步

## 4. 真實資料邊界

這一輪要維持清楚的 source-of-truth 分工：

- `content/projects/*.md`
  - 仍是目前前台 project 內容主來源
- Supabase `projects` table
  - 承接 project identity
  - 承接 blog relation target
  - 承接 admin 下拉選單來源
  - 承接最小後台管理欄位

也就是說，這一輪不是把 project 變成完整 CMS，而是先讓 project identity 的建立與維護不再卡在檔案手動編輯。

## 5. 使用情境

### 情境 A：新增新的可關聯 project

- 站主進入 `/admin/projects`
- 點擊 `新增專案`
- 填入 `title / slug / summary / status`
- 儲存後，該 project 立刻可出現在文章表單的 `Related project` 下拉選單中

### 情境 B：修正既有 project identity

- 站主在 `/admin/projects` 看到既有專案清單
- 進入編輯頁調整標題、slug、summary 或 status
- 儲存後，前台關聯與後台選單都使用最新 identity

### 情境 C：project page 仍以 Markdown 為主

- 若某個 project identity 在 Supabase 存在，但 Markdown 內容尚未補齊
- 後台仍可先用它作為文章關聯目標
- 但前台完整 project 頁是否可正常渲染，仍取決於是否有對應 Markdown source

## 6. UI / UX 原則

### 6.1 Projects 列表頁

- 風格維持與 `/admin/posts` 一致
- 每列至少顯示：
  - status
  - slug
  - title
  - summary
  - 最後更新時間
- 頁面需提供 `新增專案` 入口

### 6.2 Project form

- 維持與 post form 相同的簡潔後台語言
- 欄位需有最小說明文字，避免不清楚哪些欄位只影響 identity
- `status = published` 的項目會進入可選 relation options
- `status = draft` 的項目不應進入公開 relation option 列表

## 7. 架構邊界

- `page`
  - 只組裝 UI 與讀取 page data
- `server actions`
  - 處理 project identity create / update
- `service layer`
  - 定義最小 project admin 能力與驗證邏輯
- `repository layer`
  - 封裝 Supabase `projects` table 的 admin CRUD
- `infra layer`
  - 隔離 Supabase-specific 呼叫

不在 page / component 中直接散寫資料庫 mutation。

## 8. 實作方向

建議沿用既有 post admin 模式：

1. 補 project admin data loader
2. 補 project form component
3. 補 project create / update server actions
4. 新增 admin routing：
   - `/admin/projects`
   - `/admin/projects/new`
   - `/admin/projects/[id]`
5. 讓 Header / admin navigation 可順手往返 `文章` 與 `專案`

## 9. 資料需求

需要至少補齊以下能力：

- `listAdminProjects()`
- `getAdminProjectById(id)`
- `createProject(input)`
- `updateProject(id, input)`

project admin 的最小寫入欄位：

- `title`
- `slug`
- `summary`
- `status`

第一版可先不開放直接編輯：

- `content_markdown`
- `published_at`
- `tags`
- `outcomes`
- `role`
- `period`

## 10. 成功標準

- 後台可查看目前 project identity 清單
- 後台可新增新的 project identity
- 後台可編輯既有 project identity
- 新增或更新後，文章表單的 `Related project` 可立即選到正確項目
- `draft` project 不應進入公開關聯 option
- 實作沿用既有 admin content 架構，不在 page 內散寫 mutation

## 11. 驗證重點

- `/admin/projects` 可正常列出資料
- 建立 project 後會導回編輯頁或列表頁
- 更新 project 後可保留最新欄位
- `published` project 會出現在 relation options
- `draft` project 不會出現在 relation options
- duplicate slug 需有可讀錯誤訊息

## 12. 決策界線

這一輪先不跨過以下界線：

- 不把 `projects` 全面改成 Supabase-first content source
- 不做完整 project CMS
- 不解決 Markdown 與 DB 雙向同步
- 不做 media / preview / rich editor

這一輪只把 project 提升到「可被管理的關聯實體」，不是完整內容型別。
