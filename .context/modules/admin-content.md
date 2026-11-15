# admin-content

## 目的

承接 `/admin/posts` 與 `/admin/projects` 的內容管理流程，讓單人 admin 可以建立、編輯、排序、上架、下架與刪除內容。

## 主要路徑

- `src/app/admin/posts/`
- `src/app/admin/projects/`
- `src/components/admin/post-form.tsx`
- `src/components/admin/project-form.tsx`
- `src/components/admin/sortable-admin-post-list.tsx`
- `src/components/admin/sortable-admin-project-list.tsx`
- `src/app/api/admin/content-images/`（內文圖片上傳通道）
- `src/lib/content-images/rules.ts`、`src/lib/infra/supabase/content-images-storage.ts`

## 運作方式

- `actions.ts` 只做 Server Action 入口，真正的表單解析與流程判斷集中在 `action-core.ts`。
- `action-core.ts` 會呼叫 `content-runtime` 做 create / update / publish / reorder / delete。
- posts 與 projects 共用相同的排序概念與狀態語意：`draft` / `published`。
- article 與 project 的刪除都受 service 規則保護，不能直接刪除已上架內容。
- 內文圖片（SPEC-003）：`POST /api/admin/content-images` 檢查登入、管理員、trusted origin、檔案類型與宣告大小後，由伺服器決定檔名（隨機字串 + 副檔名），用 service-role client 向 `content-images` bucket 要一次性上傳網址，回傳上傳資訊與公開網址；圖片檔由瀏覽器直接傳到 Supabase。類型與大小規則在 `rules.ts`，伺服器端與後台表單共用。

## 目前約束

- reorder 操作需提供完整 id 順序，避免部分排序造成資料不一致。
- related project 選單依賴已存在的 project option 清單。
- 專案表單的類型（Type）必選；`action-core.ts` 在伺服器端再驗一次，沒選或值不認得時回中文錯誤、不寫入。
- admin UI 是內容工作流入口，不應自己實作第二套資料驗證。
