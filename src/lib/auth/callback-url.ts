type HeaderGetter = {
  get: (name: string) => string | null;
};

function isLocalOrigin(value: string): boolean {
  try {
    const url = new URL(value);

    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

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
  const fallbackOrigin = new URL(input.fallbackSiteUrl).origin;
  const requestOrigin = input.requestUrl ? new URL(input.requestUrl).origin : null;
  const headerOrigin = getOriginFromHeaders(input.headers);

  const baseUrl =
    (requestOrigin && isLocalOrigin(requestOrigin) ? requestOrigin : null) ??
    (requestOrigin === fallbackOrigin ? requestOrigin : null) ??
    (headerOrigin && isLocalOrigin(headerOrigin) ? headerOrigin : null) ??
    fallbackOrigin;

  return new URL("/auth/callback", baseUrl).toString();
}
