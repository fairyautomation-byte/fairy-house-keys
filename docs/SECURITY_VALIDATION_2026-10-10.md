# Security fixes and validation — 2026-10-10

This branch changes authentication, OTP, payments, quota enforcement and the extension. It is prepared for preview validation; it must not be treated as verified production security.

## Implemented

- Server-checked account status, email verification, session version and logout revocation. Scrypt password hashes with legacy migration on successful login; strict JWT configuration without fallback credentials.
- OTP purpose separation, expiry, resend cooldown, attempt limit and single-use transactions. Shared Firestore rate limits and same-origin protection for cookie-authenticated writes.
- Atomic wallet deductions, trial grants, payment settlement, license issuance and admin approval. Payment amounts and plan snapshots come from the server; duplicate callbacks and retries do not grant or debit twice. Paid orders cannot be rejected. Owner checks protect payment status and cancellation.
- Exact atomic daily quota reset/consumption, idempotent usage receipts, suspended/revoked license checks, server-side phone broker and invite quotas. Legacy activation device binding is transactional.
- License administration, audit entries, conservative account cleanup/migration and notification outbox with retry leases. Payment/email reconciliation is available to the administrator.
- Extension session invalidation, rejection of late responses after logout/key replacement, stale offline state, trusted storage/sender restrictions, frame origin checks, constrained Graph paging and CSV formula escaping. Phone transport retries use stable request identifiers.
- Updated dependencies, response headers, server prices and payment UI. Extension source and deterministic version 2.1.0 ZIP are included in this repository.
- Removed PayOS credential values found in tracked examples, scratch scripts and documentation. Values existed in Git history; credentials MUST be rotated in PayOS and the replacement configured on Vercel. History has not been rewritten.

## Validation performed locally

- Production build: successful (53 routes/pages).
- TypeScript: successful. ESLint: no errors; 21 unused-variable/directive warnings remain.
- Web unit/integration regression tests: 18/18 cases passed in the final full run. Firestore Emulator was used with a demo project; no integration cases skipped. Concurrency cases send 20 simultaneous requests for payment credit, purchase fulfillment, trial, wallet retry, quota, OTP, rate limits, admin approval and device binding.
- Extension regression suite: 10/10 passed.
- npm dependency audit: 0 known vulnerabilities across installed dependencies at validation time. This does not prove absence of application vulnerabilities.
- Browser: public pages return 200; tested desktop and mobile layouts, no horizontal overflow on tested mobile pages, no JavaScript errors. Unauthenticated dashboard access redirects to login, user API returns 401 and cross-origin write returns 403.
- Browser with demo account: login, dashboard, trial idempotent retry and logout passed against the development server connected to the emulator. Public layout checks used the production build.
- Release ZIP: version 2.1.0, 26 files; required manifest resources present. SHA-256: ae0ed3217918fec568824206305b4e33763d276d0001747691e8718da8a5dce1.

## Required before production rollout

1. Configure a separate Firebase project and Vercel preview environment. The supplied screenshot shows the existing `fairy-house-keys` project with activity; it does not establish test isolation. Do not run payment, cleanup or email tests against customer data.
2. Rotate previously committed PayOS credentials. Verify Firebase service-account credentials, JWT_SECRET (at least 32 bytes), existing KEY_SECRET_SALT for legacy passwords, OTP_SECRET_KEY, administrator credentials, SMTP and new PayOS configuration on Vercel. Never commit environment files or service-account JSON.
3. Validate signed PayOS webhook callbacks, real payment creation/cancellation/late settlement, SMTP delivery and reconciliation in the test environment. A provider response lost before the QR link is persisted currently returns a recoverable service error; QR recovery has not been verified with PayOS. Scheduled reconciliation requires deployment configuration; the current trigger is manual admin action.
4. Audit live Firestore rules, IAM/service-account permissions, backups and TTL retention. No live Firebase rules, IAM or customer records were changed by these local fixes. Emulator rules in this repository are test-only and must not be deployed as production rules.
5. Configure ADMIN_TOTP_SECRET and enable ADMIN_REQUIRE_MFA after validating the authenticator. Optional MFA code is implemented and RFC-vector tested; MFA is not enabled on the current cloud deployment by this branch.
6. Upgrade the installed extension to 2.1.0 together with the backend. Old consume requests without requestId are rejected. Existing web sessions need re-login. Unverified legacy accounts must use the verification flow; migration never silently marks users verified.
7. Validate actual Facebook scanning/inviting and phone-provider behavior with a test account. Automated extension tests use browser API mocks. Moving provider calls behind this server does not restrict a third-party publicly accessible provider; provider authentication/contract remains an external dependency.
8. Review remaining product claims about device limits and Facebook checkpoint avoidance; the current extension does not cryptographically enforce physical-device identity or guarantee Facebook account safety. Notification retries can deliver duplicate email after an ambiguous SMTP outcome; accounting and license issuance remain idempotent.

## Reproduce

Install dependencies with npm ci. Build with npm run build. Start Firestore Emulator using firebase.test.json and project demo-fairy-security; export FIREBASE_PROJECT_ID=demo-fairy-security and FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 before npm run check. Tests refuse a non-demo emulator project. Tests do not load real SMTP/payment environment values.

Build the extension ZIP with python scripts/build-extension.py. Keep extension/ as the versioned source for future releases.
