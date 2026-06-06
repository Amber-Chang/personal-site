## Why

The current admin cookie is a deterministic token derived from the admin password, which makes leaked cookies replayable until expiry and provides no per-session revocation boundary. We need to move the admin login flow onto random server-side sessions before treating the current single-owner admin model as a safer production baseline.

## What Changes

- Replace the deterministic admin cookie value with a random session token validated through server-side session records
- Add database-backed session storage for admin login state, including expiry and password-version invalidation behavior
- Update admin route guards and session checks to read server-side session validity instead of recomputing a fixed digest
- Preserve the current single-password owner login UX while tightening the underlying session model

## Capabilities

### New Capabilities
- `admin-server-side-sessions`: Allow the admin login flow to issue random session tokens that are validated through trusted server-side session records

### Modified Capabilities

## Impact

- Affected code will live primarily in `src/lib/auth/**`, `src/app/admin/**`, `src/components/Header.tsx`, Supabase migration files, and related tests
- Adds a new server-side admin session storage model on top of the existing Supabase-backed admin infrastructure
- Removes the current assumption that admin session validity can be derived solely from the configured password
