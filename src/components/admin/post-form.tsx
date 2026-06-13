"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useState } from "react";

import type { AdminPostFormState } from "../../app/admin/posts/action-state.ts";
import { initialAdminPostFormState } from "../../app/admin/posts/action-state.ts";
import type { ContentStatus, ProjectOption } from "../../lib/content/types.ts";
import { ContentStatusBadge } from "./content-status-badge.tsx";

type AdminPostFormAction = (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;

type AdminPostFormValues = {
  contentMarkdown: string;
  excerpt: string;
  id?: string;
  relatedProjectId: string;
  slug: string;
  status: ContentStatus;
  title: string;
};

export function AdminPostForm(input: {
  action: AdminPostFormAction;
  cancelHref?: string;
  deleteAction?: (id: string) => Promise<AdminPostFormState>;
  description: string;
  projectOptions: ProjectOption[];
  submitLabel: string;
  title: string;
  values: AdminPostFormValues;
}) {
  const [state, formAction, pending] = useActionState(input.action, initialAdminPostFormState);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish" | "save">("save");
  const [deleteState, deleteFormAction, deletePending] = useActionState(async () => {
    if (!input.values.id || !input.deleteAction) {
      return initialAdminPostFormState;
    }

    return input.deleteAction(input.values.id);
  }, initialAdminPostFormState);
  const isPublished = input.values.status === "published";

  return (
    <div className="space-y-4 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-black/50">Blog Admin</p>
        <h1 className="text-3xl font-semibold text-black">{input.title}</h1>
        <p className="text-sm leading-6 text-black/65">{input.description}</p>
      </div>

      <form action={formAction} className="space-y-5">
        {input.values.id ? <input name="id" type="hidden" value={input.values.id} /> : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="title">
            Title
          </label>
          <p className="text-xs leading-5 text-black/55">文章標題，會顯示在列表頁和單篇頁最上方。</p>
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.title}
            id="title"
            name="title"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="slug">
            Slug
          </label>
          <p className="text-xs leading-5 text-black/55">網址識別字，會出現在 `/blog/你的-slug`，通常用小寫英文加連字號。</p>
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.slug}
            id="slug"
            name="slug"
            required
          />
        </div>

        <input name="intent" type="hidden" value={submitIntent} />
        <input name="status" type="hidden" value={input.values.status} />

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
          <span className="text-sm font-medium text-black">目前狀態</span>
          <ContentStatusBadge status={input.values.status} />
          <p className="text-sm text-black/55">
            {isPublished ? "公開文章會出現在前台 blog。" : "草稿不會出現在前台 blog。"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="excerpt">
            Excerpt
          </label>
          <p className="text-xs leading-5 text-black/55">文章摘要，會顯示在 blog 列表和首頁 writing 區塊。</p>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.excerpt}
            id="excerpt"
            name="excerpt"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="content_markdown">
            Markdown
          </label>
          <p className="text-xs leading-5 text-black/55">文章正文內容，支援 Markdown 語法。</p>
          <textarea
            className="min-h-64 w-full rounded-2xl border border-black/10 px-4 py-3 font-mono text-sm outline-none transition focus:border-black/30"
            defaultValue={input.values.contentMarkdown}
            id="content_markdown"
            name="content_markdown"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="related_project_id">
            Related project
          </label>
          <p className="text-xs leading-5 text-black/55">選填。需要時可把文章關聯到一個案例，方便之後延伸內容連動。</p>
          <select
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.relatedProjectId}
            id="related_project_id"
            name="related_project_id"
          >
            <option value="">不關聯任何案例</option>
            {input.projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-center">
          <button
            className="inline-flex w-fit rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/30"
            disabled={pending}
            onClick={() => setSubmitIntent("save")}
            type="submit"
          >
            {pending ? "儲存中..." : input.submitLabel}
          </button>

          {isPublished ? (
            <button
              className="inline-flex w-fit rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
              onClick={() => setSubmitIntent("draft")}
              type="submit"
            >
              取消發佈
            </button>
          ) : (
            <button
              className="inline-flex w-fit rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
              onClick={() => setSubmitIntent("publish")}
              type="submit"
            >
              發佈文章
            </button>
          )}

          <Link
            className="inline-flex w-fit rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03]"
            href={input.cancelHref ?? "/admin/posts"}
          >
            返回列表
          </Link>
        </div>
      </form>

      {input.values.id ? (
        <section className="space-y-3 rounded-3xl border border-red-200 bg-red-50/70 p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-red-800">刪除文章</h2>
            <p className="text-sm leading-6 text-red-700/80">
              {isPublished ? "這篇文章目前已上架，需先下架才能刪除。" : "這篇文章目前未上架，可以直接刪除。"}
            </p>
          </div>

          {isPublished ? (
            <p className="text-sm text-red-700/80">請先按上方「取消發佈」，確認變成未上架後再刪除。</p>
          ) : (
            <form action={deleteFormAction} className="flex flex-col gap-3 md:flex-row md:items-center">
              <button
                className="inline-flex w-fit rounded-full border border-red-300 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={deletePending}
                type="submit"
              >
                {deletePending ? "刪除中..." : "刪除文章"}
              </button>
              <p className="text-sm text-red-700/80">刪除後會直接回到文章列表，且此動作無法復原。</p>
            </form>
          )}

          {deleteState.error ? <p className="text-sm text-red-600">{deleteState.error}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
