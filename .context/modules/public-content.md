# public-content

## 目的

負責公開首頁、`/about`、`/blog`、`/projects` 與內容內頁的資料組裝與呈現，只顯示已發佈內容。

## 主要路徑

- `src/app/page.tsx`
- `src/app/home-data.ts`
- `src/app/blog/data.ts`
- `src/app/blog/[slug]/page.tsx`
- `src/app/projects/data.ts`
- `src/app/projects/[slug]/data.ts`
- `src/components/RelatedProjectSection.tsx`
- `src/components/RelatedPostsSection.tsx`

## 運作方式

- 頁面層透過 `data.ts` / loader 向 `content-runtime` 取資料，不直接碰 Supabase client。
- 首頁會分別讀 featured projects 與最新公開文章，再裁成首頁需要的數量。
- blog post 詳頁會補出 `related_project_id` 指向的 project；project 詳頁則會反查關聯文章。

## 邊界

- 只處理公開頁面需要的 view model 與排版，不承擔複雜商業規則。
- 未上架內容不應從這個模組流出。
