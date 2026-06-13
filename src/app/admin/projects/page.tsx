import Link from "next/link";

import { SortableAdminProjectList } from "../../../components/admin/sortable-admin-project-list.tsx";
import { reorderAdminProjectsAction } from "./actions.ts";
import { getAdminPageContentService } from "../posts/admin-context.ts";
import { loadAdminProjectsPageData } from "./data.ts";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const service = await getAdminPageContentService();
  const { projects } = await loadAdminProjectsPageData({
    service,
  });

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col gap-4 px-6 py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-black/50">Project Admin</p>
          <h1 className="text-3xl font-semibold text-black">管理專案</h1>
          <p className="max-w-2xl text-sm leading-6 text-black/65">
            這裡管理的是公開 project 內容來源；可直接拖曳排序，且排序結果會同步影響 `/projects`、首頁代表案例與文章關聯脈絡。
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
          href="/admin/projects/new"
        >
          新增專案
        </Link>
      </div>

      {projects.length > 0 ? (
        <SortableAdminProjectList projects={projects} reorderAction={reorderAdminProjectsAction} />
      ) : (
        <section className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-8 text-sm leading-6 text-black/65">
          目前還沒有可管理的專案，先建立第一個公開案例吧。
        </section>
      )}
    </main>
  );
}
