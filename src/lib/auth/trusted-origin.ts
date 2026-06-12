import { readSupabaseEnv } from "../infra/supabase/env.ts";

export class UntrustedOriginError extends Error {
  constructor() {
    super("Admin request origin is not allowed.");
    this.name = "UntrustedOriginError";
  }
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveRequestOrigin(headers: Headers): string | null {
  const origin = headers.get("origin")?.trim();

  if (origin) {
    return normalizeOrigin(origin);
  }

  const referer = headers.get("referer")?.trim();

  if (referer) {
    return normalizeOrigin(referer);
  }

  return null;
}

function resolveForwardedOrigin(headers: Headers): string | null {
  const forwardedHost = headers.get("x-forwarded-host")?.trim() || headers.get("host")?.trim();

  if (!forwardedHost) {
    return null;
  }

  const forwardedProto = headers.get("x-forwarded-proto")?.trim() || "https";

  return normalizeOrigin(`${forwardedProto}://${forwardedHost}`);
}

export function isTrustedAdminOrigin(input: {
  headers: Headers;
  siteUrl?: string;
}): boolean {
  const requestOrigin = resolveRequestOrigin(input.headers);

  if (!requestOrigin) {
    return false;
  }

  const allowedOrigins = new Set<string>();
  const siteOrigin = normalizeOrigin(input.siteUrl ?? readSupabaseEnv().siteUrl);

  if (siteOrigin) {
    allowedOrigins.add(siteOrigin);
  }

  const forwardedOrigin = resolveForwardedOrigin(input.headers);

  if (forwardedOrigin) {
    allowedOrigins.add(forwardedOrigin);
  }

  return allowedOrigins.has(requestOrigin);
}

export async function requireTrustedAdminOrigin(input?: {
  headers?: Headers;
  siteUrl?: string;
}): Promise<void> {
  let resolvedHeaders = input?.headers;

  if (!resolvedHeaders) {
    const { headers } = await import("next/headers");
    resolvedHeaders = await headers();
  }

  if (!isTrustedAdminOrigin({ headers: resolvedHeaders, siteUrl: input?.siteUrl })) {
    throw new UntrustedOriginError();
  }
}
