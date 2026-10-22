-- Browne's Talent Group — user management: suspension, balance adjustments, admin notes
-- Run after 002_admin_panel.sql.

-- ─────────────────────────────────────────────────────────────
-- SUSPENSION
-- ─────────────────────────────────────────────────────────────

alter table public.profiles add column suspended boolean not null default false;

-- Suspended admins lose admin rights.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and not suspended
  );
$$;

-- Suspended creators can no longer change their store or products.
create or replace function public.can_manage_store(target_slug text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.stores s
    join public.profiles p on p.id = s.owner_id
    where s.slug = target_slug and s.owner_id = auth.uid() and not p.suspended
  );
$$;

create or replace function public.admin_set_suspended(target uuid, value boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if target = auth.uid() then
    raise exception 'You can''t suspend yourself';
  end if;

  update public.profiles set suspended = value where id = target;
end;
$$;

revoke execute on function public.admin_set_suspended(uuid, boolean) from public, anon;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;

-- Admins may edit other users' name / handle (column grants from 001 still apply).
create policy "profiles: admin update" on public.profiles
  for update using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- BALANCE ADJUSTMENTS — manual credits (+) and debits (−)
-- ─────────────────────────────────────────────────────────────

create table public.balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  amount numeric(10, 2) not null check (amount <> 0 and amount between -100000 and 100000),
  reason text not null check (char_length(reason) between 1 and 300),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index balance_adjustments_store_idx on public.balance_adjustments (store_slug, created_at desc);

alter table public.balance_adjustments enable row level security;

create policy "adjustments: owner read" on public.balance_adjustments
  for select using (public.can_manage_store(store_slug));
create policy "adjustments: admin insert" on public.balance_adjustments
  for insert with check (public.is_admin() and created_by = auth.uid());
create policy "adjustments: admin delete" on public.balance_adjustments
  for delete using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- ADMIN NOTES — internal, never visible to the creator
-- ─────────────────────────────────────────────────────────────

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index admin_notes_user_idx on public.admin_notes (user_id, created_at desc);

alter table public.admin_notes enable row level security;

create policy "notes: admin read" on public.admin_notes
  for select using (public.is_admin());
create policy "notes: admin insert" on public.admin_notes
  for insert with check (public.is_admin() and author_id = auth.uid());
create policy "notes: admin delete" on public.admin_notes
  for delete using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- STORE BALANCES — now includes adjustments
-- ─────────────────────────────────────────────────────────────

drop view public.store_balances;

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
  coalesce(a.total, 0) as adjustments,
  coalesce(o.earned, 0) + coalesce(a.total, 0)
    - coalesce(p.paid_out, 0) - coalesce(p.pending, 0) as balance,
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
) p on p.store_slug = s.slug
left join (
  select store_slug, sum(amount) as total
  from public.balance_adjustments
  group by store_slug
) a on a.store_slug = s.slug;
