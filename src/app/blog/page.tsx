// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：文章列表頁，顯示所有已發布文章。

import type { Metadata } from "next";
import { PostCard } from "@/components/PostCard";
import { getPublicBlogContentService } from "./blog-context";
import { loadBlogIndexPageData } from "./data";

export const metadata: Metadata = {
  title: "Writing & Notes — Amber Chang",
  description: "Amber 的文章列表：AI 協作、產品管理、學習紀錄。",
  openGraph: {
    title: "Writing & Notes — Amber Chang",
    description: "Amber 的文章列表：AI 協作、產品管理、學習紀錄。",
  },
};

export const revalidate = 0;

export default async function BlogPage() {
  const { posts } = await loadBlogIndexPageData({
    service: getPublicBlogContentService(),
  });

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">Writing &amp; Notes</h1>
        <p className="text-sm text-muted-foreground">工作裡的思考，也一些生活裡的觀察。</p>
      </header>
      <div className="space-y-4 md:space-y-5">
        {posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        ) : (
          <p className="text-sm text-muted-foreground">目前還沒有文章。</p>
        )}
      </div>
    </div>
  );
}
