import assert from "node:assert/strict";
import test from "node:test";

type TextEditsModule = {
  getTextReplacement: (before: string, after: string) => { end: number; start: number; text: string };
};

async function loadModule(): Promise<TextEditsModule> {
  const loadedModule = await import("./text-edits.ts").catch(() => null);

  assert.ok(loadedModule, "expected text edits module to exist at ./text-edits.ts");

  return loadedModule as TextEditsModule;
}

// 套用：把 before 的 [start, end) 換成 text，應該得到 after。
function apply(before: string, replacement: { end: number; start: number; text: string }) {
  return before.slice(0, replacement.start) + replacement.text + before.slice(replacement.end);
}

test("getTextReplacement finds the smallest changed range between two values", async () => {
  const { getTextReplacement } = await loadModule();

  assert.deepEqual(getTextReplacement("前文後文", "前文![a](u)後文"), { end: 2, start: 2, text: "![a](u)" });
  assert.deepEqual(getTextReplacement("abc", "abc\n\n![a](u)"), { end: 3, start: 3, text: "\n\n![a](u)" });
  assert.deepEqual(getTextReplacement("a粗體b", "a**粗體**b"), { end: 3, start: 1, text: "**粗體**" });
  assert.deepEqual(getTextReplacement("## 標題", "標題"), { end: 3, start: 0, text: "" });
  assert.deepEqual(getTextReplacement("same", "same"), { end: 4, start: 4, text: "" });
});

test("applying the replacement always reproduces the new value, including repeated characters", async () => {
  const { getTextReplacement } = await loadModule();

  for (const [before, after] of [
    ["aaa", "aaaa"],
    ["- a\n- b", "a\nb"],
    ["", "| a | b |"],
    ["x**y**z", "x*y*z"],
    ["1. a\n2. b", "a\nb"],
  ]) {
    assert.equal(apply(before, getTextReplacement(before, after)), after, `${before} -> ${after}`);
  }
});
