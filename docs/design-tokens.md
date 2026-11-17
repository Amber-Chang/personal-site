# Design Tokens

> 用途：公開頁面的樣式 token 清單、各自用在哪、新增畫面時怎麼選。
> 狀態：2026-11-12 第 2 包完成時的現況；2026-11-15 內容架構 3A 改首頁時拿掉了主標寬度 `max-w-[15em]` 與第一屏兩欄比例兩個寫死數值；同日 3B（SPEC-003）新增程式碼上色色票與表格樣式；2026-11-16 視覺改版 3C（SPEC-004）新增赤陶重點色與焦點外框、圓角收小為 6px／8px、標題改用系統字體、拿掉頁首毛玻璃與頁面光暈。定義在 `src/app/globals.css`；設計方向見根目錄 [DESIGN.md](../DESIGN.md)。

## 新增畫面時的挑選規則

- 依文字或元件扮演的角色挑 token，例如案例區塊與文章項目的標題用 `text-card-title`。
- 不寫 `text-[…]`、`rounded-[…]`、`tracking-[…]`、`leading-[…]`、`font-[family-name:…]`、寫死的顏色或陰影。
- 不新增「token/透明度」組合（例如 `text-foreground/80`），只用下方列出的組合。
- 找不到合適的 token 時，先在 `globals.css` 新增 token 並附一行註解，再更新本文件。
- 長文用 `<Prose>`，首頁與文章列表用 `<IdentityColumn>`、`<ContentTabs>`、`<CaseBlock>`、`<PostRow>`，內頁返回連結用 `<BackLink>`。

## 字級

標 RWD 的 token 會在 `globals.css` 的 `@layer base` 依斷點換值（md 48rem、lg 64rem、xl 80rem），頁面上不用再加 `md:`、`lg:`、`xl:`。

| class | 手機 → md → xl | 行高 | 用在哪 |
|---|---|---|---|
| `text-article-title` | 1.6875 → 2.125rem | 1.35 | 單欄頁面的大標：文章、案例內頁、About、404 |
| `text-prose-h2` | 1.375 → 1.5rem | 1.5 | 長文大標 |
| `text-prose-h3` | 1.125 → 1.25rem | 1.5 | 長文小標 |
| `text-card-title` | 1.125rem | 1.55 | 案例區塊、文章項目的標題 |
| `text-summary` | 0.9375rem | 1.8 | 案例區塊、文章項目的摘要 |
| `text-identity-name` | 1.4375 → 1.625rem（lg） | 1.3 | 身分區的姓名 |
| `text-identity-lede` | 1.15625 → 1.25rem（lg） | 1.6 | 身分區的定位句（首頁的 H1） |
| `text-body` | 1.02 → 1.06rem | 由 `Prose` 決定 | 長文內文 |
| `text-lead` | 1.05 → 1.15rem | 搭配 `leading-7` | 浮層裡的引言句，例如同意橫幅 |
| `text-tagline` | 0.8125rem | 1.5 | 身分區姓名下方的職稱 |
| `text-label` | 0.75rem | 1rem | 小標籤：日期、案例類型、角色與期間、分頁數字、Privacy preference |

- 一般介面小字（說明文字、連結、按鈕、分頁、延伸閱讀標題）沿用 Tailwind 內建的 `text-sm`、`text-base`。

## 文字深淺（3 階）

| class | 值 | 用在哪 |
|---|---|---|
| `text-foreground` | 主要 | 標題、重點文字 |
| `text-foreground-soft` | foreground 88% | 長文段落、身分區簡介、案例區塊與文章項目的摘要、案例內頁的成果清單 |
| `text-muted-foreground` | 輔助 | 說明、日期、返回連結、頁尾 |

- 裝飾用的組合只剩 `decoration-muted-foreground/60`（內文與頁尾 email 連結的底線）。

## 邊框（2 階）

| class | 值 | 用在哪 |
|---|---|---|
| `border-border` | 基礎線條色 `--border` 的 70% | 卡片、分隔線、外框按鈕、頁首與頁尾的線 |
| `hover:border-strong` | foreground 35% | 卡片與外框按鈕的 hover |

- 沒指定顏色的 `border`（shadcn 元件內部、後台）維持 100% 的 `--border`。公開頁的新畫面一律寫 `border-border`。

## 背景表面

| class | 用在哪 |
|---|---|
| `bg-background` | 頁首、同意橫幅（不透明，不用毛玻璃） |
| `bg-card` | 白底的區塊：案例區塊、案例資訊框、案例成果清單、程式碼區塊 |
| `bg-foreground` | 主要按鈕（黑底，文字 `text-background`） |
| `bg-muted/65` | 行內程式碼 |

- 不用漸層、光暈、毛玻璃、半透明底當裝飾（SPEC-004 拿掉了頁首的 `bg-background/78 backdrop-blur` 與同意橫幅的 `bg-background/92 backdrop-blur-xl`）。

