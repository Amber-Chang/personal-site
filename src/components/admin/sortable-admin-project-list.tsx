"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useState, useTransition } from "react";

import type { AdminProjectFormState } from "../../app/admin/projects/action-state.ts";
import type { ProjectRecord } from "../../lib/content/types.ts";
import { ContentStatusBadge } from "./content-status-badge.tsx";

function moveByOffset<TItem extends { id: string }>(items: TItem[], id: string, offset: -1 | 1) {
  const currentIndex = items.findIndex((item) => item.id === id);
  const nextIndex = currentIndex + offset;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, movedItem);

  return nextItems;
}

export function SortableAdminProjectList(input: {
  projects: ProjectRecord[];
  reorderAction: (idsInOrder: string[]) => Promise<AdminProjectFormState>;
}) {
  const router = useRouter();
  const [items, setItems] = useState(input.projects);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function persistOrder(nextItems: ProjectRecord[], previousItems: ProjectRecord[]) {
    const result = await input.reorderAction(nextItems.map((item) => item.id));

    if (result.error) {
      setItems(previousItems);
      setError(result.error);
      return;
    }

    setError(null);
    router.refresh();
  }

  function commitReorder(nextItems: ProjectRecord[]) {
    const previousItems = items;

    if (nextItems === previousItems) {
      return;
    }

    setItems(nextItems);
    startTransition(() => {
      void persistOrder(nextItems, previousItems);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/10 bg-black/[0.03] px-5 py-4 text-sm leading-6 text-black/65">
        後台列表由上到下的順序，會直接對應前台由上到下，或卡片 grid 的由左到右、再往下。
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {isPending ? <p className="text-sm text-black/50">排序儲存中...</p> : null}

      <div className="grid gap-4">
        {items.map((project, index) => (
          <article className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm" key={project.id}>
            <div className="flex min-h-[12.5rem] flex-col gap-5 md:flex-row md:items-stretch md:justify-between">
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ContentStatusBadge status={project.status} />
                  <span className="text-xs uppercase tracking-[0.18em] text-black/45">{project.slug}</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-black">{project.title}</h2>
                  <p className="min-h-[4.5rem] text-sm leading-6 text-black/65">{project.summary ?? "尚未填寫摘要。"}</p>
                </div>
                <p className="text-xs text-black/45">最後更新：{new Date(project.updatedAt).toLocaleString("zh-TW")}</p>
              </div>

              <div className="flex shrink-0 flex-row items-start justify-between gap-3 md:w-32 md:flex-col md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                  <button
                    aria-label={`將 ${project.title} 上移`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 text-black transition hover:border-black/25 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isPending || index === 0}
                    onClick={() => commitReorder(moveByOffset(items, project.id, -1))}
                    type="button"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    aria-label={`將 ${project.title} 下移`}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-black/10 text-black transition hover:border-black/25 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isPending || index === items.length - 1}
                    onClick={() => commitReorder(moveByOffset(items, project.id, 1))}
                    type="button"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                </div>
                <Link
                  className="inline-flex w-fit rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/25 hover:bg-black/[0.03]"
                  href={`/admin/projects/${project.id}`}
                >
                  編輯專案
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
