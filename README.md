# 個人 Portfolio 網站｜AI 協作實作與產品開發流程

這個 repo 不只是個人作品集網站的原始碼，也記錄我如何透過 AI-assisted product development workflow，把模糊的個人定位、作品集需求與內容管理需求，轉化為可維護、可擴充的產品系統。

網站作為產品專案、AI Builder 實作、工作隨筆與 side project 的整合入口；repo 則保留 AI 協作開發所需的文件治理、spec、review gate 與 agent working rules，展示我如何讓 AI 與人類共同遵循同一套產品開發流程。

## 這個專案展示的能力

- 將模糊需求轉化為產品定位、資訊架構與內容模型
- 規劃 `Projects` / `Writing` / `About` 等作品集展示結構
- 以 Next.js、TypeScript、Tailwind CSS、shadcn/ui 與 Supabase 建立可維護網站
- 設計前後台讀寫邊界、Google OAuth 管理員登入、草稿 / 發佈狀態與 published-only read model
- 透過 `AGENTS.md`、`FOUNDATION.md`、`NOW.md`、`SKILLS.md`、spec 與 review gate 建立 AI 協作開發流程
- 將 AI 協作從一次性 prompt 提升為可追蹤、可驗收、可持續維護的產品開發方式

## 專案定位

這是一個以潛在雇主與 hiring manager 為主要受眾的個人品牌網站，核心目標不是只展示作品，而是一起呈現：

- 我如何用 AI-native workflow 工作
- 我如何把模糊需求轉成可落地的產品與案例
- 我如何透過寫作整理判斷、觀察與思考

## 網站內容結構

```text
/                  首頁
/projects          案例列表
/projects/[slug]   案例內頁
/blog              寫作列表
/blog/[slug]       文章內頁
/about             關於我
```

## 技術基礎

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PostHog

目前公開前台的內容主要由 Supabase repository layer 提供；`content/posts/*.md` 與 `content/projects/*.md` 則保留作為 import / sync source，不是公開前台的即時資料來源。

## AI 協作文件

- `AGENTS.md`  
  定義 AI 協作的工作規則，包括技術邊界、讀檔順序、開發流程、 commit / push gate 與文件治理策略。

- `FOUNDATION.md`  
  定義這個網站相對穩定的產品方向，包括目標受眾、定位、內容範圍與長期產品原則。

- `NOW.md`  
  記錄專案目前狀態、最近進度與下一步重點，刻意保持輕量，不讓它變成過長的規劃文件。

- `SKILLS.md`  
  整理可重用的 AI 協作技能，以及各自適合使用的時機。

- `docs/`  
  放各個單一主題的 spec、實作決策與功能設計說明。

## 本機開發

```bash
npm install
npm run dev
```

啟動後可開啟 [http://localhost:3000](http://localhost:3000)。

## 內容匯入與同步

```bash
npm run content:import-posts
npm run content:sync-projects
```

- `npm run content:import-posts`：把 Markdown 文章匯入 Supabase
- `npm run content:sync-projects`：把 Markdown 專案資料同步到 Supabase `projects`

## 主要環境變數

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ALLOWED_EMAILS`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `NEXT_PUBLIC_POSTHOG_HOST`

補充：

- admin 目前採用 `Supabase Auth + Google OAuth + allowlisted email`
- `SUPABASE_SERVICE_ROLE_KEY` 只可用在 trusted server runtime，不可進 client bundle
- PostHog 只在訪客同意 consent banner 後初始化，且不追蹤 `/admin`

## 備註

- 這個 repo 對外展示的不只是網站成品，也包含我如何把 AI 納入產品開發流程
- 若你是從履歷或作品集連過來，這份 README 可以視為這個專案的產品與協作方法摘要