## 圓角

| class | 值 | 用在哪 |
|---|---|---|
| `rounded-control` | 0.375rem（6px） | 一般元件：按鈕、複製按鈕、同意橫幅的按鈕、案例成果清單的右側（`rounded-r-control`） |
| `rounded-block` | 0.5rem（8px） | 區塊與圖片：案例區塊、案例資訊框、同意橫幅、程式碼區塊、內文圖片 |
| `rounded-full` | 圓形 | 只用在頭像，不用在按鈕 |

- 行內程式碼維持 `rounded`（0.25rem）。

## 字距

| class | 值 | 用在哪 |
|---|---|---|
| `tracking-heading` | -0.015em | 標題（h1–h3 已預設套用） |
| `tracking-label` | 0.08em | 一般小標籤：職稱、日期、404、案例類型、角色與期間 |
| `tracking-caps` | 0.16em | 全大寫的小標籤：Privacy preference |

## 表格（長文內）

| 位置 | class | 對比（頁面底色 #fbfaf7） |
|---|---|---|
| 表頭文字 | `prose-th:text-foreground` | 18.07:1 |
| 內容文字 | `prose-td:text-foreground-soft` | 13.15:1 |
| 表頭下緣、每列下緣的線 | `prose-thead:border-border`、`prose-tr:border-border` | — |

- 表格沒有底色，直接疊在頁面上。比內容欄寬時，在 `MarkdownContent` 包的 `overflow-x-auto` 容器內左右捲動。

## 程式碼上色

程式碼區塊在伺服器端由 `rehype-highlight` 標上 `hljs-*` class，顏色由 `globals.css` 結尾「程式碼上色」段落的 7 個色票決定。區塊文字預設用 `prose-pre:text-foreground`。

| 色票 | 值 | 用在哪 | 對比 |
|---|---|---|---|
| `--code-keyword` | `#b42318` | 關鍵字、型別、刪除的行 | 6.48:1 |
| `--code-title` | `#6639ba` | 函式與類別名稱 | 7.24:1 |
| `--code-constant` | `#0550ae` | 數字、常數、屬性、運算子、Markdown 標題 | 7.49:1 |
| `--code-string` | `#0a3069` | 字串、正規表示式 | 12.63:1 |
| `--code-builtin` | `#953800` | 內建函式、符號、清單符號 | 7.28:1 |
| `--code-comment` | `#57606a` | 註解 | 6.30:1 |
| `--code-tag` | `#116329` | HTML 標籤名、引用、新增的行 | 7.29:1 |
| `text-foreground`（未上色的字） | — | 其他程式碼文字 | 18.54:1 |

- 對比是和程式碼區塊底色比：SPEC-004 起區塊底色是不透明的 `bg-card`，換算成 sRGB 是 `#fefdfc`（頁面也不再有光暈，底色不會因位置而變）。色票沒有改；改版後每個色票的對比都比原本高。
- 這些色票是程式碼內容的一部分，不算在「全站只有一個彩色」的限制內。
- 換算方式：`globals.css` 的 oklch 值轉成 sRGB，`color-mix(in oklab, …)` 依 oklab 混色，半透明疊色依瀏覽器的 sRGB alpha 合成，再算 WCAG 對比。`src/app/code-highlight-colors.test.ts` 會檢查每個色票與 `#fefdfc` 的對比 ≥ 4.5:1。
- 新增色票時沿用同一張表的分類，不在 `.hljs-*` 規則裡直接寫色碼。
- 程式碼區塊內的 `code` 不套行內程式碼的底色、內距與字級（`.prose pre code` 重設）。

### 程式碼區塊標頭（語言名稱與複製按鈕）

| 位置 | class | 對比（頁面底色 #fbfaf7） |
|---|---|---|
| 語言名稱 | `text-label tracking-label text-muted-foreground` | 5.52:1 |
| 複製按鈕文字（複製／已複製／複製失敗） | `text-sm text-muted-foreground`，hover 時 `text-foreground` | 5.52:1 |
| 複製按鈕外框 | `border-border`，hover 時 `border-strong` | — |
| 焦點框 | `outline-2 outline-offset-2 outline-terracotta`（畫在按鈕外觀上） | — |

- 按鈕的可點範圍是 44×44px（`min-h-11 min-w-11`），外觀是裡面較小的 `rounded-control` 按鈕；標頭用 `-my-2` 抵掉多出來的高度。
- 標頭在 `<pre>` 上方，不疊在程式碼上；間距寫在 `globals.css` 的 `.prose .code-block`（外層上下 1.5em）與 `.prose .code-block > pre`（上方 0.75em，大於按鈕往下多出的 0.5rem）。

## 字體

| class | 字體 | 用在哪 |
|---|---|---|
| `font-sans`（預設） | 系統字體：PingFang TC、Microsoft JhengHei 等 | 所有文字，包含標題 |

