# National Plasto Pvt. Ltd. — E-commerce Website

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Prisma + MySQL · Framer Motion

> **Project location:** `E:\National Plasto Pvt Ltd`
> It is **not** on `D:` — that drive is a 1 GB partition with ~105 MB free, and
> `node_modules` alone needs ~600 MB. A stray `package.json` may still be sitting
> in `D:\National Plasto Pvt Ltd`; it is a leftover and can be deleted.

---

## 1. Requirements

| Tool  | Version | Status on this machine |
| ----- | ------- | ---------------------- |
| Node  | 24.x    | installed              |
| npm   | 11.x    | installed              |
| MySQL | 8.4.3   | installed via Laragon  |

**No MySQL install is needed on this machine.** Laragon already ships one, and
its data directory is initialised with `root` on an empty password — exactly
what the committed `DATABASE_URL` expects.

```powershell
# Start it. It is NOT a Windows service, so it does not survive a reboot.
Start-Process C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysqld.exe `
  -ArgumentList '--datadir=C:\laragon\bin\mysql\mysql-8.4.3-winx64\data','--port=3306' `
  -WindowStyle Hidden
```

The `mysql` client is not on PATH either; call it by full path:

```
C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe -u root national_plasto
```

> `C:\xampp` on this machine is a broken partial install — only MercuryMail and
> phpMyAdmin, no MySQL at all. Ignore it.

On any other machine, install one of MySQL Community Server, XAMPP, or Docker:
`docker run --name np-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=national_plasto -p 3306:3306 -d mysql:8`

---

## 2. First-time setup

```bash
cd "E:\National Plasto Pvt Ltd"

# 1. Point .env at your MySQL instance (edit DATABASE_URL)
#    mysql://USER:PASSWORD@localhost:3306/national_plasto
#    A JWT_SECRET has already been generated for you.

# 2. Create the database (skip if your MySQL install already made it)
#    In MySQL: CREATE DATABASE national_plasto;

# 3. Create the tables
npm run db:push          # or: npm run db:migrate   (creates a migration history)

# 4. Load the catalogue + admin user
npm run db:seed

# 5. Start
npm run dev              # http://localhost:3000
```

**Until step 3–4 are done the site will show the friendly error page** rather
than real content, because every page reads from the database.

### Admin login

Sign in at **`/admin/login`** as `admin@nationalplasto.com`.

> **The seeded `Admin@12345` no longer works on this machine** — it was rotated
> to a generated password on 2026-08-20. If you do not have it, set a new one:
>
> ```bash
> npm run set-admin-password                 # generates a strong one, prints it once
> npm run set-admin-password -- 'YourOwn1'   # or choose your own
> ```

Re-running `npm run db:seed` will **not** reset it — the seed only upserts the
role, never the password hash, of an existing admin.

On a fresh database the seed creates the account with `SEED_ADMIN_PASSWORD`
from `.env` (default `Admin@12345`), which must be changed before going live.

---

## 3. What the seed loads

**90 products**, transcribed exactly from the supplied brand-wise product list:

| Collection            | Products |
| --------------------- | -------: |
| NEXT                  |       36 |
| NATIONAL              |       41 |
| NATIONAL SAPPHIRE     |       13 |

### Important: no product facts were invented

The source list supplied **names only**. It contained no prices, dimensions,
materials, colours or descriptions, so none were fabricated. Every product is
seeded with:

- `price: null` → the storefront shows **"Price on request"** and offers an
  enquiry instead of an Add-to-Cart
- no description, specifications or images → the product page says so plainly
- `needsReview: true` → it appears in **Admin → Products → "Needs details"**

The admin dashboard shows a banner counting how many products still need
completing. Filling in a price, description and one image clears the flag
automatically on save.

Three product names appear in two collections (`Avenger` in NEXT + NATIONAL,
`Florida` in NATIONAL + SAPPHIRE). The first keeps the clean slug; the second is
suffixed with its collection (`avenger-national`) so URLs stay unique.

Categories are only auto-assigned when the product's **own name** states the
type (Shoe Rack, Utility Rack, Giraffe Table, Stool, Vanity). Everything else is
left *Uncategorised* for an admin — guessing would have meant inventing facts.

Statistics behave the same way: **Products** and **Collections** count live from
the database, while *Years of Experience* and *Happy Customers* stay hidden
until an admin enters a real figure.

---

## 4. Scripts

