type PostHogCaptureEvent = {
  event: string;
  properties?: {
    $current_url?: string;
    $pathname?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export function normalizePostHogHost(host: string): string {
  return host.trim().replace(/\/+$/, "");
}

export function createPostHogInitOptions(host: string): {
  api_host: string;
  autocapture: false;
  capture_pageleave: false;
  capture_pageview: false;
  before_send: (event: PostHogCaptureEvent) => PostHogCaptureEvent | null;
  defaults: "2026-01-30";
} {
  return {
    api_host: normalizePostHogHost(host),
    autocapture: false,
    capture_pageleave: false,
    capture_pageview: false,
    before_send: (event) => {
      if (shouldDropPostHogEvent(event)) {
        return null;
      }

      return event;
    },
    defaults: "2026-01-30",
  };
}

export function shouldDropPostHogEvent(event: PostHogCaptureEvent): boolean {
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
