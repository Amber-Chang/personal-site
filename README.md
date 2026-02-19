# Amber's Personal Site

個人作品集與部落格，用來展示 AI 協作方法論、觀點文章和讀書筆記。

## 技術棧

- **框架**：Next.js（App Router）
- **樣式**：Tailwind CSS + shadcn/ui
- **內容**：Notion API
- **部署**：Vercel
- **網域**：Cloudflare

## 開發方式

本專案採用 Claude Code + Codex 混合開發：
- Claude Code 負責架構設計和技術決策
- Codex 負責實際程式碼實作

所有 AI 協作的程式碼會標記 `[AI-ASSISTED]`。

## 本地開發

```bash
npm install
npm run dev
```

## 環境變數

```
NOTION_API_KEY=
NOTION_DATABASE_ID=
```

## 專案結構

```
.claude/          Claude Code 設定和 agent 團隊
.context/         專案背景文件和 spec
src/app/          Next.js App Router 頁面
src/components/   React 元件
```