```bash
npm run dev         # dev server
npm run build       # production build (needs a reachable database)
npm run start       # serve the production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run db:push     # sync schema without migrations
npm run db:migrate  # create + apply a migration
npm run db:seed     # load catalogue, admin user and default content
npm run db:studio   # Prisma Studio (browse the data)
npm run db:reset    # drop, recreate and re-seed
npm run e2e         # end-to-end suite (needs a running dev server)
npm run e2e:fixtures # recreate just the ZZTEST-* test products
npm run a11y        # accessibility audit of the rendered HTML
npm run contrast    # WCAG contrast of the design tokens, both themes
npm run db:test     # verify a DATABASE_URL before deploying
npm run uploads:test # verify UPLOAD_DIR resolves and refuses traversal
npm run set-admin-password   # rotate an admin password (generates one if none given)
```

---

## 5. Payments and email

Both integrations are **fully implemented** and **switched off** until real
credentials are supplied. Neither ever fabricates success, and
**Admin → Settings → Integrations** reports their true state.

### Razorpay

Cash on Delivery works end to end with no configuration. To turn on online
payment, set all four values and restart:

```
PAYMENTS_ENABLED="true"
RAZORPAY_KEY_ID="rzp_live_xxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_xxxxxxxx"   # same value as KEY_ID
```

The flow, and why each step is where it is:

1. `POST /api/orders` commits stock and creates the local order **first**, then
   opens a Razorpay order for the server-computed total. If Razorpay is
   unreachable, the customer still has a recorded order and the response says
   payment could not be started — it does not pretend otherwise.
2. The browser opens Razorpay's checkout (`src/lib/razorpay-checkout.ts`). The
   script is loaded on demand, never bundled.
3. `POST /api/payments/verify` is **the only thing that can mark an order
   PAID**, and it does so on one piece of evidence: an HMAC-SHA256 over
   `${razorpayOrderId}|${razorpayPaymentId}`, recomputed server-side and
   compared with `timingSafeEqual`. The browser's success callback is not
   evidence — its payload is public and anyone could post it.

That endpoint additionally requires the order to belong to the signed-in user,
and the `razorpayOrderId` to match the one *we* opened for that order — so a
genuine signature from a different, cheaper order cannot be replayed against an
expensive one. A signature that fails marks the order `FAILED`, never `PAID`.

`verifyRazorpayWebhook()` is there for the optional webhook. It uses
`RAZORPAY_WEBHOOK_SECRET` — a **different** secret from the API key — over the
**raw** request body; re-serialised JSON will not match.

Run `npx tsx scripts/e2e-payments.mjs` to exercise all of this with throwaway
keys. It needs no Razorpay account and makes no network calls.

### Email

`src/lib/email.ts` is a small abstraction over a REST provider — no SDK, no
extra dependency, so switching providers costs nothing.

```
EMAIL_PROVIDER="resend"          # console (default) | resend | brevo
EMAIL_FROM="National Plasto <orders@nationalplasto.com>"
RESEND_API_KEY="re_xxxxxxxx"     # or BREVO_API_KEY
CONTACT_NOTIFY_EMAIL="sales@nationalplasto.com"   # blank = admin inbox only
```

**Recommendation: Resend.** The free tier (3,000/month) is far above this
site's volume, the API is one HTTP call, and deliverability is good. It does
require verifying the domain with a DNS record. If that is a problem, **Brevo**
is the fallback — 300/day free, popular in India, same one-call API, already
implemented here as the `brevo` driver.

With no provider configured the `console` driver **logs** each message to the
server console and reports `delivered: false`. It never claims to have sent
anything. Three call sites use it: password resets, order confirmations, and
contact-form notifications.

Sending never throws. A bounced email must not roll back a committed order, so
callers get a result object and carry on. Contact enquiries are written to the
admin inbox **before** any email is attempted, so an outage cannot lose one.

---

## 6. Structure

```
src/
  app/
    (store)/        storefront — home, products, collections, cart, checkout, account
    (auth)/         login, register, forgot/reset password
    admin/
      login/        separate admin entrance
      (dashboard)/  dashboard, products, collections, categories, orders,
                    customers, reviews, content, settings
    api/            auth, cart, orders, search, upload, reviews, contact
  components/
    ui/             design-system primitives (Radix-based)
    layout/ home/ products/ cart/ checkout/ admin/ account/ orders/
    animations/     shared Framer Motion primitives
  lib/
    db/ auth/ queries/ actions/ validations/ storage/
  hooks/  types/
prisma/
  schema.prisma  seed.ts  seed-data.ts   ← product names live here
public/uploads/  admin image uploads
```

### Two decisions worth knowing

**Money is stored as integer paise** (₹1 = 100). No floats, no `Decimal`
serialisation problems across the server/client boundary. Use `formatINR()`.

**The storefront layout never reads cookies.** Doing so would force every page
below it into dynamic rendering and throw away the ISR caching the catalogue
depends on. The header resolves the session client-side via `/api/auth/me`, so
`/`, `/about`, `/collections`, `/contact` and `/collections/[slug]` stay
statically cached.

