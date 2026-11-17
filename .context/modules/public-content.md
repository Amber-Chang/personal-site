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
- 公開頁是預先產生的頁面（SPEC-005，Next.js ISR）：`/`、`/blog`、`/blog/[slug]`、`/projects/[slug]` 設 `revalidate = 3600`，`/about` 與 404 是純靜態頁。部署時 `generateStaticParams` 產生所有已上架的文章與案例內頁；之後新上架的內頁在第一次瀏覽時產生並保存（`dynamicParams` 維持預設 true），不存在或未上架的網址由 `notFound()` 回 404。讀者瀏覽時不查 Supabase，只有重新產生時才查。
- 何時重新產生：後台任何內容變更成功後，`src/app/admin/revalidate-public-pages.ts` 呼叫 `revalidatePath("/", "layout")` 與 `revalidatePath("/sitemap.xml")`，全站公開頁標記為過期，下一次瀏覽時當場重新產生（讀者等這一次）；另外每小時自動更新一次，處理不經過後台的資料變更（這種更新先給讀者舊版、背景重新產生）。
- Supabase 出錯時（依 Next 16.1.6 原始碼與本機驗證）：每小時的背景更新失敗時繼續提供上一版，約 30 秒後再試，讀者看不到錯誤；從沒產生過的網址與「後台變更後還沒被重新產生」的頁面沒有上一版可給，會顯示錯誤頁。資料層查詢失敗一定要丟錯（repository 已如此），不能回空清單，否則空白頁會被當成新版本保存。
- 首頁（`/`）與文章列表（`/blog`）是兩欄（SPEC-004，取代 SPEC-002 的首頁五段排列）：左欄 `IdentityColumn`（兩頁相同；首頁的 H1 是它的定位句，`/blog` 另有只給螢幕閱讀器的 H1「文章」），右欄最上方是 `ContentTabs`（「案例 N」連 `/`、「文章 N」連 `/blog`，一般連結、`aria-current="page"`），下面是清單。`lg` 以下單欄。
- 首頁列出全部已上架案例：`orderHomeProjects` 讓 featured 排前面、其餘照既有排序；每個 `CaseBlock` 顯示類型、角色、期間、標題、摘要與第一條成果。`loadHomePageData` 一併回傳兩個分頁的數量。
- `/blog` 列出全部已上架文章：每個 `PostRow` 顯示完整日期（台北時間）、標題、摘要（經 `normalizeExcerpt` 整理，80 字截斷加「…」；沒有摘要就不顯示）。
- 案例區塊與專案內頁顯示中文類型標籤（工作案例 / 研究 / 個人專案）。
- 文章與專案內頁的內文都由 `MarkdownContent` 輸出（SPEC-003）：GFM 表格、刪除線（只認 `~~`）、待辦清單，程式碼在伺服器端上色，圖片延後載入；Markdown 裡的原始 HTML 只顯示成文字。外層排版仍是 `Prose`。
- 每個程式碼區塊（mermaid 除外）上方有標頭：左邊語言名稱（常見語言顯示正式名稱，例如 `ts` → TypeScript；沒標語言時留空），右邊 `CodeCopyButton`。按鈕從同一區塊的 `<pre><code>` 讀原始碼（去掉結尾換行）寫入剪貼簿，顯示「已複製」或「複製失敗」約 2 秒，並用 `aria-live` 念出。標頭由伺服器端輸出，讀者端只多這個小按鈕。
- ```` ```mermaid ```` 區塊交給 `MermaidDiagram`（client component）：掛上頁面後才動態載入 `mermaid`，沒有 mermaid 區塊的頁面不會下載它。設定為 `securityLevel: "strict"`、純 SVG 文字標籤（`htmlLabels: false`，並鎖進 `secure` 清單），輸出前拿掉 `<a>` 連結；載入前、沒有 JavaScript 或語法錯誤時顯示原始碼，錯誤時加上「這張圖表的語法有誤，無法顯示。」。圖表寬度沿用 Mermaid 預設（寬度 100%、不超過原尺寸），比內容欄寬時縮到欄寬；另設最小寬度＝原尺寸的 80%、最多 45rem（`MERMAID_READABLE_MIN_WIDTH_PX`、`MERMAID_MIN_SCALE`），欄寬不夠時在自己的容器內捲動。
- blog post 詳頁會補出 `related_project_id` 指向的 project；關聯的 project 下架或不存在時不顯示相關案例區塊。project 詳頁則會反查關聯文章。

- 錯誤頁（SPEC-005，文案經 PM 確認）：`src/app/error.tsx`（一般錯誤頁，顯示在頁首與頁尾之間）與 `src/app/global-error.tsx`（根版面也出錯時使用，自帶 `<html>`、`<body>` 並自己載入 `globals.css`）共用 `src/components/ErrorPageContent.tsx`。不顯示錯誤訊息；「重新整理」先 `router.refresh()` 再 `reset()`，「回首頁」連到 `/`；email 是 mailto 連結，點一下會選取整個地址。
- 錯誤頁出現的情況：動態頁（後台）在伺服器端出錯、瀏覽器端元件出錯、根版面出錯。預先產生的公開頁在「產生」時出錯（從沒產生過的網址、或後台變更後還沒重新產生的頁面，剛好遇到 Supabase 斷線），Next.js 16.1.6 會刻意讓這次產生失敗、不保存錯誤畫面；本機 `next start` 這時回純文字「Internal Server Error」（HTTP 500），不是這兩個錯誤頁。正式站（Vercel）的表現要上線後確認。錯誤頁的內容在瀏覽器載入 JavaScript 後才出現。

## 邊界

- 只處理公開頁面需要的 view model 與排版，不承擔複雜商業規則。
- 未上架內容不應從這個模組流出。
