import Link from "next/link";

import { getAdminPageContentService } from "./admin-context.ts";
import { loadAdminPostsPageData } from "./data.ts";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const service = await getAdminPageContentService();
  const { posts } = await loadAdminPostsPageData({
    service,
  });

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-6 py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-black/50">Blog Admin</p>
          <h1 className="text-3xl font-semibold text-black">管理文章</h1>
          <p className="max-w-2xl text-sm leading-6 text-black/65">
            這裡會列出目前資料庫中的 blog posts，可直接新增草稿或進入編輯頁。
          </p>
        </div>

        <Link
          className="inline-flex w-fit rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85"
          href="/admin/posts/new"
        >
          新增文章
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-4">
          {posts.map((post) => (
            <article
              className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
              key={post.id}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-black/45">
                    <span>{post.status}</span>
                    <span>{post.slug}</span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-black">{post.title}</h2>
                    <p className="text-sm leading-6 text-black/65">{post.excerpt ?? "尚未填寫摘要。"}</p>
                  </div>
                  <p className="text-xs text-black/45">最後更新：{new Date(post.updatedAt).toLocaleString("zh-TW")}</p>
                </div>

                <Link
                  className="inline-flex w-fit rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03]"
                  href={`/admin/posts/${post.id}`}
                >
                  編輯文章
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-8 text-sm leading-6 text-black/65">
          目前還沒有文章，先建立第一篇草稿吧。
        </section>
      )}
    </main>
  );
}
