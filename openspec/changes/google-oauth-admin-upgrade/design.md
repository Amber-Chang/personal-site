## Context

The current admin flow uses a single server-side password check plus a custom `admin_session` cookie backed by the `admin_sessions` table. That model was acceptable while the site owner used a single trusted device and the admin area was intentionally lightweight. It now creates avoidable risk and friction because admin access happens across multiple devices and the login contract is no longer aligned with the project's chosen auth infrastructure.

Relevant constraints:

- `Supabase` is already the selected auth and backend infrastructure
- admin pages and mutations already pass through centralized guard paths
- the app wants to keep page / action / auth helper / infra responsibilities separated
- this round should upgrade the auth model without spilling content rules into auth code

## Goals / Non-Goals

**Goals:**

- Make Google OAuth the primary `/admin` login path
- Gate admin access by authenticated session plus allowlisted email
- Keep admin authorization centralized for both pages and mutations
- Remove the current shared-password model from the formal primary admin flow
- Preserve the existing content repository / service boundaries

**Non-Goals:**

- Add multi-role permissions or admin user management
- Add non-Google providers
- Build audit logging or device/session management UI
- Redesign the entire admin area

## Decisions

### 1. Use Supabase Auth session as the primary admin session

The upgraded admin flow will use Supabase's authenticated session directly rather than performing Google OAuth and then minting a second custom app-level admin session.

Why this approach:

- it eliminates the dual-session mental model
- it aligns with the architecture principle that Supabase is the auth foundation
- it reduces the risk of login/logout drift between provider and app sessions

Alternatives considered:

- **Google OAuth + keep custom `admin_session` as primary**: lower short-term change count, but creates an unnecessary two-layer auth model
- **Keep password flow and only harden it further**: does not solve multi-device friction or shared-secret risk

### 2. Use centralized allowlisted email authorization

Authentication alone is not enough for admin access. The app will explicitly determine admin eligibility by normalized email matching against `ADMIN_ALLOWED_EMAILS`.

Why this approach:

- it keeps the first iteration simple and reviewable
- it works well for the current single-owner admin scope
- it preserves a clean seam for future role expansion

Alternatives considered:

- **Use any authenticated Google user**: too permissive
- **Introduce roles table now**: unnecessary scope for this round

### 3. Keep admin route and mutation authorization behind shared guard helpers

Protected page loads and admin mutations should continue to consume centralized auth helpers instead of embedding Supabase user checks inside each route or action.

Why this approach:

- it keeps provider-specific behavior out of page-level UI code
- it ensures route reads and mutations cannot drift in authorization behavior
- it is easier to test and review

Alternatives considered:

- **Inline auth checks in each admin page/action**: faster initially, but breaks the architecture boundary and invites inconsistent logic

### 4. Treat the old password flow as migration scaffolding only

The current shared-password implementation may temporarily remain in code while the new flow is developed, but it should no longer define the primary product behavior once the OAuth flow is validated.

Why this approach:

- it lowers migration risk during implementation
- it avoids long-lived parallel primary login paths

## Risks / Trade-offs

- **OAuth callback configuration can drift across local / preview / production** → Keep callback URL rules explicit in docs and verification steps
- **Allowlist checks could scatter across multiple files** → Centralize parsing and normalization in shared auth helpers
- **Legacy password flow could linger and confuse future maintenance** → Make removal or clear deprecation part of the task list and completion definition
- **Logout can feel broken if provider-backed session is not cleared** → Make logout behavior part of required automated and manual verification

## Migration Plan

1. Add OpenSpec artifacts for the Google OAuth upgrade
2. Add failing tests for allowlist parsing, callback behavior, and protected admin access
3. Implement OAuth login entry, callback handling, and centralized admin authorization
4. Update logout and admin guard consumers
5. Retire the password flow from the formal primary path
6. Run targeted tests and manual admin publish-flow verification
7. Sync related docs and `NOW.md`

Rollback strategy:

- If the OAuth flow proves unstable, keep the new code isolated enough to revert the login entry and guard changes without touching content management paths
- If callback handling is the only unstable piece, revert to the previous login contract temporarily while keeping the allowlist and guard helpers ready for the next attempt

## Open Questions

- Do we want preview deployments to support admin OAuth immediately, or can preview remain a follow-up operational task if local and production are correct?
- Should the first OAuth login page show the currently authenticated email after redirect failure, or keep the UI minimal for now?
