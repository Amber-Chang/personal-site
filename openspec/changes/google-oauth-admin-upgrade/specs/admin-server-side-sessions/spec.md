## MODIFIED Requirements

### Requirement: Admin session validation stays server-side
The system SHALL keep admin session validation in trusted server-side code and MUST NOT expose privileged authorization checks to client code.

#### Scenario: Admin guard reads authenticated session state on the server
- **WHEN** a protected admin route or mutation checks whether the current user is authorized
- **THEN** the validation path runs through trusted server-side code that reads the authenticated session and admin allowlist outcome

#### Scenario: Shared UI only receives admin auth outcome
- **WHEN** shared UI code needs to know whether to show an admin-only affordance
- **THEN** it uses the trusted server-side admin auth outcome without exposing privileged auth internals to the browser
