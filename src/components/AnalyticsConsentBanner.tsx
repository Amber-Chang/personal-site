"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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
      <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-border/70 bg-background/92 px-5 py-4 shadow-[0_20px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl md:px-6 md:py-[1.125rem]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">Privacy preference</p>
            <p className="max-w-xl font-display text-[1.05rem] leading-7 text-foreground md:text-[1.15rem]">
              這個網站會在你同意後啟用 PostHog，以了解公開頁面的瀏覽情況。
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 md:shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 rounded-full border-border/80 px-4 text-sm text-muted-foreground hover:border-foreground/20 hover:bg-background hover:text-foreground"
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
