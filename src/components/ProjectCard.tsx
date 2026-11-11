// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：案例摘要卡片，只顯示標題與描述。

import Link from "next/link";
import type { ProjectSummary } from "@/lib/content/types";

// headingLevel：卡片標題的層級。列表頁直接在 H1 下面，用 h2；首頁在區塊 H2 下面，維持預設 h3。
export function ProjectCard({
  project,
  headingLevel = "h3",
}: {
  project: ProjectSummary;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-[1.75rem] border border-border bg-card/40 px-5 py-5 transition-colors hover:border-strong md:px-7 md:py-6"
    >
      <div className="max-w-2xl space-y-2.5">
        <Heading className="text-lg font-medium tracking-tight group-hover:underline">{project.title}</Heading>
        <p className="text-sm leading-7 text-muted-foreground">{project.summary}</p>
      </div>
    </Link>
  );
}
