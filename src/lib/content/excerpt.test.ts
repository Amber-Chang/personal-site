import assert from "node:assert/strict";
import test from "node:test";

type ExcerptModule = {
  HOME_EXCERPT_MAX_LENGTH: number;
  normalizeExcerpt: (value: string | null | undefined, maxLength?: number) => string | null;
};

async function loadExcerptModule(): Promise<ExcerptModule> {
  const loadedModule = await import("./excerpt.ts").catch(() => null);

  assert.ok(loadedModule, "expected excerpt module to exist at ./excerpt.ts");

  return loadedModule as ExcerptModule;
}

test("normalizeExcerpt returns null for a missing or blank excerpt", async () => {
  const { normalizeExcerpt } = await loadExcerptModule();

  for (const value of [null, undefined, "", "   ", "\r\n\r\n", "　"]) {
    assert.equal(normalizeExcerpt(value), null, `expected null for ${JSON.stringify(value)}`);
  }
});

test("normalizeExcerpt joins CRLF-separated Chinese sentences without leaving a gap", async () => {
  const { normalizeExcerpt } = await loadExcerptModule();

  assert.equal(
    normalizeExcerpt("很長一段時間，我以為自己的職涯很混亂。\r\n\r\n我當過老師、BD、產品經理。", 200),
    "很長一段時間，我以為自己的職涯很混亂。我當過老師、BD、產品經理。",
  );
});

test("normalizeExcerpt keeps one space where a line break or run of spaces sits next to Latin text", async () => {
  const { normalizeExcerpt } = await loadExcerptModule();

  assert.equal(normalizeExcerpt("現在又沉迷於 AI Agent\n\n這些工作", 200), "現在又沉迷於 AI Agent 這些工作");
  assert.equal(normalizeExcerpt("  side   project\t如何  ", 200), "side project 如何");
});

test("normalizeExcerpt leaves an excerpt at or under the limit untouched", async () => {
  const { normalizeExcerpt } = await loadExcerptModule();
  const exact = "一".repeat(10);

  assert.equal(normalizeExcerpt(exact, 10), exact);
});

test("normalizeExcerpt truncates a long excerpt to the limit and ends it with an ellipsis", async () => {
  const { normalizeExcerpt } = await loadExcerptModule();
  const result = normalizeExcerpt("一二三四五六七八九十十一", 10);

  assert.equal(result, "一二三四五六七八九十…");
});

test("normalizeExcerpt does not leave a comma or stray space right before the ellipsis", async () => {
  const { normalizeExcerpt } = await loadExcerptModule();

  assert.equal(normalizeExcerpt("一二三四五六七八九，十一十二", 10), "一二三四五六七八九…");
  assert.equal(normalizeExcerpt("abcd efgh, ijkl mnop", 10), "abcd efgh…");
});

test("normalizeExcerpt counts characters, not UTF-16 units, so emoji are never cut in half", async () => {
  const { normalizeExcerpt } = await loadExcerptModule();

  assert.equal(normalizeExcerpt("😀😀😀😀", 2), "😀😀…");
});

test("the home page limit is 80 characters", async () => {
  const { HOME_EXCERPT_MAX_LENGTH, normalizeExcerpt } = await loadExcerptModule();
  const result = normalizeExcerpt("字".repeat(120));

  assert.equal(HOME_EXCERPT_MAX_LENGTH, 80);
  assert.equal(Array.from(result ?? "").length, 81);
  assert.ok(result?.endsWith("…"));
});
