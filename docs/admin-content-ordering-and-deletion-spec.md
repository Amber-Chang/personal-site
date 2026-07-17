# Admin Content Ordering and Deletion Spec

> 用途：定義後台 `projects` 與 `notes`（目前資料模型為 `blog_posts`）的排序、刪除與上架狀態顯示規則，讓內容管理流程與前台呈現順序一致。

## 1. 目標

這一輪要解決的不是單一按鈕缺漏，而是目前內容管理流程的三個結構性缺口：

- 後台無法手動決定 `projects` 與 `notes` 的呈現順序
- 後台無法刪除已下架內容，造成內容生命週期停在「建立 / 編輯 / 上下架」
- 後台雖然已有 `draft / published` 狀態，但顯示語言仍偏技術，不夠直觀

因此這一輪的目標是：

- 站主可在後台透過拖曳排序管理 `projects` 與 `notes`
- 後台由上到下的排序，直接成為前台列表的呈現順序
- 站主可刪除 `未上架` 的內容
- 後台以 `已上架 / 未上架` 顯示內容狀態，降低操作判讀成本

## 2. 命名對齊

為了避免產品語言與資料模型脫節，這輪先明確定義：

- 後台與產品語言中的 `notes`
  - 對應目前資料表 `blog_posts`
- 後台與產品語言中的 `articles`
  - 若在對話中出現，視為同一批 `notes / blog_posts`
- `projects`
  - 對應目前資料表 `projects`

也就是說，這輪會改的是：

- `blog_posts`
- `projects`

但在後台文案與操作說明上，可使用較符合站點語氣的 `文章 / Notes`。

## 3. 產品意圖

這個網站的公開排序不應再被 `title`、`updated_at` 或 `published_at` 間接決定，而應由站主明確控制。

當站主在後台把某篇文章或某個專案拖到更上面，前台就應反映相同順序。這樣首頁、`/blog`、`/projects` 的內容編排才真正是可設計、可維護的。

同時，內容生命週期也要補齊：

- 建立草稿
- 編輯
- 上架
- 下架
- 刪除

其中刪除只開放給 `未上架` 內容，避免已公開內容被直接移除。

## 4. 範圍

本輪包含：

- `blog_posts` 與 `projects` schema 新增手動排序欄位
- `/admin/posts` 列表支援拖曳排序
- `/admin/projects` 列表支援拖曳排序
- 後台列表與編輯頁顯示 `已上架 / 未上架`
- 後台補 `刪除文章` 與 `刪除專案` 能力
- 刪除規則：只有 `未上架` 內容可刪除
- public content repository / service 改以手動排序欄位作為主排序來源
- 首頁、`/blog`、`/projects` 與其他相關公開列表同步使用新排序規則

本輪不包含：

- nested sorting
- 多層分類或 tag-based 排序
- 排程上架
- 軟刪除回收桶
- 批次刪除
- preview / rich editor

## 5. 核心決策

### 5.1 使用明確排序欄位

兩個內容型別都新增 `sort_order`。

- `sort_order` 是整數欄位
- `sort_order` 適用於所有內容，不分 `已上架` 或 `未上架`
- draft 可先排好位置，日後上架時直接進到預期順序

### 5.2 前台順序完全由後台決定

公開頁面不再以：

- `title`
- `updated_at`
- `published_at`

作為主要排序依據，而是改為：

1. `sort_order asc`
2. 必要時再以 `updated_at desc` 或 `created_at desc` 作為同序 fallback

### 5.3 刪除前必須先下架

刪除規則統一如下：

- `已上架`
  - 不可直接刪除
  - 必須先變成 `未上架`
- `未上架`
  - 可刪除

這條規則由 service layer 負責守住，不只靠 UI 隱藏按鈕。

### 5.4 後台狀態語言改成產品語言

後台狀態顯示統一為：

- `published` -> `已上架`
- `draft` -> `未上架`

資料層與 server action 仍保留既有 `draft / published` 值，不更動 DB enum-like 規則。

## 6. 使用情境

### 情境 A：站主手動調整公開順序

- 站主進入 `/admin/posts` 或 `/admin/projects`
- 透過拖曳調整列表順序
- 儲存後，列表由上到下的順序寫回 `sort_order`
- 前台對應列表以相同順序顯示

### 情境 B：站主先排 draft，再決定何時上架

- 某篇文章或專案目前是 `未上架`
- 站主仍可先把它拖到預定位置
- 未來一旦上架，不需要再重排一次

### 情境 C：站主刪除已下架內容

- 站主進入某篇 `未上架` 文章或專案的編輯頁
- 點擊刪除
- 系統刪除資料並回到列表頁

### 情境 D：站主誤想刪除已上架內容

- 站主進入 `已上架` 內容
- 後台顯示不可刪提示
- 若要刪除，需先取消上架，再回來刪除

## 7. UI / UX 原則

### 7.1 列表頁

- `/admin/posts`
- `/admin/projects`

每列至少顯示：

- 排序拖曳把手
- 狀態：`已上架 / 未上架`
- slug
- title
- 摘要或 summary
- 最後更新時間

### 7.2 狀態顯示

- 狀態應使用中文產品語言
- 視覺上可用 badge 呈現
- `已上架` 與 `未上架` 需能一眼區分

### 7.3 刪除操作

