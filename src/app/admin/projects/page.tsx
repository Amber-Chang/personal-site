import Link from "next/link";

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
            這裡管理的是公開 project 內容來源；published 專案會同步出現在 `/projects`、首頁代表案例與文章關聯選單。
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
        <div className="grid gap-4">
          {projects.map((project) => (
            <article className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm" key={project.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-black/45">
                    <span>{project.status}</span>
                    <span>{project.slug}</span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-black">{project.title}</h2>
                    <p className="text-sm leading-6 text-black/65">{project.summary ?? "尚未填寫摘要。"}</p>
                  </div>
                  <p className="text-xs text-black/45">最後更新：{new Date(project.updatedAt).toLocaleString("zh-TW")}</p>
                </div>

                <Link
                  className="inline-flex w-fit rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03]"
                  href={`/admin/projects/${project.id}`}
                >
                  編輯專案
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-8 text-sm leading-6 text-black/65">
          目前還沒有可管理的專案，先建立第一個公開案例吧。
        </section>
      )}
    </main>
  );
}
