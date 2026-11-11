"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  type AnalyticsConsentStatus,
  readAnalyticsConsent,
  subscribeToAnalyticsConsent,
  writeAnalyticsConsent,
} from "@/lib/analytics/consent";
import { bootstrapPostHogIfConsented } from "@/lib/analytics/client";

// The server cannot read localStorage, so it always renders the "unknown" state.
function getServerConsentSnapshot(): AnalyticsConsentStatus {
  return "unknown";
}

export function AnalyticsConsentBanner() {
  const consent = useSyncExternalStore(subscribeToAnalyticsConsent, readAnalyticsConsent, getServerConsentSnapshot);

  if (consent !== "unknown") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-6 md:pb-6">
      <div className="mx-auto w-full max-w-2xl rounded-panel border border-border bg-background/92 px-5 py-4 shadow-overlay backdrop-blur-xl md:px-6 md:py-4.5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-label font-medium uppercase tracking-caps text-muted-foreground">Privacy preference</p>
            <p className="max-w-xl font-display text-lead leading-7 text-foreground">
              這個網站會在你同意後啟用 PostHog，以了解公開頁面的瀏覽情況。
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 md:shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-full border-border px-4 text-sm text-muted-foreground hover:border-strong hover:bg-background hover:text-foreground"
              onClick={() => {
                writeAnalyticsConsent("rejected");
              }}
            >
              拒絕
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-10 rounded-full px-4 text-sm"
              onClick={() => {
                writeAnalyticsConsent("accepted");
                bootstrapPostHogIfConsented();
              }}
            >
              同意
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