- 刪除入口放在編輯頁較合理，避免列表誤觸
- 若內容為 `未上架`，顯示可操作的刪除按鈕
- 若內容為 `已上架`，顯示說明文字：
  - 需先下架才能刪除

### 7.4 排序與前台關係提示

列表頁需有一段短說明，明確告訴站主：

- 後台由上到下
- 會對應前台由上到下，或 grid 中由左到右、再往下

## 8. 資料模型變更

### 8.1 `blog_posts`

新增：

- `sort_order integer not null`

初始化策略建議：

- 以既有前台順序為基準回填
- 若目前 public list 主要依 `published_at desc`
  - 已存在資料可依該順序分配 `sort_order`
- draft 資料則接在後面，並保留穩定順序

### 8.2 `projects`

新增：

- `sort_order integer not null`

初始化策略建議：

- 以既有 public list 的 `title asc` 或目前實際顯示順序回填
- featured 與非 featured 不需拆成兩套排序欄位，先共用同一套 `sort_order`

### 8.3 刪除關聯規則

目前 `blog_posts.related_project_id` 已是：

- `references projects(id) on delete set null`

因此刪除 `未上架` project 時：

- 允許刪除
- 已關聯文章自動清空 relation

第一版不額外阻擋這種刪除情境。

## 9. 架構邊界

- `page`
  - 只負責讀 page data 與組裝 UI
- `client component`
  - 承接拖曳互動與排序提交
- `server actions`
  - 處理 reorder 與 delete mutation
- `service layer`
  - 驗證刪除規則
  - 驗證 reorder payload
  - 定義狀態顯示映射 helper
- `repository layer`
  - 封裝 `sort_order` 查詢、批次排序更新、刪除
- `infra layer`
  - 隔離 Supabase-specific query 與 mutation

不在 page / component 直接散寫 provider-specific 資料操作。

## 10. 實作方向

### 10.1 repository 能力

`posts` 至少需要補：

- `deletePost(id)`
- `reorderPosts(idsInOrder)`
- `listAdminPosts()` 改以 `sort_order asc`
- `listPublishedPosts()` 改以 `sort_order asc`
- `listPublishedPostsByProjectId()` 可維持 `sort_order asc`

`projects` 至少需要補：

- `deleteProject(id)`
- `reorderProjects(idsInOrder)`
- `listAdminProjects()` 改以 `sort_order asc`
- `listPublishedProjects()` 改以 `sort_order asc`
- `listFeaturedProjects()` 沿用 published list 再 filter
- `listProjectOptions()` 可暫時維持 title asc，因其用途是選單，不是公開內容排序

## 11. 目前驗證狀態

- 2026-07-17 `npm test` 已全綠（`282 pass / 0 fail`），排序 / 刪除相關的 service、repository、admin list 與 form 測試都已納入同一輪回歸驗證。
- `sort_order asc` + `updated_at desc` fallback 的 repository 契約，已由 `src/lib/infra/repositories/*` 測試覆蓋。
- 目前文件上的 production smoke sample 已過時：
  - public `/blog`、`/projects` 頂層路由仍可達
  - 舊 sample detail pages `admin-flow-check-20260607-0215` 與 `sms-management-platform` 在 2026-07-17 live check 中皆為 `404`
- 因此這一輪正式結論是：
  - 排序 / 刪除邏輯的程式面驗證已完成
  - 舊 production sample 不可再作為 detail-page smoke 依據，後續若要重做 authenticated reorder / delete / publish smoke check，需先建立新的可重用 sample

### 10.2 service 能力

需要新增：

- `deletePost(id)`
- `deleteProject(id)`
- `reorderPosts(idsInOrder)`
- `reorderProjects(idsInOrder)`

需要補的規則：

- 若 `status = published`
  - `delete` 拋出可讀錯誤
- reorder payload 不可空、不可重複、不可缺漏目前列表中的 id

### 10.3 admin routes / actions

需要補：

- posts reorder server action
- projects reorder server action
- posts delete server action
- projects delete server action

### 10.4 public read path

至少同步檢查：

- `/blog`
- 首頁 writing 區塊
- `/projects`
- 首頁 featured projects 區塊

若這些頁面仍吃舊排序，就不算完成。

## 11. 成功標準

- 後台可拖曳排序 `posts` 與 `projects`
- 前台順序與後台排序一致
- 後台顯示 `已上架 / 未上架`
- `未上架` 內容可刪除
- `已上架` 內容不可直接刪除，且有清楚提示
- 實作仍沿用既有 service / repository 邊界，不把 mutation 散回 page 層

## 12. 驗證重點

- `/admin/posts` 拖曳排序後，`/blog` 與首頁 writing 順序正確更新
- `/admin/projects` 拖曳排序後，`/projects` 與首頁代表案例順序正確更新
- `已上架` 文章 / 專案不可刪除
- `未上架` 文章 / 專案可刪除
- 刪除 `未上架` project 後，關聯文章不會壞掉，而是 relation 變成 `null`
- 列表與編輯頁都能清楚看到 `已上架 / 未上架`
- reorder / delete 完成後，相關 admin 與 public paths 都有 revalidate

## 13. 決策界線

這一輪先不做：

- 自訂不同頁面的獨立排序規則
- featured 與非 featured 各自獨立排序系統
- 軟刪除與回收桶
- 批次操作
- 內容審核流程

這一輪只解決：

- 手動排序成為單一公開排序來源
- 刪除流程補齊
- 後台狀態顯示更貼近實際操作語言
