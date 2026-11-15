// 功能：把專案資料整理成公開卡片要顯示的內容（純函式，方便單元測試）。首頁與 /projects 共用。

import { getProjectTypeLabel } from "./project-type.ts";
import type { ProjectSummary } from "./types.ts";

export type PublicProjectCard = {
  firstOutcome: string | null;
  role: string | null;
  slug: string;
  summary: string;
  title: string;
  typeLabel: string | null;
};

function toNonEmptyText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

// highlights：首頁代表案例多顯示角色與第一條成果；/projects 列表只顯示類型、標題與摘要。
export function mapPublicProjectCard(project: ProjectSummary, options?: { highlights?: boolean }): PublicProjectCard {
  const highlights = options?.highlights ?? false;

  return {
    firstOutcome: highlights ? toNonEmptyText(project.outcomes[0]) : null,
    role: highlights ? toNonEmptyText(project.role) : null,
    slug: project.slug,
    summary: project.summary,
    title: project.title,
    typeLabel: getProjectTypeLabel(project.projectType),
  };
}
