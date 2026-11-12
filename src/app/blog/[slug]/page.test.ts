import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("blog post page renders the related project section between the header and article body", () => {
  const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /RelatedProjectSection/);
  assert.match(source, /<RelatedProjectSection relatedProject={post\.relatedProject} \/>/);
  // 內文排版由共用的 Prose 元件負責（取代原本寫在頁面裡的 prose class）。
  assert.match(source, /import \{ Prose \} from "@\/components\/Prose";/);
  assert.match(
    source,
    /<\/header>\s*<RelatedProjectSection relatedProject={post\.relatedProject} \/>\s*<Prose>\s*<ReactMarkdown>\{post\.content\}<\/ReactMarkdown>\s*<\/Prose>/s,
  );
});
