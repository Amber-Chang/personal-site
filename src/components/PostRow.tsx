// 功能：文章列表的一列（SPEC-004）：細線分隔，上方是完整日期（台北時間），接著標題與摘要（有才顯示）。
// 整列可點，hover 時標題出現赤陶底線。只負責排版，資料由 data 模組整理。

import Link from "next/link";

import { formatFullDate } from "@/lib/format";

export type PostRowPost = {
  date: string;
  excerpt: string | null;
  slug: string;
  title: string;
};

export function PostRow({ post, headingLevel = "h2" }: { post: PostRowPost; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;

  return (
    <Link className="group focus-ring block border-b border-border py-5.5" href={`/blog/${post.slug}`}>
      <p className="text-label tracking-label text-muted-foreground">
        <time dateTime={post.date}>{formatFullDate(post.date)}</time>
      </p>
      <Heading className="mt-1.5 text-card-title font-semibold underline-offset-4 decoration-2 group-hover:underline decoration-terracotta">
        {post.title}
      </Heading>
      {post.excerpt ? <p className="mt-2 text-summary text-foreground-soft">{post.excerpt}</p> : null}
    </Link>
  );
}
