export type SupabaseEnv = {
  adminAllowedEmails: string[];
  adminPassword: string;
  anonKey: string;
  serviceRoleKey: string;
  siteUrl: string;
  url: string;
};

export type SupabasePublicEnv = Pick<SupabaseEnv, "anonKey" | "url">;

export class MissingEnvironmentVariableError extends Error {
  envName: string;

  constructor(envName: string) {
    super(`Missing required environment variable: ${envName}`);
    this.name = "MissingEnvironmentVariableError";
    this.envName = envName;
  }
}

function getRequiredValue(source: Record<string, string | undefined>, envName: string): string {
  const value = source[envName]?.trim();

  if (!value) {
    throw new MissingEnvironmentVariableError(envName);
  }

  return value;
}

function normalizeSiteUrl(value: string | undefined): string | null {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://")) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function resolveSiteUrl(source: Record<string, string | undefined>): string {
  const resolvedSiteUrl =
    normalizeSiteUrl(source.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(source.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteUrl(source.VERCEL_URL);

  if (!resolvedSiteUrl) {
    throw new MissingEnvironmentVariableError("NEXT_PUBLIC_SITE_URL");
  }

  return resolvedSiteUrl;
}

function parseAllowedEmails(rawValue: string): string[] {
  return rawValue
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function readSupabaseEnv(source: Record<string, string | undefined> = process.env): SupabaseEnv {
  const url = getRequiredValue(source, "NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredValue(source, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = getRequiredValue(source, "SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = resolveSiteUrl(source);
  const adminAllowedEmails = parseAllowedEmails(getRequiredValue(source, "SUPABASE_ADMIN_EMAILS"));
  const adminPassword = getRequiredValue(source, "ADMIN_LOGIN_PASSWORD");

  return {
    adminAllowedEmails,
    adminPassword,
    anonKey,
    serviceRoleKey,
    siteUrl,
    url,
  };
}

export function readSupabasePublicEnv(source: Record<string, string | undefined> = process.env): SupabasePublicEnv {
  return {
    url: getRequiredValue(source, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredValue(source, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
