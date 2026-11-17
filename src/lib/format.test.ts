import assert from "node:assert/strict";
import test from "node:test";

type FormatModule = {
  DISPLAY_TIME_ZONE: string;
  formatFullDate: (value: string) => string;
};

async function loadFormatModule(): Promise<FormatModule> {
  const loadedModule = await import("./format.ts").catch(() => null);

  assert.ok(loadedModule, "expected format module to exist at ./format.ts");

  return loadedModule as FormatModule;
}

test("formatYearMonth is gone: every date on the site shows the full day", async () => {
  const formatModule = (await loadFormatModule()) as unknown as Record<string, unknown>;
  const fs = await import("node:fs");
  const path = await import("node:path");

  assert.equal(formatModule.formatYearMonth, undefined);
  assert.equal(formatModule.DISPLAY_TIME_ZONE, "Asia/Taipei");

  for (const file of ["src/components/PostRow.tsx", "src/app/blog/[slug]/page.tsx", "src/components/RelatedPostsSection.tsx"]) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");

    assert.match(source, /<time dateTime=\{post\.date\}>\{formatFullDate\(post\.date\)\}<\/time>/, file);
  }
});

// SPEC-004：文章日期顯示到日，一律以台北時間判斷日期。
test("formatFullDate shows the year, month and day in Taipei time", async () => {
  const { formatFullDate } = await loadFormatModule();

  assert.equal(formatFullDate("2026-06-11T20:14:20Z"), "2026 年 6 月 12 日");
  assert.equal(formatFullDate("2026-06-12T15:59:59Z"), "2026 年 6 月 12 日");
  assert.equal(formatFullDate("2026-06-12T16:00:00Z"), "2026 年 6 月 13 日");
  assert.equal(formatFullDate("2026-12-31T16:00:00Z"), "2027 年 1 月 1 日");
  assert.equal(formatFullDate("2026-06-16T18:39:38.748+00:00"), "2026 年 6 月 17 日");
  assert.equal(formatFullDate(""), "");
  assert.equal(formatFullDate("not a date"), "");
});
