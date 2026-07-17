# 工作流程

這是 builder-pm 在本專案的共用工作流程入口；詳細的標準流程、快速流程與文件同步 gate 仍以 `docs/development-workflow.md` 為主。

## 修改前

1. 先讀 `NOW.md`、`AGENTS.md`、`FOUNDATION.md`、`CLAUDE.md` 與相關 spec。
2. 純探索工作保持唯讀，不需要建立分支。
3. 第一次修改追蹤檔案前，執行：

   ```bash
   node gates/branch-hygiene/check-branch.cjs . --json
   ```

4. 若結果是 `protected-branch`，從最新 `main` 建立 `codex/<短名稱>` 工作分支。
5. 若工作區有使用者未提交變更，保留原樣；不得自行 stash、reset、rebase、checkout 或覆蓋。

## 開發與交付

- 中型以上功能、auth、資料模型、架構或後台流程，先有 owning spec，再依 `OpenSpec + TDD` 推進。
- 小型文案、樣式與局部 bugfix 可走快速流程，但仍要做基本驗證與輕量 review。
- Generator 與 Evaluator 必須是不同角色；Evaluator 先列 findings，再給總結。
- 完成前執行 `npm run review:doc-sync`，並處理 `NOW.md` 或主文件同步提醒。
- 未完成驗證與 review 前，不進行 commit 或 push。
