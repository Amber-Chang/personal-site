# AI Governance Map

> 用途：整理本專案目前的 AI 治理結構，說明全域層、專案層、任務層的邊界與優先順序。
> 狀態：治理文件草案，先建立秩序，再逐步清理舊規則。

## 1. 這份文件解決什麼問題

目前專案的 AI 治理資訊分散在 `AGENTS.md`、`.context/`、`docs/plans/`、`.codex/skills/`、`.agents/skills/`，而且有些文件仍反映較早期的開發階段。

這會造成三種混亂：

1. 不知道哪一份才是母法
2. 不知道技能、計畫、規格各自負責什麼
3. 不知道當前實作現況是否已經偏離舊計畫

本文件的目標不是立刻重寫所有舊文件，而是先建立一張治理地圖，讓後續清理有共識。

## 2. 治理層級

本專案目前可分成四層治理：

```text
[平台 / Session 層]
  系統注入規則、可用 tools、可用 skills、subagent 規則

[使用者全域層]
  ~/.codex/skills
  ~/.agents/skills
  跨專案共用能力與偏好

[專案層]
  AGENTS.md
  .context/
  docs/plans/
  .codex/skills/
  .agents/skills/

[任務層]
  某次被觸發的 SKILL.md
  當次對話中的臨時任務要求
```

## 3. 優先順序

當不同層的規則互相衝突時，依下列優先順序判斷：

1. 平台 / Session 層
2. 專案母法 `AGENTS.md`
3. 專案內規格與背景文件（`.context/`）
4. 任務計畫（`docs/plans/`）
5. 被觸發的 `SKILL.md`
6. 使用者全域 skills

補充原則：

- 全域 skill 不能推翻專案規範
- `docs/plans/` 是任務執行文件，不是長期治理母法
- `SKILL.md` 只能提供 workflow，不能凌駕專案技術邊界

## 4. 本專案目前各類文件職責

### 4.1 `AGENTS.md`

角色：專案母法

負責：

- 專案目標
- 角色切換規則
- 啟動必讀文件
- 技術方向
- skill 使用原則
- commit / lint / 回報規範

不建議負責：

- 任務細節
- 長篇 spec 內容
- 某一類 skill 的細部用法

### 4.2 `.context/`

角色：產品與技術事實來源

負責：

- 系統定位
- PRD / spec
- 技術決策脈絡

不建議負責：

- 任務排程
- agent 操作流程
- skills 清單治理

### 4.3 `docs/plans/`

角色：任務計畫

負責：

- 某個階段要做什麼
- 任務拆解
- 執行順序
- 驗收方式

不建議負責：

- 長期治理規範
- skill 分工說明

### 4.4 `.codex/skills/`

角色：專案流程型技能

目前內容偏向：

- OpenSpec / change workflow
- 探索、續作、驗證、歸檔等流程型技能

適合放：

- 明顯和專案流程綁定的 skill
- 與本 repo 工作方法強耦合的 skill

### 4.5 `.agents/skills/`

角色：通用能力型技能

目前內容偏向：

- UI/UX 設計
- React / Next.js best practices

適合放：

- 跨專案可重用能力
- 但又想在本專案內顯式納管的 skill

### 4.6 使用者全域 skills

路徑來源：

- `~/.codex/skills`
- `~/.agents/skills`

適合放：

- 跨專案通用 skill
- 不帶專案假設的工作流或能力集

不適合放：

- 只屬於 `personal-site` 的規則

## 5. Skill 與 Subagent 的治理原則

### 5.1 Skill 載入原則

Skill 不是手動 import，而是依規則被觸發後才讀取 `SKILL.md`。

本專案建議採用以下原則：

1. 使用者明確點名 skill 時可用
2. 任務明顯符合某個 skill 的描述時可用
3. 同時符合多個 skill 時，只取最小必要集合
4. skill 用來提供流程，不用來推翻需求與技術決策

### 5.2 Subagent 使用原則

本專案目前沒有獨立的 subagent 本地治理文件，因此應沿用平台規則並額外補一條專案建議：

- 只有在使用者明確要求平行代理、分工代理、或需要明確 delegation 時才使用

不建議因為任務大就預設開 subagent。

## 6. 現況不一致清單

這些不是錯誤，而是目前治理需要補清的地方。

### 6.1 Branch 規劃與現況不一致

`ai-status-index.md` 仍記錄：

- Claude 在 `main`
- Codex 在 `codex/phase1`

但目前實際開發已經直接在 `main` 進行，且已加入：

- `projects` 內容模型
- `/projects` 與 `/projects/[slug]`
- 首頁資訊架構重做

因此 branch 分工與實作現況已經脫鉤，需要後續重新定義。

### 6.2 Phase 1 計畫與網站現況不一致

`docs/plans/2026-02-20-phase1-personal-site.md` 仍以最初的個人品牌網站 Phase 1 為主，但目前網站已經超出原始範圍。

這代表：

- 舊計畫仍可作為歷史紀錄
- 但不適合繼續當成唯一的現行執行依據

### 6.3 技術方向正在轉向

`.context/SYSTEM.md` 和 `.context/specs/TPM-phase1.md` 仍以：

- 首頁 + about + blog 為主
- Markdown 發文為主體

但目前你已經在思考：

- `projects` 作為第二主軸
- 後續可能加寫作後台
- Supabase 作為內容儲存候選

這些都意味著系統文件需要進入下一輪整理。

## 7. 建議的治理重整目標

下一階段建議把治理收斂成下面結構：

```text
AGENTS.md
  專案母法

docs/ai-governance.md
  治理地圖、優先順序、分層邏輯

docs/skill-registry.md
  技能清單、用途、何時用、何時不要用

.context/
  系統背景、規格、架構事實

docs/plans/
  任務計畫

.codex/skills/
  專案流程型 skills

.agents/skills/
  通用能力型 skills
```

## 8. 目前推薦的清理順序

1. 先維持 `AGENTS.md` 作為母法，不急著拆
2. 用本文件與 `docs/skill-registry.md` 先把地圖畫清楚
3. 重新定義 branch / workflow 現況
4. 再決定是否要精簡 `AGENTS.md`
5. 最後再清理過時的 `docs/plans/` 或補新一版 plan

## 9. 治理原則總結

本專案之後的治理收斂應遵守三條原則：

1. 母法單一：`AGENTS.md` 是入口，不與 task plan 競爭
2. 邊界清楚：規格、治理、技能、任務各有位置
3. 現況可追溯：文件要能反映目前實作，而不是只保存舊理想狀態
