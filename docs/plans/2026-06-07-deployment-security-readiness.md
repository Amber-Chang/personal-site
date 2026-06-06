# Deployment Security Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 讓網站可安心部署上線，並把單人 admin 的安全基線補到可接受水位，不先引入 OAuth 2.0。

**Architecture:** 維持現有 Next.js App Router + Supabase 架構，不重做 auth。以「單人 admin 密碼門 + server-side session guard + 基本防暴力登入 + 手動流程驗證 + 部署檢查」為主線，優先補強公開上線最容易出事的幾個缺口。

**Tech Stack:** Next.js 16 App Router、TypeScript、Node test runner、Tailwind CSS、Supabase、Vercel-style env/runtime assumptions

---

## Scope

這份計劃只處理「可部署上線的最低可接受安全與穩定性」：

- admin login 基本防護
- session 與 cookie 設定檢查
- production env / deployment checklist
- blog admin 手動驗證
- 文件同步

這份計劃不包含：

- OAuth 2.0
- 多人角色管理
- 完整稽核紀錄系統
- WAF / bot management 平台級重度設定

## Success Criteria

- production build、lint、test 全綠
- `/admin/login` 具備最小登入防暴力保護
- admin session 行為在 production 假設下可驗證
- admin create / edit / publish / unpublish / public visibility 流程手動驗證完成
- deployment / env / rollback 注意事項有單一文件可照做

### Task 1: 建立 deployment 與 security 主文件

**Files:**
- Create: `docs/deployment-security-readiness.md`
- Reference: `docs/blog-admin-implementation-spec.md`
- Reference: `docs/system-architecture-principles.md`
- Reference: `NOW.md`

**Step 1: 撰寫文件骨架**

新增一份主文件，章節至少包含：

- 目標與範圍
- 單人 admin 安全假設
- 必要 env 清單
- 上線前檢查表
- 上線後檢查表
- 已知限制與未來升級條件

**Step 2: 補上目前 auth 模型說明**

明確記錄目前採用：

- 單一 admin 密碼
- httpOnly session cookie
- trusted Next.js server + service-role admin path

並寫清楚這是「單人自用 admin 的 MVP 方案」，不是多人後台最終方案。

**Step 3: 補上風險與邊界**

列出至少這些限制：

- 不支援多人協作
- 不支援細部權限管理
- 不支援 session revoke / audit log
- 若 admin 使用範圍擴大，需升級 auth 方案

**Step 4: 檢查文件一致性**

確認這份文件與既有 spec 沒有互相矛盾的登入敘述。

**Step 5: Commit**

```bash
git add docs/deployment-security-readiness.md
git commit -m "docs: add deployment security readiness guide"
```

### Task 2: 為 admin login 加入最小防暴力登入保護

**Files:**
- Modify: `src/lib/auth/login-action.ts`
- Modify: `src/app/admin/login/actions.ts`
- Create: `src/lib/auth/login-rate-limit.ts`
- Test: `src/lib/auth/login-action.test.ts`
- Test: `src/lib/auth/session.test.ts`

**Step 1: 先寫失敗測試**

在 `src/lib/auth/login-action.test.ts` 新增至少兩個案例：

- 連續錯誤登入超過上限後，回傳受控錯誤
- 超過冷卻時間後，可再次嘗試登入

可用的測試形狀：

```ts
test("createAdminLoginAction rejects attempts after too many failures", async () => {
  const action = createAdminLoginAction({
    adminPassword: "correct-password",
    getRateLimitState: () => ({ blockedUntil: Date.now() + 60_000, remainingAttempts: 0 }),
    recordFailedAttempt: () => {},
    resetAttempts: () => {},
    setAdminSession: () => {},
  });

  const formData = new FormData();
  formData.set("password", "wrong");

  const result = await action(formData);

  assert.deepEqual(result, {
    ok: false,
    error: "登入嘗試過於頻繁，請稍後再試",
  });
});
```

**Step 2: 跑測試確認會失敗**

Run: `npm test -- src/lib/auth/login-action.test.ts`  
Expected: FAIL，因為 rate-limit 依賴與行為尚未存在

**Step 3: 實作最小 rate-limit helper**

在 `src/lib/auth/login-rate-limit.ts` 建立最小介面，避免把限制邏輯散在 page/action：

- `getRateLimitState(identifier)`
- `recordFailedAttempt(identifier)`
- `resetAttempts(identifier)`

第一版可接受「process memory in-memory store」，前提是文件明寫其限制：

- 適合單實例 / 低流量 / MVP
- serverless 多實例下不是強一致

資料結構至少包含：

- `failureCount`
- `firstFailureAt`
- `blockedUntil`

**Step 4: 將 login action 接入 rate limit**

在 `createAdminLoginAction` 注入 rate-limit 依賴：

- 進 action 前先檢查是否 blocked
- 密碼錯誤時記錄失敗次數
- 登入成功時清空該 identifier 的失敗記錄

identifier 第一版可用：

- IP（若 server action 容易取到）
- 取不到 IP 時先退回固定 key，並在文件註記限制

不要在 page/component 直接手寫限制邏輯。

**Step 5: 跑測試確認通過**

Run: `npm test -- src/lib/auth/login-action.test.ts`  
Expected: PASS

**Step 6: 跑整體測試**

Run: `npm test`  
Expected: PASS

**Step 7: Commit**

