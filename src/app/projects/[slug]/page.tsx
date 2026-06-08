// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：單一案例頁，依 slug 讀取 Markdown 並進行 SSG。

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";
import { Badge } from "@/components/ui/badge";
import { getPublicBlogContentService } from "../../blog/blog-context";
import { loadProjectPageData } from "./data";
import { getProjectBySlug, getPublishedProjects } from "@/lib/projects";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

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
    <article className="space-y-8">
      <Link href="/projects" className="inline-block text-sm text-muted-foreground hover:underline">
        ← 返回專案列表
      </Link>

      <header className="space-y-4 border-b border-border/70 pb-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight">{project.title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{project.summary}</p>
        </div>

        <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/25 p-4 text-sm md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-muted-foreground">角色</p>
            <p>{project.role || "未提供"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">期間</p>
            <p>{project.period || "未提供"}</p>
          </div>
        </div>

        {project.outcomes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">關鍵成果</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
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

      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown>{project.content}</ReactMarkdown>
      </div>

      <RelatedPostsSection relatedPosts={project.relatedPosts} />
    </article>
  );
}
