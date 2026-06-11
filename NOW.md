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
  - projects：Supabase repository

## 最近完成

- 已完成公開頁面視覺與 RWD 收斂：首頁改成更明確的 editorial / portfolio 節奏，外框放寬為 `max-w-5xl`，blog / projects / about 與文章、案例內頁已補一輪 mobile-first 閱讀與導覽調整
- 已收斂首頁品牌文案方向：第一屏先建立 `AI-native Product Builder` 定位，同時保留工作與生活觀察並存的個人筆記感
- 已調整公開頁面資訊分工：首頁 `How I Work` 收成短引言，完整做事方式改放到 `/about`
- 已將 header 品牌識別改成個人頭像插圖搭配名字文字，保留回首頁入口並增加個人感
- 已將網站分頁圖示改成同一張個人頭像圖，讓 header 與 favicon 識別一致
- 已收斂首頁 hero 與專案列表呈現：header 改為純頭像識別、首頁改成 `Amber Chang / AI-native product portfolio` 層級、Projects 卡片精簡為標題與描述並在桌機改為多欄
- 已統一公開頁面命名語氣：導覽與內頁採 `Projects`、`Writing & Notes`、`About / 關於我`
- 已完成一輪公開頁面 typography cleanup：首頁、列表頁與文章／專案內頁改採更一致的 serif 標題與 sans 內文層級，減少過多粗體、全大寫與 tracking 帶來的雜訊
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
- 已確認 production 首頁、`/blog`、既有公開文章與 `/admin/login` 可正常載入；未登入直接進 `/admin/posts` 也會正確導回 `/admin/login`
- `admin-flow-check-20260607-0215` 目前仍存在於 production，可繼續作為 smoke sample；其文章頁到關聯 project 頁的前台鏈路也已確認可用
- 已建立 `npm run review:doc-sync` 與 [docs/development-workflow.md](./docs/development-workflow.md) 收尾 gate，降低忘記同步 `NOW.md` / 主文件的機率
- 已完成 `blog post <-> project` 雙向連結 round：文章頁可顯示相關案例，project 頁可顯示延伸文章，且內容關聯已收斂到 content / repository 邊界
- 已補 `npm run content:sync-projects`，可把 `content/projects/*.md` 同步到 Supabase `projects` identity table，讓 admin post form 的 `Related project` 選單可實際選用案例
- 已完成輕量 project identity admin：新增 `/admin/projects`、`/admin/projects/new`、`/admin/projects/[id]`，可直接在後台建立與編輯可被文章關聯的專案名單
- 已完成 `projects Supabase-first` round：`/projects`、`/projects/[slug]`、首頁代表案例與 `/admin/projects` 已收斂到同一套 Supabase content source，Markdown `content/projects/*.md` 改退為 migration/import source
- 已將 `supabase/migrations/202606090001_expand_projects_for_public_content.sql` 套用到實際 Supabase 環境，並重跑 `npm run content:sync-projects`，把既有 Markdown project 內容同步進 `role / period / tags / outcomes / featured / content_markdown`
- 已確認 production 首頁、`/projects`、`/projects/ai-writing-review-product`、`/projects/sms-management-platform` 可正常顯示 Supabase-backed project 內容
- 已完成依賴安裝後的技術驗證：`npm test`、`npm run lint` 通過；`npm run build` 在補齊必要 env 後可成功

## 目前最重要的事

- 持續微調網站視覺與品牌感，特別是公開頁面的 typography、footer 與首頁敘事細節
- 視需要補 `title -> slug` 自動建議與更完整的後台錯誤訊息
- 把已手動完成的 production admin 登入後流程驗證記錄補回文件，避免實際狀態與文件脫節
- 若後續需要多人或遠端登入，重新評估 auth 升級路線
- 讓後續開發工作可依標準流程規則化執行
- 收斂 production `/admin/projects`、`Related project` 與 publish flow 的手動驗證紀錄表述
- 收斂 repo 文件，避免治理文件與目前實作狀態脫節

## 下一步建議

1. 把已完成的 production admin 手動驗證整理成單一記錄，包含 `/admin/projects` 建立 / 編輯、`Related project` 選擇、登入、登出、draft / publish / unpublish
2. 以 `admin-flow-check-20260607-0215` 為目前 smoke sample，補齊其用途與驗證路徑說明
3. 視需要補 `title -> slug` 自動建議與更完整的後台錯誤訊息
4. 視公開頁面實際使用感再微調 footer、文章內頁 typography 與首頁 section 節奏
5. 持續把 `NOW.md` / `FOUNDATION.md` 中過時描述收斂掉

## 備註

- `FOUNDATION.md` 是新的核心方向文件
- 目前不保留舊規劃文件，避免干擾新的判斷
- 若未來調整 `docs/` 結構，需同步檢查 `AGENTS.md`、`NOW.md` 與直接相關文件
- 目前傾向的內容模型是 `projects` 與 `blog posts` 分開，blog post 可選擇關聯 project
- blog admin MVP 已決定正式採用 Supabase，但第一版只處理 blog posts，不擴大成全站 CMS
- 後續 implementation spec 需以 [docs/system-architecture-principles.md](./docs/system-architecture-principles.md) 作為最小架構參考
- 目前後端分工是 Next.js 負責應用層，Supabase 負責資料庫與登入基礎
- blog admin 的可實作規格已集中在 [docs/blog-admin-implementation-spec.md](./docs/blog-admin-implementation-spec.md)
- `blog post <-> project` 雙向連結的下一階段主 spec 已建立於 [docs/blog-project-linking-spec.md](./docs/blog-project-linking-spec.md)
- `project identity admin` 主 spec 已建立於 [docs/admin-project-identity-management-spec.md](./docs/admin-project-identity-management-spec.md)
- `projects Supabase-first` 主 spec 已建立於 [docs/projects-supabase-first-spec.md](./docs/projects-supabase-first-spec.md)
- 開發流程規則已集中在 [docs/development-workflow.md](./docs/development-workflow.md)
- admin 內容讀寫第一版採 trusted Next.js server + Supabase service-role path，public published reads 則維持 RLS published-read policy
- blog admin spec 的目前完成度與剩餘範圍已記在 [docs/blog-admin-implementation-spec.md](./docs/blog-admin-implementation-spec.md) 的「目前進度」
- deployment / 資安上線準備的主文件已建立於 [docs/deployment-security-readiness.md](./docs/deployment-security-readiness.md)
- `/blog`、`/blog/[slug]` 與首頁 writing 區塊已改由 public repository 讀取 `published` posts；舊 `content/posts/*.md` 仍保留作為 import source
- `npm run content:import-posts` 已成功匯入 `ai-membership-system`
- `npm run content:sync-projects` 會把 Markdown project 同步成 Supabase `projects` content，供 blog relation、public projects 與 admin form 使用
- admin post form 已改成 publish UX 按鈕，不再以 status dropdown 作為主要操作
- 目前 admin 後台登入改採密碼門 MVP，不再依賴 Supabase magic link
