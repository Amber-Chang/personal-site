// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：案例摘要卡片，顯示案例定位、角色、成果與標籤。

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "@/lib/content/types";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-[1.75rem] border border-border/70 bg-card/40 px-5 py-5 transition-colors hover:border-foreground/35 md:px-7 md:py-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl space-y-2.5">
          <h3 className="text-lg font-medium tracking-tight group-hover:underline">{project.title}</h3>
          <p className="text-sm leading-7 text-muted-foreground">{project.summary}</p>
        </div>
        {project.period ? (
          <span className="shrink-0 pt-0.5 text-xs uppercase tracking-[0.16em] text-muted-foreground md:text-right">{project.period}</span>
        ) : null}
      </div>

      {project.role ? <p className="mt-5 text-sm text-foreground/80">角色：{project.role}</p> : null}

      {project.outcomes.length > 0 ? (
        <ul className="mt-4 space-y-1.5 text-sm leading-7 text-muted-foreground">
          {project.outcomes.slice(0, 2).map((outcome) => (
            <li key={outcome}>- {outcome}</li>
          ))}
        </ul>
      ) : null}

      {project.tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