---

## 7. Testing

There is an end-to-end suite that drives the running app the way a browser
would — real cookies, real middleware, real MySQL. Nothing in it is mocked.

```bash
npm run dev     # terminal 1
npm run e2e     # terminal 2 — 408 assertions across 10 suites
```

| Suite                      | Covers                                                              |
| -------------------------- | ------------------------------------------------------------------- |
| `scripts/e2e-http.mjs`     | register/login/logout, session, middleware guards, cart merge and stock clamping, checkout, reviews, public pages, rate limiting |
| `scripts/e2e-actions.mjs`  | admin product CRUD, slug/SKU collisions, uploads and orphan cleanup, bulk actions, order status + stock restore, review moderation, customer activation |
| `scripts/e2e-reset.mjs`    | the full password-reset cycle: issue, hash, expiry, replay, re-login |
| `scripts/e2e-categories.mjs` | category admin CRUD, inline stock **and price** editing, and the unpriced-to-sellable round trip |
| `scripts/e2e-payments.mjs` | Razorpay signature and webhook verification, with throwaway keys — no account or network needed |
| `scripts/e2e-email.mjs`    | email driver selection, configuration reporting, template rendering and escaping, provider-failure handling |
| `scripts/e2e-stores.mjs`   | the browser-side cart and wishlist Zustand stores — rehydration, the `ready` flag, quantity caps, corrupt-storage recovery |
| `scripts/e2e-demo-journey.mjs` | the whole customer journey: wishlist to cart to COD order to admin fulfilment |
| `scripts/e2e-uploads.mjs`  | upload paths in both modes, and path-traversal defence |
| `scripts/e2e-theme.mjs`    | the pre-paint theme snippet, executed in a DOM stub across every stored/OS combination, plus `applyTheme` agreement |

The admin suites call real server actions through `src/app/api/e2e-harness/route.ts`,
which needs `E2E_HARNESS="1"` in `.env`. That route refuses to run when
`NODE_ENV=production`, and **should be deleted before the site is deployed**.

`scripts/e2e-fixtures.ts` creates the `ZZTEST-*` products the suites buy against.
Catalogue products have `price: null` on purpose and cannot be ordered, so the
money paths need fixtures with real prices.

---

## 8. Demo mode

The site ships with **no prices**, which means nothing can be added to a cart.
That is correct for production and useless for a demo, so there is a switch:

```bash
npm run demo:on       # fake prices on all 90 products — the shop becomes shoppable
npm run demo:status   # how many prices are demo vs. entered by hand
npm run demo:off      # take the fake prices away again
```

> **The prices `demo:on` writes are invented.** They are not National Plasto's
> prices. They exist so cart, checkout, orders and the admin screens can be
> demonstrated end to end. **Run `npm run demo:off` before this site goes
> anywhere near a customer.**

`demo:off` is safe: it only clears a product whose price still equals the value
the script would generate for it. The moment an admin types a real price, that
product stops matching and is left alone. `demo:status` reports the split.

Demo mode also does **not** touch payments — Razorpay stays off and checkout is
Cash on Delivery only, exactly as in production.

### Signing in

| Role     | Email                        | Password      |
| -------- | ---------------------------- | ------------- |
| Admin    | `admin@nationalplasto.com`   | `Admin@12345` |
| Customer | register at `/register`      | your choice   |

That admin password is the documented demo credential. Change it with
`npm run set-admin-password -- 'YourNewPassword1'` before going live.

### The journey it supports

`npm run demo:journey` drives the whole thing through the real HTTP endpoints
and asserts 64 things about it:

browse → register → wishlist 3 products → wishlist into cart → cart totals
match the catalogue → checkout (COD; online payment is *refused* while the
gateway is off) → order confirmation → order visible in the customer's account
→ review submitted and held for moderation → admin signs in, sees the order,
the customer and the review → admin walks the order CONFIRMED → PROCESSING →
SHIPPED → DELIVERED, and the delivered COD order flips to PAID.

It creates a real customer and a real order each run. Clean them up with:

```sql
DELETE FROM users WHERE email LIKE 'demo-shopper-%';
```

---

## 9. Current state

Verified by actually running it against MySQL:

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — 62 routes; storefront ISR intact (1h revalidate on `/`,
  `/about`, `/collections`, `/contact`; `/collections/[slug]` prerendered)
- `npm run db:push` + `npm run db:seed` — 3 collections, 90 products
  (NEXT 36 / NATIONAL 41 / SAPPHIRE 13), 7 categories, 1 admin, 4 stats.
  Re-running the seed is idempotent.
