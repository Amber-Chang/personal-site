# Development Workflow

> 用途：定義這個專案後續開發時的標準流程與快速流程。

## 1. 原則

- 流程要能提升品質，但不能比問題本身更重
- 中型以上功能走標準流程
- 小型變更走快速流程
- `commit` 與 `push` 是流程最後一步，不是開發中途習慣動作

## 2. 什麼情況走標準流程

符合以下任一條件時，預設走標準流程：

- 會新增或修改資料模型
- 會改 auth / 權限 / session
- 會改系統架構邊界
- 會新增後台能力
- 需要獨立 spec 才能穩定推進
- 使用者明確要求走正式流程

## 3. 什麼情況走快速流程

符合以下類型時，可走快速流程：

- 小型文案修改
- 小型視覺調整
- 局部樣式修正
- 範圍明確的小 bugfix
- 不影響資料模型、auth、架構邊界的局部修改

## 4. 標準開發流程

1. 討論本次開發範圍
2. 建立或更新本次範圍對應的 spec
3. 由 dev subagent 依 spec 開發
4. 正式實作優先採 `OpenSpec + TDD`
5. 完成後由 code review subagent 或主 agent 做 review
6. 通過驗證與 review 後，才可 `commit`、`push`

## 5. 快速流程

1. 快速確認範圍
2. 直接實作
3. 由主 agent 做輕量 review
4. 補必要驗證
5. 確認無明顯風險後，才可 `commit`、`push`

## 6. 角色分工

### 主 agent

- 收斂範圍
- 決定走標準流程或快速流程
- 撰寫或整理 spec
- 協調 dev / reviewer 角色
- 在必要時擔任最終 reviewer

### dev subagent

- 依 spec 實作
- 優先用 TDD 或至少 test-first 的方式處理主要邏輯
- 不自行跳過 spec 與 review gate

### reviewer

- 以 code review 視角檢查 bug、風險、回歸與測試缺口
- 不以重寫整份實作為目的，而是確認是否可安全進入 commit / push

## 7. Commit / Push Gate

### 標準流程必須滿足

- 範圍已對齊
- spec 已存在且可作為本次主文件
- 實作已完成
- 驗證已完成
- review 已完成

### 快速流程必須滿足

- 範圍已確認
- 變更已完成
- 至少有基本驗證
- 已做輕量 review

## 8. 與 spec 的關係

- spec 是標準流程的必要前置物，不是事後補文件
- 同一主題只保留一份主 spec，避免多份版本並存
- 若 spec 開始同時承擔產品目標、架構、資料模型與 task list，可拆成主文件與子文件

## 9. 與 skills / subagent 的關係

- 流程型 skill 只在標準流程時優先使用
- 預設不開 subagent；只有進入標準流程或使用者明確要求分工時才開
- 若任務只是快速流程，不為了使用 skill 而增加流程負擔
