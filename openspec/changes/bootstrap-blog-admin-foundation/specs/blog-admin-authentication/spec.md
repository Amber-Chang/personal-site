## ADDED Requirements

### Requirement: Admin magic link sign-in
The system SHALL allow the site owner to request a magic link sign-in flow for blog admin access through Supabase authentication.

#### Scenario: Admin requests sign-in
- **WHEN** the site owner submits an allowed email address from the admin login flow
- **THEN** the system initiates a Supabase magic link sign-in request for that email

#### Scenario: Unsupported email cannot complete admin access
- **WHEN** a user outside the allowed admin access rules attempts to use the admin login flow
- **THEN** the system MUST reject admin access rather than granting an authenticated admin session

### Requirement: Admin auth callback creates protected session
The system SHALL complete the auth callback flow and establish an admin-capable session before allowing access to protected admin routes.

#### Scenario: Valid callback reaches admin area
- **WHEN** a valid magic link callback is received
- **THEN** the system establishes the session and redirects the user to the admin posts area

#### Scenario: Invalid callback does not enter admin area
- **WHEN** the auth callback is missing required credentials or session exchange fails
- **THEN** the system MUST not grant admin access and MUST redirect the user away from protected admin content

### Requirement: Admin routes require centralized session guard
The system SHALL use centralized guard logic to protect admin routes and admin-side mutations.

#### Scenario: Unauthenticated user opens admin route
- **WHEN** an unauthenticated user requests a protected admin page
- **THEN** the system redirects the user to the admin login flow

#### Scenario: Unauthenticated user triggers admin mutation
- **WHEN** an unauthenticated user invokes an admin-only server action or mutation path
- **THEN** the system rejects the action without mutating admin data
