export const ANALYTICS_CONSENT_STORAGE_KEY = "analytics-consent";
export const ANALYTICS_CONSENT_EVENT = "analytics-consent-changed";

export type AnalyticsConsentStatus = "accepted" | "rejected" | "unknown";

type AnalyticsConsentReader = {
  getItem: (key: string) => string | null;
};

type AnalyticsConsentWriter = {
  setItem: (key: string, value: string) => void;
};

type AnalyticsConsentEventTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

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

export function subscribeToAnalyticsConsentFromTarget(
  target: AnalyticsConsentEventTarget | null,
  onChange: () => void,
): () => void {
  if (!target) {
    return () => {};
  }

  target.addEventListener(ANALYTICS_CONSENT_EVENT, onChange);

  return () => {
    target.removeEventListener(ANALYTICS_CONSENT_EVENT, onChange);
  };
}

// Subscribe signature matches React's useSyncExternalStore.
export function subscribeToAnalyticsConsent(onChange: () => void): () => void {
  return subscribeToAnalyticsConsentFromTarget(typeof window === "undefined" ? null : window, onChange);
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
