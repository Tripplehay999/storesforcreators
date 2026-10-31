# Stores for Creators

**Branded online stores for creators, designed and run for them.** Creators bring the audience; the
platform handles the storefront, the products, checkout, delivery and the numbers. Each creator gets a
public store page and a private creator hub to run it from.

Built with Next.js 16 (App Router), React 19, Supabase (Postgres, auth, storage), Stripe Checkout,
Resend for email, and Claude for AI suggestions.

---

## Contents

- [What's inside](#whats-inside)
- [Run it locally](#run-it-locally)
- [Environment variables](#environment-variables)
- [Set up Supabase](#set-up-supabase)
- [Turn on payments (Stripe)](#turn-on-payments-stripe)
- [Turn on email (Resend)](#turn-on-email-resend)
- [Turn on AI ideas (Anthropic)](#turn-on-ai-ideas-anthropic)
- [Deploy (Vercel + Cloudflare)](#deploy-vercel--cloudflare)
- [How it fits together](#how-it-fits-together)
- [Security](#security)
- [Project structure](#project-structure)
- [Scripts](#scripts)

---

## What's inside

**Public site**
- Home page with live example stores, an earnings calculator and an apply form.
- A store page for every creator (`/store/[slug]`) and a page for every product (`/product/[id]`).
- Real checkout through Stripe, discount codes at checkout, and instant, private digital downloads.

**Creator hub** (`/dashboard`): light and dark mode, works on phones, with a guided tour on first visit.

| Page | What creators can do |
| --- | --- |
| Overview | Earnings, orders, sales and average order for 7 days to 12 months, with change vs the previous period. Balance, setup checklist, recent orders, top products, and **AI ideas** for growing the store. |
| Earnings | Every order with its breakdown, payout history, **payout requests**, payout details, CSV export. |
| Products | Edit products with a live preview; upload the **file buyers receive**. |
| Analytics | Visits, conversion, sales per visit, **traffic sources** (TikTok, Instagram, YouTube…), per-product performance. |
| Promote | **Tracked share links** per platform with QR codes, **AI captions** for each product, and **discount codes**. |
| Storefront | Store name, photo, headline, bio, colours, visibility; account and password. |

**Admin panel** (`/admin`, admins only; everyone else gets a 404): users, stores, products, orders,
payouts and payout requests, applications, balance adjustments, notes, and CSV exports.

**Emails**: sale alerts, buyer receipts with download links, payout updates, application decisions,
"store is live", plus branded templates for Supabase's sign-up, login-link and password-reset emails.

Each integration switches itself off cleanly until its keys are added, so the site works from day one
with only Supabase configured.

---

## Run it locally

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in at least the Supabase values
npm run dev                  # http://localhost:3000
```

---

## Environment variables

| Variable | Required | What it's for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable (anon) key. Safe in the browser; data is protected by row-level security. |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | Public address, e.g. `https://storesforcreators.com`. Used in emails and payment redirects. |
| `SUPABASE_SERVICE_ROLE_KEY` | For checkout | Server-only key. Records paid orders and serves downloads; also powers the admin "Delete account" button. **Never** prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_TIME_ZONE` | No | Timezone for charts, greetings and code end dates. Default `America/Toronto`. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | For payments | See [payments](#turn-on-payments-stripe). |
| `RESEND_API_KEY`, `EMAIL_FROM` | For email | See [email](#turn-on-email-resend). `EMAIL_REPLY_TO` is optional. |
| `ADMIN_EMAILS` | No | Comma-separated addresses alerted about new applications and payout requests. |
| `ANTHROPIC_API_KEY` | For AI | See [AI ideas](#turn-on-ai-ideas-anthropic). |

---

## Set up Supabase

1. **Create a project** at [supabase.com](https://supabase.com) and copy the URL and anon key into `.env.local`.
2. **Run the migrations, in order.** Open *SQL Editor* and run each file in `supabase/migrations/`:

   | File | Adds |
   | --- | --- |
   | `001_initial.sql` | Profiles, stores, products, orders, applications, row-level security, the public `product-images` bucket, three demo stores. |
   | `002_admin_panel.sql` | Payouts, store balances, admin functions. |
   | `003_user_management.sql` | Account suspension, balance adjustments, admin notes. |
   | `004_growth.sql` | Keeps revenue splits private, payout details, Stripe order fields, the private `product-files` bucket, discount codes, visit analytics, payout requests, AI history. |

   Features that need `004` show a short "run the migration" note to admins until it's done.

3. **URLs.** *Authentication → URL Configuration*: set **Site URL** to your live address and add
   `https://your-domain/auth/callback` and `http://localhost:3000/auth/callback` to **Redirect URLs**.

4. **Branded auth emails.** *Authentication → Emails → Templates*: paste each file from
   `supabase/templates/` into the matching template:

   | Template | File | Suggested subject |
   | --- | --- | --- |
   | Confirm signup | `confirm-signup.html` | Confirm your email |
   | Magic link | `magic-link.html` | Your login link |
   | Reset password | `reset-password.html` | Reset your password |
   | Change email address | `change-email.html` | Confirm your new email |
   | Invite user | `invite.html` | You're invited to Stores for Creators |

5. **Use your own email sender.** Supabase's built-in sender is heavily rate-limited and meant for testing.
   Under *Authentication → Emails → SMTP Settings*, add your provider. With Resend: host `smtp.resend.com`,
   port `465`, username `resend`, password = your Resend API key, sender = the same address as `EMAIL_FROM`.

6. **Make yourself an admin** after signing up:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

---

## Turn on payments (Stripe)

Products on real (non-demo) stores show a **Buy** button once Stripe is configured; until then they show
"Checkout opens soon". Prices always come from the database, never from the browser.

1. In the [Stripe dashboard](https://dashboard.stripe.com), copy your **secret key** into `STRIPE_SECRET_KEY`
   (use a `sk_test_…` key while testing).
2. *Developers → Webhooks → Add endpoint*:
   - URL: `https://your-domain/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (the webhook uses it to record orders).
4. Test locally with the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

When a payment succeeds the webhook records the order with the creator's share, counts any discount code,
emails the buyer a receipt (with a private download link if the product has a file) and tells the creator.
Download links work for 30 days and 5 downloads. A full refund in Stripe marks the order refunded.

---

## Turn on email (Resend)

1. Create an account at [resend.com](https://resend.com), verify your sending domain, and create an API key.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (for example `Stores for Creators <hello@yourdomain.com>`).
3. Optional: `EMAIL_REPLY_TO` and `ADMIN_EMAILS`.

Emails sent by the app: sale alerts to creators (they can switch these off), receipts and downloads to
buyers, payout sent, payout requested (to admins), new application (to admins), application received and
decision (to applicants), and "your store is live". Without these keys, emails are skipped and logged.

---

## Turn on AI ideas (Anthropic)

1. Create an API key at [console.anthropic.com](https://console.anthropic.com) and set `ANTHROPIC_API_KEY`.
2. Creators get an **Ideas for your store** card on the Overview and a **Caption writer** on Promote.

How it works: the server sends Claude (`claude-opus-5-5`) only the store's **aggregated** numbers (sales,
visits, conversion, prices, setup gaps; never customer emails) and gets back structured recommendations
or captions. Server-side fallback is on, results are saved, and each store has a daily limit
(8 idea refreshes, 20 caption batches) to keep costs predictable. Change the limits in
`src/app/dashboard/ai-actions.ts`.

---

## Deploy (Vercel + Cloudflare)

1. **Vercel**: import the GitHub repo, set the framework to **Next.js**, add the environment variables,
   and deploy. Every push to `main` deploys automatically.
2. **Domain**: in Vercel → *Settings → Domains*, add your domain and `www`. In Cloudflare → *DNS*, add the
   records Vercel shows (usually `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`) with the proxy set
   to **DNS only** (grey cloud).
3. Update `NEXT_PUBLIC_SITE_URL`, the Supabase URL settings, and the Stripe webhook URL to the live domain.

---

## How it fits together

- **Money.** Each order stores the sale price and the creator's share (`creator_amount`, from the store's
  revenue split at the time of sale). A store's **balance** = creator share of completed orders +
  adjustments − paid − pending payouts. Creators request payouts; admins pay and record them.
- **Analytics.** Store and product pages record one visit per page per browser session, tagged with its
  source: `?src=` on share links first, then the referring site. The store owner's own visits aren't
  counted. Counts are kept per hour, so charts are correct in any timezone.
- **Roles.** Creators manage only their own store. Admins can open any creator's hub
  (`/dashboard?store=slug`) and use the admin panel. Suspended accounts lose access.

---

## Security

- **Row-level security** on every table. Creators can only read and change their own store, products,
  orders, codes, analytics and payout data; the database enforces it, not just the app.
- **Private business terms**: revenue splits can't be read by the public or by other creators.
- **Admin area** returns 404 to everyone else, and every admin action re-checks the role.
- **Payments**: webhook signatures are verified (timestamped, constant-time), orders are idempotent,
  prices come from the database, and demo stores can't take payments.
- **Downloads**: files live in a private bucket; buyers get one-minute signed links behind a button
  (so email link-scanners can't use up downloads), limited in count and time.
- **Auth**: safe redirects after login (no open redirects), no account enumeration on login links or
  password resets, and a spam honeypot on the apply form.
- **Headers**: framing blocked, MIME sniffing off, strict referrer policy, HSTS.

Found a problem? Please report it privately rather than in a public issue.

---

## Project structure

```
src/
  app/
    (site)/        public pages: home, store, product, order success, downloads
    (auth)/        login, signup, password reset (+ server actions)
    dashboard/     creator hub pages and server actions (incl. AI actions)
    admin/         admin panel pages and actions
    api/           checkout and Stripe webhook
    auth/          email-link callback, sign out
  components/
    hub/           creator hub UI (shell, charts, tour, ideas, share kit…)
    auth/          login and signup forms
    admin/         admin UI
  lib/             data access, stats, email, Stripe, AI, helpers
supabase/
  migrations/      database schema, run in order
  templates/       branded auth emails for Supabase
```

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build (also type-checks). |
| `npm run start` | Serve the production build. |
| `npm run lint` | Lint the code. |
