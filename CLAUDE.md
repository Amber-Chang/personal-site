# personal-site · AI 開發治理核心

> 本檔是 builder-pm 在本專案的共用 runtime 合約。專案實際方向、技術邊界與文件責任仍以 `AGENTS.md`、`FOUNDATION.md`、`NOW.md` 為準；若有衝突，以專案現況與當前對話決策為準。

## 專案基線

- 專案：`personal-site`
- 一句話目標：讓潛在雇主快速理解 Amber 如何用 AI-native workflow 做產品、累積案例與公開思考。
- 技術棧：Next.js App Router、TypeScript、Tailwind CSS、shadcn/ui、Supabase。
- PM：Amber

## 核心憲章（builder-pm 輕量版）

### 動手前：想清楚

1. 先讀檔、跑工具或查正式來源；不確定就標出，不用猜測補洞。
2. 簡單優先，只做目前問題需要的最小解。
3. 修改前先說明範圍、風險與選項；高風險取捨交由 PM 決定。

### 動手時：有紀律

4. 探索模式唯讀；開發模式依 owning spec 與工作流程執行。
5. 外科手術式改動：不順手重構、不刪無關內容、不平行建立第二套基礎層。

### 交付時：可信、乾淨

6. 完成必須有可重現的驗證指令與結果，不用「應該可以」代替證據。
7. 發現風險、文件落差或不確定的產品取捨，要明確回報。
8. 本機 AI 產物、秘密與暫存資料不得進產品 commit。
9. commit / PR 保持精簡，必要時標示 `[AI-ASSISTED]` 或 `[NEED-REVIEW]`。

### 之後：會學習

10. 重複踩到的問題寫入 `.governance/lessons/`；同一類問題累積兩次後，評估是否升級成規則、關卡或 skill。

## 角色流水線

人 ⇄ Coordinator → Planner → Generator → Evaluator

- Coordinator：分流、協調與升級，不寫 production code。
- Planner：收斂 PRD / SPEC，不寫 production code。
- Generator：依 spec 實作，主要邏輯採 TDD。
- Evaluator：獨立驗收，寫的人不得兼任驗收者。

角色契約位於 `.claude/agents/`；Codex adapter 位於 `.agents/skills/`。

## 導覽

| 要找 | 位置 |
|---|---|
| 專案治理與協作規則 | `AGENTS.md` |
| 專案核心方向 | `FOUNDATION.md` |
| 當前狀態 | `NOW.md` |
| skill 路由 | `SKILLS.md` |
| 工作分支與收尾規則 | `WORKFLOW.md`、`docs/development-workflow.md` |
| 專案脈絡 | `.context/` |
| 自我維持迴圈 | `loops/` |
| 自動關卡 | `gates/` |
| Brownfield 接入 | `ONBOARDING.md`、`.claude/commands/backfill-context.md` |
