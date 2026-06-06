## ADDED Requirements

### Requirement: Production deployment prerequisites are documented
The system SHALL define a single deployment readiness document that records the required production configuration and release prerequisites for this site.

#### Scenario: Required environment variables are listed
- **WHEN** a maintainer prepares a production deployment
- **THEN** the readiness documentation lists the required runtime environment variables, including the admin password and Supabase configuration values

#### Scenario: Admin architecture assumptions are documented
- **WHEN** a maintainer reviews deployment guidance
- **THEN** the documentation states that the current admin model is single-owner, password-gated, and not a multi-user auth system

### Requirement: Release readiness includes verification gates
The system SHALL define explicit release gates that must pass before the site is treated as ready for deployment.

#### Scenario: Automated verification gate
- **WHEN** the site is prepared for release
- **THEN** the release checklist requires successful lint, test, and production build execution

#### Scenario: Manual admin publishing gate
- **WHEN** the site is prepared for release
- **THEN** the release checklist requires manual verification of login, draft creation, editing, publish, unpublish, and public visibility behavior

### Requirement: Admin publishing verification steps are reproducible
The system SHALL document the manual admin publishing flow as a reproducible verification checklist.

#### Scenario: Maintainer verifies publish flow
- **WHEN** a maintainer follows the admin publishing checklist
- **THEN** the documented steps cover creating a draft, publishing it, confirming public visibility, unpublishing it, and confirming public removal

#### Scenario: Maintainer verifies error handling expectations
- **WHEN** a maintainer follows the admin publishing checklist
- **THEN** the documentation includes the expected outcomes for key failure or edge cases such as duplicate slug errors or unauthenticated admin access

### Requirement: Deployment readiness records current limitations
The system SHALL document the known security and operational limitations of the current single-owner admin approach.

#### Scenario: Maintainer reviews known limits
- **WHEN** a maintainer checks the readiness document before release
- **THEN** the document states the absence of multi-user roles, session revocation, and full audit logging

#### Scenario: Future auth upgrade trigger is documented
- **WHEN** the admin scope expands beyond a single owner
- **THEN** the readiness document identifies that broader auth requirements should trigger a re-evaluation of the current login model
