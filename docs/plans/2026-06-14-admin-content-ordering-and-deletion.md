# Admin Content Ordering and Deletion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓後台 `projects` 與 `notes`（`blog_posts`）支援手動排序、受控刪除，以及更直觀的 `已上架 / 未上架` 狀態顯示，並讓前台公開列表完整沿用同一套排序來源。

**Architecture:** 延伸既有 `service / repository / infra` 分層，不把排序或刪除規則散回 page。資料層新增 `sort_order`，service 層守住「只有未上架可刪」與 reorder payload 驗證，admin UI 只承接拖曳互動與操作入口。

**Tech Stack:** Next.js 16 App Router、TypeScript、React 19、Tailwind CSS、Node test runner、Supabase

---

## Scope

本計畫只處理：

- `blog_posts`、`projects` 新增 `sort_order`
- repository / service 補 reorder 與 delete 能力
- admin 列表頁支援拖曳排序
- admin 編輯頁補刪除能力與 `已上架 / 未上架` 狀態顯示
- public lists 改以 `sort_order asc` 讀取
- 對應測試與文件同步

本計畫不處理：

- 軟刪除
- 批次刪除
- 排程上架
- featured 專屬排序系統
- media / rich editor

## Success Criteria

- `/admin/posts`、`/admin/projects` 可拖曳排序
- `/blog`、首頁 writing、`/projects`、首頁 featured projects 使用新排序
- `published` 內容不可刪，`draft` 可刪
- 後台狀態顯示為 `已上架 / 未上架`
- 測試、lint、必要 build 驗證完成

### Task 1: 補齊 schema、型別、repository 與 service 的排序 / 刪除底座

**Files:**
- Create: `supabase/migrations/202606140001_add_content_sort_order.sql`
- Modify: `src/lib/content/types.ts`
- Modify: `src/lib/content/repository.ts`
- Modify: `src/lib/content/service.ts`
- Modify: `src/lib/infra/repositories/supabase-posts-repository.ts`
- Modify: `src/lib/infra/repositories/supabase-projects-repository.ts`
- Test: `src/lib/content/content.test.ts`
- Test: `src/lib/infra/repositories/supabase.test.ts`

**Step 1: 先寫失敗測試**

先在 `src/lib/content/content.test.ts` 補最小行為測試：

- `deletePost` 遇到 `published` 文章會拒絕
- `deletePost` 可刪除 `draft` 文章
- `deleteProject` 遇到 `published` 專案會拒絕
- `deleteProject` 可刪除 `draft` 專案
- `reorderPosts` 會把完整 id 順序交給 repository
- `reorderProjects` 會把完整 id 順序交給 repository
- reorder payload 為空、重複 id、或缺漏 id 時會回傳受控錯誤

再在 `src/lib/infra/repositories/supabase.test.ts` 或對應 repository 測試補：

- `listPublishedPosts` 以 `sort_order asc` 查詢
- `listAdminPosts` 以 `sort_order asc` 查詢
- `listAdminProjects` 以 `sort_order asc` 查詢
- `listPublishedProjects` 以 `sort_order asc` 查詢

**Step 2: 跑測試確認會失敗**

Run: `npm test -- src/lib/content/content.test.ts src/lib/infra/supabase/supabase.test.ts`
Expected: FAIL，因為 `sort_order` 與 delete / reorder 能力尚未存在

**Step 3: 實作 migration 與型別**

在 migration 中：

- 為 `public.blog_posts` 新增 `sort_order integer`
- 為 `public.projects` 新增 `sort_order integer`
- 以既有順序回填：
  - `blog_posts`：`published_at desc nulls last, updated_at desc`
  - `projects`：`title asc, updated_at desc`
- 再設為 `not null`
- 視需要補 index

在 `src/lib/content/types.ts`：

- `BlogPostRecord`、`ProjectRecord`
- 對應 create / update input

都補上 `sortOrder` 欄位。

**Step 4: 實作 repository**

`src/lib/infra/repositories/supabase-posts-repository.ts`：

- row mapping 補 `sort_order`
- create 時帶入預設排序值
- `listAdminPosts()` 改 `.order("sort_order", { ascending: true })`
- `listPublishedPosts()` 改 `.order("sort_order", { ascending: true })`
- `listPublishedPostsByProjectId()` 改 `.order("sort_order", { ascending: true })`
- 補 `deletePost(id)`
- 補 `reorderPosts(idsInOrder)`，以批次 update 寫回排序

`src/lib/infra/repositories/supabase-projects-repository.ts`：

