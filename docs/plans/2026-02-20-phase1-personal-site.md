# Phase 1 Personal Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立個人品牌網站 Phase 1，包含首頁、/about、/blog、/blog/[slug]，並上線第一篇文章。

**Architecture:** Next.js 15 App Router + Tailwind CSS + shadcn/ui，文章內容從 Notion API 抓取，ISR 策略更新頁面，部署在 Vercel。

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, @notionhq/client, notion-to-md, Vercel

---

> ⚠️ **執行前提**：Notion Integration Token 和 Database ID 必須已取得，
> 否則 Task 4 以後的 Notion 相關任務無法執行。

---

### Task 1：初始化 Next.js 專案

**Files:**
- Create: `（整個專案根目錄）`

**Step 1: 執行初始化指令**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

選項說明：
- `--app`：使用 App Router
- `--src-dir`：程式碼放在 `src/` 目錄下
- `--typescript`：使用 TypeScript

**Step 2: 確認專案結構**

```bash
ls src/app/
```

預期看到：`globals.css  layout.tsx  page.tsx`

**Step 3: 啟動開發伺服器確認正常**

```bash
npm run dev
```

預期：瀏覽器開啟 http://localhost:3000 看到 Next.js 預設頁面

**Step 4: Commit**

```bash
git add -A
git commit -m "[AI-DEV] chore: 初始化 Next.js 15 專案"
```

---

### Task 2：安裝 shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/components/ui/`（shadcn 元件會放這裡）

**Step 1: 初始化 shadcn/ui**

```bash
npx shadcn@latest init
```

選擇：Default style, Neutral color, CSS variables: yes

**Step 2: 安裝會用到的元件**

```bash
npx shadcn@latest add button card separator badge
```

**Step 3: 確認元件安裝成功**

```bash
ls src/components/ui/
```

預期看到：`button.tsx card.tsx separator.tsx badge.tsx`

**Step 4: Commit**

```bash
git add -A
git commit -m "[AI-DEV] chore: 安裝 shadcn/ui 基礎元件"
```

---

### Task 3：安裝 Notion 套件並設定環境變數

**Files:**
- Create: `.env.local`（不 commit）
- Create: `src/lib/notion.ts`

**Step 1: 安裝套件**

```bash
npm install @notionhq/client notion-to-md
```

**Step 2: 建立 .env.local**

```bash
# .env.local
NOTION_TOKEN=your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
```

**Step 3: 確認 .gitignore 有包含 .env.local**

```bash
grep ".env.local" .gitignore
```

預期輸出：`.env.local`（如果沒有就手動加入）

**Step 4: 建立 Notion 工具函式 `src/lib/notion.ts`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：Notion API 工具函式，提供抓取文章列表和單篇文章的方法

import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

export async function getPublishedPosts() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: "Status",
      select: { equals: "Published" },
    },
    sorts: [{ property: "Date", direction: "descending" }],
  });
  return response.results;
}

export async function getPostBySlug(slug: string) {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: "Slug",
      rich_text: { equals: slug },
    },
  });
  if (!response.results[0]) return null;
  const page = response.results[0];
  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(mdBlocks);
  return { page, markdown: markdown.parent };
}

export async function getFeaturedPosts() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        { property: "Status", select: { equals: "Published" } },
        { property: "Featured", checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: "Date", direction: "descending" }],
  });
  return response.results;
}
```

**Step 5: Commit**

```bash
git add src/lib/notion.ts package.json package-lock.json
git commit -m "[AI-DEV] chore: 安裝 Notion 套件，建立 API 工具函式"
```

---

### Task 4：建立 Notion Database

> ⚠️ 這個 Task 在 Notion 介面操作，不是寫程式碼。

**Step 1: 建立 Notion Integration**
1. 前往 https://www.notion.so/my-integrations
2. 點「New integration」
3. 名稱填「Personal Site」
4. 複製 Internal Integration Token → 填入 `.env.local` 的 `NOTION_TOKEN`

**Step 2: 建立 Notion Database**

在 Notion 建立新的 Full Page Database，加入以下欄位：

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| Title | Title | 文章標題（預設欄位） |
| Status | Select | 選項：Draft, Published |
| Date | Date | 發布日期 |
| Slug | Text | 網址用（例如：ai-membership-system） |
| Tags | Multi-select | 文章標籤 |
| Featured | Checkbox | 是否顯示在首頁精選 |

**Step 3: 連結 Integration 到 Database**
1. 在 Database 頁面點右上角「...」
2. 點「Add connections」
3. 選「Personal Site」Integration

**Step 4: 取得 Database ID**
- Database 頁面的 URL 格式：`https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
- `?v=` 前面那段 32 字元就是 Database ID
- 填入 `.env.local` 的 `NOTION_DATABASE_ID`

