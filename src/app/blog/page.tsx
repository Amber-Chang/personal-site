// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：文章列表頁，顯示所有已發布文章。

import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "文章 — Amber Chang",
  description: "Amber 的文章列表：AI 協作、產品管理、學習紀錄。",
  openGraph: {
    title: "文章 — Amber Chang",
    description: "Amber 的文章列表：AI 協作、產品管理、學習紀錄。",
  },
};

export default function BlogPage() {
  const posts = getPublishedPosts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">文章</h1>
        <p className="mt-2 text-sm text-muted-foreground">我在 AI、PM 工作與產品實作上的紀錄與思考。</p>
      </header>
      <div className="space-y-3">
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        ) : (
          <p className="text-sm text-muted-foreground">目前還沒有文章。</p>
        )}
      </div>
    </div>
  );
}
