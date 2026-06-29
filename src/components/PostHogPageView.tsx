"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

import type { PageViewProperties } from "@/lib/analytics/pageview";
import { readPostHogPublicEnv, shouldDropPostHogEvent } from "@/lib/analytics/posthog";

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

    const event = {
      event: "$pageview",
      properties: {
        ...properties,
        $current_url: window.location.href,
        $pathname: pathname,
      },
    };

    if (shouldDropPostHogEvent(event)) {
      return;
    }

    posthog.capture(event.event, event.properties);
    lastTrackedPathnameRef.current = pathname;
  }, [pathname, properties]);

  return null;
}
