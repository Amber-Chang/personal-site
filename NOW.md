# NOW

> 用途：只記現在，不記歷史。

## 現況

- branch：`main`
- 網站已具備：
  - 首頁改版版本
  - `/about`
  - `/blog`
  - `/blog/[slug]`
  - `/projects`
  - `/projects/[slug]`
- 內容來源目前是：
  - blog：Supabase repository
  - projects：Markdown 檔案

## 最近完成

- 完成網站最小治理集合與核心方向整理，確立 `AGENTS.md`、`FOUNDATION.md`、`NOW.md`、`docs/` 的責任分工
- 完成 blog admin MVP 的主 spec、系統架構原則與標準開發流程規則
- 完成 blog admin 前四個主要 round：foundation 底座、admin posts skeleton、前台 blog 切 repository、Markdown import tooling
- admin 登入 MVP 已從 Supabase magic link 改成單一密碼 + httpOnly session cookie，避免被內建 email rate limit 卡住
- admin 後台補上欄位說明文字、前台登入後可見的 `後台` 入口，以及較穩定的 publish intent 傳遞與較清楚的 Supabase 錯誤訊息
- 已建立 deployment security readiness 主文件，並補上單人 admin 部署前的 env、session 與手動發佈驗證基線
- deployment security readiness round 已完成：login rate limit、7 天 session policy、文件同步、manual admin flow 驗證，以及 lint/test/build gate
- 已新增 random server-side admin session change：cookie 不再直接使用 deterministic token，改為後端 session record 驗證
- 已將 `supabase/migrations/202606070002_add_admin_sessions.sql` 套用到實際 Supabase 環境，並完成 admin 登入 / draft / 發佈 / 取消發佈 / 重新發佈手動驗證
- 已補上後台登出功能：可清除 `admin_session` cookie，並刪除目前 server-side session record
- Vercel production 已部署於 `https://personal-site-two-opal.vercel.app/`
- 已確認 production 首頁、`/blog`、既有公開文章與 `/admin/login` 可正常載入
- 原先記錄的 smoke sample `admin-flow-check-20260607-0215` 已不在 production，部署後驗證記錄需改用新的樣本或直接記錄實際檢查路徑
- 已建立 `npm run review:doc-sync` 與 `docs/development-workflow.md` 收尾 gate，降低忘記同步 `NOW.md` / 主文件的機率
- 已完成 `blog post <-> project` 雙向連結 round：文章頁可顯示相關案例，project 頁可顯示延伸文章，且內容關聯已收斂到 content / repository 邊界
- 已補 `npm run content:sync-projects`，可把 `content/projects/*.md` 同步到 Supabase `projects` identity table，讓 admin post form 的 `Related project` 選單可實際選用案例
- 已完成輕量 project identity admin：新增 `/admin/projects`、`/admin/projects/new`、`/admin/projects/[id]`，可直接在後台建立與編輯可被文章關聯的專案名單

## 目前最重要的事

- 持續調整網站視覺與品牌感
- 視需要補 `title -> slug` 自動建議與更完整的後台錯誤訊息
- 補齊 production deploy 後的 admin 登入 / 發佈 / 登出 smoke check 記錄
- 若後續需要多人或遠端登入，重新評估 auth 升級路線
- 讓後續開發工作可依標準流程規則化執行
- 確認 project sync 後的 admin 關聯編輯流程在 production 也可順利使用
- 之後再決定是否把 projects 從 Markdown-first 升級成完整 project CMS

## 下一步建議

1. 在 production 重跑一次完整 admin smoke check，包含 `/admin/projects` 建立 / 編輯、`Related project` 選擇、登入、登出、draft / publish / unpublish 驗證記錄
2. 重新指定一篇仍存在於 production 的 smoke sample，或建立新的固定驗證樣本
3. 視需要補 `title -> slug` 自動建議與更完整的後台錯誤訊息
4. 視需要把 blog / project 的關聯區塊再做更細的文案與視覺打磨
5. 若後續要讓 project 內容本身可在後台完整維護，再評估升級成 full project admin

## 備註

- `FOUNDATION.md` 是新的核心方向文件
- 目前不保留舊規劃文件，避免干擾新的判斷
- 若未來調整 `docs/` 結構，需同步檢查 `AGENTS.md`、`NOW.md` 與直接相關文件
- 目前傾向的內容模型是 `projects` 與 `blog posts` 分開，blog post 可選擇關聯 project
- blog admin MVP 已決定正式採用 Supabase，但第一版只處理 blog posts，不擴大成全站 CMS
- 後續 implementation spec 需以 [docs/system-architecture-principles.md](/Users/amberchang/Documents/New%20project/docs/system-architecture-principles.md) 作為最小架構參考
- 目前後端分工是 Next.js 負責應用層，Supabase 負責資料庫與登入基礎
- blog admin 的可實作規格已集中在 [docs/blog-admin-implementation-spec.md](/Users/amberchang/Documents/New%20project/docs/blog-admin-implementation-spec.md)
- `blog post <-> project` 雙向連結的下一階段主 spec 已建立於 [docs/blog-project-linking-spec.md](/Users/amberchang/Documents/New%20project/docs/blog-project-linking-spec.md)
- `project identity admin` 主 spec 已建立於 [docs/admin-project-identity-management-spec.md](/Users/amberchang/Documents/New%20project/docs/admin-project-identity-management-spec.md)
- 開發流程規則已集中在 [docs/development-workflow.md](/Users/amberchang/Documents/New%20project/docs/development-workflow.md)
- admin 內容讀寫第一版採 trusted Next.js server + Supabase service-role path，public published reads 則維持 RLS published-read policy
- blog admin spec 的目前完成度與剩餘範圍已記在 [docs/blog-admin-implementation-spec.md](/Users/amberchang/Documents/New%20project/docs/blog-admin-implementation-spec.md) 的「目前進度」
- deployment / 資安上線準備的主文件已建立於 [docs/deployment-security-readiness.md](/Users/amberchang/Documents/New%20project/docs/deployment-security-readiness.md)
- `/blog`、`/blog/[slug]` 與首頁 writing 區塊已改由 public repository 讀取 `published` posts；舊 `content/posts/*.md` 仍保留作為 import source
- `npm run content:import-posts` 已成功匯入 `ai-membership-system`
- `npm run content:sync-projects` 會把 Markdown project 同步成 Supabase `projects` identity，供 blog relation 與 admin select option 使用
- admin post form 已改成 publish UX 按鈕，不再以 status dropdown 作為主要操作
- 目前 admin 後台登入改採密碼門 MVP，不再依賴 Supabase magic link
