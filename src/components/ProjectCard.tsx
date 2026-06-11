// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：案例摘要卡片，只顯示標題與描述。

import Link from "next/link";
import type { ProjectSummary } from "@/lib/content/types";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-[1.75rem] border border-border/70 bg-card/40 px-5 py-5 transition-colors hover:border-foreground/35 md:px-7 md:py-6"
    >
      <div className="max-w-2xl space-y-2.5">
        <h3 className="text-lg font-medium tracking-tight group-hover:underline">{project.title}</h3>
        <p className="text-sm leading-7 text-muted-foreground">{project.summary}</p>
      </div>
    </Link>
  );
}
