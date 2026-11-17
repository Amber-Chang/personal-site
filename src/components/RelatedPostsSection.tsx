// 功能：案例內頁底部的「延伸閱讀」（SPEC-004）：上方一條深色線，每篇是標題加完整日期，細線分隔。沒有關聯文章時不顯示。

import Link from "next/link";
import { formatFullDate } from "@/lib/format";

type RelatedPost = {
  date: string;
  description: string;
  slug: string;
  title: string;
};

export function RelatedPostsSection({ relatedPosts }: { relatedPosts: RelatedPost[] }) {
  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-posts-heading" className="mt-14 border-t border-foreground pt-3.5">
      <h2 className="text-base font-semibold" id="related-posts-heading">
        延伸閱讀
      </h2>
      <ul className="mt-1">
        {relatedPosts.map((post) => (
          <li className="border-b border-border" key={post.slug}>
            <Link className="group focus-ring block py-3.5" href={`/blog/${post.slug}`}>
              <span className="block font-semibold underline-offset-4 decoration-2 group-hover:underline decoration-terracotta">
                {post.title}
              </span>
              <span className="mt-0.5 block text-label tracking-label text-muted-foreground">
                <time dateTime={post.date}>{formatFullDate(post.date)}</time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
