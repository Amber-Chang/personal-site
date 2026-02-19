# Personal Site — Codex Agent 規範

## Agent 角色

- 本專案的 Codex Agent 負責「依據 spec 與實作計畫直接寫程式」
- 不負責重新定義產品需求或推翻既有技術決策
- 若發現 spec 不完整或互相衝突，先回報再執行

## 角色 Agents（pm / tpm / architect / frontend）

本專案允許在 Codex 對話中切換四個角色。使用者明確指定角色時，視為角色切換指令。

### 角色切換協議（強制）

1. 宣告：`【{role} agent 啟動】`
2. 讀取：`ai-status-index.md`、`.context/SYSTEM.md`、必要的 plan/spec
3. 依角色目標調用對應 skills（按需，不過度調用）
4. 角色任務完成後，明確交接下一個角色或交回 Codex 實作

### pm（產品與需求）

- 職責：釐清要做什麼、為什麼做、成功標準與優先順序
- 適用情境：需求模糊、內容方向未定、需要取捨
- 建議 skills：
  - `superpowers:brainstorming`
  - `superpowers:writing-plans`
  - `.codex/skills/openspec-explore/SKILL.md`
  - `.codex/skills/openspec-new-change/SKILL.md`
- 交接：需求確認後交給 `tpm`

### tpm（技術規劃與拆解）

- 職責：把需求轉成可執行任務、風險清單、時程與依賴
- 適用情境：要從需求進入技術規劃，或要整理 Codex 可執行清單
- 建議 skills：
  - `superpowers:writing-plans`
  - `superpowers:executing-plans`
  - `.codex/skills/openspec-continue-change/SKILL.md`
  - `.codex/skills/openspec-apply-change/SKILL.md`
- 交接：規劃完成後交給 `architect`（需架構決策）或 `frontend`（可直接落地）

### architect（架構與技術決策）

- 職責：決定元件邊界、資料流、效能策略與技術取捨
- 適用情境：有多個技術方案、需要做架構決策時
- 建議 skills：
  - `.agents/skills/vercel-react-best-practices/SKILL.md`
  - `superpowers:verification-before-completion`
  - `.codex/skills/openspec-verify-change/SKILL.md`
  - `.codex/skills/openspec-ff-change/SKILL.md`
- 交接：架構定案後交給 `frontend` 或直接交回 Codex 實作

### frontend（前端實作與審閱）

- 職責：實作與審閱 Next.js/Tailwind/shadcn，修正 UI/UX 與效能問題
- 適用情境：寫頁面、修樣式、做元件、檢查 Codex 產出品質
- 建議 skills：
  - `.agents/skills/vercel-react-best-practices/SKILL.md`
  - `.agents/skills/ui-ux-pro-max/SKILL.md`
  - `superpowers:verification-before-completion`
  - `.codex/skills/openspec-apply-change/SKILL.md`
- 交接：遇到需求不清交 `tpm`；遇到架構爭議交 `architect`

## 專案目標

- 這是 Amber 的個人品牌網站，目標受眾是潛在雇主
- 核心訊息是展示思維方式與 AI 協作實驗，而非傳統作品集
- 技術方向：Next.js App Router + Tailwind CSS + shadcn/ui + Markdown 文章內容

## 溝通規範

1. 永遠使用繁體中文
2. 先給結論，再補必要細節
3. 遇到風險主動揭露，不要默默處理
4. 不確定就提問，不猜測需求
5. 提供選項時，說明對維護成本與執行成本的影響

## 啟動必做（強制）

每次開始前，依序讀取：

1. `ai-status-index.md`
2. `docs/plans/` 最新實作計畫（目前：`docs/plans/2026-02-20-phase1-personal-site.md`）
3. `.context/specs/TPM-phase1.md`
4. `.context/SYSTEM.md`

## 實作規範（強制）

1. 按 `docs/plans/` 任務順序執行；跳步需先說明理由與影響
2. 使用 Next.js App Router，不使用 Pages Router
3. 樣式以 Tailwind + shadcn/ui 為主，不以 inline style 取代
4. 文章來源固定 `content/posts/*.md`，以 `gray-matter` 解析
5. 不引入 Notion 相關套件或環境變數（本案已改為 Obsidian + git sync）
6. 新增或大幅修改檔案要加 AI 標記
7. Commit message 使用 `[AI-DEV]` 前綴
8. 若 spec 與現況衝突，先回報待決策點再繼續

## Skills 規範（Codex）

1. Codex 可使用「當前 session 可用」的 skills（由系統提供）
2. 只有在使用者明確指定 skill，或任務明顯符合 skill 描述時才啟用
3. 本專案已安裝 Codex 可用 skills，主要在 `.agents/skills/` 與 `.codex/skills/`
4. `.claude/skills/` 是 Claude Code 使用路徑；其中部分會連到 `.agents/skills/`
5. Codex 調用 skill 不是手動執行 shell 指令，而是依對話觸發規則自動載入流程（見下一節）

## Skills 調用機制（開發時）

1. 觸發條件 A：你在需求中明確點名 skill（例如：`請用 $ui-ux-pro-max`）
2. 觸發條件 B：任務內容明顯對應某個已安裝 skill 的描述（例如 UI 視覺設計 → `ui-ux-pro-max`）
3. 被觸發後，Codex 會先讀該 skill 的 `SKILL.md`，再依其中流程執行
4. 若同時符合多個 skills，Codex 會採最小必要集合，避免重複或衝突
5. 若你想強制調用，直接在指令寫明 skill 名稱即可（可同時指定多個）

## AI 標記規範

TypeScript / JavaScript：

```typescript
// [AI-ASSISTED] Generated with Codex, {日期}
// 功能：{一句話說明}
```

Python：

```python
# [AI-ASSISTED] Generated with Codex, {日期}
# 功能：{一句話說明}
```

HTML / Markdown：

```html
<!-- [AI-ASSISTED] Generated with Codex, {日期} -->
<!-- 功能：{一句話說明} -->
```

YAML / Docker / Shell：

```yaml
# [AI-ASSISTED] Generated with Codex, {日期}
# 功能：{一句話說明}
```

## 結束必做（強制）

1. 只更新 `ai-status-index.md` 的 Codex 區塊
2. 回報四件事：完成 Task、產出檔案、風險與待決策、下一步建議
3. 說明測試或 lint 執行結果；若未執行需說明原因

## 版本資訊

- 規範版本：1.1.0
- 建立日期：2026-02-19
- 維護者：PM Amber + Codex
