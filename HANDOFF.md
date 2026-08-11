# WOWLifestyle Thuraiur — Handoff

## What this is

A Next.js 15 / TypeScript / Tailwind e-commerce app with a **real backend**:
PostgreSQL (hosted on Supabase) via Prisma 7, cookie-based auth with bcrypt password
hashing, a full admin panel, and SFTP-based media uploads to a Hostinger VPS. This is a
big change from an earlier phase of this project that was a pure-`localStorage`,
no-backend showcase — that phase is over. If you're reading an older summary or memory
that says "no backend," it's stale; trust this file and the live code instead.

Repo: `C:\Users\surya\Desktop\wow\wowlifestyle`. **Still not a git repo** — consider
initializing one now that there's a real backend with migrations, given how much harder
this would be to recover from a bad edit without version control. A full pre-teardown
backup of an even earlier (Mongo-backed) iteration exists at
`C:\Users\surya\Desktop\wow\wowlifestyle-backup-20260730-094809`, kept only in case
something from that iteration is ever worth referencing.

Dev server runs on `localhost:3000` — the user starts it themselves (`npm run dev`);
don't start a preview server, just point the Browser pane at the existing one. Note:
adding new Prisma models/migrations requires a dev-server restart to pick up the
regenerated client (`app/generated/prisma`) — a stale client is a common false "bug."

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma 7 (`@prisma/adapter-pg`,
driver adapters, client output at `app/generated/prisma`, **not** the default
`node_modules/.prisma`) · PostgreSQL via Supabase pooler · bcryptjs · ssh2 (SFTP uploads)
· lucide-react · framer-motion.

## Routes

**Customer-facing** — all wired, all backed by real API routes (see Data layer below):

| Route | Purpose |
|---|---|
| `/` | Homepage — content now comes from the CMS tables (`app/server/homepage.ts`, `app/server/content.ts`), falling back to static copy in `data/home-content.ts` when a table is empty |
| `/login`, `/register` | Real auth — bcrypt-checked login, registration always creates a non-admin `User` |
| `/category/[categoryId]` | Category listing — **server-rendered first page**, then client-side filters, sort, infinite scroll, mobile bottom sheets. Search (`?q=`) works here; it previously did nothing. |
| `/product/[productId]` | Product detail — server-rendered, gallery, sticky Add to Cart/Buy Now, Product JSON-LD |
| `/cart` | Cart — coupon, address picker, quantity steppers — all server-persisted |
| `/checkout` | 3-step Address → Delivery → Payment stepper |
| `/checkout/success` | Order confirmation |
| `/orders`, `/orders/[orderId]` | Order history + detail with timeline, print-invoice |
| `/wishlist` | Saved items |

**Admin** — `app/admin/(dashboard)/`, gated by `requireAdmin()` server-side (no
`middleware.ts` — protection is per-route, not edge-level):

