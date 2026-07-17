# 模組與必要 Gate 狀態

這份文件記錄 builder-pm 接入目前專案後的模組狀態；它不會自動執行外部 CLI，也不代表外部 plugin 已安裝。

## builder-pm 核心

狀態：**已啟用**

- 角色契約：`.claude/agents/`
- Codex adapters：`.agents/skills/`
- 脈絡與 brownfield：`.context/`、`onboarding/backfill/`
- 迴圈：`loops/`
- 關卡：`gates/`

## OpenSpec

狀態：**已啟用**

本專案原本已存在 `openspec/` 與相關 skill；後續涉及中型以上功能時，沿用既有 OpenSpec workflow，不另建第二套規格系統。

## Codex PR review

狀態：**未啟用**

`codex-pr-review` 是獨立外部 plugin，不在本次治理包接入中自動安裝。未來若要把它設成正式 PR gate，需另行確認 plugin、授權與 GitHub workflow。

## Brownfield backfill

狀態：**待 PM 審核**

目前只安裝掃描器與草稿流程；尚未把掃描結果自動升格到正式 `.context/`。需要時依 `.claude/commands/backfill-context.md` 執行，並逐份審核後再搬入正式文件。
