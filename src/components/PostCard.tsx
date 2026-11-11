// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：文章摘要卡片，顯示標題、日期、標籤並連到文章頁。

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

type PostCardPost = {
  date: string;
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
      className="group block rounded-[1.5rem] border border-border bg-card/30 px-5 py-5 transition-colors hover:border-strong md:px-6 md:py-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <Heading className="max-w-lg text-lg font-medium tracking-tight group-hover:underline">{post.title}</Heading>
        <span className="shrink-0 pt-0.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">{formatDate(post.date)}</span>
      </div>
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
