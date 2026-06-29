import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  readAnalyticsConsentFromSource,
  shouldEnableAnalytics,
  writeAnalyticsConsentToSource,
} from "./consent.ts";

test("readAnalyticsConsentFromSource returns unknown when storage is unavailable", () => {
  assert.equal(readAnalyticsConsentFromSource(null), "unknown");
});

test("readAnalyticsConsentFromSource returns unknown for missing or invalid values", () => {
  const missingStorage = {
    getItem: () => null,
  };
  const invalidStorage = {
    getItem: () => "maybe",
  };

  assert.equal(readAnalyticsConsentFromSource(missingStorage), "unknown");
  assert.equal(readAnalyticsConsentFromSource(invalidStorage), "unknown");
});

test("readAnalyticsConsentFromSource returns stored accepted or rejected values", () => {
  assert.equal(
    readAnalyticsConsentFromSource({
      getItem: () => "accepted",
    }),
    "accepted",
  );

  assert.equal(
    readAnalyticsConsentFromSource({
      getItem: () => "rejected",
    }),
    "rejected",
  );
});

test("writeAnalyticsConsentToSource persists consent using the shared storage key", () => {
  const writes: Array<{ key: string; value: string }> = [];

  writeAnalyticsConsentToSource(
    {
      setItem: (key, value) => {
        writes.push({ key, value });
      },
    },
    "accepted",
  );

  assert.deepEqual(writes, [{ key: ANALYTICS_CONSENT_STORAGE_KEY, value: "accepted" }]);
});

test("shouldEnableAnalytics only returns true when consent is accepted, config exists, and analytics is not initialized", () => {
  assert.equal(
    shouldEnableAnalytics({
      consent: "unknown",
      host: "https://us.i.posthog.com",
      initialized: false,
      projectToken: "phc_test",
    }),
    false,
  );

  assert.equal(
    shouldEnableAnalytics({
      consent: "accepted",
      host: null,
      initialized: false,
      projectToken: "phc_test",
    }),
    false,
  );

  assert.equal(
    shouldEnableAnalytics({
      consent: "accepted",
      host: "https://us.i.posthog.com",
      initialized: true,
      projectToken: "phc_test",
    }),
    false,
  );

  assert.equal(
    shouldEnableAnalytics({
      consent: "accepted",
      host: "https://us.i.posthog.com",
      initialized: false,
      projectToken: "phc_test",
    }),
    true,
  );
});
