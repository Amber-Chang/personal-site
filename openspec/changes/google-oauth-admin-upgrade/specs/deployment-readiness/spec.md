## MODIFIED Requirements

### Requirement: Production deployment prerequisites are documented
The system SHALL define a single deployment readiness document that records the required production configuration and release prerequisites for the current Google-OAuth-backed admin model.

#### Scenario: Required environment variables are listed
- **WHEN** a maintainer prepares a production deployment
- **THEN** the readiness documentation lists the required runtime environment variables, including `ADMIN_ALLOWED_EMAILS`, Supabase configuration values, and the Google OAuth provider setup expectations

#### Scenario: Admin architecture assumptions are documented
- **WHEN** a maintainer reviews deployment guidance
- **THEN** the documentation states that the current admin model is a Google-OAuth-authenticated, allowlisted admin flow rather than a shared-password login system

### Requirement: Deployment readiness records current limitations
The system SHALL document the known security and operational limitations of the current allowlisted-admin approach.

#### Scenario: Maintainer reviews known limits
- **WHEN** a maintainer checks the readiness document before release
- **THEN** the document states the absence of multi-user roles, session/device management, and full audit logging

#### Scenario: Future auth expansion trigger is documented
- **WHEN** the admin scope expands beyond the current allowlisted-owner model
- **THEN** the readiness document identifies that broader auth and permission requirements should trigger another re-evaluation of the current admin model
