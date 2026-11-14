import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("ProjectCard renders the prepared card data and only shows optional lines when they have a value", () => {
  const source = readSource("src/components/ProjectCard.tsx");

  assert.match(source, /import type \{ PublicProjectCard \} from "@\/lib\/content\/public-project";/);
  assert.match(source, /project: PublicProjectCard;/);
  assert.match(source, /project\.typeLabel \|\| project\.role/);
  assert.match(source, /project\.typeLabel \? <span>\{project\.typeLabel\}<\/span> : null/);
  assert.match(source, /project\.role \? <span>\{project\.role\}<\/span> : null/);
  assert.match(source, /\{project\.firstOutcome \? \(/);
  // 卡片不自己讀資料、不自己對應類型標籤，交給 mapPublicProjectCard。
  assert.doesNotMatch(source, /getProjectTypeLabel|projectType/);
  assert.doesNotMatch(source, /text-\[|rounded-\[|tracking-\[|leading-\[/);
});

test("project detail page shows the type label above the title only when there is one", () => {
  const source = readSource("src/app/projects/[slug]/page.tsx");

  assert.match(
    source,
    /\{project\.projectTypeLabel \? \(\s*<p className="text-label tracking-label text-muted-foreground">\{project\.projectTypeLabel\}<\/p>\s*\) : null\}\s*<h1/,
  );
});
