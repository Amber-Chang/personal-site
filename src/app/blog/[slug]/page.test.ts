import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("blog post page renders the related project section between the header and article body", () => {
  const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /RelatedProjectSection/);
  assert.match(source, /<RelatedProjectSection relatedProject={post\.relatedProject} \/>/);
  assert.match(
    source,
    /<\/header>\s*<RelatedProjectSection relatedProject={post\.relatedProject} \/>\s*<div className="prose prose-neutral max-w-none">/s,
  );
});
