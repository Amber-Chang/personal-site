## Context

The site already has product and implementation specs for a blog admin MVP, but the codebase still reads blog content from Markdown files and has no authenticated admin workflow. This change is the first backend-focused implementation round and needs to establish a safe foundation before admin CRUD UI and content migration are layered on top.

Current constraints:

- The site uses Next.js App Router and should keep backend logic inside the app layer
- Supabase has been selected as the backend infrastructure for database and authentication
- Future content workflows are expected to expand, so page-level logic cannot become the long-term integration boundary
- This round should avoid UI-heavy work and instead focus on schema, auth, and reusable data access boundaries

## Goals / Non-Goals

**Goals:**

- Establish Supabase-backed schema for `projects` and `blog_posts`
- Establish magic link admin authentication flow with centralized session guard behavior
- Introduce repository and service boundaries for blog content access
- Make the system ready for later admin UI work and later front-end data-source migration

**Non-Goals:**

- Full admin CRUD interface
- Markdown editor integration
- Public blog pages switching to database in this round
- Markdown import / migration automation
- Multi-user roles and permissions

## Decisions

### Use Next.js app-layer backend with Supabase infrastructure

The app will keep auth flow, route handlers, and server actions in Next.js, while Supabase provides Postgres and auth. This matches current project direction and avoids introducing a second backend service.

Alternative considered:

- Separate custom backend service: rejected because it adds unnecessary operational weight for the MVP

### Split requirements into authentication and content-storage capabilities

The OpenSpec capability boundary is split between `blog-admin-authentication` and `blog-content-storage` so auth rules and content model rules can evolve independently.

Alternative considered:

- One combined capability: rejected because it would make review and future deltas harder to reason about

### Use repository and service boundaries from the first backend round

Pages and components must not call Supabase query APIs directly. Repository and service boundaries are introduced now, even before the UI exists, to avoid spreading provider-specific behavior across the codebase.

Alternative considered:

- Start with direct page-level queries and refactor later: rejected because this change exists specifically to establish durable boundaries before UI work expands

### Use minimal admin authorization for round one

Round one will rely on a centralized admin guard and minimal allowlisted authenticated access, with basic RLS support. This is enough for a single-user MVP while leaving room for stronger policy enforcement later.

Alternative considered:

- Full multi-role authorization model now: rejected because it adds complexity without current product need

## Risks / Trade-offs

- [Supabase integration adds configuration complexity] -> Keep this round limited to schema, auth flow, and app boundaries so failures are isolated early
- [Minimal authorization could be too app-layer-centric] -> Preserve repository, session, and schema boundaries so stronger RLS can be added without rewriting pages
- [No migration in this round means old and new content paths coexist briefly] -> Keep blog source switching out of this round and make migration a later explicit task
- [TDD may be slower at the beginning because infra is new] -> Focus first tests on repository/service contracts and auth guard behavior rather than trying to test the whole admin UI

## Migration Plan

1. Add Supabase environment and client setup
2. Add schema for `projects` and `blog_posts`
3. Add auth callback and centralized admin session guard
4. Add repository and service abstractions plus first Supabase-backed implementations
5. Verify the foundation before starting admin UI work

Rollback strategy:

- If the change is incomplete, remove app integration code and leave Markdown flow as the active content source
- If schema exists but is unused, the site can continue operating without reading from those tables

## Open Questions

- Whether round one should include a lightweight seed path for `projects` options, or leave that until later admin work
- Whether auth allowlisting should be enforced purely in app config or also reflected in RLS checks from the start
