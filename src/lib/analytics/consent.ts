export const ANALYTICS_CONSENT_STORAGE_KEY = "analytics-consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-changed";

export type AnalyticsConsentStatus = "accepted" | "rejected" | "unknown";

type AnalyticsConsentReader = {
  getItem: (key: string) => string | null;
};

type AnalyticsConsentWriter = {
  setItem: (key: string, value: string) => void;
};

export function readAnalyticsConsentFromSource(source: AnalyticsConsentReader | null): AnalyticsConsentStatus {
  const rawValue = source?.getItem(ANALYTICS_CONSENT_STORAGE_KEY);

  if (rawValue === "accepted" || rawValue === "rejected") {
    return rawValue;
  }

  return "unknown";
}

export function writeAnalyticsConsentToSource(source: AnalyticsConsentWriter, value: Exclude<AnalyticsConsentStatus, "unknown">) {
  source.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
}

export function shouldEnableAnalytics(input: {
  consent: AnalyticsConsentStatus;
  host: string | null;
  initialized: boolean;
  projectToken: string | null;
}): boolean {
  return input.consent === "accepted" && !input.initialized && Boolean(input.host) && Boolean(input.projectToken);
}

export function readAnalyticsConsent(): AnalyticsConsentStatus {
  if (typeof window === "undefined") {
    return "unknown";
  }

  return readAnalyticsConsentFromSource(window.localStorage);
}

export function writeAnalyticsConsent(value: Exclude<AnalyticsConsentStatus, "unknown">) {
  if (typeof window === "undefined") {
    return;
  }

  writeAnalyticsConsentToSource(window.localStorage, value);
  window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT, { detail: value }));
}
