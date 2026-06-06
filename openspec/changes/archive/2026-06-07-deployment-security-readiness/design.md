## Context

This project already has a working public site, a Supabase-backed blog repository path, and a single-owner admin flow protected by an admin password and an `httpOnly` session cookie. That posture is acceptable for local MVP iteration, but public deployment raises a different question: what is the minimum security and release baseline that lets the owner deploy confidently without prematurely introducing multi-user auth complexity?

The current constraints are:

- admin is only used by the site owner
- the project does not want OAuth 2.0 or a full auth rebuild in this round
- the app should preserve existing page/service/repository boundaries
- deployment readiness must include both automated and manual verification

This change is cross-cutting because it touches auth behavior, session policy, deployment documentation, and release verification.

## Goals / Non-Goals

**Goals:**

- Add minimum brute-force resistance to the current admin login flow
- Clarify and test the current admin session cookie policy
- Create a single place that defines production env requirements and release gates
- Document and execute a reproducible admin publishing verification flow
- Keep the implementation small enough to fit the existing single-owner admin model

**Non-Goals:**

- Introduce OAuth 2.0, magic-link revival, or multi-user auth
- Rebuild admin sessions on top of database-backed persistence
- Add audit logs, role-based permissions, or a generalized security platform
- Replace Supabase or the existing repository/service structure

## Decisions

### 1. Use a lightweight application-layer rate limit for admin login

The login flow currently compares a single configured password and sets a cookie on success. The highest-value improvement is to slow repeated password guessing before it can become a realistic public risk. The implementation will add a small rate-limit helper inside `src/lib/auth/**` and keep the login page action thin.

Why this approach:

- it fits the existing Next.js server action flow
- it avoids pushing auth logic into UI code
- it can be tested with the current Node test setup
- it adds meaningful protection without introducing external infrastructure

Alternatives considered:

- **Shared persistent store immediately**: stronger across instances, but heavier than the current MVP needs
- **Platform-only protection**: useful later, but insufficient as the only application-level control
- **OAuth 2.0 now**: too much scope for a single-owner admin tool

### 2. Keep the current session model but tighten and document its policy

The session remains a password-derived cookie for this round. We will not replace it with JWT refresh flows or database sessions, but we will verify the cookie defaults, re-evaluate lifetime, and document the exact assumptions in deployment guidance.

Why this approach:

- the current admin usage is single-owner and low-volume
- the largest immediate risk is uncontrolled public exposure, not collaboration complexity
- small, explicit improvements are safer than an auth rewrite late in launch preparation

Alternatives considered:

- **Database-backed sessions**: stronger revocation semantics, but unnecessary for the current one-user scope
- **Immediate short-lived every-request re-auth**: safer in theory, but poor owner experience for this stage

### 3. Treat deployment readiness as a product capability, not just a README note

Readiness depends on more than passing build output. This round will define explicit release gates covering env configuration, automated checks, and manual publishing verification. The result belongs in tracked docs because it defines the operating contract for launching the site.

Why this approach:

- it turns launch readiness into a repeatable process
- it reduces drift between code, env assumptions, and admin workflow
- it gives future rounds a clear baseline for deciding whether auth needs to evolve

Alternatives considered:

- **Ad hoc launch checklist in chat only**: too easy to lose
- **No manual verification requirement**: too risky for content publishing behavior

## Risks / Trade-offs

- **[In-memory rate limiting is not strongly consistent across instances]** → Accept as the MVP baseline, document the limitation, and keep the helper isolated so it can later move to a shared store
- **[Current session model still lacks revocation and auditability]** → Document the limitation explicitly and treat any future multi-user need as an auth-upgrade trigger
- **[More security controls can slow owner workflows]** → Keep the scope to minimum protective controls and avoid introducing unnecessary login friction
- **[Manual verification may be skipped under deadline pressure]** → Make the verification flow part of the documented release gate rather than an optional note

## Migration Plan

1. Add the OpenSpec change artifacts and implementation tasks
2. Implement login rate limiting behind the existing auth boundary
3. Tighten or confirm session cookie policy and add tests
4. Expand deployment documentation and release checklist
5. Run automated checks: lint, test, production build
6. Run manual admin publishing verification in an environment with real env values
7. Mark readiness status based on actual verification results

Rollback strategy:

- If the login protection causes unexpected admin lockouts, revert only the rate-limit integration and retain the documentation improvements
- If deployment docs reveal unresolved blockers, do not mark the site as launch-ready until the blockers are fixed

## Open Questions

- Should the admin session lifetime remain 14 days or be shortened for the first public deployment?
- Can the current server action reliably derive a stable login identifier from request context, or should the first version use a coarser fallback key?
- After this round, is preview-only deployment sufficient, or does the owner want a true public production launch gate?
