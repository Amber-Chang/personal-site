"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AdminProjectFormState } from "../../app/admin/projects/action-state.ts";
import { initialAdminProjectFormState } from "../../app/admin/projects/action-state.ts";
import type { ContentStatus } from "../../lib/content/types.ts";

type AdminProjectFormAction = (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;

type AdminProjectFormValues = {
  contentMarkdown: string;
  featured: boolean;
  id?: string;
  outcomes: string;
  period: string;
  role: string;
  slug: string;
  status: ContentStatus;
  summary: string;
  tags: string;
  title: string;
};

export function AdminProjectForm(input: {
  action: AdminProjectFormAction;
  cancelHref?: string;
  description: string;
  submitLabel: string;
  title: string;
  values: AdminProjectFormValues;
}) {
  const [state, formAction, pending] = useActionState(input.action, initialAdminProjectFormState);

  return (
    <div className="space-y-4 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-black/50">Project Admin</p>
        <h1 className="text-3xl font-semibold text-black">{input.title}</h1>
        <p className="text-sm leading-6 text-black/65">{input.description}</p>
      </div>

      <form action={formAction} className="space-y-5">
        {input.values.id ? <input name="id" type="hidden" value={input.values.id} /> : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="title">
            Title
          </label>
          <p className="text-xs leading-5 text-black/55">專案標題，會顯示在後台清單、文章關聯選單，以及前台案例標題。</p>
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
          <p className="text-xs leading-5 text-black/55">網址識別字，需和前台 project route 對得上；若已存在對應 Markdown，改動前請先確認不會破壞路由。</p>
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.slug}
            id="slug"
            name="slug"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="summary">
            Summary
          </label>
          <p className="text-xs leading-5 text-black/55">最小摘要，會作為後台辨識與內容關聯脈絡使用。</p>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.summary}
            id="summary"
            name="summary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="role">
            Role
          </label>
          <p className="text-xs leading-5 text-black/55">前台案例卡與專案頁使用的角色描述。</p>
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.role}
            id="role"
            name="role"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="period">
            Period
          </label>
          <p className="text-xs leading-5 text-black/55">例如年份、季度或專案期間，用於前台卡片與案例頁。</p>
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.period}
            id="period"
            name="period"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="tags">
            Tags
          </label>
          <p className="text-xs leading-5 text-black/55">用逗號分隔，會顯示在前台案例卡與專案頁。</p>
          <input
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.tags}
            id="tags"
            name="tags"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="outcomes">
            Outcomes
          </label>
          <p className="text-xs leading-5 text-black/55">每行一個 outcome，會顯示在前台案例卡與專案頁。</p>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-black/10 px-4 py-3 text-base outline-none transition focus:border-black/30"
            defaultValue={input.values.outcomes}
            id="outcomes"
            name="outcomes"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="contentMarkdown">
            Content
          </label>
          <p className="text-xs leading-5 text-black/55">專案頁正文，使用 Markdown。</p>
          <textarea
            className="min-h-72 w-full rounded-2xl border border-black/10 px-4 py-3 font-mono text-sm outline-none transition focus:border-black/30"
            defaultValue={input.values.contentMarkdown}
            id="contentMarkdown"
            name="contentMarkdown"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor="status">
            Status
          </label>
          <p className="text-xs leading-5 text-black/55">published project 會出現在文章關聯選單，也會成為公開案例來源；draft project 只保留在後台。</p>
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

        <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-6 text-black/70">
          <input className="mt-1 size-4 rounded border-black/20" defaultChecked={input.values.featured} id="featured" name="featured" type="checkbox" />
          <span>Featured project 會出現在首頁代表案例區塊。</span>
        </label>

        <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-6 text-black/60">
          這個表單現在會直接管理公開 project 內容；若需要保留舊 Markdown，請另外透過 sync/import 流程維護。
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
            href={input.cancelHref ?? "/admin/projects"}
          >
            返回列表
          </Link>
        </div>
      </form>
    </div>
  );
}
