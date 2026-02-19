# 個人網站系統文件

## 專案定位

這不只是一個個人作品集網站，而是一個**展示思維方式的個人品牌平台**。

**目標受眾**：潛在雇主

**核心訊息**：「這個 PM 會自己思考，不只是執行。」

**內容方向**：
- AI 使用與實驗紀錄
- 對當前環境的觀點文章
- 讀書筆記

## 技術選型

| 項目 | 選擇 | 原因 |
|------|------|------|
| 框架 | Next.js（App Router）| AI 支援度最高，Vercel 同家公司 |
| 樣式 | Tailwind CSS + shadcn/ui | 不需從零設計，質感夠好 |
| 內容管理 | Obsidian + git sync | 圖片不過期，離線寫作，Obsidian Git 自動 push |
| 部署 | Vercel | AI 協同維護支援度最高 |
| 網域 | Cloudflare | 透明定價，內建 CDN |
| 數據追蹤 | GA4 | 免費，先用再說 |
| 聯絡方式 | Email（網域信箱）| 搭配 Cloudflare Email Routing |

## 開發分工

| 工具 | 負責 |
|------|------|
| Claude Code | 架構設計、技術決策、產出 spec |
| Codex | 照著 spec 實作程式碼 |

## 網站結構（規劃中）

```
/                    首頁（個人簡介 + 精選文章）
/blog                文章列表
/blog/[slug]         文章頁面
/about               關於我（詳細版）
```

## 文章管理結構

文章存放在 `content/posts/`，用 Obsidian 寫作，Obsidian Git plugin 自動 push 到 GitHub，Vercel 偵測更新自動部署。

每篇文章的 frontmatter（檔案頂部的設定資料）：
```yaml
---
title: "文章標題"
date: "2026-02-20"
slug: "article-slug"
tags: ["AI", "PM"]
featured: true
---
```

圖片放在 `public/images/posts/`，Markdown 內用 `![說明](/images/posts/圖片名稱.png)` 引用。

## 個人簡介方向

不是傳統的條列式經歷，而是定位和觀點：

> 「我是 Amber，一個正在學著用 AI 槓桿出更大效益、朝 builder 之路邁進的 PM。」

## 上線計畫

**Phase 1（兩週內）**：首頁 + 個人簡介 + 第一篇文章上線，有網域可以分享。

**Phase 2（持續）**：記錄架站決策，整理成系列文章。

## AI 協作標記規範

- 所有 AI 協作的程式碼在檔案頂部加上：`// [AI-ASSISTED] Generated with Codex`
- Commit message 格式：`[AI-DEV] feat: 說明做了什麼`
