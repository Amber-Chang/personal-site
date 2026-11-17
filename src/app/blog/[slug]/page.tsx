// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：單篇文章頁，依 slug 讀取已發佈文章。單欄（SPEC-004）：返回「文章」、標題、完整日期、內文，相關案例放在最後。

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { BackLink } from "@/components/BackLink";
import { PostHogPageView } from "@/components/PostHogPageView";
import { Prose } from "@/components/Prose";
import { RelatedProjectSection } from "@/components/RelatedProjectSection";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { formatFullDate } from "@/lib/format";
import { sharedOpenGraph } from "../../shared-metadata";
import { getPublicBlogContentService } from "../blog-context";
import { loadBlogPostPageData } from "../data";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 0;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadBlogPostPageData({
    service: getPublicBlogContentService(),
    slug,
  });

  if (!post) {
    return {
      title: "文章不存在",
    };
  }

  return {
    title: `${post.title} — Amber Chang`,
    description: post.description,
    openGraph: {
      ...sharedOpenGraph,
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await loadBlogPostPageData({
    service: getPublicBlogContentService(),
    slug,
  });

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-180">
      <PostHogPageView
        properties={createPageViewProperties({
          contentSlug: post.slug,
          contentTitle: post.title,
          contentType: "post",
          publishedAt: post.date,
          sourceTemplate: "blog_detail",
          tags: post.tags,
        })}
      />
      <BackLink href="/blog" label="文章" />
      <h1 className="mt-3.5 text-article-title font-semibold tracking-heading">
        {post.title}
      </h1>
      <p className="mt-4.5 text-label tracking-label text-muted-foreground">
        <time dateTime={post.date}>{formatFullDate(post.date)}</time>
      </p>

      <div className="mt-9">
        <Prose>
          <MarkdownContent content={post.content} />
        </Prose>
      </div>

      <RelatedProjectSection relatedProject={post.relatedProject} />
    </article>
  );
}
