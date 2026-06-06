# Purpose

Define the current admin session model for the single-owner blog admin area using random server-side sessions.

## Requirements

### Requirement: Admin login issues random server-side sessions
The system SHALL create a random admin session token on successful login and validate it through trusted server-side session records.

#### Scenario: Successful login creates a persisted session
- **WHEN** the site owner submits the correct admin password
- **THEN** the system creates a server-side admin session record and sets a cookie containing a random session token rather than a deterministic password-derived value

#### Scenario: Missing server-side session is rejected
- **WHEN** a request presents an admin session cookie whose token does not match a valid server-side session record
- **THEN** the system MUST treat the request as unauthenticated

### Requirement: Admin sessions expire and can be invalidated by password rotation
The system SHALL enforce expiry on admin sessions and invalidate sessions created under an older password version.

#### Scenario: Expired admin session cannot access admin routes
- **WHEN** an admin session record has passed its expiry time
- **THEN** the system MUST reject the session for protected admin reads and mutations

#### Scenario: Password change invalidates older sessions
- **WHEN** the configured admin password changes after an existing session was created
- **THEN** the system MUST reject the older session rather than continuing to honor it

### Requirement: Admin session validation stays server-side
The system SHALL keep admin session validation in trusted server-side code and MUST NOT expose service-role-backed session checks to client code.

#### Scenario: Admin guard reads server-side session state
- **WHEN** a protected admin route or mutation checks whether the owner is authenticated
- **THEN** the validation path runs through trusted server-side code that reads session state from server-side storage

#### Scenario: Public UI only receives boolean auth outcome
- **WHEN** public or shared UI code needs to know whether to show an admin-only affordance
- **THEN** it uses the server-side auth outcome without exposing secret session internals to the browser
