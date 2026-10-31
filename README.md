# SuuqVerse: walk inside your supermarket

React + React Three Fiber + Three.js customer shopping simulation, Node/Express API, and optional MongoDB during local development.

## Run locally

Requires Node 20+ and npm.

```bash
npm install
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173`. If that port is occupied, Vite prints the next available port. Use the printed Network URL to visit from a phone on the same Wi-Fi.

The first `npm run dev` creates a private `.env` with random `JWT_SECRET` and `ADMIN_PASSWORD` values if the file does not exist. Existing `.env` files are preserved. Read `ADMIN_PASSWORD` from that file to sign in via the header's Admin button or `/#admin`. Never expose `.env` to the frontend.

With no `MONGODB_URI`, local development runs clearly labeled **non-persistent demo data**. Products and orders reset when the API restarts. Cart quantities persist in browser localStorage. There are 24 seed products across eight departments.

Atlas is configured locally in the private `.env`. The health endpoint reports `persistent: true` only while the database is connected. If a configured database cannot be reached, startup fails instead of falling back to demo memory; a later disconnect returns HTTP 503 until it reconnects.

To persist products and orders, set `MONGODB_URI` to a MongoDB replica set (for example Atlas) in `.env` and restart the API. Order stock updates and order creation use a transaction; standalone MongoDB without replica-set support cannot process those transactions. Uploads live in `data/uploads` and require persistent disk storage separately from MongoDB.

## Verify the database

```bash
npm run db:check
npm run db:verify
```

`db:check` connects without printing credentials and reports database name and document counts. `db:verify` starts an isolated API on port 3111 against the configured database, creates a clearly marked temporary product and orders, verifies real Atlas transactions and persistence across API restart, and removes only those test records and its temporary upload. It does not process a real payment or alter existing inventory. Initial seed IDs are deterministic to prevent duplicate seed inventory when multiple API workers first start together.

## Controls

- Click the scene: capture mouse when the browser permits pointer lock. Move mouse to look; Escape releases capture.
- Drag the scene: look without pointer lock. This is also the fallback for insecure HTTP LAN URLs.
- W/A/S/D or arrow keys: walk and strafe. Camera height is fixed; diagonal speed is normalized.
- E or click: inspect an in-range product under the crosshair. Approach a checkout counter and use E to review the cart.
- C: open cart while the scene is focused.
- Mobile: left joystick to move, drag elsewhere to look, tap an in-range product or the hand button to inspect.
- Forms, admin and modal panels pause movement. Close panels to resume exploring; click the scene again to capture the mouse.

Shelves, counters, trolley and store boundaries have collision bounds. Motion uses smoothing, delta-time and small collision substeps. Product targeting uses a ray with a 2.8 m reach and stops at fixtures. There is no flying or camera bob.

## Shopping and inventory

Inspect a product to see its generated image, description, price, stock and quantity. Use “Rotate in 3D” for an orbitable preview. Add products to cart, adjust quantities or remove them. The cart persists across refreshes; stale products are identified and stock changes prevent invalid checkout. Inventory refreshes every 15 seconds while visible and on window focus, including changes made by another admin tab.

The optional product list and store guide are available in the header. This list also provides an alternative when WebGL is unavailable. Shelf capacity is 144 distinct placements. Repeated facings represent the same inventory record; they do not create extra stock. Beyond physical shelf capacity, products remain accessible in the product list with an explicit notice.

Checkout records customer details and produces an order reference, server-calculated total, order state and pending payment state. ZAAD and EVC Plus are **manual verification** options. There is no automatic charge, payment gateway or automatic payment success. The receipt shows submission-time status; customers should retain the reference and contact the store for subsequent updates.

## Administration

- Server-authenticated, HttpOnly, SameSite session cookie; production cookies require HTTPS.
- Login throttling and same-origin mutation checks.
- Add/edit/remove inventory, prices, stock, shape and packaging color.
- Assign a department shelf and one of 18 positions per shelf. Conflicting positions are rejected.
- Upload PNG, JPEG or WebP images up to 2 MB; uploaded artwork appears on product labels and inspection panels.
- View customer orders, update fulfillment status and independently verify manual payments.
- Analytics count only verified payments on non-cancelled orders.

Cancelling an order changes its fulfillment status; it does not automatically restock products or issue refunds. Stock adjustments and refunds require store action.

## Tests

```bash
npm test
npm run test:browser
npm run build
```

`npm test` uses an isolated API on port 3108, never the running development store. It covers navigation math, collisions, placement allocation, malformed carts, authentication, CRUD, uploads, pricing, stock validation, concurrent demo orders, and order/payment state.

Browser tests use Playwright with installed Google Chrome, isolated API port 3107 and a production-style Vite preview on port 5180. A separate test-mode build in `.browser-dist` avoids hot-reload interference with movement tests. Set a compatible Playwright browser/channel in `playwright.config.js` if Chrome is not installed. Tests cover desktop pointer lock, mouse-look, keyboard motion, shelf collisions, real product pickup, modal pause, cart persistence, checkout, admin changes, image uploads, API errors and emulated mobile touch input. Screenshots are saved to `artifacts/`; failures include Playwright traces. Phone emulation does not replace physical device testing.

## Production

```bash
npm run build
npm start
```

Set `NODE_ENV=production`, `JWT_SECRET` (at least 32 characters), `ADMIN_PASSWORD` (at least 12 characters), and a working replica-set `MONGODB_URI`. Production refuses to start without a database; it never silently accepts orders into demo memory. The server serves `dist` and the API on `PORT` (default 3001). Put it behind HTTPS and preserve the external Host header. Set up persistent storage/backups for uploads.

For Railway or another Node host: build `npm ci && npm run build`, start `npm start`; supply the environment variables and mount persistent storage for `data/uploads`. Payment-provider integration and a production account/operations review are still needed before commercial launch.

## Architecture and art

- `shared/store.js`: store layout, collision math, shelf allocation, cart validation.
- `src/game/Player.jsx`: keyboard, pointer lock, mouse/touch look, smoothing, targeting.
- `src/game/World.jsx`: fixtures, signs, instanced inventory facings and counters.
- `src/game/ProductModel.jsx`: generated textured product meshes and label caching.
- `src/Store3D.jsx`: canvas lifecycle, mobile controls and WebGL error fallback.
- `src/App.jsx`: customer shell, inventory refresh and cart orchestration.
- `src/components/`: accessible dialogs, inspection, checkout, receipt and lazy admin.
- `server/`: authenticated inventory, order validation, image storage and MongoDB persistence.

See `ASSETS.md` for provenance and `DESIGN.md` for visual decisions. All bundled artwork is original procedural geometry or code-generated vector packaging. This is a stylized playable supermarket, not a photorealistic licensed-asset recreation. No Facebook Reel was included in the available project files or attachment, so reference matching has not been claimed.
