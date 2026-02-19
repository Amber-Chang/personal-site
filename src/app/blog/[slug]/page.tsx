// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：單篇文章頁，依 slug 讀取 Markdown 並進行 SSG。

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "文章不存在",
    };
  }

  return {
    title: `${post.title} | Amber Chang`,
    description: `${post.title}（${post.date}）`,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <header className="mb-8 border-b border-border/70 pb-5">
        <h1 className="text-3xl font-semibold leading-tight">{post.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{post.date}</p>
      </header>

      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