| Module | What it manages |
|---|---|
| Dashboard (`/admin`) | KPIs: 30-day revenue/orders, customers, lifetime revenue, revenue trend chart, status donut, best sellers, recent orders, low stock |
| Products | Full CRUD — images, videos, specs, publish/featured/deal flags, category/subcategory/brand |
| Import | Bulk CSV/JSON product import — column-mapping preview, dry run, chunked upload with progress |
| Categories / Subcategories | Create/update, slug uniqueness enforced |
| Brands | Full CRUD |
| Orders | Status transitions only (`PROCESSING/SHIPPED/DELIVERED/CANCELLED`) — no create/delete |
| Coupons | Create/update |
| Customers | Merges `User` + `GuestCustomer` rows — **currently always shows 0 guest rows**, see Known gaps |
| Homepage | Hero slides, promo/lifestyle banners, category tiles, featured/deal product pickers |
| Content | Site settings (single strings) + `ContentItem` tree (nav/mega-menu/footer/trust/social/payment-badge/offers) |
| Settings | Admin users (create/promote, can't demote the last admin), self-service password change |
| Notifications | Admin bell, populated on order placement |

There's no separate admin login page — `/login` is shared, and `app/admin/(dashboard)/layout.tsx` redirects unauthenticated visitors there.

## Auth — read this before touching login/session code

One unified session system, not split by role:

- `app/server/auth.ts` signs a stateless `userId.expiresAt.signature` HMAC-SHA256 token
  (secret: `ADMIN_AUTH_SECRET` env var — the name is historical, it signs **every**
  session, customer or admin) into an httpOnly `session` cookie, 7-day maxAge. Verified
  with a constant-time (`timingSafeEqual`) comparison. `getCurrentUser()` / `getCurrentAdmin()`
  (the latter requires `user.isAdmin`) are the two things to call, never re-derive this.
- `app/server/adminGuard.ts::requireAdmin()` gates every `app/api/admin/*` route.
- `app/api/auth/{login,register,logout,me}/route.ts` — registration always sets
  `isAdmin: false` (never settable from the public form); passwords hashed with
  `bcrypt.hash(password, 12)`.
- **Separate, independent anonymous-session mechanism**: `app/server/session.ts` issues
  a `wow_session` httpOnly cookie (random UUID, 1-year maxAge) via
  `getOrCreateSessionId()`. **Cart, wishlist, addresses, and orders are keyed exclusively
  by this session ID, never by the logged-in `userId`** — see Known gaps, this is the
  single biggest functional hole in the app right now.

## Data layer (all Prisma-backed, no localStorage for actual data)

| Feature | Client wrapper | Server module | API routes |
|---|---|---|---|
| Cart | `app/components-home/lib/CartContext.tsx` | `app/server/cart.ts` | `app/api/cart/*` |
| Wishlist | `app/components-home/lib/wishlist.ts` | `app/server/wishlist.ts` | `app/api/wishlist/*` |
| Orders | `app/components-home/lib/orders.ts` | `app/server/orders.ts` | `app/api/orders/*` |
| Addresses | `app/components-home/lib/addresses.ts` | `app/server/addresses.ts` | `app/api/addresses/*` |
| Coupons | (inside cart flow) | `app/server/cart.ts::checkCouponAgainstDb` | `app/api/cart/coupon/*`, admin: `app/api/admin/coupons/*` |

`lib/pricing.ts::computeTotals()` is still the one place subtotal/discount/shipping/total
math happens — both Cart and Checkout call it, never reimplement it.

### Catalogue reads — the rule that matters at scale

**The database returns the page, not the catalogue.** `app/server/catalog.ts`
does all filtering, sorting, paging, counting and facet aggregation in SQL, and
list queries select only the nine columns a grid tile paints.

It did not always. The original version loaded *every published product* with all
of its images, videos and specifications on every request and filtered the result
in JavaScript — invisible at the 14 seeded products, **1.7 s and 6.4 MB per
request** at 3,000, and it ran again for every filter toggle, every scroll batch
and every product page's related strip. The in-memory `queryCatalog()` in
`data/catalog.ts` was deleted rather than left as a trap; that file now holds only
shared types and the static seed array.

If you add a catalogue read, it selects columns and takes a page. The same
mistake reappeared once in the admin Homepage editor (it loaded all 3,000
products into a picker, 712 ms / 825 KB) and was fixed the same way — the picker
now searches through `GET /api/admin/products`.

Two projections exist and mean different things: `CatalogCard` for anything that
renders a tile, `CatalogProduct` for the detail page only.

### Bulk import

`app/server/import/` — CSV/JSON → catalogue, used by both `/admin/import` and
`npm run products:import`. See `DEPLOY.md` §3. Points worth knowing:

- `csv.ts` and `normalize.ts` are **intentionally isomorphic** (no `server-only`):
  the admin screen parses and validates in the browser, then uploads normalised
  rows in slices of 250. One 3,000-row request would exceed a serverless timeout
  *after* writing part of the catalogue.
- Products carry a `sku`, matched on **before** slug. That's what makes a
  re-import converge instead of duplicating everything when a title changes.
- Column names are matched through `ALIASES` in `normalize.ts`. Add spellings
  there rather than asking operators to rename spreadsheet columns.

### Caching, and how to not break it

- `unstable_cache` under the `catalog` tag: brand names, department facets,
  category metadata.
- The **homepage is prerendered** (ISR, 1 h). CMS edits reach it only because
  admin writes call `revalidateHomepage()`.
- `app/server/revalidate.ts` exposes `revalidateCatalog` / `revalidateHomepage` /
  `revalidateStorefront`. **Every admin write handler calls one.** If you add a
  route that mutates products, categories, brands, banners, hero slides, content
  or settings, call the matching one — on the success path only, never in a GET.

### `loading.tsx` is deliberately absent from `/category/[categoryId]` and `/product/[productId]`

It wraps the whole route segment in a Suspense boundary, which flushes the HTTP
status before the page has decided whether the product exists — so a dead URL
renders correct not-found UI under a **200**. Across 3,000 product URLs that's a
real SEO problem, not a cosmetic one. Moving the check into a `layout.tsx` does
*not* help; that was tried and measured. The working shape is:

- the existence check is awaited in the page body (the shell), then
- the slow query streams behind an explicit `<Suspense>` inside the page
  (`ListingSkeleton` on the category page), or runs concurrently (product page).

If you add a `loading.tsx` to either route, you will silently reintroduce soft
404s. Check status codes, not just what renders.

Genuinely legitimate remaining `localStorage` use: `CartContext.tsx` stores only
`cart-address-id` (a UI preference — which saved address is currently selected), not
cart contents.

`app/components-home/lib/addresses.ts` always prepends 2 static seeded demo addresses
(from `data/home-content.ts::savedAddresses`) ahead of real DB rows, by design — every
session shows those 2 "extra" addresses regardless of account.

## Media uploads

`app/server/sftp.ts` connects via `ssh2` to a Hostinger VPS (`200.97.164.140:22`,
user `root`), writes to `/var/www/uploads/<folder>/<filename>`, served by nginx at
`http://200.97.164.140/uploads/*`. `app/api/admin/upload/route.ts` returns 503 if
`VPS_SSH_PASSWORD` isn't set. **As of this writing the env var IS set** — but its
validity as a live credential hasn't been confirmed by an actual upload attempt; test
that before relying on it. Either way, this only affects *new* uploads through the admin
`MediaUploader.tsx` — the seeded catalog's images are plain Unsplash URLs
(`ProductImage.url`, whitelisted in `next.config.ts`'s `images.remotePatterns`) and don't
depend on the VPS at all, so the storefront works regardless.

## Database setup

**Migrations** (`prisma/migrations/`, 9 so far, oldest→newest): `init` →
`add_address_session` → `orders_snapshot_address_and_session` → `user_is_admin` →
`add_product_videos` → `homepage_cms` → `full_content_cms` → `product_is_deal` →
`notifications`.

**Seed scripts — now wired into `package.json` (`npm run seed` runs 1–3 in order):**
1. `prisma/seed.ts` — categories/brands/products/specs/images from `data/catalog.ts`,
   coupons from `data/home-content.ts`, and a default admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`
   env vars, else `admin@wowlifestyle.com` / `ChangeMe123!`) if that email doesn't exist yet.
2. `prisma/seed-subcategories.ts` — needs step 1's categories to already exist.
3. `prisma/seed-content.ts` — independent; pushes homepage/site copy into
   `SiteSetting`/`ContentItem`/`HeroSlide`/`Banner` (idempotent wholesale replace per group).
4. `prisma/create-admin.ts` — standalone, run anytime: `npx tsx prisma/create-admin.ts [email] [password] [name]`.

`DATABASE_URL`/`DIRECT_URL` point at a real Supabase-pooled Postgres instance (not
localhost). `prisma.config.ts` loads env via `dotenv/config`. Prisma's generated client
output is `app/generated/prisma` (Prisma 7 `prisma-client` generator, not the
`node_modules/.prisma` default) — it's `.gitignore`d, so it must be regenerated
(`npx prisma generate`) after any fresh checkout.

## Design system — read this before touching any styling

**`tailwind.config.ts`** is the source of truth. Two scale constants drive everything:
- `UI_SCALE = 0.9` — the whole page (type, spacing, container, controls, banners)
- `NAV_SCALE = UI_SCALE * 1.05` — header/nav/mega-menu/drawer sit 5% larger than the page

Every token derives from one of these via helper functions (`r()`, `p()`, `v()`,
`fluid()`, `ramp()`) — **never hardcode a px/rem value or a hex color** in a component.
Colors: `gold` (primary/CTA), `navy` (dark surfaces), `cream`/`mist`/`sky` (fields),
`line` (borders), `ink` (text). `#B91C1C` (error/danger text) and `#0F7B3F` (success
text) are intentional WCAG-AA-safe exceptions, not accidental one-offs.

**`app/components-home/lib/cn.ts`** registers the custom fluid font-size tokens
(`text-hero`, `text-micro`, `text-nav-ui`, etc.) with `tailwind-merge` via
`extendTailwindMerge` so a size and a color className can coexist in one `cn()` call
without one silently overriding the other. If you add a new custom `text-*` token,
register it here or it WILL be dropped in merges — this exact bug bit the nav links once.

**Breakpoint convention:** Desktop chrome (header nav, mega menu) switches at `lg`
(1024px). Content-heavy pages give tablet its own `md:` (768px) layout rather than
stretching mobile — established on the product page, then applied to
cart/checkout/order-details. Default to `md:` for a new two-column page's tablet split.

## Standing conventions (learned the hard way — don't redo the mistakes)

- **No `Math.random()`/`Date.now()`/`new Date()` inside Workflow scripts** — fine
  everywhere else in the actual app code.
- **This machine's Browser pane runs with `visibilityState: hidden`** — no rAF, no real
  IntersectionObserver delivery, `computer{screenshot}` times out. Verify UI via
  `read_page`/`get_page_text`/`javascript_tool`/`read_network_requests` instead of
  screenshots. CSS transitions/smooth-scroll also don't advance — assert on `classList`,
  not computed `transform`; use `behavior:"instant"` when testing scroll logic.
- **Synthetic `element.click()` via `javascript_tool` is unreliable for Next.js
  client-side navigation.** For a trustworthy "does this link actually navigate" check,
  use `read_page` to get a `ref_N`, then `computer{action:"left_click", ref}`.
- **`public/*.png` files are Git LFS pointers, not real images.** Use the product/CMS
  image URLs already in the DB, or `wow-logo.svg`.
- Adding a Prisma model/migration and not seeing it reflected in the app almost always
  means the dev server needs a restart (stale generated client), not a real bug — check
  that before deep-diving.

## Known gaps / cleanup — roughly in order of value

1. **Account ↔ session linking is unbuilt.** Cart/wishlist/addresses/orders are keyed
   only by the anonymous `wow_session` cookie, never by `userId`. Logging in doesn't
   attach a customer's existing cart/orders to their account, and no code path ever
   creates a `GuestCustomer` row even though the model, and an admin Customers page that
   queries it, both exist. This is the single biggest functional hole — decide whether
   to build the session→user merge (on login/register, adopt the session's cart etc. onto
   the user) before treating accounts as "done."
2. **Verify the VPS SFTP credential is actually live** (still unverified after this pass) with a real upload through the
   admin Media Uploader — `VPS_SSH_PASSWORD` is set but untested by this pass.
3. ~~Stale doc comments from the old client-only architecture~~ — `data/catalog.ts`'s
   header is rewritten and its dead query functions are gone. The
   `WishlistButton.tsx` and `checkout/*` comments are still stale.
   *(original note below)*

   **Stale doc comments from the old client-only architecture** are misleading, though
   functionally harmless: `data/catalog.ts`'s top comment ("no server, queries this module
   instead of an API"), `WishlistButton.tsx`'s comment ("subscribes to the shared
   localStorage wishlist" — it actually subscribes to a `wishlistChange` event backed by
   the DB now), and leftover "localStorage" wording in `checkout/page.tsx` /
   `checkout/success/page.tsx` comments.
4. ~~Repo hygiene~~ — done: `app/api-services/`, `u.html` and the unused
   `FeaturedPicker.tsx` are deleted, and `npm run seed` now exists.
5. `app/components-home/mobile/BottomNav.tsx:29` has a literal
   `// TODO: point at a real discounts feed once the catalogue can filter on one.`
6. Consider `git init` now that there's real schema/migration history worth protecting.
7. No payment gateway, by design — Checkout's own copy says so ("demo order, no real
   payment processed"). Not a gap unless the user asks for one.

## Verification standard to hold to

Every feature built in earlier phases of this project was: (1) built, (2)
`tsc --noEmit` clean, (3) exercised live in the Browser pane with real state changes (not
just "it renders"), (4) checked across at least 320/390/768/1024/1440 widths, and (5) for
the checkout/cart/orders flow specifically, put through an adversarial multi-agent code
review (via the `Workflow` tool) that found 26 real bugs a manual pass missed — including
a critical Cart/Checkout address-desync bug. All were fixed and re-verified live. Hold
new work — especially the account/session-linking gap above, which touches auth and
money — to the same bar: build it, typecheck it, click it for real across widths, and
don't declare something done from reading the code alone.
