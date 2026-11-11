// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：單篇文章頁，依 slug 讀取已發佈文章。

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { BackLink } from "@/components/PageHeader";
import { PostHogPageView } from "@/components/PostHogPageView";
import { Prose } from "@/components/Prose";
import { RelatedProjectSection } from "@/components/RelatedProjectSection";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { formatDate } from "@/lib/format";
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
    <article className="space-y-8 md:space-y-10">
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
      <BackLink href="/blog" label="返回文章列表" />
      <header className="border-b border-border pb-6 md:pb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[2.35rem] font-semibold leading-[1.12] tracking-[-0.03em] md:text-[3rem]">
          {post.title}
        </h1>
        <p className="mt-4 text-sm tracking-[0.08em] text-muted-foreground">{formatDate(post.date)}</p>
      </header>

      <RelatedProjectSection relatedProject={post.relatedProject} />

      <Prose>
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </Prose>
    </article>
  );
}
