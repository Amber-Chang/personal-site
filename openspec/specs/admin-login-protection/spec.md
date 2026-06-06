# Purpose

Define the minimum brute-force resistance and cookie policy for the single-owner admin login flow.

## Requirements

### Requirement: Admin login applies minimum brute-force resistance
The system SHALL apply a minimum rate-limit policy to the single-owner admin login flow before evaluating repeated password attempts.

#### Scenario: Repeated failed attempts become temporarily blocked
- **WHEN** the same login identifier exceeds the configured failed-attempt threshold within the active window
- **THEN** the system rejects additional login attempts for a cooldown period with a controlled error response

#### Scenario: Blocked login does not create a session
- **WHEN** a blocked identifier submits the correct or incorrect password during the cooldown period
- **THEN** the system MUST not create an admin session and MUST return the blocked response

### Requirement: Successful admin login resets failure state
The system SHALL clear the accumulated failed-attempt state when the owner successfully authenticates.

#### Scenario: Successful login clears prior failed attempts
- **WHEN** the owner provides the correct admin password before or after prior failed attempts
- **THEN** the system creates the admin session and resets the tracked failure state for that identifier

### Requirement: Admin login failures remain controlled and non-revealing
The system SHALL return controlled admin login errors without exposing sensitive server-side configuration or secret material.

#### Scenario: Wrong password returns a controlled error
- **WHEN** the owner submits an incorrect admin password while not blocked
- **THEN** the system returns a controlled authentication error without revealing secret values or internal comparison details

#### Scenario: Missing password returns validation error
- **WHEN** the owner submits the login form without a password
- **THEN** the system returns a controlled validation error and does not create a session

### Requirement: Admin session cookies follow production-safe defaults
The system SHALL issue admin session cookies with production-safe defaults appropriate for a single-owner admin area.

#### Scenario: Production session cookie is secure and httpOnly
- **WHEN** the app issues an admin session cookie in production
- **THEN** the cookie uses `httpOnly`, `secure`, and `sameSite=lax` defaults

#### Scenario: Session policy is documented with an explicit lifetime
- **WHEN** the deployment readiness documentation is reviewed
- **THEN** it states the intended admin session lifetime and the rationale for that policy
