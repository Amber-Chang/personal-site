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
- Markdown project content

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
content/posts/      Legacy blog posts for one-time import
content/projects/   Project case studies
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
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_LOGIN_PASSWORD`

目前 admin 主登入路徑是「單一密碼 + `httpOnly` session cookie + server-side session record」。

- `ADMIN_LOGIN_PASSWORD` 是目前單人 admin 的必要 secret，應使用高強度隨機密碼，且不可重用其他常用密碼
- `NEXT_PUBLIC_SITE_URL` 必須與實際部署網址對齊；preview 與 production 都要各自配置成對應網址
- `SUPABASE_SERVICE_ROLE_KEY` 只可用在 trusted Next.js server runtime，不可進 client bundle、browser code 或任何 `NEXT_PUBLIC_*` 變數
- 公開前台讀取仍走 published-only read model；admin 內容讀寫則走 trusted server + service-role path
- admin cookie 不再直接承載可重算的固定 token；server 端會改以隨機 session token 對應後端 session 紀錄做驗證

補充：

- 若目前某些舊流程或相容層仍讀取 `SUPABASE_ADMIN_EMAILS`，它不應再被理解成目前 admin auth 的主控制機制
- `ADMIN_LOGIN_PASSWORD` 不應寫進 repo、文件範例明碼、前端程式碼或可被瀏覽器直接讀取的設定

## Deployment Caveats

- 這一版 deployment readiness 只適用單人 admin 維運，不是多人後台或正式權限系統
- public deployment 前，至少要完成 admin 登入、建立 draft、編輯、發佈、取消發佈、前台顯示 / 隱藏的手動驗證
- production 需要確認 cookie 行為符合預期，特別是 `secure`、`httpOnly`、`sameSite=lax` 與 session 持續時間
- 若未來 admin 不再只有站主一人，或需要角色、邀請、session revocation、audit log，就不應再沿用目前密碼門模型

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

- The site currently uses Markdown files as the content source
- Projects are still managed inside the repo
- Blog front-end pages read published posts through the repository layer
- Old planning and heavy governance docs have been removed to keep the project lightweight
