import assert from "node:assert/strict";
import test from "node:test";

import { createPageViewProperties } from "./pageview.ts";

test("createPageViewProperties builds base public pageview payload", () => {
  assert.deepEqual(
    createPageViewProperties({
      contentType: "home",
      sourceTemplate: "home",
    }),
    {
      content_type: "home",
      section: "public",
      source_template: "home",
    },
  );
});

test("createPageViewProperties includes optional content metadata when provided", () => {
  assert.deepEqual(
    createPageViewProperties({
      contentSlug: "ai-writing-review-product",
      contentTitle: "AI Writing Review Product",
      contentType: "project",
      sourceTemplate: "project_detail",
      tags: ["ai", "product"],
    }),
    {
      content_slug: "ai-writing-review-product",
      content_title: "AI Writing Review Product",
      content_type: "project",
      section: "public",
      source_template: "project_detail",
      tags: ["ai", "product"],
    },
  );
});
