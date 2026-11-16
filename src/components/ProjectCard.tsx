// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：案例摘要卡片。顯示類型標籤、標題與描述；首頁代表案例另外帶角色與第一條成果。
// 要顯示什麼由 mapPublicProjectCard 決定（src/lib/content/public-project.ts），卡片只負責排版。

import Link from "next/link";
import type { PublicProjectCard } from "@/lib/content/public-project";

// headingLevel：卡片標題的層級。列表頁直接在 H1 下面，用 h2；首頁在區塊 H2 下面，維持預設 h3。
export function ProjectCard({
  project,
  headingLevel = "h3",
}: {
  project: PublicProjectCard;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-block border border-border bg-card/40 px-5 py-5 transition-colors hover:border-strong md:px-7 md:py-6"
    >
      <div className="max-w-2xl space-y-2.5">
        {/* 類型與角色排成一行文字：角色很長時自然換行，分隔點跟著前面的類型，不會單獨掛在行尾。 */}
        {project.typeLabel || project.role ? (
          <p className="text-label tracking-label text-muted-foreground">
            {project.typeLabel ? <span>{project.typeLabel}</span> : null}
            {project.typeLabel && project.role ? (
              <span aria-hidden="true" className="mx-2 text-muted-foreground/40">
                ·
              </span>
            ) : null}
            {project.role ? <span>{project.role}</span> : null}
          </p>
        ) : null}
        <Heading className="text-card-title font-medium tracking-tight group-hover:underline">{project.title}</Heading>
        <p className="text-sm leading-7 text-muted-foreground">{project.summary}</p>
        {project.firstOutcome ? (
          <p className="border-t border-border pt-3 text-sm leading-6 text-foreground-soft">{project.firstOutcome}</p>
        ) : null}
      </div>
    </Link>
  );
}
