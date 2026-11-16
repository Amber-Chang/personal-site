import assert from "node:assert/strict";
import test from "node:test";

type FormatModule = {
  DISPLAY_TIME_ZONE: string;
  formatYearMonth: (value: string) => string;
};

async function loadFormatModule(): Promise<FormatModule> {
  const loadedModule = await import("./format.ts").catch(() => null);

  assert.ok(loadedModule, "expected format module to exist at ./format.ts");

  return loadedModule as FormatModule;
}

test("formatYearMonth shows only the year and month as 2026 年 6 月", async () => {
  const { formatYearMonth } = await loadFormatModule();

  assert.equal(formatYearMonth("2026-06-16T18:39:38.748+00:00"), "2026 年 6 月");
  assert.equal(formatYearMonth("2026-12-31T00:00:00.000Z"), "2026 年 12 月");
});

test("formatYearMonth always uses Taipei time, whatever the server timezone", async () => {
  const { DISPLAY_TIME_ZONE, formatYearMonth } = await loadFormatModule();

  assert.equal(DISPLAY_TIME_ZONE, "Asia/Taipei");
  // Markdown 的 date: 2026-06-01 存成 UTC 午夜，台北是當天 08:00，不會跑到 5 月。
  assert.equal(formatYearMonth("2026-06-01T00:00:00Z"), "2026 年 6 月");
  // 台北 6/30 23:30 仍是 6 月。
  assert.equal(formatYearMonth("2026-06-30T15:30:00Z"), "2026 年 6 月");
  // 台北 7/1 00:30 已是 7 月。
  assert.equal(formatYearMonth("2026-06-30T16:30:00Z"), "2026 年 7 月");
  // 2026-06-30T23:30:00Z 在台北是 7/1 07:30，所以顯示 7 月（原需求範例寫成「不能是 7 月」，與固定台北時間矛盾，已回報）。
  assert.equal(formatYearMonth("2026-06-30T23:30:00Z"), "2026 年 7 月");
  // 跨年也一樣：UTC 12/31 16:00 是台北 1/1 00:00。
  assert.equal(formatYearMonth("2026-12-31T16:00:00Z"), "2027 年 1 月");
});

test("formatYearMonth returns an empty string for a missing or invalid date instead of throwing", async () => {
  const { formatYearMonth } = await loadFormatModule();

  assert.equal(formatYearMonth(""), "");
  assert.equal(formatYearMonth("not a date"), "");
});

test("post cards, the post page and related-post rows use formatYearMonth", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");

  for (const file of ["src/app/blog/[slug]/page.tsx", "src/components/RelatedPostsSection.tsx"]) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");

    assert.match(source, /formatYearMonth\(post\.date\)/, `${file} should format dates with formatYearMonth`);
    assert.doesNotMatch(source, /formatDate\(/, `${file} should not use the old day-level formatDate`);
  }
});

// SPEC-004：文章日期顯示到日，一律以台北時間判斷日期。
test("formatFullDate shows the year, month and day in Taipei time", async () => {
  const { formatFullDate } = (await loadFormatModule()) as unknown as { formatFullDate: (value: string) => string };

  assert.equal(formatFullDate("2026-06-11T20:14:20Z"), "2026 年 6 月 12 日");
  assert.equal(formatFullDate("2026-06-12T15:59:59Z"), "2026 年 6 月 12 日");
  assert.equal(formatFullDate("2026-06-12T16:00:00Z"), "2026 年 6 月 13 日");
  assert.equal(formatFullDate("2026-12-31T16:00:00Z"), "2027 年 1 月 1 日");
  assert.equal(formatFullDate("2026-06-16T18:39:38.748+00:00"), "2026 年 6 月 17 日");
  assert.equal(formatFullDate(""), "");
  assert.equal(formatFullDate("not a date"), "");
});
