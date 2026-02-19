# TPM Spec：Phase 1 個人品牌網站

**需求來源**：`.context/requirements/PRD-personal-site-phase1.md`
**建立日期**：2026-02-20
**更新日期**：2026-02-20（架構變更：Notion API → Obsidian + git sync）
**狀態**：Architect 確認完成，可交 Codex 執行

---

## 技術摘要

用 Next.js（App Router）+ Tailwind CSS + shadcn/ui 建立個人品牌網站，
文章以 Markdown 檔案存在 repo 的 `content/posts/` 目錄，
用 Obsidian 寫作並透過 Obsidian Git plugin 自動 push 到 GitHub，
Vercel 偵測到 push 自動部署。

Phase 1 目標：首頁 + /about + /blog + /blog/[slug] + 第一篇文章上線。

---

## 架構決策記錄

| 決策 | 結論 | 原因 |
|------|------|------|
| 內容管理 | Obsidian + git sync（取代 Notion API）| Notion 圖片 URL 會過期；Amber 主要在 MacBook 寫作 |
| 資料抓取策略 | SSG（build 時靜態生成）| 內容在 repo 裡，push 即觸發重新部署，不需要 ISR |
| 內容格式 | Markdown（.md）+ frontmatter | gray-matter 解析，react-markdown 渲染 |
| 圖片 | 存在 `public/images/posts/`，直接引用 | 永不過期，完全掌握在自己手上 |
| 精選文章 | frontmatter 的 `featured: true` 欄位 | 在 Obsidian 直接編輯，不需要改程式碼 |

---

## 前置條件（開始寫程式之前必須備齊）

| 項目 | 狀態 | 說明 |
|------|------|------|
| Node.js | ✅ v25.3.0 | 已確認 |
| Obsidian | ⬜ 待安裝 | obsidian.md 下載安裝 |
| Obsidian Git plugin | ⬜ 待設定 | Obsidian 社群 plugin，設定 auto commit + push |
| Vercel 帳號連結 | ⬜ 待設定 | 需連結 GitHub repo |
| 網域 | ⬜ 待購買/設定 | Cloudflare 管理 |

> ✅ **不再需要** Notion Integration Token 和 Notion Database ID。

---

## 任務拆解

### 階段 A：專案初始化（Blocker for everything）

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P0 | 初始化 Next.js 15 | S | `npx create-next-app@latest`，選 App Router + TypeScript + Tailwind |
| P0 | 初始化 shadcn/ui | S | `npx shadcn@latest init` |
| P0 | 安裝 gray-matter + react-markdown | S | `npm install gray-matter react-markdown` |
| P0 | 建立 content 目錄結構 | S | `content/posts/`、`public/images/posts/` |
| P0 | 推上 Vercel 做基本部署 | S | 確認 CI/CD pipeline 通 |

### 階段 B：文章工具函式

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P0 | 建立 `src/lib/posts.ts` | M | getPublishedPosts()、getPostBySlug()、getFeaturedPosts() |
| P0 | 建立第一篇測試文章 | S | 在 `content/posts/` 放一篇 .md 測試能否讀到 |

### 階段 C：頁面開發

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P1 | 全域 Layout（header + footer）| M | 導覽列、頁尾聯絡方式 |
| P1 | 首頁 `/` | M | 定位文案 + 精選文章 2-3 篇 + 聯絡 CTA |
| P1 | 關於我 `/about` | M | 靜態內容，依 PRD 敘事骨架撰寫 |
| P1 | 文章列表 `/blog` | S | 讀取所有 .md 檔案，列出標題和日期 |
| P1 | 文章頁 `/blog/[slug]` | M | 讀取單篇 .md，渲染 Markdown 內容 |

### 階段 D：上線

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P1 | 設定 Obsidian + Obsidian Git | S | 安裝 Obsidian，設定 Git plugin 指向 repo |
| P1 | 撰寫第一篇文章 | M | 題目：用 AI 爬透三套耦合的會員系統 |
| P2 | 設定自訂網域 | S | Cloudflare DNS → Vercel |
| P2 | 基本 SEO meta tags | S | title、description、og:title |

---

## 風險和未知項目

| 風險 | 影響 | 建議 |
|------|------|------|
| Obsidian Git plugin 衝突 | 低：如果本機也有 git 操作，可能 conflict | 固定在 Obsidian 寫文章，程式碼在另一個 repo 目錄 |
| react-markdown 樣式 | 低：預設樣式可能不好看 | 搭配 @tailwindcss/typography 的 prose class |
| Node.js v25 相容性 | 低：很新但非 LTS | 加 `.nvmrc` 固定版本，或切換到 Node.js 20 LTS |

---

## 給 Codex 的執行備註

- 使用 Next.js App Router，**不要**用 Pages Router
- Tailwind class 不要用 inline style 替代
- shadcn/ui 元件從 `@/components/ui/` 引入
- 文章讀取用 `fs`（Node.js 內建）+ `gray-matter`，只在 Server Component 或 SSG 函式裡讀
- 每個新建的檔案頂部加上：`// [AI-ASSISTED] Generated with Codex`
- **不需要** 任何 Notion 相關套件或環境變數
