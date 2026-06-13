import Link from "next/link";

import { SortableAdminPostList } from "../../../components/admin/sortable-admin-post-list.tsx";
import { reorderAdminPostsAction } from "./actions.ts";
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
            這裡會列出目前資料庫中的 blog posts，可直接拖曳排序、新增草稿，或進入編輯頁調整內容生命週期。
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="underline decoration-black/20 underline-offset-4 hover:text-black" href="/admin/posts">
              文章
            </Link>
            <Link className="underline decoration-black/20 underline-offset-4 hover:text-black" href="/admin/projects">
              專案
            </Link>
          </div>
        </div>

        <Link
          className="inline-flex w-fit rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85"
          href="/admin/posts/new"
        >
          新增文章
        </Link>
      </div>

      {posts.length > 0 ? (
        <SortableAdminPostList posts={posts} reorderAction={reorderAdminPostsAction} />
      ) : (
        <section className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-8 text-sm leading-6 text-black/65">
          目前還沒有文章，先建立第一篇草稿吧。
        </section>
      )}
    </main>
  );
}
