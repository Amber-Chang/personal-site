import assert from "node:assert/strict";
import test from "node:test";

type ProjectTypeModule = {
  PROJECT_TYPES: readonly string[];
  PROJECT_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: string }>;
  getProjectTypeLabel: (value: unknown) => string | null;
  isProjectType: (value: unknown) => boolean;
  normalizeProjectType: (value: unknown) => string | null;
};

async function loadProjectTypeModule(): Promise<ProjectTypeModule> {
  const loadedModule = await import("./project-type.ts").catch(() => null);

  assert.ok(loadedModule, "expected project type module to exist at ./project-type.ts");

  return loadedModule as ProjectTypeModule;
}

test("PROJECT_TYPES lists exactly work, research and side", async () => {
  const { PROJECT_TYPES } = await loadProjectTypeModule();

  assert.deepEqual([...PROJECT_TYPES], ["work", "research", "side"]);
});

test("getProjectTypeLabel maps each type to its Chinese label", async () => {
  const { getProjectTypeLabel } = await loadProjectTypeModule();

  assert.equal(getProjectTypeLabel("work"), "工作案例");
  assert.equal(getProjectTypeLabel("research"), "研究");
  assert.equal(getProjectTypeLabel("side"), "個人專案");
});

test("getProjectTypeLabel returns null for missing or unknown values instead of throwing", async () => {
  const { getProjectTypeLabel } = await loadProjectTypeModule();

  for (const value of [null, undefined, "", "Work", "personal", 1, {}]) {
    assert.equal(getProjectTypeLabel(value), null, `expected no label for ${JSON.stringify(value)}`);
  }
});

test("isProjectType only accepts the three exact values", async () => {
  const { isProjectType } = await loadProjectTypeModule();

  assert.equal(isProjectType("work"), true);
  assert.equal(isProjectType("research"), true);
  assert.equal(isProjectType("side"), true);

  for (const value of [null, undefined, "", " work", "WORK", "other", 0]) {
    assert.equal(isProjectType(value), false, `expected ${JSON.stringify(value)} to be rejected`);
  }
});

test("normalizeProjectType keeps known values and turns anything else into null", async () => {
  const { normalizeProjectType } = await loadProjectTypeModule();

  assert.equal(normalizeProjectType("research"), "research");
  assert.equal(normalizeProjectType(null), null);
  assert.equal(normalizeProjectType(undefined), null);
  assert.equal(normalizeProjectType("legacy"), null);
});

test("PROJECT_TYPE_OPTIONS gives the admin select one option per type in a fixed order", async () => {
  const { PROJECT_TYPE_OPTIONS } = await loadProjectTypeModule();

  assert.deepEqual(PROJECT_TYPE_OPTIONS, [
    { label: "工作案例", value: "work" },
    { label: "研究", value: "research" },
    { label: "個人專案", value: "side" },
  ]);
});
