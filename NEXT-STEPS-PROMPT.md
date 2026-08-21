# Continuation Prompt — National Plasto

Copy everything below the line into a new session to resume work.

---

## Context

I'm continuing work on an existing Next.js e-commerce site for **National Plasto Pvt. Ltd.**, a plastic furniture manufacturer in Kolkata, West Bengal.

**Project location: `E:\National Plasto Pvt Ltd`**
Do NOT use `D:\National Plasto Pvt Ltd` — that drive is a 1 GB partition with ~105 MB free and cannot hold `node_modules` (~600 MB). A stray leftover `package.json` sits there; ignore it.

### Stack (already installed and working)

Next.js 15 App Router · TypeScript · Tailwind v4 · Prisma + MySQL · Framer Motion · Radix UI · Zustand · React Hook Form + Zod · Recharts · JWT auth via `jose`

### Current state — verified

- 33 pages built: 20 storefront/auth + 13 admin
- 20 API routes, 11 Prisma models
- `npx tsc --noEmit` — passes
- `npx eslint src` — passes
- `npx next build` — passes (57 routes)

**Read `README.md` in the project root first** — it documents architecture and setup.

---

## Non-negotiable project rules

These were deliberate decisions. Do not undo them without telling me why.

1. **Never invent product facts.** The source PDF gave product *names only* — no prices, dimensions, materials, colours or descriptions. All 90 products have `price: null`, show "Price on request", and carry a `needsReview: true` flag. Do not fabricate any of this data to make the site "look complete". Same rule for company stats, phone numbers and addresses — placeholders stay until the client supplies real values.

2. **Money is integer paise** (₹1 = 100). No floats, no Prisma `Decimal`. Use `formatINR()` from `src/lib/utils.ts`.

3. **The storefront layout must never read cookies.** `src/app/(store)/layout.tsx` deliberately avoids `getCurrentUser()` — reading cookies there forces the whole subtree into dynamic rendering and destroys ISR on the catalogue pages. The header resolves the session client-side via `/api/auth/me` and `src/hooks/use-session.tsx`. Keep it that way.

4. **Database failures degrade, they don't crash.** `src/lib/db/safe.ts` exports `safeRead()`, which catches only *infrastructure* errors (`P1001` unreachable, `P2021` table missing, auth failures) and returns a fallback. Real query bugs still throw. All public read queries are wrapped. Never use `safeRead` for writes.

5. **Nothing fake-succeeds.** Razorpay is unimplemented and *says so*; it never marks an order paid. Admin → Settings honestly reports which integrations are configured. Keep this honesty.

---

## Environment gotchas (save yourself time)

- No Docker, no MySQL installed as of the last session. `mysql` is not on PATH.
- Bash heredocs fail on large files — use the Write tool for anything over ~150 lines.
- The project path contains spaces; always quote it.
- `npm install` on `D:` fails with misleading `ENOENT .bin/acorn.ps1` errors — that is the disk being full, not an npm bug.

---

## Task 1 — Get the database running (BLOCKING)

Nothing data-driven has ever been executed. This must happen before anything else.

1. Help me install MySQL (MySQL Community Server, XAMPP, or Docker — recommend the easiest for Windows 11).
2. Verify `DATABASE_URL` in `.env`.
3. Run `npm run db:push` then `npm run db:seed`.
4. Fix whatever breaks.

Expected seed result: 3 collections, 90 products (NEXT 36, NATIONAL 41, NATIONAL SAPPHIRE 13), 5 categories, 1 admin user, default site content and stats.

Watch for: the 3 duplicate product names across collections (`Avenger` in NEXT + NATIONAL, `Florida` in NATIONAL + SAPPHIRE, `Maharaja` vs `Maharaja Superior`) — the seed suffixes the second occurrence with its collection slug to keep URLs unique. Confirm this actually works.

---

## Task 2 — Test every flow end to end (HIGH RISK)

All of this is written but has **never run against a real database**. Please actually execute each flow and fix what breaks — don't just read the code and assume it works.

- Register → login → logout → session persistence → middleware guards
- Guest cart → login → server merge (`/api/cart/sync`) → stock clamping
- Checkout → order creation → stock deduction → order confirmation page
- Admin product CRUD: create, edit, delete, bulk actions, slug/SKU uniqueness collisions
- Image upload → `public/uploads` → orphan cleanup on edit and delete
- **Order status change → stock restore on cancel** (transaction logic in `src/lib/actions/orders.ts` — highest-risk code in the project)
- Review submit → admin approve → product rating recalculation
- Forgot password → token generation → expiry → reset

Admin login: `admin@nationalplasto.com` / `Admin@12345` at `/admin/login`

---

## Task 3 — Finish incomplete features

These are small compared to Tasks 1–2.

1. **Category admin UI** — no page exists to create/edit/delete categories. Build `/admin/categories` matching the existing `/admin/collections` pattern.
2. **Banner admin UI** — the `Banner` model and `getActiveBanners()` exist but are **dead code**: no admin page, and banners render nowhere. Either build `/admin/banners` + homepage rendering, or remove the model. Tell me which you recommend.
3. **Inline stock editing** — `updateStock()` in `src/lib/actions/products.ts` is written but wired to no UI. Add inline editing to the admin products table.
4. **Coupons** — `Order.discount` exists and is always 0. Decide with me whether to build a coupon system or drop the column.

---

## Task 4 — Integrations (needs credentials from the client)

1. **Razorpay** — implement `createRazorpayOrder()` and `verifyRazorpaySignature()` in `src/lib/payments.ts`. Both currently throw. Server-side signature verification is mandatory; never trust the client. COD already works.
2. **Email** — no provider configured. Needed for: password-reset links (currently go nowhere), order confirmations, and contact-form notifications. Recommend a provider and wire it behind a small `src/lib/email.ts` abstraction.

---

## Task 5 — Production readiness

- Tests — there are none at all. Suggest a sensible minimum (the money/stock/order logic matters most).
- Deployment: hosting, production MySQL, and a backup strategy for `public/uploads` (image files live on disk, not in the DB).
- Accessibility and Lighthouse audit.
- Change the seeded admin password.

---

## How I'd like you to work

- Start with Task 1. Don't move on until the seed actually runs.
- Work in order; tell me if you think the order is wrong.
- Run `npx tsc --noEmit` and `npx eslint src` after each significant change.
- When something is broken, blocked or untested, say so plainly — don't report success you haven't verified.
- Ask before adding new dependencies.
