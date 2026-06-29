"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

import type { PageViewProperties } from "@/lib/analytics/pageview";
import { bootstrapPostHogIfConsented, isPostHogInitialized } from "@/lib/analytics/client";
import { ANALYTICS_CONSENT_EVENT, readAnalyticsConsent } from "@/lib/analytics/consent";
import { isAdminPathname } from "@/lib/analytics/posthog";

export function PostHogPageView({ properties }: { properties: PageViewProperties }) {
  const pathname = usePathname();
  const lastTrackedPathnameRef = useRef<string | null>(null);
  const [consent, setConsent] = useState(() => readAnalyticsConsent());

  useEffect(() => {
    const handleConsentChanged = () => {
      setConsent(readAnalyticsConsent());
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChanged);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChanged);
    };
  }, []);

  useEffect(() => {
    if (!pathname || consent !== "accepted") {
      return;
    }

    if (lastTrackedPathnameRef.current === pathname) {
      return;
    }

    if (isAdminPathname(pathname)) {
      return;
    }

    const initialized = bootstrapPostHogIfConsented();

    if (!initialized || !isPostHogInitialized()) {
      return;
    }

    posthog.capture("$pageview", {
      ...properties,
      $current_url: window.location.href,
      $pathname: pathname,
    });
    lastTrackedPathnameRef.current = pathname;
  }, [consent, pathname, properties]);

  return null;
}
