import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("admin sortable post list uses button-based ordering and keeps public-ordering helper copy", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/admin/sortable-admin-post-list.tsx"), "utf8");

  assert.doesNotMatch(source, /draggable=\{!isPending\}/);
  assert.doesNotMatch(source, /拖曳排序/);
  assert.match(source, /由左到右、再往下/);
  assert.match(source, /min-h-\[12\.5rem\]/);
  assert.match(source, /min-h-\[4\.5rem\]/);
  assert.match(source, /ContentStatusBadge status=\{post\.status\}/);
});

test("admin sortable project list uses button-based ordering and keeps public-ordering helper copy", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/admin/sortable-admin-project-list.tsx"), "utf8");

  assert.doesNotMatch(source, /draggable=\{!isPending\}/);
  assert.doesNotMatch(source, /拖曳排序/);
  assert.match(source, /由左到右、再往下/);
  assert.match(source, /min-h-\[12\.5rem\]/);
  assert.match(source, /min-h-\[4\.5rem\]/);
  assert.match(source, /ContentStatusBadge status=\{project\.status\}/);
});

test("admin index pages render sortable list components wired to reorder actions", () => {
  const postsPageSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/posts/page.tsx"), "utf8");
  const projectsPageSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/projects/page.tsx"), "utf8");

  assert.match(postsPageSource, /SortableAdminPostList/);
  assert.match(postsPageSource, /reorderAdminPostsAction/);
  assert.match(projectsPageSource, /SortableAdminProjectList/);
  assert.match(projectsPageSource, /reorderAdminProjectsAction/);
});
