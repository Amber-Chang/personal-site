## ADDED Requirements

### Requirement: Public project lists read from Supabase-first project content
The system SHALL render public project lists from Supabase-backed project records instead of repo Markdown files.

#### Scenario: Projects index shows published database projects
- **WHEN** a visitor opens `/projects`
- **THEN** the page shows published projects from the public content repository ordered for public display

#### Scenario: Projects index excludes draft database projects
- **WHEN** a project record exists with `status = draft`
- **THEN** it is excluded from the public `/projects` list

### Requirement: Public project detail pages read from Supabase-first project content
The system SHALL render `/projects/[slug]` from Supabase-backed project content while preserving related-post behavior.

#### Scenario: Project detail page renders published database content
- **WHEN** a visitor opens `/projects/[slug]` for a published project stored in Supabase
- **THEN** the page renders the stored title, summary, role, period, tags, outcomes, content, and related posts

#### Scenario: Missing or unpublished project slug returns not found
- **WHEN** a visitor opens `/projects/[slug]` for a slug that does not resolve to a published project
- **THEN** the page returns not found instead of falling back to Markdown-only public content

### Requirement: Homepage featured projects read from Supabase-first project content
The system SHALL source homepage featured project cards from Supabase-backed public project records.

#### Scenario: Homepage shows featured published projects from DB
- **WHEN** featured published project records exist
- **THEN** the homepage representative project section renders those featured records from the public content path

### Requirement: Admin project management can author public project content
The system SHALL let admins manage the minimum project content fields required for current public project cards and pages.

#### Scenario: Admin creates a published project that becomes publicly visible
- **WHEN** an admin creates a project with the required public content fields and `status = published`
- **THEN** the project becomes eligible for `/projects`, `/projects/[slug]`, homepage featured display, and blog relation options

#### Scenario: Admin updates public project content fields
- **WHEN** an admin updates a project's public content fields
- **THEN** subsequent public reads reflect the updated values through the content repository

### Requirement: Existing Markdown project content can seed Supabase project records
The system SHALL provide a migration/import path from `content/projects/*.md` into Supabase project records so existing public content is preserved during the source-of-truth transition.

#### Scenario: Markdown project import creates or updates DB content
- **WHEN** the project import tooling runs against existing Markdown project files
- **THEN** it creates or updates the corresponding Supabase project records with the fields required for public rendering
