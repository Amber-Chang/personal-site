import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function relativeLuminance(hex: string) {
  const [red, green, blue] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}

// 頁面底色 --background 與卡片底色 --card 換算成 sRGB 的值（換算方式見 docs/design-tokens.md）。
const PAGE_BACKGROUND = "#fbfaf7";
const CARD_BACKGROUND = "#fefdfc";

test("the single accent colour is terracotta #A8452B and reads at 4.5:1 or more on the page and on cards", () => {
  const css = readSource("src/app/globals.css");
  const terracotta = css.match(/--color-terracotta: (#[0-9a-f]{6});/i)?.[1];

  assert.equal(terracotta?.toLowerCase(), "#a8452b");
  assert.ok(contrastRatio(terracotta ?? "", PAGE_BACKGROUND) >= 4.5);
  assert.ok(contrastRatio(terracotta ?? "", CARD_BACKGROUND) >= 4.5);
});

test("radii are small: 6px for controls and 8px for blocks and images; the large radius tokens are gone", () => {
  const css = readSource("src/app/globals.css");

  assert.match(css, /--radius-control: 0\.375rem;/);
  assert.match(css, /--radius-block: 0\.5rem;/);
  assert.doesNotMatch(css, /--radius-card|--radius-panel/);
});

test("the page has no background glow and the header is opaque without blur", () => {
  const css = readSource("src/app/globals.css");
  const header = readSource("src/components/Header.tsx");

  assert.doesNotMatch(css, /radial-gradient|linear-gradient/);
  assert.doesNotMatch(header, /backdrop-blur|bg-background\//);
});

test("keyboard focus uses a visible terracotta outline utility", () => {
  const css = readSource("src/app/globals.css");

  assert.match(css, /@utility focus-ring \{\s*&:focus-visible \{\s*outline: 2px solid var\(--color-terracotta\);\s*outline-offset: 3px;\s*\}\s*\}/);
});

// 公開頁面（不含後台與 shadcn 的 ui 元件）不再用大圓角、毛玻璃、半透明底與標題字體。
test("public pages no longer use the removed large radius, blur, translucent surfaces or the display font", () => {
  const roots = ["src/app", "src/components"];
  const files: string[] = [];

  for (const root of roots) {
    for (const entry of fs.readdirSync(path.join(process.cwd(), root), { recursive: true }) as string[]) {
      const relative = path.join(root, entry);

      if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry) || /(^|\/)admin(\/|$)/.test(entry) || entry.startsWith("ui/") || entry.startsWith("api/")) {
        continue;
      }

      files.push(relative);
    }
  }

  for (const file of files) {
    const source = readSource(file);

    assert.doesNotMatch(source, /rounded-card|rounded-panel|backdrop-blur|bg-background\/\d|font-display/, file);
  }
});
