# 全站健檢修正與 Design Token 實作規劃

> 狀態：D1–D3 已由 PM（Amber）於 2026-11-11 確認；第 1、2 包可派工，第 3 包待 D4。
> 來源：2026-11-11 全站健檢（8 頁 × 桌機 1440 / 手機 390）。
> 給執行者：每個任務都可以獨立派工。開工前先讀 `AGENTS.md`、`WORKFLOW.md`，並看完本文件的「共通規則」。

**Goal：** 修掉健檢發現的全站共通問題，把寫死的樣式數值整理成 design token，最後調整內容呈現，讓潛在雇主更快看懂 Amber 是誰、做出過什麼。

**Tech Stack：** Next.js 16 App Router、React 19、TypeScript、Tailwind CSS v4（設定在 `src/app/globals.css` 的 `@theme inline`，沒有 `tailwind.config`）、shadcn/ui、Node test runner。

---

## 總覽

| 包 | 內容 | 分支 | 可否派工 | 依賴 |
|---|---|---|---|---|
| 第 1 包 | 全站共通問題修正（8 個任務，其中 1.8 已取消） | `codex/site-health-fixes` | 可以 | 無 |
| 第 2 包 | 建立 design token（6 個任務） | `codex/design-tokens` | 可以 | 第 1 包已合併 |
| 第 3 包 | 內容與版面調整（6 個任務） | `codex/content-refresh` | **暫不可派工**，需求待 PM 確認 | 第 2 包已合併 |

順序的理由：第 3 包會新增版面。先有 token，新版面就能直接套用，不會再多一批寫死的數值。

## PM 決策

| 編號 | 決策 | 結論 | 影響的任務 |
|---|---|---|---|
| D1 | 社群分享圖長什麼樣子 | ✅ 已確認：用程式產生，米白底、襯線字的姓名加一句定位文案，不另外做圖 | 1.1 |
| D2 | 字體要不要真的載入 | ✅ 已確認（選項 A）：標題載入 Noto Serif TC（只載 600 字重）；內文改用各平台系統字體，並拿掉沒有實際載入的 `Noto Sans TC` 宣告 | 2.2 |
| D3 | 沒用到的 token 要不要刪 | ✅ 已確認：保留 `.dark` 區塊（shadcn 元件內部會參照），只刪 `sidebar` 與 `chart` 兩組 | 2.6 |
| D4 | 第 3 包的文案與素材（見第 3 包各任務的「需要 PM 提供」） | ⏳ 待提供，第 2 包進行時同步準備 | 第 3 包全部 |

D2 當時的選項比較（已選 A）：

| 選項 | 好處 | 代價 |
|---|---|---|
| A. 標題載入 Noto Serif TC、內文用系統字體（建議） | 各裝置的標題質感一致，載入量小 | 首次載入多幾個字體檔 |
| B. 標題與內文都載入網路字體 | 全站字體完全一致 | 中文字體檔大，載入變慢 |
| C. 全部用系統字體 | 零載入成本 | Windows 與 Mac 的標題外觀不同。Windows 的實際外觀尚未驗證 |

## 共通規則（每個任務都適用）

- 走專案的快速流程。不改資料庫結構、auth、後台功能。
- 外科手術式改動：不順手重構範圍外的檔案，不動 `src/app/admin/**`（任務明確列出的除外）。
- 每個任務完成前都要通過：`npm run lint`（0 errors）、`npm test`、`npm run build`、`npm run review:doc-sync`。
- `npm run build` 會改動 `next-env.d.ts`，commit 前用 `git restore next-env.d.ts` 還原。
- commit 可在本機建立。push、合併、正式部署都要 PM 明確同意。
- 本機驗證方式：正式站會擋自動化瀏覽器（Vercel 安全檢查），不要繞過。改在本機 `next start` 驗證：
  - `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` 用正式專案的公開值。
  - `SUPABASE_SERVICE_ROLE_KEY`、`ADMIN_ALLOWED_EMAILS` 填假值即可（頁首會讀，但公開頁不會用到權限）。
  - `NEXT_PUBLIC_SITE_URL=http://localhost:<port>`。
  - 不要設定 PostHog 的環境變數；瀏覽器測試一律不點「同意」。
- 視覺驗證固定用這 8 頁 × 2 種寬度（1440×900、390×844）：`/`、`/about`、`/blog`、`/blog/between-builder-and-pm`、`/projects`、`/projects/ai-builder-workflow`、`/admin/login`、一個不存在的網址。

---

## 第 1 包：全站共通問題修正

每個任務互相獨立，可平行派工，最後合成一個 PR。

### 任務 1.1：社群分享圖與 metadataBase

