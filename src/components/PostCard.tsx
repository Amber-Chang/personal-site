// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：文章摘要卡片，顯示標題、日期、摘要（有才顯示）、標籤並連到文章頁。

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type PostCardPost = {
  date: string;
  // 首頁精選文章才會帶；沒有摘要時只顯示標題，不輸出空白段落。
  excerpt?: string | null;
  slug: string;
  tags: string[];
  title: string;
};

// headingLevel：卡片標題的層級。列表頁直接在 H1 下面，用 h2；首頁在區塊 H2 下面，維持預設 h3。
export function PostCard({ post, headingLevel = "h3" }: { post: PostCardPost; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-panel border border-border bg-card/30 px-5 py-5 transition-colors hover:border-strong md:px-6 md:py-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <Heading className="max-w-lg text-card-title font-medium tracking-tight group-hover:underline">{post.title}</Heading>
        <span className="shrink-0 pt-0.5 text-label uppercase tracking-caps text-muted-foreground">{formatDate(post.date)}</span>
      </div>
      {post.excerpt ? <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{post.excerpt}</p> : null}
      {post.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
