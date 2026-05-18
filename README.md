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
