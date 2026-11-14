---
id: SPEC-002
status: active
title: "內容架構調整（3A）：專案類型、首頁五段、年月日期"
related_prd: PRD-001
---

# 內容架構調整（3A）：專案類型、首頁五段、年月日期

> 範圍由 PM 於 2026-11-15 確認。這份 SPEC 是 3A 的主文件；視覺改版是之後的另一包，不在這裡。
> 本專案目前沒有 3A 專屬 PRD，`related_prd` 暫掛在內容 runtime 的 PRD-001。

## 目標

- 每個專案都有一個必填的「類型」，讓訪客一眼分辨是工作案例、研究，還是個人專案。
- 首頁改成固定五段：身分 → 代表案例 → 精選文章 → 關於我（短版）→ 聯絡。
- 公開頁面的日期只顯示年和月（例如 `2026 年 6 月`），且不因時區跑到前後一個月。
- 「工作隨筆」下架後，所有公開頁面照常運作，不出現壞掉的連結。

## 非目標

- 視覺改版（字級、配色、版面節奏）：之後另一包處理，本包只用既有 token 與共用元件。
- About 頁內容改寫：之後處理；舊首頁大標那句之後會搬到 About，本包不放到任何地方。
- 下架或刪除「工作隨筆」的正式資料：由 reviewer 在 production 執行，不在程式變更內。
- 套用 migration 到 production：由 reviewer 在 PM 同意後執行。
- 首頁新增外部連結（LinkedIn 等）、後台專案列表顯示類型、文章列表頁顯示摘要。

## 驗收條件

### 專案類型

- [ ] `projects` 表有 `project_type` 欄位：`text`、`not null`、只接受 `work`、`research`、`side`，預設值 `side`。
- [ ] migration 可重複執行不出錯；既有資料依 slug 回填：`ai-builder-workflow` → side、`modern-martech-architecture` → research、`turning-work-into-thinking` → side、`ai-writing-review-product` → work、`sms-management-platform` → work，其他既有資料 → side。
- [ ] 重跑 migration 不會覆蓋套用後在後台改過的類型（只回填空值）。
- [ ] 後台新增與編輯專案表單有必選的「類型」選單（工作案例／研究／個人專案）。
- [ ] 後台送出時伺服器端驗證：沒選類型顯示「請選擇專案類型（工作案例、研究或個人專案）。」；送出不認得的值顯示「專案類型無效，請從選單選擇工作案例、研究或個人專案。」；兩種情況都不寫入資料。
- [ ] 前台的專案卡片（首頁、`/projects`）與專案內頁顯示中文類型標籤：`work` → 工作案例、`research` → 研究、`side` → 個人專案。
- [ ] 資料庫讀到不認得或空的類型時，公開頁面不報錯，只是不顯示類型標籤。
- [ ] `content/projects/*.md` 的 frontmatter 有 `type`；Markdown 備援讀到缺少或不認得的 `type` 時不報錯、不顯示標籤；`npm run content:sync-projects` 遇到缺少或不認得的 `type` 會停下並指出檔名。

### 首頁五段（`src/app/page.tsx`）

- [ ] 區塊順序：身分 → 代表案例 → 精選文章 → 關於我（短版）→ 聯絡；頁面只有一個 H1，五段之後的區塊標題都是 H2，卡片標題是 H3，不跳號。
- [ ] 身分：小標 `Product Manager / Product Builder`；H1 為「我把模糊的需求整理成可以上線的產品，並用 AI 把想法更快做成成果。」；保留 Projects、Writing & Notes 兩個按鈕；舊 H1 與 Focus 清單移除。
- [ ] H1 在 390、768、1024、1280、1440、1920 六種寬度下，最後一行都不少於 6 個字。
- [ ] 代表案例：已上架且標為 featured 的專案，最多 3 個，每張顯示類型標籤、角色、標題、摘要，有成果時顯示第一條成果。
- [ ] 代表案例備援：沒有任何 featured 的已上架專案時，改顯示排序最前面的 3 個已上架專案；完全沒有已上架專案時才顯示空狀態。
- [ ] 精選文章：依既有排序取前 3 篇已上架文章，每篇顯示摘要；沒有摘要的文章只顯示標題，版面不跑掉。
- [ ] 摘要整理：換行（含 CRLF）與連續空白合併；中文字之間的換行直接接起來，其他地方變成一個空白；超過 80 個字時截斷並加上「…」，截斷處不留逗號類標點。
- [ ] 關於我（短版）：「我從教育現場、BD 與產品規劃，一路走到產品經理。」加上連到 `/about` 的「更多關於我」。不提目前公司或產業。
- [ ] 聯絡：標題加上既有的 mailto 連結，不新增外部連結。
- [ ] 首頁 metadata 的 description 不再用舊 H1 那句；title 不變。

### 日期

> 待確認：原需求的測試案例 `2026-06-30T23:30:00Z` 在台北時間是 7/1 07:30，和「固定用台北時間」互相矛盾。下方是建議版本，已請 PM 確認。

- [ ] 文章卡片、文章內頁、專案內頁的延伸閱讀列，日期都顯示成 `2026 年 6 月`。
- [ ] 一律用台北時間（`Asia/Taipei`，UTC+8）判斷月份：`2026-06-01T00:00:00Z`（台北 6/1 08:00）→ 6 月；`2026-06-30T15:30:00Z`（台北 6/30 23:30）→ 6 月；`2026-06-30T16:30:00Z`（台北 7/1 00:30）→ 7 月。
- [ ] 無法解析的日期不報錯，顯示空字串。

