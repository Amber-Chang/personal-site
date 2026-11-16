// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：單一案例頁，依 slug 讀取已上架的案例。單欄（SPEC-004）：返回「案例」、赤陶類型標籤、標題、摘要、
// 角色與期間的資訊框、左側赤陶線的成果清單、標籤、內文，延伸閱讀放在最後。

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { BackLink } from "@/components/BackLink";
import { PostHogPageView } from "@/components/PostHogPageView";
import { Prose } from "@/components/Prose";
import { RelatedPostsSection } from "@/components/RelatedPostsSection";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { sharedOpenGraph } from "../../shared-metadata";
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
      ...sharedOpenGraph,
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
    <article className="mx-auto max-w-180">
      <PostHogPageView
        properties={createPageViewProperties({
          contentSlug: project.slug,
          contentTitle: project.title,
          contentType: "project",
          sourceTemplate: "project_detail",
          tags: project.tags,
        })}
      />
      <BackLink href="/" label="案例" />

      <header>
        {project.projectTypeLabel ? (
          <p className="mt-3.5 text-label font-semibold tracking-label text-terracotta">{project.projectTypeLabel}</p>
        ) : null}
        <h1 className="mt-2 text-article-title font-semibold tracking-heading">
          {project.title}
        </h1>
        {project.summary ? <p className="mt-4 text-base leading-8 text-muted-foreground">{project.summary}</p> : null}

        <dl className="mt-7 grid rounded-block border border-border bg-card md:grid-cols-2">
          <div className="px-4.5 py-3.5">
            <dt className="text-label text-muted-foreground">角色</dt>
            <dd className="mt-0.5 text-summary">{project.role || "未提供"}</dd>
          </div>
          <div className="border-t border-border px-4.5 py-3.5 md:border-l md:border-t-0">
            <dt className="text-label text-muted-foreground">期間</dt>
            <dd className="mt-0.5 text-summary">{project.period || "未提供"}</dd>
          </div>
        </dl>

        {project.outcomes.length > 0 ? (
          <ul aria-label="關鍵成果" className="mt-5 list-disc rounded-r-control border-l-2 border-terracotta bg-card py-4 pl-8.5 pr-4.5 text-summary text-foreground-soft">
            {project.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        ) : null}

        {project.tags.length > 0 ? (
          <p className="mt-4 text-label tracking-label text-muted-foreground">{project.tags.join(" · ")}</p>
        ) : null}
      </header>

      <div className="mt-9">
        <Prose>
          <MarkdownContent content={project.content} />
        </Prose>
      </div>

      <RelatedPostsSection relatedPosts={project.relatedPosts} />
    </article>
  );
}
