# Amber's Personal Site

個人品牌網站，展示思維方式和 AI 協作實驗紀錄，目標受眾為潛在雇主。

> 「我是 Amber，一個正在學著用 AI 槓桿出更大效益、朝 builder 之路邁進的 PM。」

## 技術棧

- **框架**：Next.js 16（App Router）
- **樣式**：Tailwind CSS + shadcn/ui
- **內容**：Markdown 檔案（`content/posts/`）+ Obsidian 寫作
- **部署**：Vercel
- **網域**：Cloudflare

## 網站結構

```
/               首頁（定位 + 精選文章 + 聯絡方式）
/about          關於我（第一人稱敘事，不是條列式經歷）
/blog           文章列表
/blog/[slug]    文章頁
```

## 寫文章

文章存在 `content/posts/` 目錄，用 Obsidian 寫作，Obsidian Git plugin 自動 push 到 GitHub，Vercel 偵測到更新自動部署。

每篇文章的格式：

```markdown
---
title: "文章標題"
date: "2026-02-20"
slug: "article-slug"
tags: ["AI", "PM"]
featured: true
---

文章內容...
```

圖片放在 `public/images/posts/` 目錄，在 Markdown 裡用 `![說明](/images/posts/圖片名稱.png)` 引用。

## 本地開發

```bash
npm install
npm run dev
```

開啟 http://localhost:3000 查看。

## 專案結構

```
# 網站程式碼
src/app/          Next.js App Router 頁面
src/components/   React 元件
src/lib/          工具函式（posts.ts 等）
content/posts/    Markdown 文章
public/images/    靜態圖片

# AI 協作文件
.claude/          Claude Code 設定、session 記錄
.codex/           Codex prompts 和 skills
.agents/          Agent skills
.context/         專案需求文件（PRD）和技術規格（specs）
docs/plans/       實作計畫（Codex 執行用）
AGENTS.md         Codex agent 規範
ai-status-index.md  Claude / Codex 協作狀態索引
```

## 開發方式

本專案採用 Claude Code + Codex 混合開發：
- **Claude Code**：架構設計、技術決策、產出 spec 和實作計畫（在 `main` branch）
- **Codex**：照著 `docs/plans/` 的計畫實作程式碼（在 `codex/phase1` branch）

Codex 完成所有 Task 後，開 PR 將 `codex/phase1` merge 回 `main`。

所有 AI 協作的程式碼標記 `[AI-ASSISTED]`，commit message 加上 `[AI-DEV]` 前綴。