- 標題和內文用同一套系統字體，靠字級與字重（`font-semibold`）區分。網站不下載任何網路字體（SPEC-004 拿掉了 Noto Serif TC，首頁少下載約 231 KB、文章頁約 487 KB）。
- 社群分享圖（`src/app/opengraph-image.tsx`）用 repo 內附的 Noto Serif 拉丁子集，只在產生分享圖時讀取，不影響網頁。

## 重點色與焦點外框

| class | 值 | 用在哪 | 對比 |
|---|---|---|---|
| `text-terracotta` 等（`--color-terracotta`） | `#A8452B` | 只用在：類型標籤文字、目前分頁的底線、hover 時標題的底線、案例內頁成果清單左側的線、鍵盤焦點外框 | 頁面底色 5.68:1、卡片底色 5.83:1 |
| `focus-ring` | 赤陶 2px 外框、離元件 3px | 公開頁所有可互動元件的鍵盤焦點 | — |

- 全站只有這一個彩色；不用在按鈕、底色等大面積元件。主要按鈕是黑底白字（`bg-foreground text-background`）。

## 陰影

- `shadow-overlay`：浮在頁面上的元件，例如同意橫幅。

## 版面寬度

| 位置 | class | 說明 |
|---|---|---|
| 全站內容外框 | 根版面 `<main>` 的 `max-w-5xl`（左右 `px-4`／`md:px-6`） | 後台文章與專案編輯頁在 `lg` 以上用 `has-[[data-admin-editor]]` 放寬到 `max-w-7xl` |
| 首頁、文章列表的兩欄 | `grid gap-9 lg:grid-cols-[18.75rem_minmax(0,1fr)] lg:gap-18` | 左欄身分區 300px、欄距 72px；`lg` 以下單欄。這是唯一保留的版面寫死數值 |
| 單欄頁面（文章、案例內頁、About、404） | `mx-auto max-w-180` | 最寬 45rem（720px），長文一行約 40 個中文字 |

## 共用元件

| 元件 | 負責 | 用法 |
|---|---|---|
| `Prose` | 長文排版 | 文章、案例內頁用預設 `variant="article"`（桌機內文行高 2.25rem）；About 用 `as="article" variant="page"` |
| `MarkdownContent` | Markdown 轉成 HTML：表格、刪除線、待辦清單、程式碼上色與標頭（語言名稱、`CodeCopyButton`）、Mermaid 圖表（`MermaidDiagram`）、圖片延後載入；原始 HTML 只顯示成文字 | 放在 `Prose` 裡：`<Prose><MarkdownContent content={…} /></Prose>`。文章內頁、案例內頁、後台預覽共用 |
| `IdentityColumn` | 首頁與文章列表的左欄身分區：頭像、姓名、職稱、定位句、簡介、兩個按鈕 | 首頁 `ledeAs="h1"`（定位句是 H1）；文章列表 `ledeAs="p"`。`lg` 以上且視窗高度 ≥ 40rem（`tall` variant）時 sticky |
| `ContentTabs` | 「案例 N／文章 N」分頁，一般連結 | `active` 決定哪個有 `aria-current="page"` 與赤陶底線 |
| `CaseBlock` | 案例區塊：類型（赤陶）、角色、期間、標題、摘要、第一條成果 | 細外框白底 `rounded-block`，hover 外框 `border-foreground`、標題赤陶底線 |
| `PostRow` | 文章項目：完整日期、標題、摘要 | 細線分隔，hover 標題赤陶底線 |
| `primaryButtonClassName`／`secondaryButtonClassName`（`button-styles.ts`） | 公開頁的按鈕樣式 | 主要：黑底白字；次要：細外框。高 44px、`rounded-control`、`focus-ring` |
| `BackLink`（`BackLink.tsx`） | 「← …」返回連結，可點高度 44px | 文章內頁「← 文章」、案例內頁「← 案例」、About「← 首頁」 |

## 保留的寫死數值

- `prose-code:text-[0.92em]`：行內程式碼相對內文的字級。
- `lg:grid-cols-[18.75rem_minmax(0,1fr)]`：首頁與文章列表兩欄的欄寬（見「版面寬度」）。
- `src/components/ui/` 內 shadcn 自帶的數值不改。
- Mermaid 圖表的最小寬度：原尺寸的 80%、最多 45rem（720px），定義在 `src/lib/markdown/mermaid.ts`（`MERMAID_MIN_SCALE`、`MERMAID_READABLE_MIN_WIDTH_PX`），由 `MermaidDiagram` 以 `--mermaid-svg-min-width` 交給 `globals.css` 的 `.mermaid-diagram > svg`。45rem 是五個節點左右排的流程圖在手機上字約 10.8px 的寬度，也等於平板（768px）的內容欄寬。
