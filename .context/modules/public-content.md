# public-content

## 目的

負責公開首頁、`/about`、`/blog` 與內容內頁的資料組裝與呈現，只顯示已發佈內容。`/projects` 在 `next.config.ts` 以 308 永久轉址到 `/`（SPEC-004），`/projects/[slug]` 內頁不變。

## 主要路徑

- `src/app/page.tsx`
- `src/app/home-data.ts`
- `src/components/IdentityColumn.tsx`、`src/components/ContentTabs.tsx`、`src/components/CaseBlock.tsx`、`src/components/PostRow.tsx`
- `src/app/blog/data.ts`
- `src/app/blog/[slug]/page.tsx`
- `src/app/projects/[slug]/data.ts`
- `src/components/RelatedProjectSection.tsx`
- `src/components/RelatedPostsSection.tsx`
- `src/components/MarkdownContent.tsx`、`src/lib/markdown/markdown-options.ts`
- `src/components/MermaidDiagram.tsx`、`src/lib/markdown/mermaid.ts`
- `src/components/CodeCopyButton.tsx`、`src/lib/markdown/code-copy.ts`

## 運作方式

- 頁面層透過 `data.ts` / loader 向 `content-runtime` 取資料，不直接碰 Supabase client。
- 首頁（`/`）與文章列表（`/blog`）是兩欄（SPEC-004，取代 SPEC-002 的首頁五段排列）：左欄 `IdentityColumn`（兩頁相同；首頁的 H1 是它的定位句，`/blog` 另有只給螢幕閱讀器的 H1「文章」），右欄最上方是 `ContentTabs`（「案例 N」連 `/`、「文章 N」連 `/blog`，一般連結、`aria-current="page"`），下面是清單。`lg` 以下單欄。
- 首頁列出全部已上架案例：`orderHomeProjects` 讓 featured 排前面、其餘照既有排序；每個 `CaseBlock` 顯示類型、角色、期間、標題、摘要與第一條成果。`loadHomePageData` 一併回傳兩個分頁的數量。
- `/blog` 列出全部已上架文章：每個 `PostRow` 顯示完整日期（台北時間）、標題、摘要（經 `normalizeExcerpt` 整理，80 字截斷加「…」；沒有摘要就不顯示）。
- 案例區塊與專案內頁顯示中文類型標籤（工作案例 / 研究 / 個人專案）。
- 文章與專案內頁的內文都由 `MarkdownContent` 輸出（SPEC-003）：GFM 表格、刪除線（只認 `~~`）、待辦清單，程式碼在伺服器端上色，圖片延後載入；Markdown 裡的原始 HTML 只顯示成文字。外層排版仍是 `Prose`。
- 每個程式碼區塊（mermaid 除外）上方有標頭：左邊語言名稱（常見語言顯示正式名稱，例如 `ts` → TypeScript；沒標語言時留空），右邊 `CodeCopyButton`。按鈕從同一區塊的 `<pre><code>` 讀原始碼（去掉結尾換行）寫入剪貼簿，顯示「已複製」或「複製失敗」約 2 秒，並用 `aria-live` 念出。標頭由伺服器端輸出，讀者端只多這個小按鈕。
- ```` ```mermaid ```` 區塊交給 `MermaidDiagram`（client component）：掛上頁面後才動態載入 `mermaid`，沒有 mermaid 區塊的頁面不會下載它。設定為 `securityLevel: "strict"`、純 SVG 文字標籤（`htmlLabels: false`，並鎖進 `secure` 清單），輸出前拿掉 `<a>` 連結；載入前、沒有 JavaScript 或語法錯誤時顯示原始碼，錯誤時加上「這張圖表的語法有誤，無法顯示。」。圖表寬度沿用 Mermaid 預設（寬度 100%、不超過原尺寸），比內容欄寬時縮到欄寬；另設最小寬度＝原尺寸的 80%、最多 45rem（`MERMAID_READABLE_MIN_WIDTH_PX`、`MERMAID_MIN_SCALE`），欄寬不夠時在自己的容器內捲動。
- blog post 詳頁會補出 `related_project_id` 指向的 project；關聯的 project 下架或不存在時不顯示相關案例區塊。project 詳頁則會反查關聯文章。

## 邊界

- 只處理公開頁面需要的 view model 與排版，不承擔複雜商業規則。
- 未上架內容不應從這個模組流出。
