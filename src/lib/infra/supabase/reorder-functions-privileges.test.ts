// 功能：確認排序函式只開放給伺服器使用的 service_role（架構檢視 F1）。
// reorder_blog_posts／reorder_projects 以 security definer 執行，若開放給 anon，任何拿到公開金鑰的人都能改網站排序。

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const MIGRATION_PATH = path.join(process.cwd(), "supabase/migrations/202611170001_restrict_reorder_functions.sql");

function readMigration() {
  assert.ok(fs.existsSync(MIGRATION_PATH), `expected migration at ${MIGRATION_PATH}`);
  return fs.readFileSync(MIGRATION_PATH, "utf8").toLowerCase().replace(/\s+/g, " ");
}

for (const fn of ["reorder_blog_posts", "reorder_projects"]) {
  test(`${fn} can no longer be executed by public, anon or authenticated`, () => {
    const sql = readMigration();
    assert.match(sql, new RegExp(`revoke execute on function public\\.${fn}\\(uuid\\[\\]\\) from public, anon, authenticated;`));
  });

  test(`${fn} stays executable by service_role`, () => {
    const sql = readMigration();
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}\\(uuid\\[\\]\\) to service_role;`));
  });
}

test("set_updated_at_timestamp gets a fixed, empty search_path", () => {
  const sql = readMigration();
  assert.match(sql, /alter function public\.set_updated_at_timestamp\(\) set search_path = '';/);
});

test("the admin reorder calls still go through the service-role repositories", () => {
  const factory = fs.readFileSync(path.join(process.cwd(), "src/lib/infra/repositories/factory.ts"), "utf8");
  assert.match(factory, /createAdminContentRepositories[\s\S]*createAdminSupabaseClient\(\)/);
});
