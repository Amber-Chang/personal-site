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
- Markdown content

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
content/posts/      Blog posts
content/projects/   Project case studies
public/images/      Static images
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ADMIN_EMAILS`
- `NEXT_PUBLIC_SITE_URL`

`SUPABASE_ADMIN_EMAILS` uses a comma-separated allowlist. Public reads rely on RLS published-read policies, while admin content reads and writes run through trusted Next.js server code with the Supabase service-role client.

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
- Projects and blog posts are both managed inside the repo
- Old planning and heavy governance docs have been removed to keep the project lightweight
