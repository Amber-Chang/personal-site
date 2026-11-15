import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const EDITOR_PAGES = [
  "src/app/admin/posts/new/page.tsx",
  "src/app/admin/posts/[id]/page.tsx",
  "src/app/admin/projects/new/page.tsx",
  "src/app/admin/projects/[id]/page.tsx",
];

test("only the four post and project editor pages widen to max-w-7xl from lg up", () => {
  for (const page of EDITOR_PAGES) {
    assert.match(
      readSource(page),
      /<main className="mx-auto flex min-h-\[60vh\] w-full max-w-4xl flex-col px-6 py-16 lg:max-w-7xl lg:px-0" data-admin-editor>/,
      page,
    );
  }

  for (const page of ["src/app/admin/posts/page.tsx", "src/app/admin/projects/page.tsx", "src/app/admin/login/page.tsx"]) {
    assert.doesNotMatch(readSource(page), /max-w-7xl|data-admin-editor/, page);
  }
});

test("the root layout lifts its max-w-5xl cap only for pages that contain an admin editor", () => {
  const layout = readSource("src/app/layout.tsx");

  // 全站內容外框是 max-w-5xl；只有含 data-admin-editor 的頁面（後台四個編輯頁）在 lg 以上放寬到 max-w-7xl。
  assert.match(
    layout,
    /<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6 md:py-14 lg:has-\[\[data-admin-editor\]\]:max-w-7xl">/,
  );
});

test("the narrow-children rule keeps everything except data-admin-wide blocks at the old width (49rem)", async () => {
  const layoutModule = await import("./admin-editor-layout.ts").catch(() => null);

  assert.ok(layoutModule, "expected admin editor layout module to exist at ./admin-editor-layout.ts");
  assert.equal(
    (layoutModule as { ADMIN_EDITOR_NARROW_CHILDREN: string }).ADMIN_EDITOR_NARROW_CHILDREN,
    "lg:[&>*:not([data-admin-wide])]:max-w-[49rem]",
  );
});

test("forms cap their header, fields and delete box; only the Markdown editor and preview row use the full width", () => {
  for (const form of ["src/components/admin/post-form.tsx", "src/components/admin/project-form.tsx"]) {
    const source = readSource(form);

    assert.match(source, /className=\{`space-y-4 rounded-3xl border border-black\/10 bg-white\/80 p-8 shadow-sm \$\{ADMIN_EDITOR_NARROW_CHILDREN\}`\}/, form);
    assert.match(source, /<form action=\{formAction\} className=\{`space-y-5 \$\{ADMIN_EDITOR_NARROW_CHILDREN\}`\} data-admin-wide>/, form);
  }

  const field = readSource("src/components/admin/markdown-content-field.tsx");

  assert.match(field, /<div className=\{`space-y-2 \$\{ADMIN_EDITOR_NARROW_CHILDREN\}`\} data-admin-wide>/);
  assert.match(field, /<div className=\{isWide \? "grid grid-cols-2 gap-4" : undefined\} data-admin-wide>/);
});