- `npm run e2e` — 408 assertions across 10 suites, all passing
- `npm run a11y` — 0 critical, 0 serious, 0 moderate

### The cart and wishlist hydration bug

`ready` never became `true` on either persisted store, so `/cart` and
`/wishlist` rendered a loading skeleton for ever and `CartSync` never merged
anything to the server.

The cause is a sharp edge in zustand's `persist`: **it hydrates synchronously,
inside `create()`**. Both stores did this —

```ts
export const useCart = create()(persist(..., {
  onRehydrateStorage: () => () => {
    useCart.setState({ ready: true });   // useCart is still in its TDZ here
  },
}));
```

— which throws `ReferenceError: Cannot access 'useCart' before initialization`.
Zustand catches that in an internal `.catch` and never rethrows, so the failure
was completely silent: the saved lines still restored (that happens before the
callback), only the flag stayed `false`.

The fix is `src/hooks/use-persist-ready.ts`, called *after* `create()` where the
binding exists. It also marks the store ready when hydration fails outright, so
one corrupt `localStorage` value can no longer strand a visitor on a skeleton —
and the error is now logged instead of swallowed.

### Two stock bugs found and fixed by that suite

Both were in `updateOrderStatus`, and both were only reachable once real data
existed:

1. **Cancelling invented inventory.** Checkout skips `trackStock: false`
   products when deducting, but cancelling incremented them unconditionally, so
   a cancelled order created stock out of nothing.
2. **Un-cancelling drove stock negative.** Reinstating a cancelled order
   decremented with no availability check, reaching −4 in testing while still
   reporting success.

Both directions now skip untracked products, and reinstating uses the same
conditional `updateMany` guard checkout already used — refusing with an honest
message rather than going negative.

---

## 10. Deliberate decisions worth knowing

**"Add to Cart" does not appear on any product yet, and that is deliberate.**
Every one of the 90 seeded products has `price: null`, so the storefront shows
**"Price on request"** and an **Enquire** button instead. Clicking it raises a
"price not published yet" toast and adds nothing to the cart — a customer must
never be able to buy at a price nobody set.

This reads exactly like a broken cart. To make a product sellable, click its
price in **Admin -> Products** and type the amount in rupees — the price column
is editable inline, the same as stock. The storefront switches that product to
**Add to Cart** immediately, and the whole checkout runs from there.

Setting a price writes integer paise, refreshes the denormalised `hasPrice` /
`sortPrice` sort keys, and drops any stale markdown that was higher than the new
price. It does **not** clear `needsReview` on its own — a product is only
"complete" once it has a price, a description and an image.

**`Order.discount` is not a coupon field.** It holds the product markdown total
(list price − sale price, summed over the order). It reads 0 today only because
no product has a `discountPrice` yet. There is no coupon system, by choice.

**The `Banner` model was removed.** It had no admin page and rendered nowhere.
The homepage hero is already admin-editable via `/admin/content`, which covers
the same need. Reintroduce it when there is real marketing artwork to show.

**Categories are managed at `/admin/categories`.** Deleting a category does not
delete its products — `onDelete: SetNull` leaves them uncategorised, and the
confirmation dialog says how many will be affected. This differs from
collections, which refuse to delete while they still hold products, because a
product's collection is required and its category is not.

**Dark mode is a real feature now, not just CSS.** The palette was always in
`globals.css` under `.dark`, but nothing ever added the class, so it was
unreachable. There is now a Light / Dark / **System** control in the storefront
header, the mobile drawer, the auth pages and the admin topbar.

Three options rather than a two-way flip, because "system" is the honest
default — a plain toggle silently overrides whatever the visitor already told
their OS.

The mechanism is deliberately dependency-free (`next-themes` would do the same
for the price of another package): a class on `<html>`, one `localStorage` key,
and a **blocking inline script in `<head>`** that applies the stored theme
*before the first paint*. Without that script every dark-mode visitor gets a
white flash on load — which is also why `<html>` carries
`suppressHydrationWarning`.

The snippet is plain hand-written JS that runs before React exists, so nothing
else could catch a mistake in it; `scripts/e2e-theme.mjs` executes it in a DOM
stub across every stored-value / OS-preference combination. That caught a real
mismatch: on an unrecognised stored value the snippet resolved to light while
the React provider resolved to the OS theme, producing exactly the flash the
snippet exists to prevent.

**Turning dark mode on exposed a contrast bug.** `.dark` overrode `--success`
to a lighter green but inherited the white `--success-foreground` from `:root`,
leaving the success badge at **2.54:1** — below even the 3:1 floor for large
text. Dark ink on the lighter green, matching what `--warning` already did,
takes it to 6.88:1. Run `npm run contrast` to re-check both palettes.