- **目的：** 連結貼到 LinkedIn、Slack 時有預覽圖。現況所有頁面都沒有 `og:image`。
- **檔案：** 新增 `src/app/opengraph-image.tsx`（用 `next/og` 的 `ImageResponse`，1200×630）；修改 `src/app/layout.tsx` 加上 `metadataBase`（讀 `NEXT_PUBLIC_SITE_URL`，沿用 `src/lib/infra/supabase/env.ts` 既有的網址解析邏輯，不重寫第二套）。
- **驗收：**
  - 8 頁中的 6 個公開頁，HTML 都有 `og:image` 與 `twitter:card=summary_large_image`，而且是絕對網址。
  - 直接打開圖片網址回 200、尺寸 1200×630。
  - 缺少 `NEXT_PUBLIC_SITE_URL` 時 build 不會失敗。
- **依據：** PM 決策 D1。文案用首頁既有的 metadata 標題「Amber Chang — AI-native Product Builder」，第 3 包若改定位文案再同步更新。

### 任務 1.2：自訂 404 頁

- **目的：** 現況是 Next.js 預設英文頁，背景變純白（其他頁是米白），也沒有回站內的連結。背景變白的原因尚未調查，執行者需先查明。
- **檔案：** 新增 `src/app/not-found.tsx`。
- **驗收：**
  - 中文說明，加上回首頁、Projects、Writing & Notes 三個連結。
  - 背景、頁首、頁尾與其他頁一致。
  - HTTP 狀態仍是 404，`robots` 仍是 `noindex`。
  - 不存在的文章與作品網址（`/blog/xxx`、`/projects/xxx`）也顯示這一頁。

### 任務 1.3：sitemap 與 robots

- **目的：** 讓搜尋引擎知道有哪些頁面。現況兩者都沒有。
- **檔案：** 新增 `src/app/sitemap.ts`、`src/app/robots.ts`。資料透過既有的 `getPublicBlogContentService()` 取得，不直接呼叫 Supabase。
- **驗收：**
  - `/sitemap.xml` 列出首頁、`/about`、`/blog`、`/projects`，以及所有已上架的文章與作品。草稿不出現。
  - `/robots.txt` 排除 `/admin`、`/auth`、`/api`，並指向 sitemap。
  - Supabase 連不上時，sitemap 仍能回應（沿用既有 Markdown fallback），不讓整站 build 失敗。
  - 補對應的單元測試（網址清單的產生邏輯抽成可測的函式）。

### 任務 1.4：文字對比修正

- **目的：** 三處低於 4.5:1。
- **現況數值：** 頁尾導覽連結 3.99:1（12px）；作品內頁的「角色」「期間」標籤 3.59:1；`/admin/login` 的「Blog Admin」4.0:1。
- **檔案：** `src/components/Footer.tsx`、`src/app/projects/[slug]/page.tsx`、`src/app/admin/login/` 內對應檔案。
- **做法：** 拿掉這幾處的透明度減淡（`text-muted-foreground/85`、`/80` 等），直接用 `text-muted-foreground`（實測 5.48:1）。不改 token 的顏色值。
- **驗收：** 8 頁的可見文字（不含純裝飾的分隔符號）對比都 ≥ 4.5:1；大字（≥ 24px）≥ 3:1。

### 任務 1.5：可點範圍修正

- **目的：** 小連結不好點。
- **現況數值：** 頁尾連結高 16px；「← 返回…」連結、桌機導覽列、「All projects」「All posts」高 20px；手機選單展開後的連結高 28px。
- **檔案：** `src/components/Footer.tsx`、`src/components/Header.tsx`、`src/app/page.tsx`、各頁的返回連結。
- **做法：** 用 padding 或 `min-h` 擴大可點範圍，視覺位置盡量不變。
- **驗收：**
  - 所有連結與按鈕的可點高度 ≥ 24px。
  - 手機選單內的連結高度 ≥ 44px。
  - `src/components/Header.test.ts` 仍通過。

### 任務 1.6：標題層級修正

- **目的：** `/blog` 與 `/projects` 從 H1 直接跳到 H3。
- **檔案：** `src/components/PostCard.tsx`、`src/components/ProjectCard.tsx`（加一個標題層級的參數，預設維持 `h3`）、`src/app/blog/page.tsx`、`src/app/projects/page.tsx`（傳入 `h2`）。順手把 `src/app/page.tsx` 的「Contact」從 `<p>` 改成 `<h2>`，樣式不變。
- **驗收：** 8 頁都沒有標題跳號；每頁仍只有一個 H1；畫面外觀不變。

### 任務 1.7：首頁大標題斷行

