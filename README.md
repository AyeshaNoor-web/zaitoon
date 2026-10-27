# Zaitoon — House of Shawarma & BBQ

Online ordering site and staff admin for Zaitoon's Lahore branches. Customers browse the menu, set a delivery location, check out, and confirm the order with the branch on WhatsApp. Staff manage live orders, the menu, site content and reviews from `/admin`.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Supabase, Zustand and Framer Motion.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000. The admin is at http://localhost:3000/admin.

### Environment variables

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client. It can only **read** the public catalog (menu, categories, branches, FAQs, site content). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only API routes. Never expose it to the browser or commit it. |
| `CUSTOMER_SESSION_SECRET` | Optional. Signs customer device sessions; derived from the service-role key if unset. |
| `NEXT_PUBLIC_SITE_URL` | Referral links and metadata |
| `GOOGLE_MAPS_API_KEY` | Optional. Road distance, address search and reverse geocoding (server-side). Without it the app falls back to OpenStreetMap and a buffered straight-line distance. |

### Database

SQL migrations are in the repo root (`*-migration.sql`) and `supabase/`. Loyalty points are awarded by a Postgres trigger when an order moves to `confirmed` (`loyalty-trigger-migration.sql`).

**Run `security-lockdown-migration.sql` after deploying the current code.** It removes public write access and limits the public key to reading the catalog.

## How data access works

- **Public catalog** (menu, categories, variants, branches, site content, FAQs, combos) is read directly with the anon key.
- **Orders** are placed through `POST /api/orders`. The server re-prices every item from the database, picks the nearest branch, recalculates the delivery fee, and applies member discounts or points.
- **Customers** are identified per device. A signed, httpOnly `zt_customer` cookie is issued when an account is created on that device. Anyone can order with a phone number, and the order earns points for that number's owner. Viewing or spending points needs the device session (`/api/auth/*`, `/api/customer/*`).
- **Admin** reads and writes go through `POST /api/admin/rpc` (`src/lib/server/adminOps.ts`). It validates the `admin_session` cookie against the database, checks the owner/employee role per operation, and only writes allowlisted columns.

## Project layout

```
src/app            Routes: home, menu, checkout, order tracking, account, loyalty, admin, API routes
src/components     UI: layout (navbar, footer), menu cards, cart, location modal, admin shell
src/lib/api        Browser data helpers (public reads, server API calls)
src/lib/server     Server-only logic: order pricing, customer sessions, admin operations, distance
src/store          Persisted Zustand stores (cart, auth, language, location) + hydration helper
```

### Design system

Tokens live in `src/app/globals.css` under `@theme`: warm paper neutrals (`paper`, `line`, `ink`), one brand hue (`olive-*`) and one action hue (`ember-*`). Headings use Fraunces and body text uses Figtree. Shared component classes include `.btn-primary`, `.btn-outline-dark`, `.field`, `.chip`, `.panel` and `.section-label`.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run lint`: ESLint (Next.js core-web-vitals and TypeScript rules)
