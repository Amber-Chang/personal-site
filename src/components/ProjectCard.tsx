// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：案例摘要卡片，顯示案例定位、角色、成果與標籤。

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProjectSummary } from "@/lib/content/types";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block rounded-xl border border-border/70 p-5 transition-colors hover:border-foreground/35"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h3 className="text-base font-medium group-hover:underline">{project.title}</h3>
          <p className="text-sm text-muted-foreground">{project.summary}</p>
        </div>
        {project.period ? (
          <span className="shrink-0 text-xs text-muted-foreground">{project.period}</span>
        ) : null}
      </div>

      {project.role ? <p className="mt-3 text-sm text-foreground/80">角色：{project.role}</p> : null}

      {project.outcomes.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {project.outcomes.slice(0, 2).map((outcome) => (
            <li key={outcome}>- {outcome}</li>
          ))}
        </ul>
      ) : null}

      {project.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
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
