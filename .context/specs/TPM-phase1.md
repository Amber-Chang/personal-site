# TPM Spec：Phase 1 個人品牌網站

**需求來源**：`.context/requirements/PRD-personal-site-phase1.md`
**建立日期**：2026-02-20
**狀態**：待 Architect 確認技術決策

---

## 技術摘要

用 Next.js（App Router）+ Tailwind CSS + shadcn/ui 建立個人品牌網站，
文章內容透過 Notion API 管理，部署在 Vercel，網域透過 Cloudflare 設定。

Phase 1 目標：首頁 + /about + /blog + /blog/[slug] + 第一篇文章上線。

---

## 前置條件（開始寫程式之前必須備齊）

| 項目 | 狀態 | 說明 |
|------|------|------|
| Node.js | ✅ v25.3.0 | 已確認 |
| Notion Integration Token | ⬜ 待取得 | 在 notion.so/my-integrations 建立 |
| Notion Database ID | ⬜ 待取得 | 建立 database 後從 URL 取得 |
| Vercel 帳號連結 | ⬜ 待設定 | 需連結 GitHub repo |
| 網域 | ⬜ 待購買/設定 | Cloudflare 管理 |

> ⚠️ **Notion Token + Database ID 是開發 blocker**，取得前無法完成 /blog 相關頁面。
> 但首頁靜態部分、/about 頁可以先開發，不需要 Notion。

---

## 任務拆解

### 階段 A：專案初始化（Blocker for everything）

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P0 | 初始化 Next.js 15 | S | `npx create-next-app@latest`，選 App Router + TypeScript + Tailwind |
| P0 | 初始化 shadcn/ui | S | `npx shadcn@latest init` |
| P0 | 安裝 Notion 套件 | S | `npm install @notionhq/client notion-to-md` |
| P0 | 設定環境變數 | S | 建立 `.env.local`，加入 NOTION_TOKEN、NOTION_DATABASE_ID |
| P0 | 推上 Vercel 做基本部署 | S | 確認 CI/CD pipeline 通，空頁面也沒關係 |

### 階段 B：Notion 設定（需要 Notion 帳號）

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P0 | 建立 Notion Integration | S | notion.so/my-integrations，取得 Token |
| P0 | 建立 Notion Database | S | 欄位：標題、狀態、日期、標籤、Slug |
| P0 | 建立 Notion API 工具函式 | M | `lib/notion.ts`：getPublishedPosts()、getPostBySlug() |
| P0 | 測試 API 連線 | S | 確認可以從 Notion 抓到資料 |

### 階段 C：頁面開發

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P1 | 全域 Layout（header + footer）| M | 導覽列、頁尾聯絡方式 |
| P1 | 首頁 `/` | M | 定位文案 + 精選文章 2-3 篇 + 聯絡 CTA |
| P1 | 關於我 `/about` | M | 靜態內容，依 PRD 敘事骨架撰寫 |
| P1 | 文章列表 `/blog` | M | 從 Notion 抓取所有已發布文章 |
| P1 | 文章頁 `/blog/[slug]` | L | 從 Notion 抓取單篇文章並渲染內容 |

### 階段 D：上線

| 優先級 | 任務 | 複雜度 | 說明 |
|--------|------|--------|------|
| P1 | 在 Notion 撰寫第一篇文章 | M | 題目：用 AI 爬透三套耦合的會員系統 |
| P2 | 設定自訂網域 | S | Cloudflare DNS → Vercel |
| P2 | 基本 SEO meta tags | S | title、description、og:title |

---

## 風險和未知項目

| 風險 | 影響 | 建議 |
|------|------|------|
| Notion 圖片 URL 會過期 | 高：文章內圖片可能失效 | 先不放圖片在 Notion，或 Architect 決定處理方式 |
| Notion 內容渲染複雜度 | 中：Notion block 格式特殊，需要轉換 | Architect 決定使用哪個 library |
| ISR revalidate 時機 | 低：文章更新後多久才反映到網站 | Architect 決定 revalidate 間隔 |
| Next.js 25 相容性 | 低：Node.js v25 是非常新的版本 | 注意 Next.js 官方支援的 Node.js 版本 |

---

## 給 Architect 的問題

- [ ] **資料抓取策略**：/blog 和 /blog/[slug] 用 ISR（建議）、SSG 還是 SSR？
- [ ] **Notion 內容渲染**：用 `notion-to-md` + markdown renderer，還是其他方案？
- [ ] **Notion 圖片過期問題**：Phase 1 先忽略，還是需要處理？
- [ ] **精選文章的選取方式**：首頁的 2-3 篇精選文章，靠 Notion 欄位標記（加一個 featured 欄位）還是硬編碼（直接寫在程式碼裡）？

---

## 給 Codex 的執行備註

- 使用 Next.js App Router，**不要**用 Pages Router
- Tailwind class 不要用 inline style 替代
- shadcn/ui 元件從 `@/components/ui/` 引入
- Notion API 呼叫只放在 Server Component，不要在 Client Component 呼叫
- 每個新建的檔案頂部加上：`// [AI-ASSISTED] Generated with Codex`
- 環境變數放在 `.env.local`，**不要** commit 進 git
