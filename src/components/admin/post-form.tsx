"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AdminPostFormState } from "../../app/admin/posts/actions.ts";
import { initialAdminPostFormState } from "../../app/admin/posts/actions.ts";
import type { ContentStatus, ProjectOption } from "../../lib/content/types.ts";

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
  description: string;
  projectOptions: ProjectOption[];
  submitLabel: string;
  title: string;
  values: AdminPostFormValues;
}) {
  const [state, formAction, pending] = useActionState(input.action, initialAdminPostFormState);

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
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.title}
            id="title"
            name="title"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-black" htmlFor="slug">
              Slug
            </label>
            <input
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
              defaultValue={input.values.slug}
              id="slug"
              name="slug"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-black" htmlFor="status">
              Status
            </label>
            <select
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none transition focus:border-black/30"
              defaultValue={input.values.status}
              id="status"
              name="status"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="excerpt">
            Excerpt
          </label>
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
            type="submit"
          >
            {pending ? "儲存中..." : input.submitLabel}
          </button>

          <Link
            className="inline-flex w-fit rounded-full border border-black/10 px-5 py-3 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03]"
            href={input.cancelHref ?? "/admin/posts"}
          >
            返回列表
          </Link>
        </div>
      </form>
    </div>
  );
}
