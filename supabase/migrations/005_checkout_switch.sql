-- ─────────────────────────────────────────────────────────────
-- 005 · Checkout switch, one store at a time
--
--   off     → no Buy button. Visitors see "Checkout opens soon".
--   testing → only admins and the store's own creator see the Buy button,
--             so you can make a test purchase before anyone else can buy.
--   on      → anyone can buy.
--
-- Only admins can change it. Stores without a row are "off".
-- Run once in the Supabase SQL Editor (after 004). Safe to run again.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.store_checkout (
  store_slug text primary key references public.stores (slug) on update cascade on delete cascade,
  mode text not null default 'off' check (mode in ('off', 'testing', 'on')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

alter table public.store_checkout enable row level security;

-- Store pages need to know whether to show a Buy button, so anyone may read the switch.
drop policy if exists "store_checkout: public read" on public.store_checkout;
create policy "store_checkout: public read" on public.store_checkout
  for select using (true);

drop policy if exists "store_checkout: admin insert" on public.store_checkout;
create policy "store_checkout: admin insert" on public.store_checkout
  for insert with check (public.is_admin());

drop policy if exists "store_checkout: admin update" on public.store_checkout;
create policy "store_checkout: admin update" on public.store_checkout
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "store_checkout: admin delete" on public.store_checkout;
create policy "store_checkout: admin delete" on public.store_checkout
  for delete using (public.is_admin());

revoke all on public.store_checkout from anon, authenticated;
grant select on public.store_checkout to anon, authenticated;
grant insert, update, delete on public.store_checkout to authenticated;
