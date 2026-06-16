## ADDED Requirements

### Requirement: Admin login uses Google OAuth through Supabase
The system SHALL provide Google OAuth through Supabase as the primary `/admin/login` authentication path.

#### Scenario: Admin starts Google sign-in from the login page
- **WHEN** the site owner opens `/admin/login`
- **THEN** the page presents Google OAuth as the primary admin sign-in action

#### Scenario: Successful OAuth flow reaches the admin area
- **WHEN** the site owner completes a valid Google OAuth flow
- **THEN** the system establishes the authenticated session and redirects the user to `/admin/posts`

### Requirement: Admin access requires an allowlisted email
The system SHALL grant admin access only to authenticated users whose normalized email matches the configured admin allowlist.

#### Scenario: Allowlisted authenticated user gains admin access
- **WHEN** an authenticated user returns from OAuth with an email present in `ADMIN_ALLOWED_EMAILS`
- **THEN** the system treats the user as an authorized admin

#### Scenario: Non-allowlisted authenticated user is rejected
- **WHEN** an authenticated user returns from OAuth with an email not present in `ADMIN_ALLOWED_EMAILS`
- **THEN** the system MUST deny admin access, clear the active auth session, and redirect the user back to the admin login flow

### Requirement: Admin routes and mutations use centralized authenticated-admin guards
The system SHALL use centralized guard logic for admin pages and admin-side mutations based on authenticated session state plus allowlisted admin authorization.

#### Scenario: Unauthenticated user opens admin route
- **WHEN** an unauthenticated user requests a protected admin page
- **THEN** the system redirects the user to `/admin/login`

#### Scenario: Authenticated non-admin user triggers admin mutation
- **WHEN** an authenticated user outside the allowlist invokes an admin-only mutation path
- **THEN** the system MUST reject the action without mutating admin data
