# Phase 1 Personal Site Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 建立個人品牌網站 Phase 1，包含首頁、/about、/blog、/blog/[slug]，並上線第一篇文章。

**Architecture:** Next.js 15 App Router + Tailwind CSS + shadcn/ui，文章以 Markdown 檔案存在 `content/posts/`，用 gray-matter 讀取，SSG 靜態生成，部署在 Vercel。

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, gray-matter, react-markdown, @tailwindcss/typography

---

### Task 1：初始化 Next.js 專案

**Files:**
- Create: `（整個專案根目錄）`
- Create: `.nvmrc`

**Step 1: 執行初始化指令**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Step 2: 建立 .nvmrc 固定 Node.js 版本**

```bash
echo "20" > .nvmrc
```

**Step 3: 確認專案結構**

```bash
ls src/app/
```

預期看到：`globals.css  layout.tsx  page.tsx`

**Step 4: 啟動開發伺服器確認正常**

```bash
npm run dev
```

預期：瀏覽器開啟 http://localhost:3000 看到 Next.js 預設頁面

**Step 5: Commit**

```bash
git add -A
git commit -m "[AI-DEV] chore: 初始化 Next.js 15 專案"
```

---

### Task 2：安裝 shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/components/ui/`

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

### Task 3：安裝套件並建立 content 目錄結構

**Files:**
- Install: `gray-matter`, `react-markdown`, `@tailwindcss/typography`
- Create: `content/posts/.gitkeep`
- Create: `public/images/posts/.gitkeep`

**Step 1: 安裝套件**

```bash
npm install gray-matter react-markdown
npm install -D @tailwindcss/typography
```

**Step 2: 在 tailwind.config.ts 加入 typography plugin**

找到 `tailwind.config.ts`，在 plugins 陣列加入：

```typescript
plugins: [require("@tailwindcss/typography")]
```

**Step 3: 建立 content 目錄結構**

```bash
mkdir -p content/posts
mkdir -p public/images/posts
touch content/posts/.gitkeep
touch public/images/posts/.gitkeep
```

**Step 4: Commit**

```bash
git add -A
git commit -m "[AI-DEV] chore: 安裝 gray-matter、react-markdown，建立 content 目錄"
```

---

### Task 4：建立文章工具函式

**Files:**
- Create: `src/lib/posts.ts`
- Create: `content/posts/test-post.md`（測試用，完成後刪除）

**Step 1: 建立 `src/lib/posts.ts`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：讀取 content/posts/ 目錄的 Markdown 文章，提供列表和單篇文章的查詢函式

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  title: string;
  date: string;
  slug: string;
  tags?: string[];
  featured?: boolean;
};

export type Post = PostMeta & {
  content: string;
};

export function getPublishedPosts(): PostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((name) => name.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);
      return { ...data, slug } as PostMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getFeaturedPosts(): PostMeta[] {
  return getPublishedPosts().filter((post) => post.featured);
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);
    return { ...data, slug, content } as Post;
  } catch {
    return null;
  }
}
```

**Step 2: 建立測試文章 `content/posts/test-post.md`**

```markdown
---
title: "測試文章"
date: "2026-02-20"
slug: "test-post"
featured: true
---

這是一篇測試文章，確認文章讀取功能正常。
```

**Step 3: Commit**

```bash
git add src/lib/posts.ts content/posts/test-post.md
git commit -m "[AI-DEV] feat: 建立文章讀取工具函式"
```

---

### Task 5：建立全域 Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`

**Step 1: 建立 `src/components/Header.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：全站導覽列，包含名字和導覽連結

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

**Step 2: 建立 `src/components/Footer.tsx`**

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

### Task 6：建立 PostCard 元件

**Files:**
- Create: `src/components/PostCard.tsx`

**Step 1: 建立 `src/components/PostCard.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：文章卡片，顯示文章標題和日期，點擊進入文章頁

