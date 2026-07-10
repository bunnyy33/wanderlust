# Wanderlust — Deployment Guide

A premium tourism booking platform. This guide takes you from this code to a live website.

---

## What you need (all free)

| Service | Purpose | Cost |
|---|---|---|
| **GitHub** | Host your code | Free |
| **Vercel** | Host the website (frontend + API) | Free |
| **Neon** | PostgreSQL database | Free |
| **Stripe** *(optional)* | Real payments | Free to start |

---

## Step 1: Get the code onto GitHub

### Option A — Download & upload (easiest)
1. Download this project as a ZIP (from the sandbox file browser).
2. Unzip it on your computer.
3. Go to [github.com/new](https://github.com/new), create a repo named `wanderlust` (don't add README/license).
4. Open a terminal in the unzipped folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/wanderlust.git
   git push -u origin main
   ```

### Option B — Push directly from this sandbox
If you create a GitHub Personal Access Token (Settings → Developer settings → Personal access tokens → Tokens classic → Generate new token, check `repo` scope), I can push for you. **Revoke the token immediately after.**

---

## Step 2: Create a PostgreSQL database (Neon)

1. Go to [neon.tech](https://neon.tech) → Sign up (free, GitHub login works).
2. Click **Create Project** → name it `wanderlust`.
3. On the dashboard, copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/wanderlust?sslmode=require
   ```
   Save this — you'll paste it into Vercel.

---

## Step 3: Switch the database from SQLite to Postgres

In your code, open `prisma/schema.prisma` and change ONE line:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Commit and push that change to GitHub.

---

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with **GitHub**.
2. Click **Add New** → **Project**.
3. Import your `wanderlust` repo.
4. Vercel auto-detects Next.js. In the **Environment Variables** section, add these:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | *(paste your Neon connection string from Step 2)* |
   | `ADMIN_PASSWORD` | `choose-a-strong-admin-password` |
   | `SESSION_SECRET` | `type-32-random-characters-here` |
   | `ADMIN_SECRET` | `type-another-32-random-chars` |

   **Optional (to enable real payments & email):**
   | Name | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | `sk_test_...` from [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) |
   | `SMTP_HOST` | `smtp.gmail.com` (or your provider) |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `your-email@gmail.com` |
   | `SMTP_PASS` | `your-app-password` (Gmail: use an App Password, not your real password) |
   | `SMTP_FROM` | `Wanderlust <bookings@yourdomain.com>` |

5. Click **Deploy**. Wait ~2 minutes. Vercel gives you a live URL like `wanderlust-xxx.vercel.app`.

---

## Step 5: Create the database tables & seed data

After the first deploy, your database is empty. Run these commands **on your local computer** (in the project folder, with the same `DATABASE_URL` in a local `.env` file):

```bash
# Install dependencies
bun install   # or: npm install

# Create all tables in Postgres
bun run db:push

# Populate with 12 destinations, 21 experiences, 18 hotels, reviews, coupons
bun run prisma/seed.ts
```

> **No local setup?** You can also run these via Vercel CLI:
> ```bash
> npm i -g vercel
> vercel login
> vercel link          # link to your project
> vercel env pull .env  # pulls your env vars locally
> bun run db:push
> bun run prisma/seed.ts
> ```

---

## Step 6: Visit your live site 🎉

Open your Vercel URL. You should see:
- The luxury homepage with destinations, experiences, hotels
- AI trip planner & chat assistant (works out of the box)
- Admin console at the **Admin** button → enter your `ADMIN_PASSWORD`

### To enable real payments
The card form currently validates but doesn't charge. With `STRIPE_SECRET_KEY` set, the `/api/payments` route will create real Stripe PaymentIntents. Start with Stripe **test mode** (`sk_test_...`) — use card `4242 4242 4242 4242` to test, then switch to live keys when ready.

---

## Environment variables — quick reference

**Required:**
- `DATABASE_URL` — Neon Postgres connection string
- `ADMIN_PASSWORD` — your admin login password
- `SESSION_SECRET` — random 32+ chars (customer session signing)
- `ADMIN_SECRET` — random 32+ chars (admin cookie signing)

**Optional but recommended:**
- `STRIPE_SECRET_KEY` — `sk_test_...` or `sk_live_...`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — email delivery

**Defaults that work without config:**
- Payments run in demo mode (Luhn-validated, no charge)
- Emails are logged to the DB but not sent
- Admin demo password: `wanderlust-admin-2024` *(change in production!)*

---

## Troubleshooting

**"Database connection error"** → Your `DATABASE_URL` has `?sslmode=require` at the end (Neon requires SSL).

**"Table does not exist"** → You forgot Step 5 (`db:push`). Run it.

**Empty site (no experiences)** → You forgot to run the seed (`bun run prisma/seed.ts`).

**AI features don't work** → The `z-ai-web-dev-sdk` is pre-configured in this sandbox. On Vercel you may need to add the `ZAI_API_KEY` env var — check Vercel logs for the exact error.

**Images broken** → Some Unsplash URLs in the seed may 404 over time. Replace them in `prisma/seed.ts` and re-seed, or add your own images via the admin Catalog manager.

---

## Your daily workflow after launch

- Edit code locally → `git push` → Vercel auto-deploys in ~60 seconds.
- Add tours/hotels via the **Admin → Catalog** tab (no code needed).
- View bookings & refunds via **Admin → Bookings**.
- View sent emails via **Admin → Notifications**.

Welcome to production. 🚀
