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

export function PostCard({ post }: { post: PostCardPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-[1.5rem] border border-border/70 bg-card/30 px-5 py-5 transition-colors hover:border-foreground/35 md:px-6 md:py-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h3 className="max-w-lg text-lg font-medium tracking-tight group-hover:underline">{post.title}</h3>
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
