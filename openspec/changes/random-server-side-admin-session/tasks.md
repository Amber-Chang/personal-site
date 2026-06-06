## 1. Session schema and auth contract

- [x] 1.1 Add an OpenSpec-backed migration plan for a new `admin_sessions` table in Supabase
- [x] 1.2 Add failing tests that describe random session creation, validation, expiry rejection, and password-rotation invalidation

## 2. Server-side session implementation

- [x] 2.1 Implement a server-side admin session module or repository that can create and validate session records
- [x] 2.2 Update login action flow to create random server-side sessions instead of deterministic password-derived cookies
- [x] 2.3 Update admin route guards, login page checks, and header admin visibility checks to validate server-side sessions

## 3. Verification and docs

- [x] 3.1 Add or update migration and auth tests for the new session model
- [x] 3.2 Run targeted auth tests, full test suite, and production build
- [x] 3.3 Update the deployment/security documentation to reflect the new session model and any changed limitations
