-- ─────────────────────────────────────────────────────────────
-- 007 · Onboarding emails
--
-- • profiles.tips_emails: creators can switch off tips and reminders (the welcome
--   series) separately from sale alerts. Account emails (password resets, receipts)
--   aren't affected by either switch.
-- • email_log: one row per onboarding email a person has been sent, so nobody gets
--   the same one twice. Written only by the server (service role); admins can read it.
-- • onboarding_candidates(): everything the daily onboarding run needs in one call.
--   Server only: not callable from the browser.
--
-- Run once in the Supabase SQL Editor (after 006). Safe to run again.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists tips_emails boolean not null default true;

grant update (tips_emails) on public.profiles to authenticated;

create table if not exists public.email_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind ~ '^[a-z0-9-]{1,40}$'),
  sent_at timestamptz not null default now(),
  unique (user_id, kind)
);

create index if not exists email_log_sent_idx on public.email_log (sent_at desc);

alter table public.email_log enable row level security;

drop policy if exists "email log: admin read" on public.email_log;
create policy "email log: admin read" on public.email_log
  for select using (public.is_admin());

-- No insert/update/delete policies: only the server's service role writes here.
revoke all on public.email_log from anon;
revoke insert, update, delete on public.email_log from authenticated;

-- Creators who joined in the last 30 days, with where they are in setting up.
-- Only confirmed, active creators who haven't switched tips off.
create or replace function public.onboarding_candidates()
returns table (
  user_id uuid,
  email text,
  full_name text,
  joined_at timestamptz,
  store_slug text,
  store_name text,
  store_created_at timestamptz,
  store_published boolean,
  product_count int,
  order_count int,
  sent text[],
  last_sent_at timestamptz
)
language sql
stable
security definer set search_path = public
as $$
  select
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    s.slug,
    s.name,
    s.created_at,
    s.published,
    (select count(*)::int from public.products pr where pr.store_slug = s.slug),
    (select count(*)::int from public.orders o where o.store_slug = s.slug and o.status = 'completed'),
    coalesce((select array_agg(l.kind) from public.email_log l where l.user_id = p.id), '{}'::text[]),
    (select max(l.sent_at) from public.email_log l where l.user_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.stores s on s.owner_id = p.id
  where u.email_confirmed_at is not null
    and p.role = 'creator'
    and not p.suspended
    and p.tips_emails
    and p.created_at > now() - interval '30 days';
$$;

revoke all on function public.onboarding_candidates() from public, anon, authenticated;
grant execute on function public.onboarding_candidates() to service_role;