```bash
git add src/lib/auth/login-rate-limit.ts src/lib/auth/login-action.ts src/app/admin/login/actions.ts src/lib/auth/login-action.test.ts src/lib/auth/session.test.ts
git commit -m "feat: add basic admin login rate limiting"
```

### Task 3: 收斂 session 與 cookie 安全設定

**Files:**
- Modify: `src/lib/auth/session.ts`
- Test: `src/lib/auth/session.test.ts`
- Reference: `src/app/admin/posts/admin-context.ts`

**Step 1: 先補測試**

在 `src/lib/auth/session.test.ts` 補以下案例：

- production 時 `secure` 為 `true`
- cookie option 含 `httpOnly`
- cookie option 含 `sameSite: "lax"`
- session max age 符合預期

**Step 2: 檢查 session 設計是否要微調**

評估並擇一：

- 保持 14 天，但文件寫明風險與使用情境
- 縮短為 7 天或更短，降低長效 session 風險

若沒有強理由，偏向縮短。

**Step 3: 保持改動範圍小**

不要在這一輪引入 JWT、database-backed session、refresh token 等超出 MVP 的機制。

**Step 4: 驗證所有相關測試**

Run: `npm test -- src/lib/auth/session.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/auth/session.ts src/lib/auth/session.test.ts
git commit -m "chore: tighten admin session cookie policy"
```

### Task 4: 建立 production env 與 deployment checklist

**Files:**
- Modify: `README.md`
- Modify: `NOW.md`
- Reference: `.env.local`
- Reference: `docs/deployment-security-readiness.md`

**Step 1: 補齊 README 的 production 說明**

加入明確段落：

- required env
- `ADMIN_LOGIN_PASSWORD` 必填
- production URL 必須與 `NEXT_PUBLIC_SITE_URL` 對齊
- service role key 不可暴露到 client bundle

**Step 2: 新增部署檢查表**

README 或主文件至少要有：

- env 已配置
- migration 已套用
- build / lint / test 通過
- admin password 已設為強密碼
- preview / production URL 已確認
- admin 登入與發佈流程已手動驗證

**Step 3: 更新 NOW.md**

把「目前最重要的事」或「下一步建議」收斂到：

- deployment security readiness
- admin 流程手動驗證

不要把 `NOW.md` 寫成長規格，只更新高階狀態。

**Step 4: Commit**

```bash
git add README.md NOW.md docs/deployment-security-readiness.md
git commit -m "docs: add production deployment checklist"
```

### Task 5: 完成 blog admin 手動驗證腳本

**Files:**
- Modify: `docs/deployment-security-readiness.md`
- Optional Create: `docs/manual-test/admin-post-flow.md`

**Step 1: 寫成可照跑的 checklist**

逐條列出：

1. 登入 `/admin/login`
2. 新增草稿
3. 編輯標題 / slug / excerpt / 內容
4. 發佈文章
5. 確認 `/blog` 看得到
6. 確認 `/blog/[slug]` 看得到
7. 取消發佈
8. 確認前台隱藏
9. 再次發佈

**Step 2: 補上預期結果**

每一步都要有 expected result，例如：

- 成功登入後導向 `/admin/posts`
- duplicate slug 顯示受控中文錯誤
- unpublished 後前台列表不可見

**Step 3: 真的手動執行一次**

在具備 env 的本機或 preview 環境執行整條流程，將結果記錄回文件。

**Step 4: 若手動驗證失敗，先修 blocker 再繼續**

不要在流程未通前就宣布 readiness 完成。

**Step 5: Commit**

```bash
git add docs/deployment-security-readiness.md docs/manual-test/admin-post-flow.md
git commit -m "test: document admin publishing verification flow"
```

### Task 6: 進行 release readiness 驗證

**Files:**
- Reference: `package.json`
- Reference: `src/app/admin/**`
- Reference: `src/lib/auth/**`

**Step 1: 跑 lint**

Run: `npm run lint`  
Expected: PASS

**Step 2: 跑 test**

Run: `npm test`  
Expected: PASS

**Step 3: 跑 production build**

Run: `npm run build`  
Expected: PASS

**Step 4: 做 reviewer 角度檢查**

重點看：

- 是否把 service role key 用到 client code
- 是否出現 page/component 直接做 provider-specific admin write
- rate limit 是否有明顯可繞過的實作錯誤
- session 變更是否造成 admin guard regression

**Step 5: 更新 readiness 結論**

在 `docs/deployment-security-readiness.md` 寫下最終判斷：

- 可部署 preview
- 可正式上線
- 僅建議在補某個 blocker 後上線

**Step 6: Commit**

```bash
git add docs/deployment-security-readiness.md
git commit -m "docs: record deployment readiness result"
```

## Suggested Execution Order

1. Task 1 文件骨架
2. Task 2 login rate limit
3. Task 3 session / cookie 收斂
4. Task 4 deployment checklist
5. Task 5 手動驗證
6. Task 6 release readiness 結論

## Decision Notes

- 不先做 OAuth 2.0，因為目前 admin 只有單一使用者，導入成本高於眼前收益
- 若未來 admin 不再是單人自用，應重新評估 auth 升級路線
- 若要把 rate limit 做到跨 instance 穩定，後續可再升級到 shared store（如 Supabase table / edge-friendly KV），但這不是本輪 MVP 必做
