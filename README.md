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
| MySQL | 8.x     | **not installed yet**  |

MySQL is the only missing piece. Install **one** of:

- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)
- [XAMPP](https://www.apachefriends.org/) (bundles MySQL/MariaDB — easiest on Windows)
- Docker: `docker run --name np-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=national_plasto -p 3306:3306 -d mysql:8`

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

### Seeded admin login

```
admin@nationalplasto.com  /  Admin@12345
```

Sign in at **`/admin/login`**. Change this password immediately from `/account`.

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
```

---

## 5. Payments and email — deliberately not faked

**Razorpay** is wired as an *architecture*, not a working integration. Cash on
Delivery works end to end. Online payment stays unavailable until you set
`PAYMENTS_ENABLED=true` with real keys **and** implement the two clearly-marked
functions in `src/lib/payments.ts`. Nothing marks an order as paid without a
verified payment.

**Email** has no provider configured. Contact enquiries are saved to
**Admin → Settings → Contact enquiries**, and password-reset links are printed
to the server console in development instead of being emailed.

Both are reported honestly in **Admin → Settings → Integrations**.

---

## 6. Structure

```
src/
  app/
    (store)/        storefront — home, products, collections, cart, checkout, account
    (auth)/         login, register, forgot/reset password
    admin/
      login/        separate admin entrance
      (dashboard)/  dashboard, products, collections, orders, customers,
                    reviews, content, settings
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

## 7. Current state

Verified with the real code:

- `npm run typecheck` — clean
- `npm run lint` — clean
- `npm run build` — **compiles and bundles successfully**; all 57 routes build,
  static/SSG/dynamic classification confirmed correct

Not yet verified, because no MySQL server exists on this machine:

- migrations, seeding, and anything that reads or writes real data
- the end-to-end flows (register → cart → checkout → order → admin status change)

Run steps 3–5 above and those become testable.
