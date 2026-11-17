import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

// 首頁與文章列表的清單標題直接在頁面 H1 下面，所以是 h2（首頁的 H1 是身分區的定位句，文章列表的 H1 只給螢幕閱讀器）。
for (const component of ["CaseBlock", "PostRow"]) {
  test(`${component} takes a heading level prop that defaults to h2`, () => {
    const source = readSource(`src/components/${component}.tsx`);

    assert.match(source, /headingLevel\?: "h2" \| "h3"/);
    assert.match(source, /headingLevel = "h2"/);
    assert.match(source, /const Heading = headingLevel;/);
    assert.match(source, /<Heading className=/);
  });
}

test("home and blog pages keep the list titles at the default h2", () => {
  assert.match(readSource("src/app/page.tsx"), /<CaseBlock key=\{project\.slug\} project=\{project\} \/>/);
  assert.match(readSource("src/app/blog/page.tsx"), /<PostRow key=\{post\.slug\} post=\{post\} \/>/);
});
