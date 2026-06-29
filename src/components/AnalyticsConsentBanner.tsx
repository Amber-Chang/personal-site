"use client";

import { useEffect, useState } from "react";

import {
  ANALYTICS_CONSENT_EVENT,
  type AnalyticsConsentStatus,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "@/lib/analytics/consent";
import { bootstrapPostHogIfConsented } from "@/lib/analytics/client";

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsentStatus>("unknown");

  useEffect(() => {
    setConsent(readAnalyticsConsent());

    const handleConsentChanged = () => {
      setConsent(readAnalyticsConsent());
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChanged);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChanged);
    };
  }, []);

  if (consent !== "unknown") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-6 md:pb-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-[1.75rem] border border-border/80 bg-background/95 px-5 py-5 shadow-lg backdrop-blur md:flex-row md:items-end md:justify-between md:px-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">這個網站想用匿名 analytics 了解公開頁面的閱讀情況。</p>
          <p className="text-sm leading-6 text-muted-foreground">
            只有在你同意後，才會啟用 PostHog 追蹤公開頁面 pageview；`/admin` 不會被追蹤。
          </p>
        </div>

        <div className="flex flex-wrap gap-3 md:shrink-0">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground/35"
            onClick={() => {
              writeAnalyticsConsent("rejected");
            }}
          >
            拒絕
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            onClick={() => {
              writeAnalyticsConsent("accepted");
              bootstrapPostHogIfConsented();
            }}
          >
            同意
          </button>
        </div>
      </div>
    </div>
  );
}
