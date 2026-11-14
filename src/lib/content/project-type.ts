// 功能：專案類型的唯一定義：可用的值、中文標籤、判斷與轉換。前台、後台與 repository 都從這裡取。
// 資料庫欄位 projects.project_type 的 CHECK 也是這三個值（supabase/migrations/202611150001_add_project_type.sql）。

export const PROJECT_TYPES = ["work", "research", "side"] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  work: "工作案例",
  research: "研究",
  side: "個人專案",
};

export const PROJECT_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: ProjectType }> = PROJECT_TYPES.map((value) => ({
  label: PROJECT_TYPE_LABELS[value],
  value,
}));

export function isProjectType(value: unknown): value is ProjectType {
  return typeof value === "string" && (PROJECT_TYPES as readonly string[]).includes(value);
}

// 讀取端用：不認得的值（例如資料庫被手動改過）轉成 null，讓公開頁面只是不顯示標籤，不會報錯。
export function normalizeProjectType(value: unknown): ProjectType | null {
  return isProjectType(value) ? value : null;
}

export function getProjectTypeLabel(value: unknown): string | null {
  const projectType = normalizeProjectType(value);

  return projectType ? PROJECT_TYPE_LABELS[projectType] : null;
}
