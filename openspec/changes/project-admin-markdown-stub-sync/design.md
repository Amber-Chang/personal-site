## Context

The site currently has two separate project systems:

- public project pages and lists read from `content/projects/*.md`
- admin project management writes to Supabase `projects`

That split was acceptable when `projects` only needed identity and relation support, but it now breaks the user's core expectation: creating a project in the admin UI should make it show up publicly.

This round is cross-cutting because it affects:

- the projects database shape
- admin project form scope
- public project list and detail pages
- homepage featured project reads
- migration/import tooling

## Goals / Non-Goals

**Goals:**

- Make Supabase `projects` the public source of truth for project content
- Ensure admin-created published projects appear on `/projects`, `/projects/[slug]`, and the homepage featured section
- Expand project admin to edit the minimum public content fields already used by the current project UI
- Preserve content-layer boundaries for both admin and public reads
- Keep existing Markdown files useful as import/migration source instead of immediate dead weight

**Non-Goals:**

- Build a rich editor or media workflow
- Add project version history
- Create a generic CMS abstraction for every content type
- Remove Markdown import tooling immediately after migration

## Decisions

### 1. Promote `projects` from identity-only DB records to full public content records

The cleanest fix is not to sync back into Markdown, but to make the same database record power both admin writes and public reads.

Why this approach:

- it works in production without filesystem or Git write tricks
- it aligns authoring and rendering onto one stable model
- it removes the confusing split where "real" projects live somewhere different from admin-created ones

Alternatives considered:

- **Write Markdown stubs from the admin UI**: not production-safe on Vercel
- **Keep split sources and merge them at read time**: preserves ambiguity and increases edge cases

### 2. Expand admin project fields only to the current public UI footprint

The admin project form should grow enough to power the existing project card and detail page, but not beyond that.

Why this approach:

- it keeps scope tied to actual rendering needs
- it avoids reworking the visual design just to support unused fields
- it makes migration from Markdown straightforward because those fields already exist conceptually

Alternatives considered:

- **Keep identity-only admin and add partial fallback behavior**: still leaves public mismatch
- **Design a much richer project editor now**: too much scope for this round

### 3. Use migration tooling to seed and backfill DB content

Existing Markdown project files still contain the canonical historical content today. This round should include import/sync tooling that can seed DB records from Markdown so the site can flip public reads without manual copy-paste.

Why this approach:

- it reduces migration risk
- it preserves existing authored content
- it gives a rollback-friendly path during the transition

Alternatives considered:

- **Manual one-off content entry into admin**: too error-prone
- **Hard cut without import**: unnecessary churn

## Risks / Trade-offs

- **[Schema expansion increases migration complexity]** → keep new columns tightly mapped to current UI needs and cover with repository tests
- **[Markdown and DB can diverge during transition]** → document DB as the new public source of truth once the migration is applied, and keep Markdown as import-only afterward
- **[Homepage and project pages could drift visually if data shape changes]** → preserve current view models and update data sources underneath them
- **[Slug edits remain high impact]** → keep slug editing explicit and ensure public pages rely on DB slug consistently

## Migration Plan

1. Add spec and OpenSpec artifacts for the Supabase-first projects round
2. Add failing tests for expanded project repository, admin form, public project list/detail data, and homepage featured projects
3. Add Supabase migration for missing project content columns
4. Extend project repository and service contracts for full public/admin project content
5. Expand admin project form and actions to support public project fields
6. Replace public Markdown-based project reads with repository-backed reads
7. Add/update project import tooling to seed DB content from existing Markdown files
8. Run tests, sync data, verify public pages, and update docs

Rollback strategy:

- Keep Markdown import tooling intact during rollout so data can be re-seeded if needed
- If public DB-backed pages regress badly, temporarily revert public project reads while leaving schema and admin improvements isolated

## Open Questions

- Should `content/projects/*.md` remain permanently as archival import source, or be retired after this round stabilizes?
- Do we want to expose `featured` as a first-class toggle in project admin immediately, or infer it some other way?
