# Skill Registry

> 用途：列出本專案目前已知的 skills、角色、適用情境與使用邊界。
> 原則：這是一份治理索引，不是 skill 全文說明。

## 1. 使用原則

本專案採以下 skill 使用規則：

1. 只有在使用者明確指定 skill，或任務明顯符合 skill 描述時才啟用
2. 一次只用最小必要 skill 組合，避免重複或衝突
3. skill 提供 workflow 與 guardrails，不取代產品判斷
4. 專案 skill 優先於全域 skill 的語境，但不得違反 `AGENTS.md`

## 2. 目錄分工

### 2.1 `.codex/skills/`

定位：專案流程型 skills

適用：

- 規格探索
- OpenSpec 變更流程
- 驗證、續作、歸檔

### 2.2 `.agents/skills/`

定位：通用能力型 skills

適用：

- UI/UX 設計
- React / Next.js 實作與審閱

### 2.3 全域 skill roots

來源：

- `~/.codex/skills`
- `~/.agents/skills`

定位：跨專案通用能力

備註：是否可用仍取決於當前 session 是否暴露給 agent。

## 3. 已知技能清單

### 3.1 `brainstorming`

來源：平台可用 skill / 全域 skill roots

用途：

- 做創意收斂
- 釐清需求方向
- 在開始設計或功能規劃前先探索

何時用：

- 首頁資訊架構討論
- UI 方向不明
- 要先收斂選項再實作

何時不要用：

- 需求已經非常明確，只差落地
- 純粹修 bug 或小幅 code edit

### 3.2 `writing-plans`

來源：平台可用 skill / 全域 skill roots

用途：

- 把需求整理成可執行的技術計畫

何時用：

- 有 spec，要拆成任務時
- 要正式啟動一段多步驟工作時

何時不要用：

- 小型修正
- 已有計畫，只是照著做

### 3.3 `executing-plans`

來源：平台可用 skill / 全域 skill roots

用途：

- 照既有計畫執行工作

何時用：

- `docs/plans/` 已存在且內容可信
- 任務邊界已清楚

何時不要用：

- 舊 plan 已經與現況嚴重脫節

### 3.4 `verification-before-completion`

來源：平台可用 skill / 全域 skill roots

用途：

- 在宣稱完成前提醒做驗證

何時用：

- 大型改動後
- 準備 commit / PR 前

### 3.5 `openspec-*`

來源：`.codex/skills/`

包含：

- `openspec-explore`
- `openspec-new-change`
- `openspec-continue-change`
- `openspec-apply-change`
- `openspec-verify-change`
- `openspec-archive-change`
- `openspec-bulk-archive-change`
- `openspec-ff-change`
- `openspec-onboard`
- `openspec-sync-specs`

用途：

- 採用 OpenSpec 工作流時，處理 change artifact 的探索、建立、續作、驗證與歸檔

何時用：

- 專案真的要進 OpenSpec change 流程
- 需求、spec、implementation 之間需要明確 artifact

何時不要用：

- 只是一般的 UI 修正或單頁開發
- 團隊目前沒有打算維持完整 OpenSpec 流程

治理備註：

- 這組 skills 很強，但流程感也最重
- 若專案沒有穩定採用 OpenSpec，應避免過度使用

### 3.6 `ui-ux-pro-max`

來源：`.agents/skills/ui-ux-pro-max/SKILL.md`

用途：

- UI / UX 設計方向建議
- 色彩、版型、字體、互動原則
- landing page、portfolio、blog 等介面設計支援

何時用：

- 介面不好看但需求已大致清楚
- 要做設計系統初稿
- 要檢查目前頁面是否缺乏視覺層次

何時不要用：

- 只有內容結構問題，還沒收斂訊息
- 只是在修單一功能 bug

治理備註：

- 這個 skill 比較像設計 intelligence / ruleset
- 真正效果仰賴明確的品牌方向與參考風格

### 3.7 `vercel-react-best-practices`

來源：`.agents/skills/vercel-react-best-practices/SKILL.md`

用途：

- React / Next.js 實作最佳實踐
- 效能、render 模式、資料抓取與 component 邊界建議

何時用：

- 要審視 React/Next.js 實作品質
- 元件多了之後想做品質檢查
- 有 server/client 邊界或效能疑慮

何時不要用：

- 純內容寫作
- 極小型靜態頁修改

## 4. 角色與技能的對應

依目前 `AGENTS.md` 的角色設計，可先用下列對應關係：

| 角色 | 建議 skill |
|------|-------------|
| `pm` | `brainstorming`, `writing-plans`, `openspec-explore`, `openspec-new-change` |
| `tpm` | `writing-plans`, `executing-plans`, `openspec-continue-change`, `openspec-apply-change` |
| `architect` | `vercel-react-best-practices`, `verification-before-completion`, `openspec-verify-change` |
| `frontend` | `ui-ux-pro-max`, `vercel-react-best-practices`, `verification-before-completion`, `openspec-apply-change` |

## 5. 目前觀察到的治理風險

1. `OpenSpec` 類 skills 偏重流程，若日常工作大量使用，容易讓輕量任務過度複雜
2. `ui-ux-pro-max` 很適合補視覺品質，但不能取代品牌方向定義
3. 專案尚未明確定義「何時允許 subagent」，建議之後補進母法或治理文件
4. 全域 skill 與專案 skill 的邊界目前靠人工理解，未來最好再補一份簡短準則

## 6. 建議後續動作

1. 保留本文件作為 skill 索引，不把詳細流程搬進來
2. 下一步在 `AGENTS.md` 加一段簡化版 skill policy，並連到本文件
3. 若未來新增 skill，先決定它是「專案流程型」還是「通用能力型」
4. 如果某個 skill 長期不用，就考慮從專案層移除，減少治理噪音
