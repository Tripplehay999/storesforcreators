-- Stores for Creators — security fixes plus checkout, delivery, analytics, discount codes,
-- payout requests and AI ideas.
-- Run after 003_user_management.sql. Safe to run once; it does not touch existing data.

-- ─────────────────────────────────────────────────────────────
-- SECURITY: keep each store's revenue split private
-- ─────────────────────────────────────────────────────────────
-- Store rows are public (storefronts), but revenue_share is a private business term.
-- Readers get every column except revenue_share; owners and admins read it through
-- store_balances below.

revoke select on public.stores from anon, authenticated;
grant select (slug, owner_id, name, short, category, description, headline, headline_em, bio,
              image, label, background, featured_product_id, is_demo, published, created_at)
  on public.stores to anon, authenticated;

-- store_balances used to run with the caller's rights, which listed every published store
-- (and its split) to anyone. It now runs as its owner and filters to stores the caller manages.
drop view public.store_balances;

create view public.store_balances as
select
  s.slug,
  s.name,
  s.owner_id,
  s.revenue_share,
  s.published,
  s.is_demo,
  s.created_at,
  coalesce(o.gross, 0) as gross,
  coalesce(o.earned, 0) as earned,
  coalesce(o.order_count, 0) as order_count,
  coalesce(p.paid_out, 0) as paid_out,
  coalesce(p.pending, 0) as pending_payouts,
  coalesce(a.total, 0) as adjustments,
  coalesce(o.earned, 0) + coalesce(a.total, 0)
    - coalesce(p.paid_out, 0) - coalesce(p.pending, 0) as balance,
  (select count(*) from public.products pr where pr.store_slug = s.slug) as product_count
from public.stores s
left join (
  select store_slug, sum(amount) as gross, sum(creator_amount) as earned, count(*) as order_count
  from public.orders
  where status = 'completed'
  group by store_slug
) o on o.store_slug = s.slug
left join (
  select store_slug,
         sum(amount) filter (where status = 'paid') as paid_out,
         sum(amount) filter (where status = 'pending') as pending
  from public.payouts
  group by store_slug
) p on p.store_slug = s.slug
left join (
  select store_slug, sum(amount) as total
  from public.balance_adjustments
  group by store_slug
) a on a.store_slug = s.slug
where public.can_manage_store(s.slug);

revoke all on public.store_balances from anon, public;
grant select on public.store_balances to authenticated;

-- ─────────────────────────────────────────────────────────────
-- PROFILES: payout details and notification preference
-- ─────────────────────────────────────────────────────────────

alter table public.profiles
  add column payout_method text not null default ''
    check (payout_method in ('', 'paypal', 'etransfer', 'bank', 'other')),
  add column payout_details text not null default '' check (char_length(payout_details) <= 500),
  add column email_notifications boolean not null default true;

grant update (payout_method, payout_details, email_notifications) on public.profiles to authenticated;

-- ─────────────────────────────────────────────────────────────
-- CHECKOUT: Stripe references and download links on orders
-- ─────────────────────────────────────────────────────────────

alter table public.orders
  add column stripe_session_id text unique,
  add column stripe_payment_intent text,
  add column discount_code text,
  add column discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  add column download_token text unique,
  add column download_count int not null default 0,
  add column download_expires_at timestamptz;

create index orders_payment_intent_idx on public.orders (stripe_payment_intent);

-- ─────────────────────────────────────────────────────────────
-- DIGITAL DELIVERY: the file a buyer receives, in a private bucket
-- ─────────────────────────────────────────────────────────────

create or replace function public.can_manage_product(target_id text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.products p where p.id = target_id and public.can_manage_store(p.store_slug)
  );
$$;

create table public.product_files (
  product_id text primary key references public.products (id) on update cascade on delete cascade,
  path text not null check (char_length(path) between 3 and 400),
  file_name text not null check (char_length(file_name) between 1 and 200),
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.product_files enable row level security;

-- Uploaders can only point a product at a file in their own storage folder.
create policy "product files: manage read" on public.product_files
  for select using (public.can_manage_product(product_id));
create policy "product files: manage insert" on public.product_files
  for insert with check (
    public.can_manage_product(product_id)
    and (public.is_admin() or split_part(path, '/', 1) = auth.uid()::text)
  );
create policy "product files: manage update" on public.product_files
  for update using (public.can_manage_product(product_id))
  with check (
    public.can_manage_product(product_id)
    and (public.is_admin() or split_part(path, '/', 1) = auth.uid()::text)
  );
create policy "product files: manage delete" on public.product_files
  for delete using (public.can_manage_product(product_id));

insert into storage.buckets (id, name, public, file_size_limit)
values ('product-files', 'product-files', false, 52428800)
on conflict (id) do nothing;

create policy "product-files: owner upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "product-files: owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'product-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "product-files: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────
-- DISCOUNT CODES
-- ─────────────────────────────────────────────────────────────

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  code text not null check (code ~ '^[A-Z0-9_-]{3,24}$'),
  percent_off int not null check (percent_off between 1 and 90),
  max_uses int check (max_uses is null or max_uses > 0),
  uses int not null default 0 check (uses >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_slug, code)
);

alter table public.discount_codes enable row level security;

create policy "discounts: manage read" on public.discount_codes
  for select using (public.can_manage_store(store_slug));
create policy "discounts: manage insert" on public.discount_codes
  for insert with check (public.can_manage_store(store_slug));
