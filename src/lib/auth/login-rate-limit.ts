export const ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES = 5;
export const ADMIN_LOGIN_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;
export const ADMIN_LOGIN_RATE_LIMIT_FALLBACK_IDENTIFIER = "admin-login:unknown";

type LoginRateLimitEntry = {
  blockedUntil: number | null;
  failureCount: number;
  firstFailureAt: number;
};

export type LoginRateLimitState = {
  blockedUntil: number | null;
  remainingAttempts: number;
};

export type LoginRateLimit = {
  getRateLimitState: (identifier: string) => LoginRateLimitState;
  recordFailedAttempt: (identifier: string) => void;
  resetAttempts: (identifier: string) => void;
};

function buildEmptyState(): LoginRateLimitState {
  return {
    blockedUntil: null,
    remainingAttempts: ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES,
  };
}

export function createLoginRateLimit(input?: {
  cooldownMs?: number;
  maxFailures?: number;
  now?: () => number;
}): LoginRateLimit {
  const cooldownMs = input?.cooldownMs ?? ADMIN_LOGIN_RATE_LIMIT_COOLDOWN_MS;
  const maxFailures = input?.maxFailures ?? ADMIN_LOGIN_RATE_LIMIT_MAX_FAILURES;
  const now = input?.now ?? Date.now;
  const entries = new Map<string, LoginRateLimitEntry>();

  function getActiveEntry(identifier: string): LoginRateLimitEntry | null {
    const entry = entries.get(identifier);

    if (!entry) {
      return null;
    }

    const currentTime = now();

    if (entry.blockedUntil !== null) {
      if (entry.blockedUntil > currentTime) {
        return entry;
      }

      entries.delete(identifier);
      return null;
    }

    if (currentTime - entry.firstFailureAt >= cooldownMs) {
      entries.delete(identifier);
      return null;
    }

    return entry;
  }

  return {
    getRateLimitState(identifier) {
      const entry = getActiveEntry(identifier);

      if (!entry) {
        return buildEmptyState();
      }

      return {
        blockedUntil: entry.blockedUntil,
        remainingAttempts: Math.max(0, maxFailures - entry.failureCount),
      };
    },
    recordFailedAttempt(identifier) {
      const currentTime = now();
      const entry = getActiveEntry(identifier);

      if (!entry) {
        entries.set(identifier, {
          blockedUntil: null,
          failureCount: 1,
          firstFailureAt: currentTime,
        });
        return;
      }

      if (entry.blockedUntil !== null && entry.blockedUntil > currentTime) {
        return;
      }

      entry.failureCount += 1;

      if (entry.failureCount >= maxFailures) {
        entry.blockedUntil = currentTime + cooldownMs;
      }
    },
    resetAttempts(identifier) {
      entries.delete(identifier);
    },
  };
}

export const adminLoginRateLimit = createLoginRateLimit();
