---
id: PRD-001
status: active
title: "Personal Site Content Runtime Baseline"
---

# Personal Site Content Runtime Baseline

## 背景與問題

這個專案的公開頁面、內容管理、管理員驗證與 analytics 已經進入可持續維護階段，但正式 PRD / SPEC 區仍缺少一份明確描述目前 runtime 基線的文件，導致 `.context/modules/*` 雖然已經整理好，formal SPEC coverage 卻無法對齊。

## 目標

- 讓目前已成立的 runtime 子系統有一份正式 PRD 可被 SPEC 關聯
- 明確定義目前網站內容平台的五個主要模組與使用者價值
- 讓後續新增或調整 module 時，有正式文件可作為對齊基線

## 非目標

- 不重寫既有各主題 spec
- 不引入新的產品功能
- 不把未實作的規格欄位誤升格成 runtime 事實

## 使用者與使用情境

- 站主需要維護公開 `Projects`、`Writing & Notes`、`About` 內容，並透過後台完成基本內容生命週期管理
- 協作中的 agent 需要快速知道目前 `public-content`、`content-runtime`、`admin-content`、`admin-auth`、`analytics-consent` 各自的責任邊界

## 驗收條件

- [ ] 至少一份正式 SPEC 使用 `related_prd: PRD-001`
- [ ] 正式 SPEC 明確提到 `public-content`、`content-runtime`、`admin-content`、`admin-auth`、`analytics-consent`
- [ ] formal PRD / SPEC 與 `.context/SYSTEM.md` 的主要邊界一致

## 需求摘要

- 專案需要一份正式文件把五個 runtime modules 與其責任關係寫成可追溯基線
- 這份基線要能補足 builder-pm 的 formal SPEC coverage，而不是只停留在 `.context/`
