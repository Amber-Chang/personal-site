## ADDED Requirements

### Requirement: Admins can list project identities
The system SHALL provide an authenticated admin page that lists project identities available in the project admin path.

#### Scenario: Admin project list shows existing project identities
- **WHEN** an authenticated admin opens `/admin/projects`
- **THEN** the page shows project identity records with at least status, slug, title, summary, and updated time

#### Scenario: Admin project list shows empty state
- **WHEN** an authenticated admin opens `/admin/projects` and no project identities exist
- **THEN** the page shows an empty state with a clear path to create the first project identity

### Requirement: Admins can create a new project identity
The system SHALL allow an authenticated admin to create a new project identity using the minimum fields required for routing and blog relations.

#### Scenario: Admin creates a published project identity
- **WHEN** an authenticated admin submits valid `title`, `slug`, `summary`, and `status = published` in `/admin/projects/new`
- **THEN** the system creates the project identity and redirects the admin to a follow-up management page for that record

#### Scenario: Admin gets readable duplicate slug feedback
- **WHEN** an authenticated admin submits a slug that already exists
- **THEN** the system rejects the mutation with a readable validation or persistence error instead of failing with an opaque provider message

### Requirement: Admins can update an existing project identity
The system SHALL allow an authenticated admin to edit the minimum project identity fields for an existing project.

#### Scenario: Admin updates project identity fields
- **WHEN** an authenticated admin submits valid updated identity fields for an existing project
- **THEN** the system persists the new values and returns the admin to the updated record flow without losing the project identity

#### Scenario: Missing project identity is handled safely
- **WHEN** an authenticated admin requests `/admin/projects/[id]` for a project identity that does not exist
- **THEN** the system returns a not-found result instead of rendering a broken edit form

### Requirement: Project identity admin follows published visibility rules
The system SHALL preserve the existing relation-option visibility rule where only published project identities are exposed to public relation-option readers.

#### Scenario: Published project appears in relation options
- **WHEN** a project identity is stored with `status = published`
- **THEN** it is included in the project options returned for blog relation selection

#### Scenario: Draft project is excluded from relation options
- **WHEN** a project identity is stored with `status = draft`
- **THEN** it is excluded from the project options returned for blog relation selection

### Requirement: Project admin reads and writes go through content-layer boundaries
The system SHALL implement project identity admin through content service, repository, and server action boundaries rather than page-level provider-specific mutations.

#### Scenario: Admin project page data uses content-layer contracts
- **WHEN** an admin project page needs project identity data
- **THEN** it receives that data through content-layer loaders or service calls instead of inline provider-specific access in the page component

#### Scenario: Admin project mutations use server-side content actions
- **WHEN** an admin creates or updates a project identity
- **THEN** the mutation is executed through authenticated server-side actions backed by content-layer contracts