- **目的：** 桌機 1440 寬時，「清楚」被拆成兩行，最後一行只剩「楚的問題。」。
- **檔案：** `src/app/page.tsx`。
- **做法：** 不要靠硬塞 `<br>` 或不斷行空白來控制最後一行。調整標題的最大寬度或字級，搭配既有的 `text-balance`。
- **驗收：** 在 390、768、1024、1280、1440、1920 六種寬度下，標題最後一行都不少於 6 個字，「清楚」不被拆開。附六張截圖。

### 任務 1.8：內文行長（已取消）

> 2026-11-12 PM 檢視改後畫面後決定不做：桌機版面寬，內文縮窄後右側留白過多。內文維持全寬，已還原。以下保留原始內容供參考。

- **目的：** 桌機版內文每行約 58 字，偏長。
- **檔案：** `src/app/blog/[slug]/page.tsx`、`src/app/projects/[slug]/page.tsx`、`src/app/about/page.tsx`。
- **做法：** 限制內文區塊的最大寬度，標題區可維持原寬。
- **驗收：** 桌機 1440 寬時，內文每行 35 到 45 個中文字；手機版不變。
- **注意：** 這項會改變閱讀版面，交付時附改前改後截圖，由 PM 確認觀感。

### 第 1 包的整體驗收

- 重跑 8 頁 × 2 寬度的量測，確認：對比不足 0 處、可點高度 < 24px 0 處、標題跳號 0 處、橫向捲動 0 頁、主控台錯誤 0 筆（404 頁本身的 404 回應除外）。
- 更新 `NOW.md`。

---

## 第 2 包：建立 design token

**原則：畫面看起來不變。** 這一包只整理寫法，不做設計調整。

**現況盤點（公開頁面 20 個 `.tsx`）：**

| 類別 | 現況 |
|---|---|
| 顏色 | 已用 shadcn token，只有 1 處寫死顏色（同意橫幅的陰影） |
| 文字與邊框深淺 | 用「token 加透明度」臨時調，共 26 種組合。前景色就有 /78、/80、/82、/84、/88、/90、/92 |
| 字級 | 37 處寫死尺寸，例如 `text-[1.02rem]`、`text-[2rem]`、`text-[3.25rem]` |
| 標題字體 | `font-[family-name:var(--font-display)]` 重複 12 次 |
| 圓角 | 7 種，其中 3 種寫死（`1.5rem`、`1.75rem`、`2rem`） |
| 字距 | 7 種 |
| 內文樣式 | 一段約 900 字元的 `prose` 設定，在文章、作品、About 三頁各複製一份 |
| 沒用到的 token | `sidebar`、`chart` 兩組；`.dark` 定義了但沒有任何地方啟用 |

### 任務 2.1：建立視覺基準

- **目的：** 留下「改之前」的截圖，後續每個任務都跟它比。
- **做法：** 在第 1 包合併後的 `main` 上，拍 8 頁 × 2 寬度的整頁截圖。存在 repo 之外（不進 commit）。寫一支比對腳本，輸出每頁的像素差異比例。
- **驗收：** 16 張基準圖；同一版本連拍兩次，差異為 0（確認比對方式穩定）。

### 任務 2.2：定義 token

- **檔案：** `src/app/globals.css`（`@theme inline` 與 `:root`）；若 D2 選 A 或 B，另改 `src/app/layout.tsx` 用 `next/font` 載入字體。
- **要定義的 token：**

| 類別 | 內容 | 命名方向 |
|---|---|---|
| 字級 | 把現有尺寸收斂成一組：頁面大標、首頁主標、區塊標題、內文標題兩級、卡片標題、內文、輔助文字、標籤 | `--text-display`、`--text-title`、`--text-heading`… |
| 文字深淺 | 收斂成 3 階：主要、次要、輔助 | 沿用 `foreground`、`muted-foreground`，新增一階 `foreground-soft` |
| 邊框深淺 | 收斂成 2 階：預設、強調（hover） | `border`、`border-strong` |
| 圓角 | 卡片、面板、膠囊 3 種 | `--radius-card`、`--radius-panel`，膠囊用 `rounded-full` |
| 字距 | 標題、小標籤 2 種 | `--tracking-heading`、`--tracking-label` |
| 字體 | 讓 `font-display` 成為可直接使用的 utility | 既有 `--font-display` |

- **驗收：** token 都有定義且有一行註解說明用途；`npm run build` 通過；此時畫面尚未改變。
- **依據：** PM 決策 D2（選項 A）。交付時附載入字體前後的 LCP 數值。

### 任務 2.3：抽出共用樣式元件

- **檔案：** 新增 `src/components/Prose.tsx`（取代三份重複的 `prose` 設定）、`src/components/PageHeader.tsx`（返回連結加頁面標題加副標）、`src/components/SectionHeading.tsx`（首頁區塊標題）。
- **驗收：** 三個元件只負責樣式與結構，不讀資料；各有最小測試或在既有頁面測試中被涵蓋。

