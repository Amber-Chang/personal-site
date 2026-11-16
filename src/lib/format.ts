// [AI-ASSISTED] Generated with Claude Code, 2026-02-22
// 功能：日期格式化工具。公開頁面的文章日期顯示到日，例如「2026 年 6 月 12 日」（SPEC-004，取代 SPEC-002 的只顯示年月）。

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

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
});

// 「2026 年 6 月 12 日」：以台北時間判斷是哪一天，例如 2026-06-12T16:00:00Z 已是台北 6/13。
export function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);

  if (!dateStr || Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = fullDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year} 年 ${month} 月 ${day} 日` : "";
}
