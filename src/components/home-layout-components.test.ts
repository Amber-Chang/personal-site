// SPEC-004 共用元件：身分區、分頁、案例區塊、文章項目。這些元件只負責結構與樣式，用原始碼檢查。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const LEDE = "我把模糊的需求整理成可以上線的產品，並用 AI 把想法更快做成成果。";
const BIO = "我從教育現場、BD 與產品規劃，一路走到產品經理。現在是 AI 產品經理，協助公司進行組織 AI 化。";

test("IdentityColumn shows the agreed identity copy and the two actions", () => {
  const source = readSource("src/components/IdentityColumn.tsx");

  assert.match(source, /src="\/amber-avatar\.png"/);
  assert.match(source, /rounded-full/);
  assert.match(source, />\s*Amber Chang\s*</);
  assert.match(source, />\s*Product Manager \/ Product Builder\s*</);
  assert.ok(source.includes(LEDE));
  assert.ok(source.includes(BIO));
  assert.match(source, /href="\/about"[\s\S]*?>\s*更多關於我\s*</);
  assert.match(source, /href="mailto:taco5239@gmail\.com"[\s\S]*?>\s*寫信給我\s*</);
  assert.doesNotMatch(source, /開放工作機會|求職|Open to work/i);
});

test("IdentityColumn renders the positioning line as the page H1 only when asked", () => {
  const source = readSource("src/components/IdentityColumn.tsx");

  assert.match(source, /ledeAs = "h1"/);
  assert.match(source, /ledeAs\?: "h1" \| "p"/);
  assert.match(source, /const Lede = ledeAs;/);
  // 姓名不是標題，避免和頁面的 H1 搶層級。
  assert.doesNotMatch(source, /<h[1-6][^>]*>\s*Amber Chang/);
});

test("IdentityColumn sticks only on wide and tall enough windows", () => {
  const source = readSource("src/components/IdentityColumn.tsx");

  // lg 以上且視窗夠高（tall：40rem）時才固定；矮視窗照常捲動，左欄不會被切掉。
  assert.match(source, /lg:tall:sticky lg:tall:top-24/);
});

test("primary and secondary buttons are small-radius links with a 44px target and a focus ring", () => {
  const source = readSource("src/components/button-styles.ts");

  assert.match(source, /export const primaryButtonClassName =/);
  assert.match(source, /export const secondaryButtonClassName =/);
  assert.match(source, /bg-foreground[^"]*text-background/);
  assert.match(source, /min-h-11/);
  assert.match(source, /rounded-control/);
  assert.match(source, /focus-ring/);
  assert.doesNotMatch(source, /rounded-full|terracotta/);
});

test("ContentTabs are plain links to / and /blog with counts and aria-current", () => {
  const source = readSource("src/components/ContentTabs.tsx");

  assert.doesNotMatch(source, /^"use client";/m);
  assert.match(source, /<nav aria-label="內容分類"/);
  assert.match(source, /href: "\/"[\s\S]*?label: "案例"/);
  assert.match(source, /href: "\/blog"[\s\S]*?label: "文章"/);
  assert.match(source, /aria-current=\{tab\.key === active \? "page" : undefined\}/);
  assert.match(source, /aria-\[current=page\]:border-terracotta/);
  assert.match(source, /\{tab\.count\}/);
  assert.match(source, /min-h-11/);
  assert.doesNotMatch(source, /onClick|useState|role="tab"/);
});

test("CaseBlock is an outlined block with type, role, period, title, summary and first outcome", () => {
  const source = readSource("src/components/CaseBlock.tsx");

  assert.match(source, /href=\{`\/projects\/\$\{project\.slug\}`\}/);
  assert.match(source, /rounded-block border border-border bg-card/);
  assert.match(source, /hover:border-foreground/);
  assert.match(source, /text-terracotta">\{project\.typeLabel\}/);
  assert.match(source, /\{project\.role\}/);
  assert.match(source, /\{project\.period\}/);
  assert.match(source, /headingLevel = "h2"/);
  assert.match(source, /group-hover:underline decoration-terracotta/);
  assert.match(source, /project\.firstOutcome \? \(/);
  assert.doesNotMatch(source, /shadow|rounded-full/);
});

test("PostRow is a thin-rule row with the full date, title and optional excerpt", () => {
  const source = readSource("src/components/PostRow.tsx");

  assert.match(source, /href=\{`\/blog\/\$\{post\.slug\}`\}/);
  assert.match(source, /border-b border-border/);
  assert.match(source, /<time dateTime=\{post\.date\}>\{formatFullDate\(post\.date\)\}<\/time>/);
  assert.match(source, /headingLevel = "h2"/);
  assert.match(source, /group-hover:underline decoration-terracotta/);
  assert.match(source, /post\.excerpt \? /);
  assert.doesNotMatch(source, /rounded|shadow|bg-card/);
});

test("Header keeps only About plus the admin links, with no Menu button", () => {
  const source = readSource("src/components/Header.tsx");

  assert.match(source, /href="\/"[\s\S]*?>\s*Amber Chang\s*</);
  assert.match(source, /href="\/about"/);
  assert.doesNotMatch(source, /href="\/projects"|href="\/blog"/);
  assert.doesNotMatch(source, /<details|<summary|Menu/);
  assert.doesNotMatch(source, /backdrop-blur|rounded-full/);
  assert.match(source, /showAdminAffordance \? \(/);
});

test("Footer keeps the name and email without repeating the header navigation", () => {
  const source = readSource("src/components/Footer.tsx");

  assert.match(source, /Amber Chang/);
  assert.match(source, /href="mailto:taco5239@gmail\.com"/);
  assert.doesNotMatch(source, /href="\/projects"|href="\/blog"|href="\/about"|<nav/);
});
