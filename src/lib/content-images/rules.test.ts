import assert from "node:assert/strict";
import test from "node:test";

type RulesModule = {
  CONTENT_IMAGE_BUCKET: string;
  CONTENT_IMAGE_MAX_BYTES: number;
  CONTENT_IMAGE_SIZE_ERROR: string;
  CONTENT_IMAGE_TYPE_ERROR: string;
  CONTENT_IMAGE_TYPES: readonly string[];
  createContentImageObjectName: (contentType: string, randomId: () => string) => string;
  getContentImageSizeError: (size: unknown) => string | null;
  getContentImageTypeError: (contentType: unknown) => string | null;
};

async function loadRules(): Promise<RulesModule> {
  const loadedModule = await import("./rules.ts").catch(() => null);

  assert.ok(loadedModule, "expected content image rules module to exist at ./rules.ts");

  return loadedModule as RulesModule;
}

test("content image rules match the bucket settings in the migration", async () => {
  const rules = await loadRules();

  assert.equal(rules.CONTENT_IMAGE_BUCKET, "content-images");
  assert.equal(rules.CONTENT_IMAGE_MAX_BYTES, 5_242_880);
  assert.deepEqual([...rules.CONTENT_IMAGE_TYPES], ["image/png", "image/jpeg", "image/webp", "image/gif"]);
  assert.equal(rules.CONTENT_IMAGE_TYPE_ERROR, "只能上傳 PNG、JPG、WebP 或 GIF 圖片。");
  assert.equal(rules.CONTENT_IMAGE_SIZE_ERROR, "圖片不能超過 5MB。");
});

test("only the four allowed image types pass the type check", async () => {
  const { CONTENT_IMAGE_TYPE_ERROR, getContentImageTypeError } = await loadRules();

  for (const allowed of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
    assert.equal(getContentImageTypeError(allowed), null, allowed);
  }

  for (const rejected of ["image/svg+xml", "image/PNG", "text/html", "", undefined, null, 1, ["image/png"]]) {
    assert.equal(getContentImageTypeError(rejected), CONTENT_IMAGE_TYPE_ERROR, String(rejected));
  }
});

test("the declared size must be a positive number no larger than 5MB", async () => {
  const { CONTENT_IMAGE_SIZE_ERROR, getContentImageSizeError } = await loadRules();

  assert.equal(getContentImageSizeError(1), null);
  assert.equal(getContentImageSizeError(5_242_880), null);

  for (const rejected of [0, -1, 5_242_881, Number.NaN, Number.POSITIVE_INFINITY, "1000", null, undefined, {}]) {
    assert.equal(getContentImageSizeError(rejected), CONTENT_IMAGE_SIZE_ERROR, String(rejected));
  }
});

test("object names are a random id plus an extension chosen from the content type", async () => {
  const { createContentImageObjectName } = await loadRules();
  const randomId = () => "0f8fad5b-d9cb-469f-a165-70867728950e";

  assert.equal(createContentImageObjectName("image/png", randomId), "0f8fad5b-d9cb-469f-a165-70867728950e.png");
  assert.equal(createContentImageObjectName("image/jpeg", randomId), "0f8fad5b-d9cb-469f-a165-70867728950e.jpg");
  assert.equal(createContentImageObjectName("image/webp", randomId), "0f8fad5b-d9cb-469f-a165-70867728950e.webp");
  assert.equal(createContentImageObjectName("image/gif", randomId), "0f8fad5b-d9cb-469f-a165-70867728950e.gif");
  assert.throws(() => createContentImageObjectName("image/svg+xml", randomId));
});
