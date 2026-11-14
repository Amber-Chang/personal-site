import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const HEADLINE = "我把模糊的需求整理成可以上線的產品，並用 AI 把想法更快做成成果。";
const OLD_HEADLINE_PARTS = ["我用產品思維、系統理解與寫作", "整理那些在工作現場與生活裡還說不清楚的問題"];

function indexOfOrFail(source: string, marker: string) {
  const index = source.indexOf(marker);

  assert.notEqual(index, -1, `expected home page to contain ${marker}`);

  return index;
}

test("home page renders five sections in order: identity, projects, writing, about, contact", () => {
  const source = readSource("src/app/page.tsx");
  const order = [
    indexOfOrFail(source, "<h1"),
    indexOfOrFail(source, 'title="Projects"'),
    indexOfOrFail(source, 'title="Writing & Notes"'),
    indexOfOrFail(source, 'title="About"'),
    indexOfOrFail(source, 'title="Contact"'),
  ];

  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.equal(source.match(/<section\b/g)?.length, 5);
  assert.equal(source.match(/<h1\b/g)?.length, 1);
});

test("identity section has the new eyebrow, the new single headline and the two CTAs, without the old headline or Focus list", () => {
  const source = readSource("src/app/page.tsx");
  const headline = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "";

  assert.match(source, />\s*Product Manager \/ Product Builder\s*</);
  assert.equal(headline.replace(/\{" "\}/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, ""), HEADLINE.replace(/\s+/g, ""));
  assert.match(source, /href="\/projects"[\s\S]*?>\s*Projects\s*<\/Link>/);
  assert.match(source, /href="\/blog"[\s\S]*?>\s*Writing &amp; Notes\s*<\/Link>/);

  for (const part of OLD_HEADLINE_PARTS) {
    assert.doesNotMatch(source, new RegExp(part));
  }

  assert.doesNotMatch(source, /Focus/);
  assert.doesNotMatch(source, /AI-native workflow<\/li>/);
});

test("home metadata keeps the title and no longer uses the removed headline", () => {
  const source = readSource("src/app/page.tsx");
  const metadata = source.match(/export const metadata: Metadata = \{[\s\S]*?\n\};/)?.[0] ?? "";

  assert.match(metadata, /title: "Amber Chang — AI-native Product Builder"/);
  assert.match(metadata, /description:/);

  for (const part of ["我用產品思維、系統理解與寫作", "整理工作現場與生活裡那些還說不清楚的問題"]) {
    assert.doesNotMatch(metadata, new RegExp(part));
  }
});

test("about section shows the short text and links to /about", () => {
  const source = readSource("src/app/page.tsx");

  assert.match(source, />\s*我從教育現場、BD 與產品規劃，一路走到產品經理。現在是 AI 產品經理，協助公司進行組織 AI 化。\s*</);
  assert.match(source, /href="\/about"[\s\S]*?>\s*更多關於我\s*<\/Link>/);
});

test("contact section keeps the existing mailto link and adds no external links", () => {
  const source = readSource("src/app/page.tsx");

  assert.match(source, /href="mailto:taco5239@gmail\.com"/);
  assert.doesNotMatch(source, /href="https?:\/\//);
});

test("projects and writing sections read through the home data loaders and keep their empty states", () => {
  const source = readSource("src/app/page.tsx");

  assert.match(source, /loadHomeFeaturedProjectsData/);
  assert.match(source, /loadHomeWritingData/);
  assert.match(source, /目前還沒有公開案例。/);
  assert.doesNotMatch(source, /supabase|from\("projects"\)/i);
});

test("PostCard shows an excerpt line only when the post has one", () => {
  const source = readSource("src/components/PostCard.tsx");

  assert.match(source, /excerpt\?: string \| null;/);
  assert.match(source, /\{post\.excerpt \? <p className="[^"]*">\{post\.excerpt\}<\/p> : null\}/);
});
