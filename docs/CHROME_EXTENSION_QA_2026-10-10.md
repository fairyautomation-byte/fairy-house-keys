# Chrome extension QA — 2026-10-10

## Actual customer failure

The customer screenshot showed version 2.1.0 scanning 100 UIDs, then failing with `Unexpected token < ... DOCTYPE ... is not valid JSON`. Read-only HTTP verification confirmed `/api/license/phones` returns 404 HTML on both production domains. The extension was installed before its new backend was deployed. A passing preview build does not establish backend compatibility on production.

The extension now reports that the backend must be updated instead of exposing a JSON parser exception. The popup also immediately returns to activation when manual synchronization detects a suspended key, and handles failed synchronization. Version 2.1.1 packages these fixes.

## Browser evidence

The exact release ZIP was extracted and loaded into a separate Chrome for Testing profile. Real extension service workers, storage access levels, content-script isolated worlds, popup DOM, embedded iframe, message routing and downloads were exercised. Its backend URL was transparently routed to the local Next development server connected to Firestore Emulator, using a demo project and dummy license. Facebook HTML/GraphQL/Graph API responses and the phone provider were fixtures; no real Facebook account, customer records or external provider data was used. These are browser integration tests, not live Facebook acceptance tests.

12 checks passed:

1. ZIP loading, service-worker startup and popup key activation.
2. No Facebook cookie gives unavailable status.
3. Chrome content scripts cannot read license storage or invoke privileged key changes; public session hides the key.
4. Content injection and workstation iframe handshake initialize successfully.
5. Group GraphQL fixture parses into rows with names, gender and phone data via the real iframe bridge/backend broker.
6. UID export downloads the expected fixture IDs.
7. Excel export downloads a valid XLSX ZIP/XML workbook with header and data rows.
8. Losing the provider response after settlement causes retry with the same request ID; quota is charged once.
9. A request exceeding the exact daily limit is denied.
10. 404 HTML produces a useful backend compatibility message, without a raw parser error.
11. Suspending the emulator key immediately invalidates the popup on synchronization.
12. Logout clears the stored license.

No JavaScript page errors were reported in the successful run. The 11-case extension regression suite and syntax checks on 20 JavaScript files passed. The first local activation attempt timed out while Next compiled a cold route; the APIs were warmed before the successful run. The browser test waits for the iframe READY message before interacting.

Release version: 2.1.1. Files: 26. SHA-256: 662edf21972cf66ccc77b9c7025a38bed7030d36b1c29c8ed2b5d1a11a6f58e8.

## Outstanding acceptance work

`fairy-house-keys` is confirmed by the user to serve customers. No separate test Firebase configuration has been supplied. Existing Chrome account access through Computer Use failed to initialize. Real Facebook scanning, profile/fanpage variants, actual gender/provider availability, friend requests, checkpoint handling and live quota behavior remain unverified. PayOS/SMTP and cloud permissions remain pending as documented in SECURITY_VALIDATION_2026-10-10.md. Do not distribute the new ZIP to customers before the compatible backend and required configuration are deployed and validated together. Never embed preview authentication bypass credentials in a public extension.
