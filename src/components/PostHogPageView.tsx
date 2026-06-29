"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

import type { PageViewProperties } from "@/lib/analytics/pageview";
import { isAdminPathname, readPostHogPublicEnv } from "@/lib/analytics/posthog";

const postHogEnv = readPostHogPublicEnv();

export function PostHogPageView({ properties }: { properties: PageViewProperties }) {
  const pathname = usePathname();
  const lastTrackedPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !postHogEnv.host || !postHogEnv.projectToken) {
      return;
    }

    if (lastTrackedPathnameRef.current === pathname) {
      return;
    }

    if (isAdminPathname(pathname)) {
      return;
    }

    posthog.capture("$pageview", {
      ...properties,
      $current_url: window.location.href,
      $pathname: pathname,
    });
    lastTrackedPathnameRef.current = pathname;
  }, [pathname, properties]);

  return null;
}
