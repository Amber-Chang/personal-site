## Context

The current site already stores blog posts in Supabase and allows each post to carry an optional `related_project_id`. However, that relationship is only captured in admin data entry; the public site still renders blog posts and project pages as separate reading experiences.

The relevant constraints are:

- blog posts already flow through repository and service boundaries
- project pages still read from Markdown-backed project data
- the app wants to preserve clear page / service / repository separation
- this round should improve reader understanding without expanding into project admin or a full content-type refactor

This change is cross-cutting because it touches the public blog page, public project page, content-layer contracts, and mixed data-source composition.

## Goals / Non-Goals

**Goals:**

- Show related project context on blog post pages when `related_project_id` exists
- Show related published blog posts on project pages when posts reference that project
- Keep relationship assembly inside content-layer helpers instead of page-level ad hoc joins
- Preserve the current project source of truth while exposing the minimum project fields required for relationship rendering
- Make the behavior testable through TDD-friendly repository and page-data seams

**Non-Goals:**

- Add project admin CRUD or move all project content into Supabase
- Introduce many-to-many relationships, tags, or recommendation logic
- Redesign the entire blog or project page visual system
- Build a generic cross-content graph abstraction for every future content type

## Decisions

### 1. Introduce a dedicated public content-linking capability instead of overloading admin behavior

The relationship already exists in stored blog data, but the user-facing contract is still missing. This round will define a separate capability focused on what readers can see and follow, rather than treating this as a side effect of admin storage.

Why this approach:

- it matches the actual user-facing value of the round
- it avoids hiding front-end behavior changes inside storage-only specs
- it gives future project/blog expansion a clearer capability boundary

Alternatives considered:

- **Only modify storage capability docs**: too indirect for a visible front-end feature
- **Treat as pure implementation detail**: would weaken future review and verification

### 2. Keep projects on Markdown for now and bridge them through content-layer adapters

Projects do not need to move into a database for this round. The smaller and safer path is to keep the current Markdown-backed project flow, then expose project lookup and project summary data through a content-layer adapter that can be consumed alongside blog repositories.

Why this approach:

- it keeps scope aligned with the actual need
- it avoids creating a second migration stream during a relationship feature
- it preserves the current project authoring flow while still improving the reader experience

Alternatives considered:

- **Move projects into Supabase now**: too much scope and migration risk for this round
- **Assemble everything directly in pages**: faster short-term, but breaks the architecture boundary already established for blog content

### 3. Add relationship-specific page data builders

The blog post page and project page each need composed data, not raw records. This round will add explicit page-data helpers or service methods for these public routes so the UI receives already-shaped relationship data.

Why this approach:

- it keeps page files focused on rendering
- it makes missing-related-data fallback behavior easier to test
- it avoids coupling UI code to provider-specific records or join logic

Alternatives considered:

- **Inline async composition inside page components**: acceptable for tiny pages, but too easy to let grow into scattered business logic
- **Single giant public content query object**: unnecessary abstraction at this size

## Risks / Trade-offs

- **[Projects and posts still come from different sources]** → Keep the adapter boundary explicit and limit the relationship surface to the fields the UI actually needs
- **[Related project IDs may point to missing or unpublished projects]** → Treat missing project data as a safe null state and suppress the related-project UI block
- **[Project pages could accidentally expose draft posts]** → Only use published-post listing methods for the public relationship view
- **[The round could drift into a full project-content refactor]** → Keep tasks scoped to page data composition and reader-visible linking only

## Migration Plan

1. Add OpenSpec artifacts for the relationship round
2. Add failing tests for relationship-aware content data assembly
3. Extend content repositories / adapters with the minimum relationship queries needed
4. Add blog post page related-project rendering
5. Add project page related-post rendering
6. Run targeted tests plus broader verification
7. Update `NOW.md` and any related implementation docs with the new status

Rollback strategy:

- If relationship composition introduces unstable page behavior, remove the new UI sections while keeping repository contracts isolated for rework
- If project lookup through the adapter proves too messy, fall back to a simpler read model but keep the relationship feature out of page-level provider code

## Open Questions

- Should project pages surface only related posts, or also distinguish one “primary” article later?
- Do we want the article page related-project block near the header or after the article body for the first iteration?
- After this round, should the next content step be project migration, richer related-content UX, or admin-side linking polish?
