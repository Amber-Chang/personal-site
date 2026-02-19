// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：文章摘要卡片，顯示標題、日期、標籤並連到文章頁。

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-border/70 p-4 transition-colors hover:border-foreground/35"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-medium group-hover:underline">{post.title}</h3>
        <span className="shrink-0 text-xs text-muted-foreground">{post.date}</span>
      </div>
      {post.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
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
