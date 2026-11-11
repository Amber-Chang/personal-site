# Design Tokens

> 用途：公開頁面的樣式 token 清單、各自用在哪、新增畫面時怎麼選。
> 狀態：2026-11-12 第 2 包完成時的現況。定義在 `src/app/globals.css`。

## 新增畫面時的挑選規則

- 依文字或元件扮演的角色挑 token，例如首頁區塊標題用 `text-heading`。
- 不寫 `text-[…]`、`rounded-[…]`、`tracking-[…]`、`leading-[…]`、`font-[family-name:…]`、寫死的顏色或陰影。
- 不新增「token/透明度」組合（例如 `text-foreground/80`），只用下方列出的組合。
- 找不到合適的 token 時，先在 `globals.css` 新增 token 並附一行註解，再更新本文件。
- 長文用 `<Prose>`，列表頁與 About 的頁首用 `<PageHeader>`，內頁返回連結用 `<BackLink>`，首頁區塊標題用 `<SectionHeading>`。

## 字級

標 RWD 的 token 會在 `globals.css` 的 `@layer base` 依斷點換值（md 48rem、xl 80rem），頁面上不用再加 `md:`、`xl:`。

| class | 手機 → md → xl | 行高 | 用在哪 |
|---|---|---|---|
| `text-display` | 1.875 → 2.25 → 3.25rem | 1.22 | 首頁主標 |
| `text-title` | 2.25 → 2.6rem | 1.5 | About、列表頁、404 的頁面大標 |
| `text-article-title` | 2.35 → 3rem | 1.12 | 文章、案例內頁的大標 |
| `text-heading` | 2rem | 1.5 | 首頁區塊標題 |
| `text-prose-h2` | 1.8 → 2rem | 由 `Prose` 決定 | 長文大標 |
| `text-prose-h3` | 1.35 → 1.5rem | 由 `Prose` 決定 | 長文小標 |
| `text-card-title` | 1.125rem | 1.75rem | 文章卡片、案例卡片標題 |
| `text-body` | 1.02 → 1.06rem | 由 `Prose` 決定 | 長文內文 |
| `text-lead` | 1.05 → 1.15rem | 搭配 `leading-7` | 浮層裡的引言句，例如同意橫幅 |
| `text-tagline` | 0.875 → 0.95rem | 1.25rem 等比 | 首頁姓名下方標語 |
| `text-label` | 0.75rem | 1rem | 小標籤：卡片日期、Focus、Privacy preference |

- 一般介面小字（說明文字、連結、按鈕、延伸閱讀標題）沿用 Tailwind 內建的 `text-sm`、`text-base`、`text-lg`、`text-xl`。

## 文字深淺（3 階）

| class | 值 | 用在哪 |
|---|---|---|
| `text-foreground` | 主要 | 標題、重點文字 |
| `text-foreground-soft` | foreground 88% | 長文段落、首頁 Focus 清單、手機選單文字、案例「關鍵成果」 |
| `text-muted-foreground` | 輔助 | 說明、日期、返回連結、頁尾 |

- 裝飾用的兩個組合：`text-muted-foreground/40`（頁尾分隔符號）、`decoration-muted-foreground/60`（連結底線）。

## 邊框（2 階）

| class | 值 | 用在哪 |
|---|---|---|
| `border-border` | 基礎線條色 `--border` 的 70% | 卡片、分隔線、外框按鈕、頁首與頁尾的線 |
| `hover:border-strong` | foreground 35% | 卡片與外框按鈕的 hover |

- 沒指定顏色的 `border`（shadcn 元件內部、後台）維持 100% 的 `--border`。公開頁的新畫面一律寫 `border-border`。

## 背景表面

| class | 用在哪 |
|---|---|
| `bg-background/78` | 頁首（搭配 `backdrop-blur`） |
| `bg-background/92` | 浮層：手機選單、同意橫幅 |
| `bg-card/30` | 文章列表卡片 |
| `bg-card/40` | 案例卡片 |
| `bg-muted/25` | 資訊面板：案例資訊框、相關案例、程式碼區塊 |
| `bg-muted/65` | 行內程式碼 |

## 圓角

| class | 值 | 用在哪 |
|---|---|---|
| `rounded-card` | 1.75rem | 網格排列的卡片：案例卡片、相關案例 |
| `rounded-panel` | 1.5rem | 整列寬的列表項目與面板：文章列表卡片、延伸閱讀、案例資訊框、手機選單、同意橫幅、程式碼區塊、內文圖片 |
| `rounded-full` | 膠囊 | 按鈕、Menu、標籤 |

- 行內程式碼維持 `rounded`（0.25rem）。

## 字距

| class | 值 | 用在哪 |
|---|---|---|
| `tracking-heading` | -0.03em | 標題（h1–h3 已預設套用） |
| `tracking-label` | 0.08em | 一般小標籤：首頁標語、文章日期、404、Focus |
| `tracking-caps` | 0.16em | 全大寫或數字的小標籤：卡片日期、Privacy preference |

- 卡片標題維持 Tailwind 內建的 `tracking-tight`（-0.025em）。

## 字體

| class | 字體 | 用在哪 |
|---|---|---|
| `font-display` | Noto Serif TC 600，由 `src/app/layout.tsx` 的 `next/font` 載入 | 標題 |
| `font-sans`（預設） | 系統字體：PingFang TC、Microsoft JhengHei 等 | 其他所有文字 |

- 只載入 600 字重。`font-display` 用在一般字重的文字時會顯示成 600，所以一般文字（例如同意橫幅的說明句）用內文字體。
- 中文字依 unicode-range 切成多個小檔，瀏覽器只下載頁面上用到的字；每頁約 6 到 11 個檔、240 到 500 KB。

## 陰影

- `shadow-overlay`：浮在頁面上的元件，例如同意橫幅。

## 共用元件

| 元件 | 負責 | 用法 |
|---|---|---|
| `Prose` | 長文排版 | 文章、案例內頁用預設 `variant="article"`；About 用 `as="article" variant="page"`，保留較鬆的大標行高 |
| `PageHeader` | 返回連結、頁面大標、副標 | About、Writing & Notes、Projects |
| `BackLink` | 「← 返回…」連結 | 文章、案例內頁 |
| `SectionHeading` | 首頁區塊標題、說明、右側連結 | 只有標題時直接輸出 `h2` |

## 保留的寫死數值

- `max-w-[15em]`：首頁主標寬度，對應 15 個中文字，原因見 `src/app/page.tsx` 的註解。
- `md:grid-cols-[1.5fr_0.7fr]`：首頁第一屏的兩欄比例。
- `prose-code:text-[0.92em]`：行內程式碼相對內文的字級。
- `src/components/ui/` 內 shadcn 自帶的數值不改。
