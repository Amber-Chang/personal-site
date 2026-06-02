export type SupabaseEnv = {
  adminAllowedEmails: string[];
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
  const siteUrl = getRequiredValue(source, "NEXT_PUBLIC_SITE_URL");
  const adminAllowedEmails = parseAllowedEmails(getRequiredValue(source, "SUPABASE_ADMIN_EMAILS"));

  return {
    adminAllowedEmails,
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
