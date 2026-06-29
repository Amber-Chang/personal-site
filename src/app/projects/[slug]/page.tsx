// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：單一案例頁，依 slug 讀取 Markdown 並進行 SSG。

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { PostHogPageView } from "@/components/PostHogPageView";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";
import { Badge } from "@/components/ui/badge";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { getPublicBlogContentService } from "../../blog/blog-context";
import { loadProjectPageData } from "./data";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 0;

export async function generateStaticParams() {
  const projects = await getPublicBlogContentService().listPublicProjects();

  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublicBlogContentService().getPublicProjectBySlug(slug);

  if (!project) {
    return {
      title: "案例不存在",
    };
  }

  const description = project.summary || project.content.slice(0, 160).replace(/\n/g, " ");

  return {
    title: `${project.title} — Amber Chang`,
    description,
    openGraph: {
      title: project.title,
      description,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await loadProjectPageData({
    service: getPublicBlogContentService(),
    slug,
  });

  if (!project) {
    notFound();
  }

  return (
    <article className="space-y-8 md:space-y-10">
      <PostHogPageView
        properties={createPageViewProperties({
          contentSlug: project.slug,
          contentTitle: project.title,
          contentType: "project",
          sourceTemplate: "project_detail",
          tags: project.tags,
        })}
      />
      <Link href="/projects" className="inline-block text-sm text-muted-foreground hover:underline">
        ← 返回專案列表
      </Link>

      <header className="space-y-5 border-b border-border/70 pb-6 md:pb-8">
        <div className="space-y-3">
          <h1 className="font-[family-name:var(--font-display)] text-[2.35rem] font-semibold leading-[1.12] tracking-[-0.03em] md:text-[3rem]">
            {project.title}
          </h1>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground">{project.summary}</p>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-muted/25 p-5 text-sm md:grid-cols-2 md:p-6">
          <div className="space-y-1">
            <p className="text-muted-foreground/80">角色</p>
            <p className="leading-7">{project.role || "未提供"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground/80">期間</p>
            <p className="leading-7">{project.period || "未提供"}</p>
          </div>
        </div>

        {project.outcomes.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-foreground/84">關鍵成果</p>
            <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
              {project.outcomes.map((outcome) => (
                <li key={outcome}>- {outcome}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {project.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      <div className="prose prose-neutral max-w-none text-[1.02rem] leading-8 prose-headings:font-[family-name:var(--font-display)] prose-headings:tracking-[-0.03em] prose-h2:mt-12 prose-h2:text-[1.8rem] prose-h2:leading-tight prose-h2:font-semibold prose-h3:mt-8 prose-h3:text-[1.35rem] prose-h3:leading-snug prose-h3:font-semibold prose-p:text-foreground/88 prose-p:leading-8 prose-li:leading-8 prose-blockquote:border-l-border prose-blockquote:text-foreground/78 prose-strong:text-foreground prose-a:text-foreground prose-a:decoration-muted-foreground/60 prose-a:underline-offset-4 hover:prose-a:text-primary prose-code:rounded prose-code:bg-muted/65 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.92em] prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/70 prose-pre:bg-card/80 prose-img:rounded-2xl prose-img:border prose-img:border-border/60 md:text-[1.06rem] md:leading-9 md:prose-h2:text-[2rem] md:prose-h3:text-[1.5rem]">
        <ReactMarkdown>{project.content}</ReactMarkdown>
      </div>

      <RelatedPostsSection relatedPosts={project.relatedPosts} />
    </article>
  );
}
