import posthog from "posthog-js";

import { createPostHogInitOptions, readPostHogPublicEnv } from "@/lib/analytics/posthog";

import { readAnalyticsConsent, shouldEnableAnalytics } from "./consent";

let postHogInitialized = false;

export function isPostHogInitialized(): boolean {
  return postHogInitialized;
}

export function initPostHog(): boolean {
  if (postHogInitialized) {
    return true;
  }

  const { host, projectToken } = readPostHogPublicEnv();

  if (!host || !projectToken) {
    return false;
  }

  posthog.init(projectToken, createPostHogInitOptions(host));
  postHogInitialized = true;
  return true;
}

export function bootstrapPostHogIfConsented(): boolean {
  const { host, projectToken } = readPostHogPublicEnv();

  if (
    !shouldEnableAnalytics({
      consent: readAnalyticsConsent(),
      host,
      initialized: postHogInitialized,
      projectToken,
    })
  ) {
    return postHogInitialized;
  }

  return initPostHog();
}
