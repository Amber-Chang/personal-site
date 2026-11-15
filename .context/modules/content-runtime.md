# content-runtime

## 目的

提供 `blog posts` 與 `projects` 的共用內容模型、商業規則與資料存取邊界，是公開頁面與 admin workflow 的共同底座。

## 主要路徑

- `src/lib/content/types.ts`
- `src/lib/content/project-type.ts`
- `src/lib/content/public-project.ts`、`src/lib/content/excerpt.ts`（公開卡片用的純函式）
- `src/lib/content/repository.ts`
- `src/lib/content/service.ts`
- `src/lib/infra/repositories/factory.ts`
- `src/lib/infra/repositories/supabase-posts-repository.ts`
- `src/lib/infra/repositories/supabase-projects-repository.ts`

## 核心責任

- 用 camelCase domain model 封裝資料，隔離資料表中的 snake_case 欄位。
- 在 service 層集中規則，例如：
  - `published` 內容自動補 `publishedAt`
  - 已上架內容不能直接刪除
  - reorder 必須提交完整且不重複的 id 清單
- 在 repository 層集中 Supabase-specific 查詢、錯誤轉譯與排序 fallback。

## 目前資料模型重點

- `BlogPostRecord` 與 `ProjectRecord` 都有 `status`、`publishedAt`、`sortOrder`。
- 文章可選填 `relatedProjectId` 指向單一 project。
- project 另有 `featured`、`period`、`role`、`outcomes`、`tags` 等公開呈現欄位。
- project 有必填的 `projectType`（資料表 `project_type`：`work` / `research` / `side`）。讀取端寬鬆：不認得的值轉成 `null`、前台不顯示標籤；寫入端嚴格：`CreateProjectInput`、`SyncProjectInput` 一定要帶。Supabase 公開查詢明確列出 `project_type`，所以 migration `202611150001_add_project_type.sql` 要先於程式上線（SPEC-002）。
- `content_format`、`cover_image_url`、`seo_title`、`seo_description`、`updated_by` 目前只存在於規格保留欄位，尚未進入 runtime schema、repository contract 或 admin 表單。

## 邊界

- 頁面與表單不直接依賴資料表欄位名稱。
- 若未來再新增內容類型，優先擴充這層，而不是在 feature 內複製一套存取流程。
