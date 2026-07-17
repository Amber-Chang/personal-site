# SKILLS

> 用途：只列本專案常用 skill，不做大而全盤點。

## 使用原則

- 只在真的有幫助時用
- 不為了「有 skill 可用」而硬用
- 如果不用 skill 反而更快，就直接做

## 與開發流程的關係

- 走標準開發流程時，才優先考慮流程型 skill
- 走快速流程時，預設不用重型 skill，除非明確有幫助
- 若任務涉及 spec、正式實作、review，可依序考慮對應 skill；但仍以最小必要組合為原則

## 常用技能

### `brainstorming`

適合：

- 收斂首頁方向
- 討論品牌感與資訊架構
- 功能還沒定義清楚時

### `ui-ux-pro-max`

適合：

- 覺得畫面不好看，但方向已經清楚
- 要補視覺層次、排版節奏、設計系統初稿時

### `vercel-react-best-practices`

適合：

- React / Next.js 實作變複雜後做品質檢查
- 有 server/client 邊界或效能疑慮時

### `openspec-*`

適合：

- 已明確決定要走標準開發流程
- 需要把功能需求轉成較正式的 spec / 實作節奏時
- 中型以上功能，且後續可能持續擴張時

### `test-driven-development`

適合：

- 正式開發流程中的主要邏輯實作
- 容易回歸或規則較多的功能

### `requesting-code-review`

適合：

- 功能完成後進入 review gate 前
- 需要用 code review 視角檢查風險、回歸與測試缺口時

## 先不要用太重的技能

以下流程型 skill 先保守使用：

- `openspec-*`
- 過重的多階段計畫 skill

只有在你明確想回到那套流程，或任務已進入標準開發流程時再用。

## builder-pm 角色路由

| 角色 | 入口 | 何時用 |
|---|---|---|
| Coordinator | `.agents/skills/coordinator/` | 任務分流、阻塞排除、交接 |
| Planner | `.agents/skills/planner/` | 需求不清、需要 PRD / SPEC |
| Generator | `.agents/skills/generator/` | 已核准 spec 的正式實作 |
| Evaluator | `.agents/skills/evaluator/` | 本機或 PR review，且不得與 Generator 相同 |
| Planner | `.agents/skills/knowledge-curation/` | 從外部來源整理候選 evidence，需 PM 核准後才進正式文件 |

`.claude/skills/` 保存共用 canonical skill；`.agents/skills/` 保存 Codex adapter。除非在 registry 中有明確採用紀錄，不把外部 skill 自動升格成專案正式能力。

<!-- project-skill-registry:start -->
| skill | role | trigger | priority | canonical | codex_adapter | adoption_record |
|---|---|---|---:|---|---|---|
<!-- project-skill-registry:end -->