- row mapping 補 `sort_order`
- create 時帶入預設排序值
- `listAdminProjects()` 改 `.order("sort_order", { ascending: true })`
- `listPublishedProjects()` 改 `.order("sort_order", { ascending: true })`
- 補 `deleteProject(id)`
- 補 `reorderProjects(idsInOrder)`

**Step 5: 實作 service 規則**

在 `src/lib/content/service.ts`：

- 新增 `deletePost(id)`、`deleteProject(id)`
- 新增 `reorderPosts(idsInOrder)`、`reorderProjects(idsInOrder)`
- 若內容狀態為 `published`，刪除時拋出可讀錯誤
- 對 reorder payload 做完整性檢查，不可空、不可重複、不可缺漏現有清單 id

**Step 6: 跑測試確認通過**

Run: `npm test -- src/lib/content/content.test.ts src/lib/infra/supabase/supabase.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add supabase/migrations/202606140001_add_content_sort_order.sql src/lib/content/types.ts src/lib/content/repository.ts src/lib/content/service.ts src/lib/infra/repositories/supabase-posts-repository.ts src/lib/infra/repositories/supabase-projects-repository.ts src/lib/content/content.test.ts src/lib/infra/supabase/supabase.test.ts
git commit -m "feat: add content ordering and deletion foundations"
```

### Task 2: 補 admin actions 與 page data，讓排序 / 刪除可被後台呼叫

**Files:**
- Modify: `src/app/admin/posts/action-core.ts`
- Modify: `src/app/admin/posts/actions.ts`
- Modify: `src/app/admin/posts/data.ts`
- Modify: `src/app/admin/posts/actions.test.ts`
- Modify: `src/app/admin/posts/data.test.ts`
- Modify: `src/app/admin/projects/action-core.ts`
- Modify: `src/app/admin/projects/actions.ts`
- Modify: `src/app/admin/projects/data.ts`
- Modify: `src/app/admin/projects/actions.test.ts`
- Modify: `src/app/admin/projects/data.test.ts`

**Step 1: 先寫失敗測試**

在 posts / projects actions test 補：

- reorder action 會把 ids 交給 service，並 revalidate admin + public paths
- delete action 成功後會 revalidate admin + public paths，並 redirect 回列表
- published 內容 delete 失敗時回傳受控錯誤

在 posts / projects data test 補：

- admin page data 會保留 `sortOrder`
- edit page data 可供刪除 UI 判斷目前是否 `published`

**Step 2: 跑測試確認會失敗**

Run: `npm test -- src/app/admin/posts/actions.test.ts src/app/admin/posts/data.test.ts src/app/admin/projects/actions.test.ts src/app/admin/projects/data.test.ts`
Expected: FAIL，因為新 actions / data shape 尚未存在

**Step 3: 實作 posts actions**

在 `src/app/admin/posts/action-core.ts`：

- 擴充 mutation service 型別
- 補 `reorderPosts`
- 補 `deletePost`
- 對應受控錯誤轉譯
- revalidate 至少涵蓋：
  - `/admin/posts`
  - `/blog`
  - `/`

在 `src/app/admin/posts/actions.ts`：

- 匯出 reorder / delete server actions

**Step 4: 實作 projects actions**

在 `src/app/admin/projects/action-core.ts`：

- 補 `reorderProjects`
- 補 `deleteProject`
- revalidate 至少涵蓋：
  - `/admin/projects`
  - `/projects`
  - `/`

在 `src/app/admin/projects/actions.ts`：

- 匯出 reorder / delete server actions

**Step 5: 實作 page data**

在 posts / projects data loader：

- 確保列表項目保留 `sortOrder`
- edit 頁資料不需額外轉換掉 `status`

**Step 6: 跑測試確認通過**

Run: `npm test -- src/app/admin/posts/actions.test.ts src/app/admin/posts/data.test.ts src/app/admin/projects/actions.test.ts src/app/admin/projects/data.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/app/admin/posts/action-core.ts src/app/admin/posts/actions.ts src/app/admin/posts/data.ts src/app/admin/posts/actions.test.ts src/app/admin/posts/data.test.ts src/app/admin/projects/action-core.ts src/app/admin/projects/actions.ts src/app/admin/projects/data.ts src/app/admin/projects/actions.test.ts src/app/admin/projects/data.test.ts
git commit -m "feat: add admin content reorder and delete actions"
```

### Task 3: 補 admin UI 的拖曳排序、刪除入口與狀態文案

