# Browne's Talent Group

Creator commerce site — Next.js 16 (App Router) + Supabase (auth, Postgres, storage).

## Run it

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```

Without Supabase keys the public site still renders from built-in sample data;
login, signup, and the creator hub need Supabase.

## Supabase setup

1. Create a project at supabase.com and copy the URL + anon key into `.env.local`.
2. Open **SQL Editor** and run the files in `supabase/migrations/` in order (`001`, `002`, `003`).
   This creates the tables, row-level security, the `product-images` storage
   bucket, and seeds the three example stores (Jasmine, Sofia, Nia).
3. **Authentication → URL Configuration**: set Site URL to your domain and add
   `http://localhost:3000/auth/callback` (and your production `/auth/callback`)
   to Redirect URLs.
4. Make yourself an admin after signing up:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## What's where

| Route | What it does |
| --- | --- |
| `/` | Landing page (calculator, creator collection, FAQ, apply form) |
| `/store/[slug]`, `/product/[id]` | Public storefronts and product pages |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Creator auth |
| `/dashboard` | Creator hub: earnings, orders, weekly/monthly chart |
| `/dashboard/store` | Create/edit storefront + profile |
| `/dashboard/products` | Product studio (saves to the database) |
| `/admin/*` | Admin control panel: users, stores, products, orders, payouts, applications |

**Roles.** Creators manage only their own store and its products (enforced by RLS).
Admin accounts are also creators: the Creator ⇄ Admin switch in the header moves
between `/dashboard` (your own store) and the `/admin` control panel, where you
manage roles, revenue share, orders, payouts, and applications.

**Optional:** set `SUPABASE_SERVICE_ROLE_KEY` (server-only) in `.env.local` to enable
"Delete account" and "Confirm email" on admin user pages.

**Not yet connected:** live checkout/payments and digital delivery. Orders are
recorded by admins until a payment provider (e.g. Stripe webhooks inserting into
`orders`) is wired up.
