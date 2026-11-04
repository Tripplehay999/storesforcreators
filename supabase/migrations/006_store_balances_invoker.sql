-- ─────────────────────────────────────────────────────────────
-- 006 · store_balances runs with the caller's own permissions
--
-- Supabase's Security Advisor flags views that run with their owner's rights
-- ("security definer view"). store_balances did, only so it could read the private
-- revenue_share column. Now the view runs as the person asking (normal row-level
-- security applies), and the split comes from a small function that returns it
-- only for stores the caller manages. Results are the same as before.
--
-- Run once in the Supabase SQL Editor (after 005). Safe to run again.
-- ─────────────────────────────────────────────────────────────

-- A store's revenue share, but only to its owner or an admin. Everyone else gets null.
create or replace function public.store_revenue_share(target_slug text)
returns int
language sql
stable
security definer set search_path = public
as $$
  select s.revenue_share
  from public.stores s
  where s.slug = target_slug and public.can_manage_store(target_slug);
$$;

revoke all on function public.store_revenue_share(text) from public, anon;
grant execute on function public.store_revenue_share(text) to authenticated;

drop view if exists public.store_balances;

create view public.store_balances
with (security_invoker = true) as
select
  s.slug,
  s.name,
  s.owner_id,
  public.store_revenue_share(s.slug) as revenue_share,
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
