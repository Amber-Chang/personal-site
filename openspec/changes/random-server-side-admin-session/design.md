## Context

The current admin login flow already uses a single password, rate limiting, and an `httpOnly` cookie, but the cookie value itself is deterministic because it is derived from the password. That means a leaked cookie can be replayed until expiry, and there is no meaningful per-session boundary. The project already depends on Supabase with a trusted server-side service-role path, so the cleanest next step is to store admin sessions in the same backend foundation rather than introducing an external session service.

## Goals / Non-Goals

**Goals:**

- Replace deterministic admin cookies with random session tokens
- Persist admin session state server-side in Supabase
- Make admin route guards and mutation guards validate sessions through server-side storage
- Invalidate sessions after expiry and when the admin password changes
- Keep the current single-owner login UX unchanged

**Non-Goals:**

- Introduce multi-user auth, OAuth 2.0, or role management
- Add a full admin logout UI in this round
- Build device management, session dashboards, or audit history
- Replace the existing admin content repository architecture

## Decisions

### 1. Store admin sessions in a dedicated `admin_sessions` table

We will add a new Supabase table that stores:

- `id`
- `session_token_hash`
- `password_version_hash`
- `expires_at`
- `created_at`
- `updated_at`
- optional lightweight metadata such as `last_seen_at`

The cookie stores only the raw random token. Server-side validation hashes the presented token and looks up a matching record.

Why:

- aligns with the current Supabase-backed backend foundation
- keeps admin auth state out of client-visible logic
- allows future revoke / cleanup paths without another auth rewrite

Alternatives considered:

- **Signed stateless cookies only**: simpler storage-wise, but still weaker for revocation and rotation semantics
- **External session store**: unnecessary complexity for the current single-owner site

### 2. Use password-version hashing to invalidate sessions on password change

Each session record stores a hash derived from the current configured admin password. Validation compares the stored password-version hash against the current configuration-derived hash. If they no longer match, the session is invalid.

Why:

- allows password rotation to invalidate older sessions without needing a bulk cleanup step first
- keeps the behavior easy to test

### 3. Keep session checks behind a small auth service boundary

Instead of scattering Supabase queries through pages, we will add a small auth session module or repository that supports:

- create session
- validate session
- optionally prune or refresh lightweight metadata

This keeps the page-level auth checks thin and consistent with the repo's service/repository boundary style.

## Risks / Trade-offs

- **[Adds a migration and auth storage complexity]** → Keep schema minimal and reuse the existing Supabase service-role path
- **[Session table can accumulate stale rows]** → Accept for this round; expiry-based invalidation is sufficient now, and cleanup can be added later
- **[Password rotation invalidates all active sessions]** → This is acceptable and desirable for a single-owner admin
- **[No logout UI yet]** → Accept for this round because replay resistance and expiry are the higher-priority fix

## Migration Plan

1. Add migration for `admin_sessions`
2. Add tests for random session creation and server-side validation
3. Implement session persistence and validation logic
4. Update login action, admin guard paths, and header/admin entry visibility checks
5. Run auth tests, full test suite, and build

## Open Questions

- Whether to update `last_seen_at` on every valid admin request now or leave that for a later observability round
- Whether to add a logout endpoint in this same change or keep the scope strictly to session hardening