### 工作隨筆下架後

- [ ] 文章關聯的專案被下架或不存在時，文章頁照常顯示，不出現「相關案例」區塊，也沒有指向該專案的連結。
- [ ] sitemap 只列已上架的專案。

### 全站健檢第 1、2 包的保證不退步

- [ ] 8 頁 × 2 寬度（1440、390）：對比不足 0、可點高度 < 24px 0、標題跳號 0、每頁 1 個 H1、橫向捲動 0、主控台錯誤 0（404 頁本身的 404 回應除外）。

## 實作注意事項

### 資料模型

| 層 | 欄位 | 讀取 | 寫入 |
|---|---|---|---|
| DB `projects.project_type` | `text not null default 'side'`，CHECK 三個值 | — | — |
| `ProjectRecord`、`ProjectSummary`、`PublicProjectRecord` | `projectType: ProjectType \| null` | 不認得的值轉成 `null`，不丟錯 | — |
| `CreateProjectInput` | `projectType: ProjectType`（必填） | — | 後台建立一定要帶 |
| `UpdateProjectInput` | `projectType?: ProjectType` | — | 後台編輯表單一定會帶 |
| `SyncProjectInput` | `projectType: ProjectType`（必填） | — | 來自 Markdown `type` |

- 類型的值、中文標籤、判斷與轉換集中在 `src/lib/content/project-type.ts`，前台、後台、repository 都從這裡取，不各自寫一份。
- 讀取端寬鬆（未知值 → `null`、不顯示標籤），寫入端嚴格（後台 action 與 Markdown 同步都驗證），資料庫再用 CHECK 擋一次。
- Supabase repository 的公開查詢明確列出 `project_type` 欄位。這代表新程式需要資料庫已經有這個欄位（見下方上線順序）。

### Migration：`supabase/migrations/202611150001_add_project_type.sql`

步驟依序：

1. `add column if not exists project_type text`（先不設預設值，既有資料保持空值，才能依 slug 回填）。
2. `set default 'side'`：從這一步起，舊程式新增的專案會自動得到 `side`。
3. 依 slug 回填，只更新 `project_type is null` 的資料。
4. `set not null`。
5. `drop constraint if exists` 後重建 `projects_project_type_check`。

預設值選 `side` 的原因：

- 和「其他既有資料 → side」的回填規則一致。
- 舊程式在新增專案時不會帶這個欄位；有預設值，舊程式在 migration 套用後、新程式上線前仍能正常新增與編輯專案。
- `side`（個人專案）是三個值裡最不會誇大的標籤：不會把個人作品誤標成雇主的工作案例。
- 後台表單仍要求明確選擇，預設值只是資料庫的安全網，不是產品上的預設選項。

### 上線順序

1. reviewer 在 PM 同意後套用 migration（純新增欄位，現行程式不讀這個欄位，不受影響）。
2. 確認 `select project_type from projects` 有值且符合回填表。
3. 合併並部署新程式。
4. reviewer 把「工作隨筆」下架（`status = 'draft'`）。

反過來（先上程式、後套 migration）會讓公開專案查詢失敗：PostgREST 對不存在的欄位回 `42703 column projects.project_type does not exist`。首頁、`/projects`、專案內頁、有關聯專案的文章頁都會出錯，Vercel build 也會在 `generateStaticParams` 讀專案時失敗。

### 日期時區

- `formatYearMonth` 用 `Intl.DateTimeFormat` 固定 `timeZone: "Asia/Taipei"` 取年、月，再組成 `YYYY 年 M 月`，不依伺服器或瀏覽器時區。
- Markdown 文章的 `date: 2026-06-01` 會存成 `2026-06-01T00:00:00Z`，台北時間是當天 08:00，月份不會位移。

### 測試

- 主要邏輯都有 `node --test` 單元測試，先寫測試、看它失敗再實作：類型判斷與標籤、後台驗證、repository 對應、Markdown 備援與同步、首頁代表案例備援、摘要整理、年月日期。
- 頁面結構用讀原始碼的測試（同既有 `card-heading-level.test.ts` 寫法）確認區塊順序與標題層級；實際畫面用本機 production build 量測。

## 方案與流程

### 首頁資料流

```text
page.tsx
 ├─ loadHomeFeaturedProjectsData ── service.listPublicProjects()
 │     └─ selectHomeProjects：featured 取前 3；沒有 featured 就取前 3 個已上架專案
 └─ loadHomeWritingData ── service.listPublicPosts()
       └─ 取前 3 篇，摘要經 normalizeExcerpt 整理（沒有摘要 → null，只顯示標題）
```

- 首頁代表案例改讀 `listPublicProjects`（已依 `sort_order` 排序、只含已上架），在同一份清單上做 featured 篩選與備援，不再另外查一次 featured。
- `ProjectCard` 新增 `highlights` 參數：首頁傳入時多顯示角色與第一條成果；`/projects` 維持標題與摘要，兩處都顯示類型標籤。
- `PostCard` 新增可選的 `excerpt`；沒有值時不輸出那一行。

### 未來擴張

- 新增第四種類型時：改 `project-type.ts` 的清單與標籤，加一支 migration 更新 CHECK。前台與後台選單會自動跟上。
- 若之後要讓 `/projects` 依類型分組或篩選，直接用 `projectType` 欄位，不需要再改資料模型。
