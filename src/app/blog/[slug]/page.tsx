// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：單篇文章頁，依 slug 讀取已發佈文章。

import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { PostHogPageView } from "@/components/PostHogPageView";
import { RelatedProjectSection } from "@/components/RelatedProjectSection";
import { createPageViewProperties } from "@/lib/analytics/pageview";
import { formatDate } from "@/lib/format";
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
      <Link href="/blog" className="inline-block text-sm text-muted-foreground hover:underline">
        ← 返回文章列表
      </Link>
      <header className="border-b border-border/70 pb-6 md:pb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[2.35rem] font-semibold leading-[1.12] tracking-[-0.03em] md:text-[3rem]">
          {post.title}
        </h1>
        <p className="mt-4 text-sm tracking-[0.08em] text-muted-foreground">{formatDate(post.date)}</p>
      </header>

      <RelatedProjectSection relatedProject={post.relatedProject} />

      <div className="prose prose-neutral max-w-none text-[1.02rem] leading-8 prose-headings:font-[family-name:var(--font-display)] prose-headings:tracking-[-0.03em] prose-h2:mt-12 prose-h2:text-[1.8rem] prose-h2:leading-tight prose-h2:font-semibold prose-h3:mt-8 prose-h3:text-[1.35rem] prose-h3:leading-snug prose-h3:font-semibold prose-p:text-foreground/88 prose-p:leading-8 prose-li:leading-8 prose-blockquote:border-l-border prose-blockquote:text-foreground/78 prose-strong:text-foreground prose-a:text-foreground prose-a:decoration-muted-foreground/60 prose-a:underline-offset-4 hover:prose-a:text-primary prose-code:rounded prose-code:bg-muted/65 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.92em] prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/70 prose-pre:bg-card/80 prose-img:rounded-2xl prose-img:border prose-img:border-border/60 md:text-[1.06rem] md:leading-9 md:prose-h2:text-[2rem] md:prose-h3:text-[1.5rem]">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