One pair is still worth a look: **destructive button in dark is 4.06:1**. That
clears 3:1 for a UI component but is under 4.5:1 for its label text. I left the
token alone rather than redesign the palette unasked.

**Stock and price are editable inline** from the admin products table — click
the figure, Enter to save, Escape to cancel. Both update optimistically and roll
back if the server rejects the value. Clearing the price box returns a product
to "Price on request".

**Brand assets are the client's own artwork**, in `public/logo/`:

| File                            | What it is                                    |
| ------------------------------- | --------------------------------------------- |
| `national-plasto.png`           | corporate mark (486x236, transparent) — header, footer, admin, auth |
| `next-nppl.png`                 | NEXT sub-brand lockup (444x204) — `NextBrandLogo` |

Derived from them, so they stay in step if the logo is replaced:
`src/app/icon.png` (favicon), `src/app/apple-icon.png`, `public/og-image.png`
(1200x630 social card) and `public/icon-512.png`. Regenerate with
`scripts/make-icons.py` if the logo changes.

### How the logo handles dark mode

The client supplied only light-background artwork — dark ink on transparency —
which would vanish on any dark surface. There are now two files:

| File                            | For                                            |
| ------------------------------- | ---------------------------------------------- |
| `national-plasto.png`           | light surfaces (as supplied)                    |
| `national-plasto-dark.png`      | dark surfaces — generated, **keeps the blue arc and red script** |

The dark variant is produced by `scripts/make-dark-logo.py`, which recolours the
near-black ink to the brand cream and lifts the blue and red slightly so they
hold up on navy. That is a real reversed-out mark, not the flat white silhouette
`brightness-0 invert` would give. Alpha is untouched, so antialiased edges stay
clean instead of fringing. Rerun it after replacing the source logo.

**The swap happens in CSS, not JavaScript.** Both files sit in the markup and
`dark:hidden` / `hidden dark:block` decide which is visible, so the right mark
paints on the first frame — no `mounted` check, no hydration mismatch, no flash
of the wrong logo. The dark copy is `alt="" aria-hidden` so screen readers do
not announce the brand twice.

`Logo` takes one flag:

- **default** — an ordinary surface that follows the theme: header, auth pages,
  mobile drawer, 404
- **`onBrand`** — an always-navy surface that never inverts with the theme:
  footer, admin sidebar, admin login. These sit on `bg-brand`, so the
  reversed-out mark is correct in both themes.

> **A bug this fixed:** the admin sidebar rendered `<Logo href="/admin" />` with
> no flag at all, on an always-navy background — the dark-ink mark was invisible
> there in *both* themes.

> Clean **vector** artwork from the client would still be worth having. It would
> retire `make-dark-logo.py`, and it is the only thing blocking a dark variant of
> the NEXT lockup — that source is a noisy scan whose compression artefacts leave
> a visible haze when lifted, so `NextBrandLogo` still falls back to a flat white
> silhouette on dark.

The source catalogue PDF now lives in `docs/Brand-wise_Product_Lists.pdf`. It
was moved out of `public/` because anything under `public/` is served to the
open web, and `public/uploads/` is meant for admin product images only.

---

## 11. Accessibility

`npm run a11y` audits the rendered HTML of 12 public pages for the structural,
machine-detectable problems: missing `alt`, unlabelled controls, buttons and
links without accessible names, heading order, landmarks, document language,
blocked zoom and positive `tabindex`.

Current result: **0 critical, 0 serious, 0 moderate.**

The 3 remaining `minor` findings are "no `<nav>` landmark" on `/login`,
`/register` and `/forgot-password`. That is intentional — those pages carry no
navigation beyond a single "Back to store" link, and inventing a `<nav>` to
satisfy a checker would help nobody.

Fixed during this pass:

- **Skip link** (WCAG 2.4.1). `src/components/layout/skip-to-content.tsx` is now
  the first focusable element on every page, visually hidden until focused, so
  keyboard users can bypass the header. Its target `<main>` carries
  `tabIndex={-1}`, without which focus does not actually move there in Safari
  or Firefox.
- **`<main>` landmark** was missing on the three auth pages.
- **Heading order.** The footer column headings were `<h3>`, so on pages whose
  content stops at `<h1>` (`/cart`, `/wishlist`) the document skipped a level.
  They are `<h2>` now; the styling is unchanged because it comes from classes.

### Still needs a browser and a human

The audit is static, so these remain **unverified**:

- colour contrast ratios (WCAG 1.4.3) — the accent-on-white combinations are
  worth measuring
