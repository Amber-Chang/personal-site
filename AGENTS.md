# Personal Site Agent Guide

> 這是本專案唯一的治理母法。
> 原則：夠用就好，不追求完整流程感。

## 1. 專案目標

- 這是一個以潛在雇主為主要受眾的個人品牌網站
- 核心任務是同時展示：
  - 我做產品與 AI-native workflow 的方式
  - 我的代表案例
  - 我的公開寫作與思考

## 2. 技術邊界

- 前端：Next.js App Router + TypeScript
- 樣式：Tailwind CSS + shadcn/ui
- 目前內容來源：
  - `content/posts/*.md`
  - `content/projects/*.md`
- 若未明確決定，不主動引入大型 CMS 或重型治理流程

## 3. 工作原則

- 永遠用繁體中文溝通
- 先給結論，再補必要細節
- 優先做能直接推進網站品質的事
- 規則不能比問題本身更重
- 若舊文件與現況衝突，以現況與當前對話決策為準

## 4. 讀檔順序

每次開始工作時，優先看：

1. `NOW.md`
2. `AGENTS.md`
3. 與當前任務直接相關的檔案

以下文件視需要再讀，且目前視為 legacy 參考，不當作預設母法：

- `.context/`
- `docs/plans/`
- `docs/archive/`

## 5. Skills 原則

- 只有在使用者明確指定，或任務明顯符合 skill 描述時才用
- 一次只用最小必要 skill 組合
- skill 是輔助流程，不是額外增加負擔
- 常用 skill 與使用時機整理在 `SKILLS.md`

## 6. Subagent 原則

- 預設不開 subagent
- 只有在使用者明確要求分工或平行處理時才使用
- 若要使用，必須先明確定義分工邊界

## 7. 文件策略

- 長期有效的規則放在 `AGENTS.md`
- 當前狀態放在 `NOW.md`
- skill 索引放在 `SKILLS.md`
- 舊治理放到 `docs/archive/`
- `.context/` 與 `docs/plans/` 目前保留，但視為 legacy 背景資料

## 8. 完成工作時

- 說清楚做了什麼
- 說清楚有沒有驗證
- 如果有新的關鍵決策或下一步，更新 `NOW.md`
