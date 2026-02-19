---
name: agent-lifecycle
description: Agent 啟動和結束的標準 SOP。所有 agent 每次工作前後必須遵循。
---

# Agent 生命週期 SOP

## 啟動必做（強制）

每次啟動時，在做任何事之前：

1. **讀取** `.claude/session-summary.md`，重點看 §2 未完成事項
2. **讀取** `.context/SYSTEM.md`，確認技術選型和專案定位

## 結束工作時（全部完成才算結束）

1. **`session-summary.md`**：
   - §1 更新里程碑狀態
   - §2 清理已完成的、新增本次未完成的
   - §3 記錄本次做的重要決定
   - §5 新增本次 session 摘要

2. **向 Amber 回報**：
   ```
   ✅ 完成了：[清單]
   📋 產出了：[檔案清單]
   ⚠️ 注意事項：[影響其他部分的事項]
   🔜 下一步建議：[建議]
   ```

> ⚠️ 這是強制規則。未更新 session-summary.md 就結束 = 違規。