---

### Task 5：建立全域 Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`

**Step 1: 建立 Header 元件 `src/components/Header.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：全站導覽列，包含 Logo 和導覽連結

import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="font-semibold text-lg">
          Amber Chang
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/blog" className="hover:text-foreground/80">文章</Link>
          <Link href="/about" className="hover:text-foreground/80">關於我</Link>
        </nav>
      </div>
    </header>
  );
}
```

**Step 2: 建立 Footer 元件 `src/components/Footer.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：頁尾，顯示聯絡 email

export function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="max-w-2xl mx-auto px-4 py-8 text-sm text-muted-foreground">
        <p>聯絡我：<a href="mailto:amber@yourdomain.com" className="underline">amber@yourdomain.com</a></p>
      </div>
    </footer>
  );
}
```

**Step 3: 更新 `src/app/layout.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：全站 Layout，包含 Header 和 Footer

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Amber Chang",
  description: "一個正在學著用 AI 槓桿出更大效益、朝 builder 之路邁進的 PM。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-12">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

**Step 4: Commit**

```bash
git add src/
git commit -m "[AI-DEV] feat: 建立全域 Layout、Header、Footer"
```

---

### Task 6：建立首頁 `/`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: 建立首頁 `src/app/page.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：首頁，顯示個人定位、精選文章、聯絡 CTA

import Link from "next/link";
import { getFeaturedPosts } from "@/lib/notion";
import { PostCard } from "@/components/PostCard";

