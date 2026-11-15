// [AI-ASSISTED] Generated with Claude Code, 2026-02-22
// 功能：日期格式化工具。公開頁面的日期只顯示年和月，例如「2026 年 6 月」（SPEC-002）。

// 一律用台北時間判斷月份，不受伺服器（Vercel 是 UTC）或瀏覽器時區影響。
export const DISPLAY_TIME_ZONE = "Asia/Taipei";

const yearMonthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
});

export function formatYearMonth(dateStr: string): string {
  const date = new Date(dateStr);

  if (!dateStr || Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = yearMonthFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return year && month ? `${year} 年 ${month} 月` : "";
}
