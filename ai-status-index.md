# AI Status Index

> **用途**：Claude 和 Codex 的共用狀態索引。
> **寫入規則**：每個工具只更新自己的區塊，禁止修改其他工具的區塊。
> **讀取時機**：每個工具啟動時讀取，了解對方的狀態，避免撞車。

## Branch 分工

| 工具 | Branch | 說明 |
|------|--------|------|
| **Claude** | `main` | 規格、文件、架構決策 |
| **Codex** | `codex/phase1` | 程式碼實作 |

> Codex 完成所有 Task 後，開 PR 將 `codex/phase1` merge 回 `main`。

---

## Claude

| 欄位 | 值 |
|------|-----|
| **最後更新** | 2026-02-20 |
| **當前任務摘要** | 規劃完成。PRD 確認、架構決策（Obsidian + git sync）、TPM spec、實作計畫（13 個 Task）全部產出。等待 Codex 執行 Task 1。 |
| **工作目錄** | `.claude/`, `.context/`, `docs/plans/` |
| **狀態詳情** | `.claude/session-summary.md` |

---

## Codex

| 欄位 | 值 |
|------|-----|
| **最後更新** | 2026-02-19 |
| **當前任務摘要** | 已完成 Task 1-10（Next.js 初始化、shadcn/ui、文章讀取工具、首頁/about/blog/[slug]）。已建立首篇文章 `ai-membership-system.md`。下一步是 Task 11-13（Vercel 部署、Obsidian 設定、自訂網域）。 |
| **工作目錄** | `src/`, `content/posts/`, `public/images/posts/`, 根目錄設定檔（`package.json`、`components.json`、`.nvmrc`） |
| **狀態詳情** | `docs/plans/2026-02-20-phase1-personal-site.md` |

---

## Codex 啟動指引

**⚠️ Codex 必須在 `codex/phase1` branch 上工作。**
切換方式：`git checkout codex/phase1`

Codex 每次啟動時，依序讀取：

1. `ai-status-index.md`（本檔案）：了解目前進度
2. `docs/plans/2026-02-20-phase1-personal-site.md`：實作計畫，從上次未完成的 Task 繼續
3. `.context/specs/TPM-phase1.md`：技術規範和給 Codex 的執行備註

完成每個 Task 後，更新本檔案的 Codex 區塊：
- **最後更新**：日期
- **當前任務摘要**：完成了哪些 Task，下一步是什麼
- **工作目錄**：這次動了哪些目錄
