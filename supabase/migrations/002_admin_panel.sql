-- Browne's Talent Group — admin control panel: payouts, balances, admin RPCs
-- Run after 001_initial.sql.

-- ─────────────────────────────────────────────────────────────
-- PAYOUTS — money sent to creators
-- ─────────────────────────────────────────────────────────────

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  method text not null default '' check (char_length(method) <= 60),
  reference text not null default '' check (char_length(reference) <= 200),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index payouts_store_idx on public.payouts (store_slug, created_at desc);

alter table public.payouts enable row level security;

create policy "payouts: owner read" on public.payouts
  for select using (public.can_manage_store(store_slug));
create policy "payouts: admin insert" on public.payouts
  for insert with check (public.is_admin());
create policy "payouts: admin update" on public.payouts
  for update using (public.is_admin());

-- Orders: admins may also delete mistaken manual entries.
create policy "orders: admin delete" on public.orders
  for delete using (public.is_admin());

-- Applications: admins may delete spam.
create policy "applications: admin delete" on public.applications
  for delete using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- STORE BALANCES — per-store totals (respects RLS of the caller)
-- ─────────────────────────────────────────────────────────────

create view public.store_balances with (security_invoker = true) as
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
  coalesce(o.earned, 0) - coalesce(p.paid_out, 0) - coalesce(p.pending, 0) as balance,
  (select count(*) from public.products pr where pr.store_slug = s.slug) as product_count
from public.stores s
left join (
  select store_slug,
         sum(amount) as gross,
         sum(creator_amount) as earned,
         count(*) as order_count
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
) p on p.store_slug = s.slug;

-- ─────────────────────────────────────────────────────────────
-- ADMIN RPCs — for columns creators must never write themselves
-- ─────────────────────────────────────────────────────────────

create or replace function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if target = auth.uid() then
    raise exception 'You can''t change your own role';
  end if;
  if new_role not in ('creator', 'admin') then
    raise exception 'Unknown role';
  end if;

  update public.profiles set role = new_role where id = target;
end;
$$;

create or replace function public.admin_update_store(target text, new_share int, new_published boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if new_share < 0 or new_share > 100 then
    raise exception 'Revenue share must be between 0 and 100';
  end if;

  update public.stores
  set revenue_share = new_share, published = new_published
  where slug = target;
end;
$$;

revoke execute on function public.admin_set_role(uuid, text) from public, anon;
revoke execute on function public.admin_update_store(text, int, boolean) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
grant execute on function public.admin_update_store(text, int, boolean) to authenticated;
