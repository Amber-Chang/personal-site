# analytics-consent

## 目的

在不追蹤 `/admin` 的前提下，僅於訪客明確同意後啟用 PostHog public pageview analytics。

## 主要路徑

- `src/components/AnalyticsConsentBanner.tsx`
- `src/components/PostHogPageView.tsx`
- `src/lib/analytics/consent.ts`
- `src/lib/analytics/client.ts`
- `src/lib/analytics/pageview.ts`
- `src/lib/analytics/posthog.ts`

## 運作方式

- `AnalyticsConsentBanner` 先讀本地 consent 狀態；狀態仍是 `unknown` 時才顯示橫幅。
- 使用者按下同意後才呼叫 `bootstrapPostHogIfConsented()` 初始化 SDK。
- 公開頁面透過 `PostHogPageView` + `createPageViewProperties()` 送出統一的 pageview payload。

## 邊界

- 不在未同意前初始化 PostHog。
- 目前事件命名與 properties 設計以公開內容瀏覽為主，不作為 admin 操作追蹤系統。
