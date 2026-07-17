# builder-pm Brownfield 接入指南

本專案不是空白專案；builder-pm 已以「保留既有治理、加入角色與自我維持機制」方式接入。

## 已完成

- `CLAUDE.md`：共用 AI runtime 核心合約。
- `.claude/agents/` 與 `.agents/skills/`：Coordinator / Planner / Generator / Evaluator 角色路由。
- `loops/`：防膨脹、脈絡成長、文件契約、學習捕捉與 skill registry。
- `gates/`：工作分支與 drift fact checks。
- `onboarding/backfill/`：既有 codebase 的證據掃描器。

## 下一步：回填既有脈絡

需要補齊 `.context/` 的專案特定內容時：

```bash
node onboarding/backfill/scan-evidence.cjs .
```

掃描器只會寫入 `.context/.backfill/`，不會自動修改正式 `.context/`，也不會自動 commit。接著依 `.claude/commands/backfill-context.md` 審核草稿，再手動搬入正式文件。

## 每次開工

1. 讀 `NOW.md`、`AGENTS.md`、`FOUNDATION.md`、`CLAUDE.md` 與相關 spec。
2. 若要修改追蹤檔案，先執行 `node gates/branch-hygiene/check-branch.cjs . --json`。
3. 依 `SKILLS.md` 選最小必要 skill。
4. 完成後提供驗證證據，並執行 `npm run review:doc-sync`。

## 重要邊界

- 不把 `.context/.backfill/` 草稿當成正式事實。
- 不把本機 AI 產物、秘密或暫存資料加入 Git。
- 不因為治理包已安裝，就把每個迴圈或重型流程套到每一個小任務。
