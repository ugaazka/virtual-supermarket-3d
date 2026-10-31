# Verification: 2026-10-31

## Results

- `npm test`: **15 passed**, including isolated Express API tests and navigation/collision math.
- `npm run test:browser`: **5 passed**, using installed Chrome with SwiftShader and an isolated built preview.
- `npm run build`: **passed**. Vite reports a large Three.js vendor chunk (about 983 KB raw / 271 KB gzip); this is a size advisory, not a build failure. Administration is a separate lazy chunk.
- Separate desktop light/dark preview: product panel visible and **zero console errors or page errors** during the captured flow.

## Browser acceptance coverage

| Behavior | Result |
| --- | --- |
| Customer URL opens a usable full-viewport 3D store | Passed |
| W, A, S and D move the real camera at fixed eye height | Passed |
| Mouse-look after activating pointer lock | Passed |
| Escape releases pointer lock | Passed |
| Drag-look without pointer lock | Passed |
| Shelf collision prevents crossing the fixture | Passed |
| Approach and target an actual physical shelf product | Passed |
| E and direct mouse click open that record's inspection panel | Passed |
| Scene input pauses during inspection | Passed |
| Add-to-cart and C shortcut update/show the cart | Passed |
| Persisted quantities survive page reload | Passed |
| Quantity changes, checkout details, order receipt, pending EVC state | Passed |
| Admin login, image upload, create/edit/delete inventory | Passed |
| Edited inventory appears in the customer inspection panel | Passed |
| Admin can see the browser-created order and log out | Passed |
| API error leaves the scene available and Retry recovers | Passed |
| Emulated mobile touch joystick moves the actual camera | Passed |
| Emulated mobile drag changes actual camera rotation | Passed |
| Mobile cart fits the emulated phone viewport | Passed |

The desktop gameplay and mobile tests assert no uncaught page errors. The separate preview also checks console errors. API tests verify anonymous access rejection, session cookies, same-origin request rules, conflicting shelf slots, invalid stock, server totals ignoring client prices, duplicate item rejection, concurrent demo orders not overselling the last unit, image validation/retrieval, order-state updates and deletion.

## Screenshots

- `artifacts/store-desktop.png`
- `artifacts/store-mobile.png`
- `artifacts/store-dark.png`
- `artifacts/product-inspection.png`

## Verification limits

- MongoDB Atlas `suuq` is now configured privately and verified. `db:verify` passed real authenticated CRUD, server totals, stock rejection, transactional order creation, concurrent last-unit protection, order-status persistence, upload persistence and product/order survival across API restart. Its one temporary product and two temporary orders were removed. The ordinary browser suite still uses isolated demo memory by design.
- Legacy MongoDB inventory metadata migration is implemented but has not been run against an existing database here.
- Tests emulate an iPhone in Chrome; no physical phone or Safari run was performed. No hardware FPS or Lighthouse performance result is claimed.
- ZAAD/EVC Plus have no authorized payment-provider API configured. All orders start with pending payment; administrators must independently verify transfers.
- Product/environment art is original stylized procedural geometry and vector packaging. No video reference or photorealistic licensed GLB asset pack was available.
- A production deployment was not requested or performed. Atlas is configured; HTTPS and persistent upload storage still need deployment configuration.
- The workspace has no Git repository or configured remote, so no commit or push was performed.

## Atlas connection follow-up

- Running storefront health: `ok: true`, `persistent: true`, `mode: database`, `database: connected`.
- The supplied cluster/database were initially empty. Two development API workers seeded concurrently and produced duplicate initial inventory. First-start seeding now uses deterministic IDs, preventing that race.
- Removing the untouched duplicate seed records was rejected by automatic approval review. No duplicate cleanup was performed. A read-only report in `artifacts/database-inventory-audit.json` records exact copies and linked-order counts for review; deletion requires explicit user approval.
- An additional regression test verifies a configured database failure exits instead of silently accepting orders into demo memory. A later disconnect returns HTTP 503 until reconnection.
- Credentials remain in private `.env`, excluded from source control and the client build.

- Live Atlas storefront/browser verification passed: real ObjectId inventory, 48 admin inventory rows, successful login/logout, no demo warning, and zero critical browser errors. Screenshot: `artifacts/store-connected-atlas.png`. The 48 rows include 24 exact untouched seed duplicates awaiting cleanup approval; the read-only audit found no linked orders.

## Graphics troubleshooting

The installed Chrome user profile was inspected read-only and had hardware/graphics acceleration disabled. The error screen previously labeled every scene error as a WebGL problem. It now distinguishes graphics-context failures from other runtime errors, provides Chrome settings/relaunch instructions, offers retry/product-list actions, and hides gameplay controls while the scene is down. The renderer uses the default GPU preference rather than requesting a high-performance GPU. Browser graphics preferences were not modified.

Both disabled-WebGL recovery and successful enabled-WebGL rendering were verified in Chrome; the product list remains usable without WebGL.