- visible focus indicators throughout
- keyboard traps, especially in the Radix dialogs
- screen-reader flow, and announcement of the `sonner` toasts
- Lighthouse performance, SEO and best-practice scores

Lighthouse needs Chrome plus the `lighthouse` package, which would be a new
dependency — say the word and I will add it. Until then, run it from Chrome
DevTools against `npm run build && npm run start`, not against `npm run dev`:
dev-mode numbers are meaningless.

---

## 12. Deployment

### Environment variables — read this first

Start from **`.env.production.example`**, not `.env`. It lists every value that
must change and says what breaks if it does not. `.env` is gitignored and is
local-development configuration only.

Four of them will actively break the site if left at their dev values:

| Variable | Left unchanged | Consequence |
| -------- | -------------- | ----------- |
| `DATABASE_URL` | points at MySQL on the dev laptop | app cannot start |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | **password-reset and order emails link to localhost**, and `sitemap.xml`, `robots.txt`, canonical URLs and OG images all advertise the wrong host to Google |
| `JWT_SECRET` | the development secret | anyone with the repo history can forge a session cookie |
| `EMAIL_PROVIDER` | `console` | reset links are only printed to the server log — customers never receive them |

`NEXT_PUBLIC_SITE_URL` is the one people forget. It is baked in at **build
time** (that is what `NEXT_PUBLIC_` means), so setting it after `npm run build`
does nothing — set it, then build.

Use `https://` with **no trailing slash**.

### Deployment checklist

Work top to bottom. Steps 1–4 are the ones that cause real incidents.

```bash
# 1. Turn the demo prices off — they are invented figures
npm run demo:off
npm run demo:status          # expect: demo price 0

# 2. Delete the test-harness route (it is also NODE_ENV-guarded, but
#    do not rely on a single guard)
rm src/app/api/e2e-harness/route.ts

# 3. Fill in production env, from the template
cp .env.production.example .env      # then edit every CHANGE marker

# 4. Generate a fresh JWT secret into it
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 5. Create a migration baseline (development used db push, which keeps
#    no history). Run this ONCE, locally, and commit the result.
npx prisma migrate dev --name init

# --- on the server ---
npm ci
npx prisma migrate deploy    # never db:push against production
npm run db:seed              # first deploy only
npm run build
npm run start

# 6. Rotate the admin password away from the seeded one
npm run set-admin-password -- 'AStrongPasswordYouChoose1'
```

Then verify against the live domain:

```bash
# bash
BASE=https://your-domain npm run a11y

# PowerShell
$env:BASE = 'https://your-domain'; npm run a11y; Remove-Item Env:BASE

curl -s https://your-domain/robots.txt      # must show YOUR host, not localhost
curl -s https://your-domain/sitemap.xml | head
```

Do **not** run `npm run e2e` against production — it registers users, places
orders and edits products.

### Things that are easy to miss

- **`public/uploads` must be on a persistent disk.** Container hosts wipe the
  filesystem on every deploy. See *Uploads on a container host* below.
  Back it up **with** the database, never separately — an image row whose file
  is missing is a broken product page.
- **Nginx must set `X-Forwarded-For`.** `clientIp()` falls back to the string
  `"unknown"` when the header is absent, which puts *every visitor in one
  shared rate-limit bucket* — five registrations per ten minutes for the whole
  site. See the rate-limiting note below.
- **The rate limiter is in-memory**, so it is per-process. Two Node instances
  behind a load balancer means two independent limits; move it to Redis before
  scaling out.
- **Razorpay stays off** until real keys are supplied and a live transaction
  has been tested. `PAYMENTS_ENABLED=false` keeps checkout on Cash on Delivery,
  and the server refuses online orders outright.

### Uploads on a container host (Railway, Fly, Docker)

Product images are written to disk. On Railway, Fly.io, and most container
platforms that disk is **ephemeral** — every redeploy starts from a fresh
image, so uploaded photographs silently disappear while their `product_images`
rows survive, leaving broken product pages.

`UPLOAD_DIR` accepts two shapes, and the code handles both:

| Value | Where files live | Who serves them |
| ----- | ---------------- | --------------- |
| `public/uploads` (default) | inside the app | Next's static handler — fastest |
| `/data/uploads` (absolute) | a mounted volume | `src/app/uploads/[...path]/route.ts` |

The public URL is `/uploads/...` in **both** cases, so rows already in
`product_images` keep resolving if the directory ever moves.

**Railway setup:**

1. Service → **Settings → Volumes → Add volume**
2. Mount path: `/data`
3. Service → **Variables**, add: `UPLOAD_DIR=/data/uploads`
4. Redeploy

Verify by uploading an image in the admin, redeploying, and reloading the
product page. The image must still be there.

