// 功能：首頁的案例區塊（SPEC-004）：細外框、白底，整塊可點。上方一列是類型（赤陶）、角色、期間，
// 接著標題、摘要與第一條成果（有才顯示）。hover 時外框變深、標題出現赤陶底線。只負責排版，資料由 data 模組整理。

import Link from "next/link";

export type CaseBlockProject = {
  firstOutcome: string | null;
  period: string | null;
  role: string | null;
  slug: string;
  summary: string;
  title: string;
  typeLabel: string | null;
};

export function CaseBlock({ project, headingLevel = "h2" }: { project: CaseBlockProject; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;

  return (
    <Link
      className="group focus-ring block rounded-block border border-border bg-card px-5.5 pb-4.5 pt-5 transition-colors hover:border-foreground"
      href={`/projects/${project.slug}`}
    >
      {project.typeLabel || project.role || project.period ? (
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-label tracking-label text-muted-foreground">
          {project.typeLabel ? <span className="font-semibold text-terracotta">{project.typeLabel}</span> : null}
          {project.role ? <span>{project.role}</span> : null}
          {project.period ? <span>{project.period}</span> : null}
        </p>
      ) : null}
      <Heading className="mt-1.5 text-card-title font-semibold underline-offset-4 decoration-2 group-hover:underline decoration-terracotta">
        {project.title}
      </Heading>
      <p className="mt-2 text-summary text-foreground-soft">{project.summary}</p>
      {project.firstOutcome ? (
        <p className="mt-3.5 border-t border-border pt-3 text-sm leading-6 text-muted-foreground">{project.firstOutcome}</p>
      ) : null}
    </Link>
  );
}
