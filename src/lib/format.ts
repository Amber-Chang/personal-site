// [AI-ASSISTED] Generated with Claude Code, 2026-02-22
// 功能：日期格式化工具

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