> **Why an absolute path needs care.** `path.join(cwd, "/data/uploads")`
> returns `<cwd>/data/uploads` — inside the container, not on the volume. The
> code uses `path.resolve`, and `npm run uploads:test` asserts specifically
> that an absolute `UPLOAD_DIR` does **not** fall back inside the project.
> That failure is invisible until a redeploy eats the images.

**Limits of a volume**, all fine at this scale but worth knowing:

- **One instance only.** A Railway volume attaches to a single replica, so the
  app cannot be scaled horizontally while using one. (The in-memory rate
  limiter has the same constraint, so the two move together.)
- **Backups are yours.** Take the volume and the database together.
- **Fixed size.** Uploads fail once it fills.

Outgrowing those means moving to object storage. The interface is deliberately
small — `storeImage` and `deleteStoredImage` in `src/lib/storage/local.ts`,
used by exactly two call sites — so an S3/R2 driver is a contained change.

### Hosting

**Recommended: a single VPS** (Hostinger, DigitalOcean, or a similar
India-region host) running Node 24 behind Nginx, with MySQL on the same box.

The reason is `public/uploads`. Product images are written to the local disk,
not to object storage, so the app needs a **persistent filesystem**. Vercel,
Netlify and most serverless platforms have ephemeral disks — every deploy would
silently discard uploaded images. Vercel becomes viable only after swapping
`src/lib/storage/local.ts` for an S3/R2 driver; that interface (`storeImage`,
`deleteStoredImage`) is already narrow enough to make it a contained change.

Minimum viable box: 2 vCPU / 2 GB RAM.

```bash
npm ci
npx prisma migrate deploy    # NOT db:push — see below
npm run build
npm run start                # behind pm2 or a systemd unit
```

