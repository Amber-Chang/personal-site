import Link from "next/link";
import { formatDate } from "@/lib/format";

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
    <section className="border-t border-border/70 pt-8">
      <div className="mb-5 space-y-2">
        <h2 className="text-base font-medium">延伸閱讀</h2>
        <p className="text-sm text-muted-foreground">如果你想從文章角度看這個案例，這幾篇可以接著讀。</p>
      </div>

      <div className="space-y-3">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block rounded-xl border border-border/70 p-4 transition-colors hover:border-foreground/35"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <h3 className="text-base font-medium leading-snug">{post.title}</h3>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(post.date)}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
