// SPEC-004：案例列表併入首頁。/projects 永久轉址（308）到 /，/projects/[slug] 內頁不變；站內不再連到 /projects。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("next.config permanently redirects /projects to / and nothing else", async () => {
  const { default: config } = (await import("../../next.config.ts")) as {
    default: { redirects?: () => Promise<Array<{ destination: string; permanent: boolean; source: string }>> };
  };

  assert.ok(config.redirects, "expected next.config to define redirects");
  // permanent: true 讓 Next 回 308（保留請求方法的永久轉址）。
  assert.deepEqual(await config.redirects(), [{ destination: "/", permanent: true, source: "/projects" }]);
});

test("the old /projects list page and its data module are gone, the detail page stays", () => {
  assert.equal(fs.existsSync(path.join(process.cwd(), "src/app/projects/page.tsx")), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), "src/app/projects/data.ts")), false);
  assert.equal(fs.existsSync(path.join(process.cwd(), "src/app/projects/[slug]/page.tsx")), true);
});

test("no public page or component links to /projects any more", () => {
  const roots = ["src/app", "src/components"];

  for (const root of roots) {
    for (const entry of fs.readdirSync(path.join(process.cwd(), root), { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry) || /(^|\/)admin(\/|$)/.test(entry)) {
        continue;
      }

      const source = readSource(path.join(root, entry));

      assert.doesNotMatch(source, /href="\/projects"|href=\{"\/projects"\}|href: "\/projects"/, `${root}/${entry}`);
    }
  }
});

test("the project detail back link and the 404 page point to / with the text 案例", () => {
  assert.match(readSource("src/app/projects/[slug]/page.tsx"), /<BackLink href="\/" label="案例" \/>/);
  assert.match(readSource("src/app/not-found.tsx"), /href="\/"[\s\S]*?>\s*案例\s*</);
});
