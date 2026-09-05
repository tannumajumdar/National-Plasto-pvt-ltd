# Getting production up to date

Pushing code is only a third of a release here. Three things live outside git
and each has to be moved across on its own:

| | Where it lives now | How it gets to production |
|---|---|---|
| Code | GitHub `main` | Railway builds on push |
| Schema + catalogue | local MySQL | `scripts/deploy-catalogue.mjs` |
| 387 product photos | `public/uploads/` (gitignored, 58 MB) | Railway volume |

Do them in that order. The new code cannot start against the old schema —
`Category.parentId`, `Product.isPremium` and `Product.isLimitedEdition` were
added on 5 September and the app reads all three.

---

## 1. Schema and catalogue

Create `.env.production.local` beside `package.json` with one line:

```
DATABASE_URL="mysql://root:PASSWORD@HOST.proxy.rlwy.net:PORT/railway"
```

Railway → your MySQL service → **Variables** → `MYSQL_PUBLIC_URL`.
Use the public host. `*.railway.internal` only resolves from inside Railway, so
it cannot be reached from a laptop.

`.env*.local` is already in `.gitignore`, so the file cannot be committed.

```bash
node scripts/deploy-catalogue.mjs           # report — writes nothing
node scripts/deploy-catalogue.mjs --apply   # push schema, then seed
```

The report prints which columns are missing and what production currently
holds. Read it before applying.

**What the seed does to existing rows.** It retires any product not on the
03 September sheet. Order history survives — `order_items` snapshot the name,
slug and price, and their `productId` is `ON DELETE SET NULL` — but a price or
photograph an admin entered against a retired product is lost. The report shows
the order count so you can judge this before running it.

---

## 2. Photo storage

Railway rebuilds the container on every deploy and its filesystem starts empty,
so `public/uploads` cannot hold anything that needs to survive. A volume can.

**In the Railway dashboard, on the web service:**

1. **Settings → Volumes → New Volume**, mount path `/data`
2. **Variables**, add `UPLOAD_DIR=/data/uploads`
3. Redeploy

Nothing in the code changes. `src/lib/storage/local.ts` resolves an absolute
`UPLOAD_DIR` outside the app directory, and `src/app/uploads/[...path]/route.ts`
serves those files — the public URLs stay `/uploads/products/...`, so rows
already in `product_images` keep working either way.

### Getting the photographs onto the volume

The photographs came from the public PHOTOSHOOT 2024 Drive folder, so
production can fetch its own copy rather than uploading 58 MB from a laptop.
With the Railway CLI linked to the service:

```bash
railway run node scripts/fetch-drive-images.mjs \
  1Usc5ET8nKMpxvo2rVuvAl67m1O6Jr3UV /tmp/drive --apply
railway run npx tsx scripts/import-product-images.ts /tmp/drive --apply
```

Both read `DATABASE_URL` and `UPLOAD_DIR` from the service, so the files land on
the volume and the rows point at them. Run the second command without `--apply`
first to see what it would match.

If the CLI is not an option, the same two commands work from a laptop against
the public `DATABASE_URL`, with the files then copied to the volume by hand.

---

## After a release

Two failure modes worth knowing:

**A stale `.next` gives 500s with `Cannot find module './vendor-chunks/…'`.**
Not a code fault. Delete `.next` and rebuild.

**The database is on `db push`, not migrations.** It had already drifted from
the migration history before 5 September — foreign keys were missing — and
`prisma migrate dev` wants a full reset, which would destroy the admin user.
Worth reconciling into a clean migration before the site is public.
