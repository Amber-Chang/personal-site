# public-content

## 目的

負責公開首頁、`/about`、`/blog`、`/projects` 與內容內頁的資料組裝與呈現，只顯示已發佈內容。

## 主要路徑

- `src/app/page.tsx`
- `src/app/home-data.ts`
- `src/components/ProjectCard.tsx`、`src/components/PostCard.tsx`
- `src/app/blog/data.ts`
- `src/app/blog/[slug]/page.tsx`
- `src/app/projects/data.ts`
- `src/app/projects/[slug]/data.ts`
- `src/components/RelatedProjectSection.tsx`
- `src/components/RelatedPostsSection.tsx`
- `src/components/MarkdownContent.tsx`、`src/lib/markdown/markdown-options.ts`
- `src/components/MermaidDiagram.tsx`、`src/lib/markdown/mermaid.ts`
- `src/components/CodeCopyButton.tsx`、`src/lib/markdown/code-copy.ts`

## 運作方式

- 頁面層透過 `data.ts` / loader 向 `content-runtime` 取資料，不直接碰 Supabase client。
- 首頁固定五段：身分 → 代表案例 → 精選文章 → 關於我（短版）→ 聯絡（SPEC-002）。
- 代表案例讀一次 `listPublicProjects`，`selectHomeProjects` 取 featured 前 3 個；一個 featured 都沒有時改取排序最前面的 3 個已上架專案。卡片顯示類型標籤、角色、標題、摘要與第一條成果。
- 精選文章取排序最前面的 3 篇，摘要經 `normalizeExcerpt` 整理（合併空白與換行、80 字截斷加「…」）；沒有摘要只顯示標題。
- 專案卡片、`/projects` 與專案內頁顯示中文類型標籤（工作案例 / 研究 / 個人專案）。
- 文章與專案內頁的內文都由 `MarkdownContent` 輸出（SPEC-003）：GFM 表格、刪除線（只認 `~~`）、待辦清單，程式碼在伺服器端上色，圖片延後載入；Markdown 裡的原始 HTML 只顯示成文字。外層排版仍是 `Prose`。
- 每個程式碼區塊（mermaid 除外）上方有標頭：左邊語言名稱（常見語言顯示正式名稱，例如 `ts` → TypeScript；沒標語言時留空），右邊 `CodeCopyButton`。按鈕從同一區塊的 `<pre><code>` 讀原始碼（去掉結尾換行）寫入剪貼簿，顯示「已複製」或「複製失敗」約 2 秒，並用 `aria-live` 念出。標頭由伺服器端輸出，讀者端只多這個小按鈕。
- ```` ```mermaid ```` 區塊交給 `MermaidDiagram`（client component）：掛上頁面後才動態載入 `mermaid`，沒有 mermaid 區塊的頁面不會下載它。設定為 `securityLevel: "strict"`、純 SVG 文字標籤（`htmlLabels: false`，並鎖進 `secure` 清單），輸出前拿掉 `<a>` 連結；載入前、沒有 JavaScript 或語法錯誤時顯示原始碼，錯誤時加上「這張圖表的語法有誤，無法顯示。」。圖表寬度沿用 Mermaid 預設（寬度 100%、不超過原尺寸），比內容欄寬時縮到欄寬；另設最小寬度＝原尺寸的 80%、最多 45rem（`MERMAID_READABLE_MIN_WIDTH_PX`、`MERMAID_MIN_SCALE`），欄寬不夠時在自己的容器內捲動。
- blog post 詳頁會補出 `related_project_id` 指向的 project；關聯的 project 下架或不存在時不顯示相關案例區塊。project 詳頁則會反查關聯文章。

## 邊界

- 只處理公開頁面需要的 view model 與排版，不承擔複雜商業規則。
- 未上架內容不應從這個模組流出。
