import type { BeforeSendFn, CaptureResult, PostHogConfig } from "posthog-js";

export function normalizePostHogHost(host: string): string {
  return host.trim().replace(/\/+$/, "");
}

export function createPostHogInitOptions(
  host: string,
): Pick<PostHogConfig, "api_host" | "autocapture" | "capture_pageleave" | "capture_pageview" | "before_send" | "defaults"> {
  const beforeSend: BeforeSendFn = (event) => {
    if (shouldDropPostHogEvent(event)) {
      return null;
    }

    return event;
  };

  return {
    api_host: normalizePostHogHost(host),
    autocapture: false,
    capture_pageleave: false,
    capture_pageview: false,
    before_send: beforeSend,
    defaults: "2026-01-30",
  };
}

export function shouldDropPostHogEvent(event: CaptureResult | null): boolean {
  if (!event) {
    return false;
  }

  if (event.event !== "$pageview") {
    return false;
  }

  const pathname = event.properties?.$pathname;

  if (!pathname) {
    return false;
  }

  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function readPostHogPublicEnv(source: Record<string, string | undefined> = process.env): {
  host: string | null;
  projectToken: string | null;
} {
  const rawHost = source.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  const rawProjectToken = source.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();

  if (!rawHost || !rawProjectToken) {
    return {
      host: null,
      projectToken: null,
    };
  }

  return {
    host: normalizePostHogHost(rawHost),
    projectToken: rawProjectToken,
  };
}
