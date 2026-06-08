## MODIFIED Requirements

### Requirement: Admins can create a new project identity
The system SHALL allow an authenticated admin to create a new project record using the minimum public content fields required for project routing, blog relations, project cards, and project detail pages.

#### Scenario: Admin creates a published project record
- **WHEN** an authenticated admin submits valid project content fields including `title`, `slug`, `summary`, public display metadata, and `status = published` in `/admin/projects/new`
- **THEN** the system creates the project record and redirects the admin to a follow-up management page for that record

#### Scenario: Admin gets readable duplicate slug feedback
- **WHEN** an authenticated admin submits a slug that already exists
- **THEN** the system rejects the mutation with a readable validation or persistence error instead of failing with an opaque provider message

### Requirement: Admins can update an existing project identity
The system SHALL allow an authenticated admin to edit the minimum public project content fields for an existing project record.

#### Scenario: Admin updates project content fields
- **WHEN** an authenticated admin submits valid updated project content fields for an existing project
- **THEN** the system persists the new values and returns the admin to the updated record flow without losing the project record

#### Scenario: Missing project record is handled safely
- **WHEN** an authenticated admin requests `/admin/projects/[id]` for a project record that does not exist
- **THEN** the system returns a not-found result instead of rendering a broken edit form
