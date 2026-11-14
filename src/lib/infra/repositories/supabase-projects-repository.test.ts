import assert from "node:assert/strict";
import test from "node:test";

type Row = Record<string, unknown>;

type RecordedCall = {
  columns?: string;
  filters: Array<[string, unknown]>;
  operation: "select" | "insert" | "update" | "upsert";
  payload?: Row;
  table: string;
};

// 可串接的假 Supabase client：記錄每次查詢，await 時回傳 rows（陣列查詢）或第一筆（single / maybeSingle）。
function createFakeClient(rows: Row[]) {
  const calls: RecordedCall[] = [];

  function createBuilder(call: RecordedCall) {
    const arrayResult = { data: rows, error: null };
    const singleResult = { data: rows[0] ?? null, error: null };
    const builder = {
      eq(column: string, value: unknown) {
        call.filters.push([column, value]);
        return builder;
      },
      maybeSingle: async () => singleResult,
      order() {
        return builder;
      },
      select(columns: string) {
        call.columns = columns;
        return builder;
      },
      single: async () => singleResult,
      then(resolve: (value: typeof arrayResult) => unknown, reject?: (reason: unknown) => unknown) {
        return Promise.resolve(arrayResult).then(resolve, reject);
      },
    };

    return builder;
  }

  const client = {
    from(table: string) {
      const start = (operation: RecordedCall["operation"], payload?: Row) => {
        const call: RecordedCall = { filters: [], operation, payload, table };
        calls.push(call);
        return createBuilder(call);
      };

      return {
        delete: () => start("select"),
        insert: (payload: Row) => start("insert", payload),
        select: (columns: string) => start("select").select(columns),
        update: (payload: Row) => start("update", payload),
        upsert: (payload: Row) => start("upsert", payload),
      };
    },
    rpc: async () => ({ error: null }),
  };

  return { calls, client };
}

function createRow(overrides?: Row): Row {
  return {
    content_markdown: "內容",
    created_at: "2026-06-09T00:00:00.000Z",
    featured: true,
    id: "project-1",
    outcomes: ["成果一"],
    period: "2025",
    project_type: "work",
    published_at: "2026-06-09T00:00:00.000Z",
    role: "PM",
    slug: "sms-management-platform",
    sort_order: 1,
    status: "published",
    summary: "摘要",
    tags: [],
    title: "簡訊管理平台",
    updated_at: "2026-06-09T00:00:00.000Z",
    ...overrides,
  };
}

async function createRepository(rows: Row[]) {
  const loadedModule = await import("./supabase-projects-repository.ts").catch(() => null);

  assert.ok(loadedModule, "expected Supabase projects repository module to exist");

  const { calls, client } = createFakeClient(rows);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repository = new loadedModule.SupabaseProjectsRepository(client as any);

  return { calls, repository };
}

test("public project reads select project_type and expose it as projectType", async () => {
  const { calls, repository } = await createRepository([createRow({ project_type: "research" })]);

  const [list, bySlug, byId] = await Promise.all([
    repository.listPublishedProjects(),
    repository.getPublicProjectBySlug("sms-management-platform"),
    repository.getPublicProjectById("project-1"),
  ]);

  assert.equal(list[0]?.projectType, "research");
  assert.equal(bySlug?.projectType, "research");
  assert.equal(byId?.projectType, "research");

  for (const call of calls) {
    assert.match(call.columns ?? "", /(^|, )project_type(,|$)/, `expected ${call.columns} to include project_type`);
  }
});

test("public project reads turn an unknown or missing project_type into null instead of throwing", async () => {
  for (const value of ["legacy", null, undefined]) {
    const { repository } = await createRepository([createRow({ project_type: value })]);

    const [list, bySlug, byId] = await Promise.all([
      repository.listPublishedProjects(),
      repository.getPublicProjectBySlug("sms-management-platform"),
      repository.getPublicProjectById("project-1"),
    ]);

    assert.equal(list[0]?.projectType, null);
    assert.equal(bySlug?.projectType, null);
    assert.equal(byId?.projectType, null);
  }
});

test("getPublicProjectById only resolves published projects, so an unpublished related project yields no row", async () => {
  const { calls, repository } = await createRepository([]);

  const result = await repository.getPublicProjectById("project-unpublished");

  assert.equal(result, null);
  assert.deepEqual(calls[0]?.filters, [
    ["id", "project-unpublished"],
    ["status", "published"],
  ]);
});

test("admin project reads map project_type, with unknown values as null", async () => {
  const { repository } = await createRepository([createRow({ project_type: "side" })]);
  const [listed] = await repository.listAdminProjects();
  const single = await repository.getAdminProjectById("project-1");

  assert.equal(listed?.projectType, "side");
  assert.equal(single?.projectType, "side");

  const { repository: unknownRepository } = await createRepository([createRow({ project_type: "personal" })]);

  assert.equal((await unknownRepository.getAdminProjectById("project-1"))?.projectType, null);
});

test("createProject and upsertProject write project_type", async () => {
  const { calls, repository } = await createRepository([createRow()]);

  await repository.createProject({ projectType: "research", slug: "new-project", title: "New project" });
  await repository.upsertProject({ projectType: "work", slug: "sms-management-platform", status: "published", title: "簡訊管理平台" });

  assert.equal(calls[0]?.operation, "insert");
  assert.equal(calls[0]?.payload?.project_type, "research");
  assert.equal(calls[1]?.operation, "upsert");
  assert.equal(calls[1]?.payload?.project_type, "work");
});

test("updateProject writes project_type only when it is provided", async () => {
  const { calls, repository } = await createRepository([createRow()]);

  await repository.updateProject("project-1", { projectType: "side" });
  await repository.updateProject("project-1", { title: "Renamed" });

  assert.equal(calls[0]?.payload?.project_type, "side");
  assert.equal(Object.hasOwn(calls[1]?.payload ?? {}, "project_type"), false);
});
