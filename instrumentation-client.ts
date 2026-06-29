import posthog from "posthog-js";

import { createPostHogInitOptions, readPostHogPublicEnv } from "@/lib/analytics/posthog";

const { host, projectToken } = readPostHogPublicEnv();

if (host && projectToken) {
  posthog.init(projectToken, createPostHogInitOptions(host));
}
