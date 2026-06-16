## Why

The admin area no longer fits a shared-password model because the site owner now signs in across multiple devices and needs a safer, lower-friction login flow. This change upgrades `/admin` to Google OAuth through Supabase so admin access no longer depends on a single shared secret.

## What Changes

- Replace the `/admin/login` shared-password flow with `Supabase Auth + Google OAuth`
- Add an allowlisted-admin-email capability that gates admin access after OAuth session exchange
- Update admin route and mutation guards to rely on authenticated allowlisted users instead of password-backed server sessions
- Update logout, deployment configuration, and verification docs to match the new auth model
- Remove the current single-password login path from the formal primary admin flow

## Capabilities

### New Capabilities
- `admin-oauth-authentication`: Define the Google OAuth login, callback, allowlist, and centralized admin guard flow for `/admin`

### Modified Capabilities
- `admin-login-protection`: Change login protection requirements from repeated password submission protection to controlled OAuth entry behavior and non-revealing admin login failures
- `admin-server-side-sessions`: Replace password-derived admin session assumptions with Supabase-authenticated session validation for protected admin routes and mutations
- `deployment-readiness`: Update the deployment baseline from a password-gated single-owner admin model to a Google OAuth allowlisted admin model

## Impact

- Affected code will primarily live in `src/app/admin/**`, `src/app/auth/**`, `src/lib/auth/**`, and `src/lib/infra/supabase/**`
- Deployment configuration will change to require Google OAuth provider setup and `ADMIN_ALLOWED_EMAILS` instead of the current primary reliance on `ADMIN_LOGIN_PASSWORD`
- This round changes the formal admin auth contract and therefore requires matching test, manual verification, and documentation updates