export default async function HomePage() {
  const posts = await getFeaturedPosts();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section>
        <h1 className="text-2xl font-semibold leading-snug">
          我是 Amber，一個正在學著用 AI 槓桿出更大效益、朝 builder 之路邁進的 PM。
        </h1>
        <p className="mt-4 text-muted-foreground">
          這裡是我記錄思考和實驗的地方。
        </p>
      </section>

      {/* 精選文章 */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-6">精選文章</h2>
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <Link href="/blog" className="mt-8 inline-block text-sm underline">
          所有文章 →
        </Link>
      </section>

      {/* 聯絡 */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">聯絡我</h2>
        <a href="mailto:amber@yourdomain.com" className="underline">
          amber@yourdomain.com
        </a>
      </section>
    </div>
  );
}
```

**Step 2: 建立 PostCard 元件 `src/components/PostCard.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：文章卡片，顯示文章標題和日期

import Link from "next/link";

export function PostCard({ post }: { post: any }) {
  const title = post.properties.Title?.title?.[0]?.plain_text ?? "無標題";
  const slug = post.properties.Slug?.rich_text?.[0]?.plain_text ?? "";
  const date = post.properties.Date?.date?.start ?? "";

  return (
    <Link href={`/blog/${slug}`} className="block group">
      <div className="flex justify-between items-baseline">
        <span className="group-hover:underline">{title}</span>
        <span className="text-sm text-muted-foreground">{date}</span>
      </div>
    </Link>
  );
}
```

**Step 3: Commit**

```bash
git add src/
git commit -m "[AI-DEV] feat: 建立首頁和 PostCard 元件"
```

---

### Task 7：建立文章列表頁 `/blog`

**Files:**
- Create: `src/app/blog/page.tsx`

**Step 1: 建立 `src/app/blog/page.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：文章列表頁，顯示所有已發布文章

import { getPublishedPosts } from "@/lib/notion";
import { PostCard } from "@/components/PostCard";

export const revalidate = 3600; // ISR：每小時重新生成

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-8">文章</h1>
      <div className="space-y-4">
        {posts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/blog/
git commit -m "[AI-DEV] feat: 建立文章列表頁"
```

---

### Task 8：建立文章頁 `/blog/[slug]`

**Files:**
- Create: `src/app/blog/[slug]/page.tsx`
- Install: `npm install react-markdown`

**Step 1: 安裝 markdown 渲染套件**

```bash
npm install react-markdown
```

**Step 2: 建立 `src/app/blog/[slug]/page.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：單篇文章頁，從 Notion 抓取內容並渲染 Markdown

import { getPostBySlug, getPublishedPosts } from "@/lib/notion";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post: any) => ({
    slug: post.properties.Slug?.rich_text?.[0]?.plain_text ?? "",
  }));
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const result = await getPostBySlug(params.slug);
  if (!result) notFound();

  const { page, markdown } = result;
  const title = (page as any).properties.Title?.title?.[0]?.plain_text ?? "無標題";
  const date = (page as any).properties.Date?.date?.start ?? "";

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{date}</p>
      </header>
      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </article>
  );
}
```

**Step 3: 安裝 Tailwind Typography（prose 樣式需要）**

```bash
npm install -D @tailwindcss/typography
```

在 `tailwind.config.ts` 的 plugins 加入：

```typescript
plugins: [require("@tailwindcss/typography")]
```

**Step 4: Commit**

```bash
git add src/app/blog/[slug]/ package.json package-lock.json tailwind.config.ts
git commit -m "[AI-DEV] feat: 建立文章頁，支援 Markdown 渲染"
```

---

### Task 9：建立 `/about` 頁

**Files:**
- Create: `src/app/about/page.tsx`

**Step 1: 建立 `src/app/about/page.tsx`**

> 注意：/about 是靜態內容，由 Amber 撰寫後直接寫入程式碼，不需要 Notion。

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：關於我頁面，靜態內容，Amber 撰寫後填入

export default function AboutPage() {
  return (
    <article className="prose prose-neutral max-w-none">
      <h1>關於我</h1>
      {/* Amber 在這裡填入 /about 內容，依照 PRD 敘事骨架 */}
      <p>（內容待補）</p>
    </article>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/about/
git commit -m "[AI-DEV] feat: 建立 /about 頁面骨架"
```

---

### Task 10：部署到 Vercel + 設定環境變數

**Step 1: 連結 Vercel**

```bash
npx vercel --prod
```

或在 vercel.com 介面連結 GitHub repo。

**Step 2: 在 Vercel 設定環境變數**

前往 Vercel 專案設定 → Environment Variables：
- `NOTION_TOKEN`：填入 Integration Token
- `NOTION_DATABASE_ID`：填入 Database ID

**Step 3: 觸發重新部署確認正常**

推送任何 commit 到 main branch，確認 Vercel build 成功。

---

### Task 11：設定自訂網域

**Step 1: 在 Vercel 新增網域**

Vercel 專案設定 → Domains → 輸入網域名稱

**Step 2: 在 Cloudflare 設定 DNS**

新增 CNAME record：
- Name: `@` 或 `www`
- Target: `cname.vercel-dns.com`
- Proxy: 關閉（灰色雲朵）

**Step 3: 等待 DNS 生效（約 5-10 分鐘）**

---

## 執行順序建議

```
Task 1（Next.js 初始化）
    ↓
Task 2（shadcn/ui）
    ↓
Task 3（Notion 套件）+ Task 4（Notion 設定，並行）
    ↓
Task 5（全域 Layout）
    ↓
Task 6（首頁）+ Task 7（/blog）+ Task 9（/about）（可並行）
    ↓
Task 8（/blog/[slug]）
    ↓
Task 10（Vercel 部署）
    ↓
Task 11（自訂網域）
```
