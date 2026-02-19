---
name: code-marking
description: AI 輔助開發的程式碼標記規範。新增或大幅修改檔案時必須加上標記。
---

# 程式碼標記規範

新增或大幅修改的檔案，開頭加上對應語言的標記：

## TypeScript / JavaScript

```typescript
// [AI-ASSISTED] by Claude, {日期}
// 功能：{一句話說明}
```

## Python

```python
# [AI-ASSISTED] by Claude, {日期}
# 功能：{一句話說明}
```

## HTML / Blade

```html
<!-- [AI-ASSISTED] by Claude, {日期} -->
<!-- 功能：{一句話說明} -->
```

## YAML / Docker / Shell

```yaml
# [AI-ASSISTED] by Claude, {日期}
# 功能：{一句話說明}
```

## 不確定時的處理

如果不確定某段邏輯：
1. 標記 `// TODO: [NEED-REVIEW] 請工程師確認`
2. 說明你的理解和考慮的選項
3. 詢問 PM 的決定
