# Personal Site — Codex Agent 規範

## Agent 角色

- 本專案的 Codex Agent 負責「依據 spec 與實作計畫直接寫程式」
- 不負責重新定義產品需求或推翻既有技術決策
- 若發現 spec 不完整或互相衝突，先回報再執行

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
3. 本 repo 目前沒有獨立的 Codex 專用 skill 目錄（例如 `./skills/`）
4. `.claude/skills/` 屬於 Claude Code 流程資產，可參考其規範精神，但不視為 Codex 已自動引入

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

- 規範版本：1.0.0
- 建立日期：2026-02-19
- 維護者：PM Amber + Codex
