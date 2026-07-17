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

## 運作方式

- `actions.ts` 只做 Server Action 入口，真正的表單解析與流程判斷集中在 `action-core.ts`。
- `action-core.ts` 會呼叫 `content-runtime` 做 create / update / publish / reorder / delete。
- posts 與 projects 共用相同的排序概念與狀態語意：`draft` / `published`。
- article 與 project 的刪除都受 service 規則保護，不能直接刪除已上架內容。

## 目前約束

- reorder 操作需提供完整 id 順序，避免部分排序造成資料不一致。
- related project 選單依賴已存在的 project option 清單。
- admin UI 是內容工作流入口，不應自己實作第二套資料驗證。
