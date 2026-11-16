// 功能：把專案資料整理成首頁案例區塊要顯示的內容（純函式，方便單元測試）。

import { getProjectTypeLabel } from "./project-type.ts";
import type { ProjectSummary } from "./types.ts";

export type PublicProjectCard = {
  firstOutcome: string | null;
  period: string | null;
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

// 案例區塊顯示：類型、角色、期間（後台填寫的文字，不轉換）、標題、摘要、第一條成果；空白的欄位不顯示。
export function mapPublicProjectCard(project: ProjectSummary): PublicProjectCard {
  return {
    firstOutcome: toNonEmptyText(project.outcomes[0]),
    period: toNonEmptyText(project.period),
    role: toNonEmptyText(project.role),
    slug: project.slug,
    summary: project.summary,
    title: project.title,
    typeLabel: getProjectTypeLabel(project.projectType),
  };
}