import Link from "next/link";
import { PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <div className="flex justify-between items-baseline">
        <span className="group-hover:underline">{post.title}</span>
        <span className="text-sm text-muted-foreground">{post.date}</span>
      </div>
    </Link>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/PostCard.tsx
git commit -m "[AI-DEV] feat: 建立 PostCard 元件"
```

---

### Task 7：建立首頁 `/`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: 建立首頁 `src/app/page.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：首頁，顯示個人定位、精選文章、聯絡 CTA

import Link from "next/link";
import { getFeaturedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export default function HomePage() {
  const posts = getFeaturedPosts();

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
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
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

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "[AI-DEV] feat: 建立首頁"
```

---

### Task 8：建立文章列表頁 `/blog`

**Files:**
- Create: `src/app/blog/page.tsx`

**Step 1: 建立 `src/app/blog/page.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：文章列表頁，顯示所有文章

import { getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export default function BlogPage() {
  const posts = getPublishedPosts();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-8">文章</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
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

### Task 9：建立文章頁 `/blog/[slug]`

**Files:**
- Create: `src/app/blog/[slug]/page.tsx`

**Step 1: 建立 `src/app/blog/[slug]/page.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：單篇文章頁，讀取 Markdown 並渲染內容

import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  const posts = getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">{post.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">{post.date}</p>
      </header>
      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
```

**Step 2: 刪除測試文章（確認功能正常後）**

```bash
rm content/posts/test-post.md
```

**Step 3: Commit**

```bash
git add src/app/blog/[slug]/
git commit -m "[AI-DEV] feat: 建立文章頁，支援 Markdown 渲染"
```

---

### Task 10：建立 `/about` 頁

**Files:**
- Create: `src/app/about/page.tsx`

**Step 1: 建立 `src/app/about/page.tsx`**

```typescript
// [AI-ASSISTED] Generated with Codex
// 功能：關於我頁面，靜態內容

export default function AboutPage() {
  return (
    <article className="prose prose-neutral max-w-none">
      <h1>關於我</h1>
      {/* TODO: Amber 依照 PRD 敘事骨架填入內容：
          1. 我是誰
          2. 為什麼開始用 AI
          3. 學習平台的經歷
          4. 現在的 PM 工作
          5. 我相信什麼
          6. 聯絡 CTA
      */}
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

### Task 11：部署到 Vercel

**Step 1: 連結 Vercel**

在 vercel.com 介面連結 GitHub repo（推薦用介面操作，不用 CLI）：
1. 登入 vercel.com
2. 點「Add New Project」
3. 選 GitHub repo：`Amber-Chang/personal-site`
4. Framework Preset 選 Next.js
5. 點 Deploy

**Step 2: 確認部署成功**

Vercel 會給一個 `.vercel.app` 的預覽網址，確認網站正常顯示。

---

### Task 12：設定 Obsidian 寫作環境

> ⚠️ 這個 Task 是環境設定，不是寫程式碼。

**Step 1: 安裝 Obsidian**

前往 https://obsidian.md 下載安裝。

**Step 2: 開啟 repo 作為 Obsidian Vault**

Obsidian → Open folder as vault → 選擇專案根目錄（`personal-site/`）

**Step 3: 安裝 Obsidian Git plugin**

Settings → Community plugins → Browse → 搜尋「Obsidian Git」→ Install → Enable

**Step 4: 設定 Obsidian Git**

Settings → Obsidian Git：
- Auto pull interval: `10`（分鐘）
- Auto commit-and-sync interval: `5`（分鐘）
- Commit message: `docs: 新增/更新文章 {{date}}`

**Step 5: 測試：寫第一篇文章**

在 Obsidian 的 `content/posts/` 目錄建立新檔案，格式如下：

```markdown
---
title: "用 AI 爬透三套耦合的會員系統"
date: "2026-02-20"
slug: "ai-membership-system"
tags: ["AI", "PM", "需求管理"]
featured: true
---

我接手需求的時候，面對的是三套相互耦合的舊系統，沒有人能告訴我它們之間的關係。

（文章內容繼續...）
```

等待 Obsidian Git 自動 commit + push，確認 Vercel 自動部署更新。

---

### Task 13：設定自訂網域

**Step 1: 在 Vercel 新增網域**

Vercel 專案設定 → Domains → 輸入你的網域名稱

**Step 2: 在 Cloudflare 設定 DNS**

新增 CNAME record：
- Name: `@` 或 `www`
- Target: `cname.vercel-dns.com`
- Proxy status: 關閉（灰色雲朵，不要開橘色）

**Step 3: 等待 DNS 生效（約 5-10 分鐘）**

---

## 執行順序

```
Task 1（Next.js 初始化）
    ↓
Task 2（shadcn/ui）
    ↓
Task 3（套件 + content 目錄）
    ↓
Task 4（文章工具函式）
    ↓
Task 5（全域 Layout）
    ↓
Task 6（PostCard 元件）
    ↓
Task 7（首頁）→ Task 8（/blog）→ Task 10（/about）  ← 可並行
    ↓
Task 9（/blog/[slug]）
    ↓
Task 11（Vercel 部署）
    ↓
Task 12（Obsidian 設定）
    ↓
Task 13（自訂網域）
```
