type HeaderGetter = {
  get: (name: string) => string | null;
};

function getOriginFromHeaders(headers: HeaderGetter | undefined): string | null {
  if (!headers) {
    return null;
  }

  const origin = headers.get("origin");

  if (origin) {
    return new URL(origin).origin;
  }

  const forwardedHost = headers.get("x-forwarded-host");
  const forwardedProto = headers.get("x-forwarded-proto");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  const host = headers.get("host");

  if (host) {
    const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";

    return `${protocol}://${host}`;
  }

  return null;
}

export function resolveAuthCallbackUrl(input: {
  fallbackSiteUrl: string;
  headers?: HeaderGetter;
  requestUrl?: string;
}): string {
  const baseUrl =
    (input.requestUrl ? new URL(input.requestUrl).origin : null) ??
    getOriginFromHeaders(input.headers) ??
    new URL(input.fallbackSiteUrl).origin;

  return new URL("/auth/client-callback", baseUrl).toString();
}
