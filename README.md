# Amber's Personal Site

Amber 的個人品牌網站，主要面向潛在雇主與 hiring manager。

這個網站目前用來呈現三件事：

- 我如何用 AI-native workflow 工作
- 我如何把模糊需求轉成可落地的產品與案例
- 我如何透過寫作整理自己的判斷與思考

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase-backed blog content
- Supabase-backed project content
- PostHog pageview analytics

## Site Structure

```text
/                  Home
/projects          Project list
/projects/[slug]   Project detail
/blog              Blog list
/blog/[slug]       Blog post
/about             About
```

## Content Structure

```text
content/posts/      Markdown posts for import / local drafting
content/projects/   Markdown project content for import / sync
public/images/      Static images
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Blog Post Migration

Existing Markdown blog posts can be imported into Supabase with:

```bash
npm run content:import-posts
```

The importer skips posts whose slug already exists in `blog_posts`.

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_ALLOWED_EMAILS`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`（若要啟用網站埋點）
- `NEXT_PUBLIC_POSTHOG_HOST`（例如 `https://us.i.posthog.com`）

目前 admin 主登入路徑是「Supabase Auth + Google OAuth + allowlisted email」。

- `ADMIN_ALLOWED_EMAILS` 是目前 admin allowlist 的主要設定，請填入可登入後台的 Google 帳號 email，支援逗號分隔多個值
- `NEXT_PUBLIC_SITE_URL` 必須與實際部署網址對齊；preview 與 production 都要各自配置成對應網址
- `SUPABASE_SERVICE_ROLE_KEY` 只可用在 trusted Next.js server runtime，不可進 client bundle、browser code 或任何 `NEXT_PUBLIC_*` 變數
- PostHog 採官方建議的 `posthog-js + instrumentation-client.ts` 初始化；若沒有設定 `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` 與 `NEXT_PUBLIC_POSTHOG_HOST`，埋點會自動停用
- 目前埋點策略刻意收斂成「只收公開頁 pageview」：`/admin` 不送，且只有在訪客同意 consent banner 後才會初始化 PostHog
- 公開前台讀取仍走 published-only read model；admin 內容讀寫則走 trusted server + service-role path
- admin cookie 不再直接承載可重算的固定 token；server 端會以隨機 session token 對應後端 session 紀錄做驗證

補充：

- 若目前某些舊流程或相容層仍讀取 `SUPABASE_ADMIN_EMAILS`，它只是 `ADMIN_ALLOWED_EMAILS` 的 fallback，不應再被理解成目前 admin auth 的主控制機制
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` 與 `NEXT_PUBLIC_POSTHOG_HOST` 需要同時存在，前端 bundle 才會真的啟用 PostHog

### Analytics Behavior

- 站上 analytics 目前使用 PostHog
- 只追蹤公開頁面 pageview，並附帶基本頁面內容屬性
- `/admin` 路徑不追蹤
- 訪客需先同意 consent banner，PostHog 才會初始化

## Deployment Caveats

- 這一版 deployment readiness 只適用單人 admin 維運，不是多人後台或正式權限系統
- public deployment 前，至少要完成 admin 登入、建立 draft、編輯、發佈、取消發佈、前台顯示 / 隱藏的手動驗證
- production 需要確認 cookie 行為符合預期，特別是 `secure`、`httpOnly`、`sameSite=lax` 與 session 持續時間
- 若未來 admin 不再只有站主一人，或需要角色、邀請、session revocation、audit log，就不應再沿用目前單人 Google OAuth allowlist 模型

## Project Files

- `FOUNDATION.md`
  Current core direction of the site
- `AGENTS.md`
  Lightweight working rules for this repo
- `NOW.md`
  Current status and next focus
- `SKILLS.md`
  Small registry of commonly used skills

## Notes

- Public pages read blog posts and projects from the Supabase repository layer
- Markdown files are kept mainly as import source and local writing material
- Blog front-end pages read published posts through the repository layer
- Old planning and heavy governance docs have been removed to keep the project lightweight