Put Nginx in front for TLS (Let's Encrypt) and make sure it sets
`X-Forwarded-For` — see the rate-limiting warning below.

### Migrations

Development has used `prisma db push`, which keeps no migration history. Before
the first production deploy, generate a baseline:

```bash
npx prisma migrate dev --name init
```

Then deploy with `prisma migrate deploy` only. Never run `db push` against
production — it can drop columns without asking.

### Connecting to the production database

Test the connection string **before** deploying anything, from the machine that
will run the app:

```bash
npm run db:test -- 'mysql://np_app:PASSWORD@db-host:3306/national_plasto'
npm run db:test            # or, to check whatever is in .env
```

(That form works in both PowerShell and bash. Replace `db-host` with the real
hostname — it is a placeholder, and testing it as-is correctly reports
*"Can't reach database server"*.)

It reports the server version, the selected database, the user MySQL actually
authenticated you as, and the table count — and names the likely cause when it
fails, rather than leaving you with a Prisma stack trace. It never prints the
password.

**Setting the database up**, on the MySQL server:

```sql
CREATE DATABASE national_plasto
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- A dedicated user, not root. '%' allows remote connections; use 'localhost'
-- instead when MySQL and the app share a box.
CREATE USER 'np_app'@'%' IDENTIFIED BY 'a-long-random-password';

-- No DDL at runtime: the app only ever reads and writes rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON national_plasto.* TO 'np_app'@'%';
FLUSH PRIVILEGES;
```

Then create the schema. Migrations need more rights than the app user has, so
run them as an admin user, overriding `DATABASE_URL` for those two commands
only.

**PowerShell (Windows):**

```powershell
$env:DATABASE_URL = 'mysql://admin:PASSWORD@db-host:3306/national_plasto'
npx prisma migrate deploy
npm run db:seed                      # first deploy only
Remove-Item Env:DATABASE_URL         # important — do not leave it set
```

**bash (Linux server, macOS, Git Bash):**

```bash
DATABASE_URL='mysql://admin:PASSWORD@db-host:3306/national_plasto' npx prisma migrate deploy
DATABASE_URL='mysql://admin:PASSWORD@db-host:3306/national_plasto' npm run db:seed
```

> PowerShell has no `VAR=value command` form — that is bash syntax, and it
> fails with *"is not recognized as the name of a cmdlet"*. Set `$env:VAR`
> first, then run the command, then clear it. An env var set this way outlives
> the command and would silently override `.env` for everything else you run in
> that window.

Afterwards put the **`np_app`** URL in `.env` and never the admin one.

**Writing the URL correctly.** The password must be URL-encoded — this is the
single most common cause of a connection that "should work":

| Character | Write as |
| --------- | -------- |
| `@` | `%40` |
| `#` | `%23` |
| `/` | `%2F` |
| `:` | `%3A` |
| `?` | `%3F` |

So `P@ss/w0rd#1` becomes `P%40ss%2Fw0rd%231`.

**Other rules that bite:**

- **Bind MySQL to `127.0.0.1`** when it shares a box with the app, and create
  the user as `'np_app'@'localhost'`. Only expose port 3306 to the network if
  the database genuinely lives elsewhere — and then firewall it to the app
  server's IP, never `0.0.0.0`.
- **MySQL 8.4 removed `mysql_native_password`.** Users must be created with
  `caching_sha2_password`, which is the default — but an older `CREATE USER`
  snippet that names the old plugin will fail. Confusingly, MySQL reports this
  the same way as a wrong password; `npm run db:test` calls that out.
- Managed MySQL (PlanetScale, RDS, Aiven) usually requires TLS. Append
  `?sslaccept=strict` to the URL, or `?ssl={"rejectUnauthorized":true}`.
- Keep `utf8mb4` / `utf8mb4_unicode_ci`, matching the dev database — product
  names and addresses need it.

### Backups — two things, not one

The database and the uploads folder are **separate** stores that must be backed
up **together**. A database restored to a point where `public/uploads` holds
different contents gives you products pointing at images that do not exist.

```bash
#!/bin/sh
# /etc/cron.daily/national-plasto-backup
set -e
STAMP=$(date +%F)
DEST=/var/backups/national-plasto
mkdir -p "$DEST"

mysqldump --single-transaction --routines --triggers \
  -u backup -p"$BACKUP_PW" national_plasto | gzip > "$DEST/db-$STAMP.sql.gz"

tar -czf "$DEST/uploads-$STAMP.tar.gz" -C /srv/national-plasto/public uploads

# Off-box copy. A backup on the same disk is not a backup.
rclone copy "$DEST" remote:national-plasto-backups

find "$DEST" -mtime +30 -delete
```

`--single-transaction` keeps the dump consistent without locking the site. Run
the two commands close together so the pair stays coherent.

**Test the restore.** An untested backup is a guess. Restore into a scratch
database and a scratch uploads folder at least once, and confirm that product
images still resolve.

### Before the first deploy — checklist

- [ ] `JWT_SECRET` regenerated for production
      (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain — reset links and order
      emails are built from it
- [ ] Seeded admin password changed — `npm run set-admin-password`
- [ ] Dedicated MySQL user, not `root`
- [ ] **Delete `src/app/api/e2e-harness/route.ts`.** It refuses to run when
      `NODE_ENV=production` and stays off unless `E2E_HARNESS=1`, but the safest
      test backdoor is one that is not deployed. Drop `E2E_HARNESS` from the
      production environment too.
- [ ] `EMAIL_PROVIDER` configured, or accept that password resets go nowhere
- [ ] Nginx sets `X-Forwarded-For`
- [ ] Backups scheduled **and one restore rehearsed**

### Known production limitation: rate limiting

`rateLimit()` in `src/lib/api.ts` is an in-memory fixed window keyed on
`clientIp()`, which reads `X-Forwarded-For`, then `X-Real-IP`, then falls back
to the literal string `"unknown"`.

Two consequences:

1. **If the reverse proxy does not set `X-Forwarded-For`, every visitor shares a
   single bucket named `"unknown"`** — meaning 5 registrations per 10 minutes
   for the entire site. Configure Nginx properly.
2. The counters live in one process's memory, so they reset on deploy and
   are not shared between instances. Fine for a single VPS; move them to Redis
   or a database table before running more than one.

---

## 13. Tests — what exists, and what is still missing

`npm run e2e` covers **241 assertions** across six suites and genuinely
exercises the money and stock paths against a real database. That is the layer
that matters most here, and it is the layer that caught both stock bugs.

What it does **not** cover, in the order I would add it:

1. **Concurrency.** The stock guards use conditional `updateMany` and are
   believed correct, but nothing yet fires two simultaneous checkouts at the
   last unit in stock. This is the highest-value gap, because a race here
   oversells real inventory. Such a test needs parallel requests plus a
   deliberate delay between resolve and commit.
2. **Unit tests for the pure functions** — `computeTotals`, `pricingFields`,
   `formatINR`, `slugify`, `categorySlugForProduct`. Fast, no server needed,
   and exactly where an arithmetic slip would pass unnoticed. Node's
   built-in `node:test` runner covers this with no new dependency.
3. **Browser tests** for what HTTP cannot see: the inline stock editor's
   optimistic rollback, dialog focus traps, the cart drawer. Playwright would be
   a new dependency — worth it before handover, but I will ask first.
4. **A CI workflow** running typecheck, lint, build and the e2e suite against a
   throwaway MySQL service container on every push.

Deliberately not tested: Razorpay against the live API — the signature logic is
tested in isolation instead, which is the part that can actually be got wrong —
and real email delivery.