### 任務 2.4：逐頁替換

- **檔案：** `src/app/page.tsx`、`about/`、`blog/`、`blog/[slug]/`、`projects/`、`projects/[slug]/`，以及 `src/components/` 下的 `Header`、`Footer`、`PostCard`、`ProjectCard`、`RelatedPostsSection`、`RelatedProjectSection`、`AnalyticsConsentBanner`。
- **做法：** 一次替換一頁，每頁替換後就跑一次視覺比對。
- **驗收：**
  - 公開頁面的寫死數值從 93 處降到 10 處以下（`src/components/ui/` 內 shadcn 自帶的 `data-[…]`、`has-[…]` 不計）。
  - 「token 加透明度」的組合從 26 種降到 8 種以下。
  - `font-[family-name:var(--font-display)]` 出現 0 次。
  - 每頁與基準圖的像素差異 ≤ 0.5%。超過的地方逐一列出原因（例如七種深淺併成三階造成的細微色差），由 PM 確認。

### 任務 2.5：文件

- **檔案：** 新增 `docs/design-tokens.md`（一頁：token 清單、各自用在哪、新增畫面時怎麼選）；更新 `.context/CONVENTIONS.md` 加一條「新畫面不得寫死字級、圓角、深淺」；更新 `NOW.md`。
- **驗收：** `npm run review:doc-sync` 通過。

### 任務 2.6：清理沒用到的 token

- **檔案：** `src/app/globals.css`。
- **做法：** 依 D3 刪除 `sidebar`、`chart` 兩組。刪之前全專案搜尋確認沒有參照（含 `src/components/ui/`）。
- **驗收：** build 通過；16 張截圖與基準一致。

---

## 第 3 包：內容與版面調整（需求待確認，暫不可派工）

這一包會改變網站傳達的內容，屬於新需求。PM 提供素材並確認需求後，再拆成可派工的任務。以下是預計的任務與各自需要的素材。

| 任務 | 目的 | 現況 | 需要 PM 提供 |
|---|---|---|---|
| 3.1 首頁第一屏 | 10 秒內看懂「你是誰、做過什麼」 | 只有做事方式的敘述，沒有身分、領域、成果 | 一句定位（職稱加領域）、2 到 3 個可佐證的成果或數字 |
| 3.2 首頁作品卡片 | 卡片上直接看到角色與成果 | 只顯示標題與描述。資料裡已有 `role`、`period`、`outcomes`、`tags`，不用改資料庫 | 卡片要顯示哪些欄位；「工作隨筆」內容偏少，是否仍放首頁 |
| 3.3 作品內頁的關鍵成果 | 讓成果成為頁面上最顯眼的資訊之一 | 14px 灰字，是全頁最不顯眼的文字 | 無。純版面調整 |
| 3.4 文章列表摘要 | 看得出每篇在講什麼 | 只有標題與日期。資料有 `excerpt` 欄位，各篇是否都有填尚未檢查 | 確認每篇文章都有摘要，或同意沒有摘要的就不顯示 |
| 3.5 聯絡入口 | 讓有興趣的雇主有明確的下一步 | 只有頁尾一行 email | LinkedIn 網址；是否提供履歷下載；第一屏要不要放聯絡按鈕 |
| 3.6 About 頁 | 可快速掃讀 | 純文字 | 是否放照片；是否加經歷時間軸（需提供各段經歷的期間與職稱） |

---

## 風險

| 風險 | 等級 | 因應 |
|---|---|---|
| 第 2 包動到每一頁，可能造成細微走樣 | 🟡 中 | 任務 2.1 的基準圖加逐頁比對；一頁一個 commit，方便回退 |
| 載入中文網路字體讓首頁變慢 | 🟡 中 | D2 建議只載標題字體的單一字重；交付時附載入前後的 LCP 數值 |
| 分享圖在各平台的實際顯示無法在本機驗證 | 🟡 中 | 上線後用 LinkedIn Post Inspector 檢查，由 PM 確認 |
| sitemap 在 Supabase 暫停時失敗 | 🟢 低 | 沿用既有 Markdown fallback；防暫停排程已上線 |
| 自動化瀏覽器被正式站擋下 | 🟢 低 | 一律在本機驗證；正式站只做 HTTP 狀態檢查，畫面由 PM 目視確認 |

## 不在這次範圍

- 深色模式。
- 後台（`/admin`）的版面與樣式，任務 1.4 提到的登入頁對比除外。
- 已做過選擇的訪客再訪時，同意橫幅會短暫閃一下的問題。
- 治理工具腳本裡的 16 個 lint 警告。
