import test from "node:test";
import assert from "node:assert/strict";

import {
  shouldDropPostHogEvent,
  createPostHogInitOptions,
  normalizePostHogHost,
  readPostHogPublicEnv,
} from "./posthog.ts";

test("normalizePostHogHost removes trailing slashes", () => {
  assert.equal(normalizePostHogHost("https://us.i.posthog.com///"), "https://us.i.posthog.com");
});

test("readPostHogPublicEnv returns nulls when config is incomplete", () => {
  assert.deepEqual(readPostHogPublicEnv({ NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com" }), {
    host: null,
    projectToken: null,
  });
});

test("readPostHogPublicEnv returns normalized public config when complete", () => {
  assert.deepEqual(
    readPostHogPublicEnv({
      NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com/",
      NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "phc_test_token",
    }),
    {
      host: "https://us.i.posthog.com",
      projectToken: "phc_test_token",
    },
  );
});

test("createPostHogInitOptions returns official Next.js init config", () => {
  const config = createPostHogInitOptions("https://us.i.posthog.com/");

  assert.equal(config.api_host, "https://us.i.posthog.com");
  assert.equal(config.defaults, "2026-01-30");
  assert.equal(config.autocapture, false);
  assert.equal(config.capture_pageview, false);
  assert.equal(config.capture_pageleave, false);
  assert.equal(typeof config.before_send, "function");
});

test("shouldDropPostHogEvent drops admin pageviews only", () => {
  assert.equal(
    shouldDropPostHogEvent({
      event: "$pageview",
      properties: {
        $pathname: "/admin/posts",
      },
    }),
    true,
  );

  assert.equal(
    shouldDropPostHogEvent({
      event: "$pageview",
      properties: {
        $pathname: "/blog",
      },
    }),
    false,
  );

  assert.equal(
    shouldDropPostHogEvent({
      event: "$autocapture",
      properties: {
        $pathname: "/admin/posts",
      },
    }),
    false,
  );
});

test("createPostHogInitOptions before_send rejects admin pageviews", () => {
  const config = createPostHogInitOptions("https://us.i.posthog.com/");
  const adminPageview = {
    event: "$pageview",
    properties: {
      $pathname: "/admin",
    },
  };
  const publicPageview = {
    event: "$pageview",
    properties: {
      $pathname: "/projects",
    },
  };

  assert.equal(config.before_send?.(adminPageview), null);
  assert.deepEqual(config.before_send?.(publicPageview), publicPageview);
});