**Files:**
- Create: `src/components/admin/content-status-badge.tsx`
- Create: `src/components/admin/sortable-admin-post-list.tsx`
- Create: `src/components/admin/sortable-admin-project-list.tsx`
- Modify: `src/components/admin/post-form.tsx`
- Modify: `src/components/admin/post-form.test.ts`
- Modify: `src/components/admin/project-form.tsx`
- Modify: `src/components/admin/project-form.test.ts`
- Modify: `src/app/admin/posts/page.tsx`
- Modify: `src/app/admin/projects/page.tsx`
- Modify: `src/app/admin/posts/[id]/page.tsx`
- Modify: `src/app/admin/projects/[id]/page.tsx`

**Step 1: 先寫失敗測試**

在 form / component 測試補：

- 狀態顯示使用 `已上架 / 未上架`
- `published` 內容不顯示可刪按鈕，而是顯示需先下架提示
- `draft` 內容顯示刪除按鈕
- 列表頁說明文字包含後台排序會影響前台順序

若目前沒有列表元件測試，可用 source-level assertions 維持既有測試風格。

**Step 2: 跑測試確認會失敗**

Run: `npm test -- src/components/admin/post-form.test.ts src/components/admin/project-form.test.ts`
Expected: FAIL

**Step 3: 實作共享狀態 badge**

新增 `content-status-badge.tsx`：

- `published` 顯示 `已上架`
- `draft` 顯示 `未上架`
- 樣式上可一眼區分

**Step 4: 實作 sortable lists**

新增兩個 client component：

- `sortable-admin-post-list.tsx`
- `sortable-admin-project-list.tsx`

要求：

- 不引入大型第三方套件，先以原生 button + 上移/下移作為 MVP sortable 互動
- 視覺上明確呈現排序把手或移動控制
- 提交完整 ids 順序給 reorder action

註：這一步的重點是「後台可直接調整順序」，不要求第一版一定是 pointer drag-and-drop library。

**Step 5: 實作編輯頁刪除區**

在 post / project form：

- 顯示 `目前狀態` 的中文 badge
- `draft` 顯示刪除按鈕
- `published` 顯示「需先下架才能刪除」

**Step 6: 接上列表頁**

在 `/admin/posts`、`/admin/projects`：

- 改用新的 sortable list component
- 補排序說明文案

**Step 7: 跑測試確認通過**

Run: `npm test -- src/components/admin/post-form.test.ts src/components/admin/project-form.test.ts`
Expected: PASS

**Step 8: Commit**

```bash
git add src/components/admin/content-status-badge.tsx src/components/admin/sortable-admin-post-list.tsx src/components/admin/sortable-admin-project-list.tsx src/components/admin/post-form.tsx src/components/admin/post-form.test.ts src/components/admin/project-form.tsx src/components/admin/project-form.test.ts src/app/admin/posts/page.tsx src/app/admin/projects/page.tsx src/app/admin/posts/[id]/page.tsx src/app/admin/projects/[id]/page.tsx
git commit -m "feat: add admin ordering and deletion ui"
```

### Task 4: 驗證公開頁順序、整理文件並完成收尾 review

**Files:**
- Modify: `src/app/blog/data.ts`
- Modify: `src/app/projects/data.ts`
- Modify: `src/app/home-data.ts`
- Modify: `src/app/blog/data.test.ts`
- Modify: `src/app/projects/data.test.ts`
- Modify: `src/app/home-data.test.ts`
- Modify: `NOW.md`
- Reference: `docs/admin-content-ordering-and-deletion-spec.md`

**Step 1: 先寫失敗測試**

補公開頁 data tests，確認：

- `/blog` 依 service 回傳順序輸出，不再自行重排
- `/projects` 依 service 回傳順序輸出
- 首頁 writing / featured projects 保留同一順序

**Step 2: 跑測試確認會失敗**

Run: `npm test -- src/app/blog/data.test.ts src/app/projects/data.test.ts src/app/home-data.test.ts`
Expected: FAIL（若既有測試仍假設舊排序）

**Step 3: 調整公開頁 data / mapping**

只做最小必要調整，確認 page data 不把 repository 已決定的順序打散。

**Step 4: 同步 NOW.md**

以高階摘要更新：

- 這輪排序 / 刪除 / 狀態顯示已完成哪些面向
- 下一步需要的 production migration / smoke check

**Step 5: 跑完整驗證**

Run: `npm test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

若 env 允許，再跑：

Run: `npm run build`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/blog/data.ts src/app/projects/data.ts src/app/home-data.ts src/app/blog/data.test.ts src/app/projects/data.test.ts src/app/home-data.test.ts NOW.md
git commit -m "test: verify content ordering flows through public pages"
```