create policy "discounts: manage update" on public.discount_codes
  for update using (public.can_manage_store(store_slug)) with check (public.can_manage_store(store_slug));
create policy "discounts: manage delete" on public.discount_codes
  for delete using (public.can_manage_store(store_slug));

-- Checkout asks "is this code valid for this store?" without being able to list codes.
create or replace function public.check_discount(p_store text, p_code text)
returns int
language sql
stable
security definer set search_path = public
as $$
  select percent_off from public.discount_codes
  where store_slug = p_store
    and code = upper(trim(p_code))
    and active
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses < max_uses);
$$;

-- Counts a use after a paid order (called by the payment webhook with the service key).
create or replace function public.redeem_discount(p_store text, p_code text)
returns void
language sql
security definer set search_path = public
as $$
  update public.discount_codes set uses = uses + 1
  where store_slug = p_store and code = upper(trim(p_code));
$$;

revoke execute on function public.check_discount(text, text) from public;
grant execute on function public.check_discount(text, text) to anon, authenticated;
revoke execute on function public.redeem_discount(text, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- ANALYTICS: hourly visit counts per store, product and source
-- ─────────────────────────────────────────────────────────────

create table public.store_visits (
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  product_id text not null default '',
  hour timestamptz not null,
  source text not null default 'direct',
  views int not null default 0,
  primary key (store_slug, product_id, hour, source)
);

alter table public.store_visits enable row level security;

create policy "visits: manage read" on public.store_visits
  for select using (public.can_manage_store(store_slug));

-- Called by store and product pages. Ignores unpublished stores, unknown products,
-- and the store owner's own visits; unknown sources are grouped as 'other'.
create or replace function public.track_visit(p_store text, p_product text, p_source text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_product text := coalesce(nullif(trim(p_product), ''), '');
  v_source text := lower(coalesce(nullif(trim(p_source), ''), 'direct'));
  v_owner uuid;
begin
  select owner_id into v_owner from public.stores where slug = p_store and published;
  if not found then
    return;
  end if;
  if v_owner is not null and v_owner = auth.uid() then
    return;
  end if;
  if v_product <> '' and not exists (
    select 1 from public.products where id = v_product and store_slug = p_store
  ) then
    v_product := '';
  end if;
  if v_source not in ('tiktok', 'instagram', 'youtube', 'x', 'facebook', 'pinterest', 'snapchat',
                      'threads', 'linktree', 'email', 'google', 'direct', 'other') then
    v_source := 'other';
  end if;

  insert into public.store_visits (store_slug, product_id, hour, source, views)
  values (p_store, v_product, date_trunc('hour', now()), v_source, 1)
  on conflict (store_slug, product_id, hour, source)
  do update set views = public.store_visits.views + 1;
end;
$$;

revoke execute on function public.track_visit(text, text, text) from public;
grant execute on function public.track_visit(text, text, text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- PAYOUT REQUESTS: creators ask to be paid their available balance
-- ─────────────────────────────────────────────────────────────

create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'paid', 'declined', 'cancelled')),
  payout_id uuid references public.payouts (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index payout_requests_one_open on public.payout_requests (store_slug) where status = 'open';
create index payout_requests_store_idx on public.payout_requests (store_slug, created_at desc);

alter table public.payout_requests enable row level security;

create policy "payout requests: manage read" on public.payout_requests
  for select using (public.can_manage_store(store_slug));
create policy "payout requests: admin update" on public.payout_requests
  for update using (public.is_admin());

create or replace function public.request_payout(p_store text, p_amount numeric, p_note text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_available numeric;
  v_id uuid;
begin
  if not exists (
    select 1 from public.stores s join public.profiles p on p.id = s.owner_id
    where s.slug = p_store and s.owner_id = auth.uid() and not p.suspended
  ) then
    raise exception 'You can only request payouts for your own store';
  end if;

  select balance into v_available from public.store_balances where slug = p_store;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Enter an amount';
  end if;
  if p_amount > coalesce(v_available, 0) then
    raise exception 'That is more than your available balance';
  end if;
  if exists (select 1 from public.payout_requests where store_slug = p_store and status = 'open') then
    raise exception 'You already have a payout request in progress';
  end if;

  insert into public.payout_requests (store_slug, amount, note)
  values (p_store, round(p_amount, 2), left(coalesce(p_note, ''), 500))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.cancel_payout_request(p_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.payout_requests r
  set status = 'cancelled', resolved_at = now()
  where r.id = p_id and r.status = 'open'
    and exists (select 1 from public.stores s where s.slug = r.store_slug and s.owner_id = auth.uid());
end;
$$;

revoke execute on function public.request_payout(text, numeric, text) from public, anon;
revoke execute on function public.cancel_payout_request(uuid) from public, anon;
grant execute on function public.request_payout(text, numeric, text) to authenticated;
grant execute on function public.cancel_payout_request(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- AI IDEAS: saved recommendations and captions (also used for daily limits)
-- ─────────────────────────────────────────────────────────────

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  kind text not null check (kind in ('recommendations', 'captions')),
  focus text not null default '' check (char_length(focus) <= 300),
  payload jsonb not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ai_insights_store_idx on public.ai_insights (store_slug, kind, created_at desc);

alter table public.ai_insights enable row level security;

create policy "ai insights: manage read" on public.ai_insights
  for select using (public.can_manage_store(store_slug));
create policy "ai insights: manage insert" on public.ai_insights
  for insert with check (public.can_manage_store(store_slug) and created_by = auth.uid());
