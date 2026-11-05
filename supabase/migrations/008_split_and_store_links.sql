-- ─────────────────────────────────────────────────────────────
-- 008 · 70/30 split and short store links
--
-- • The standard split is now 70/30: creators keep 70% of each sale. New stores start at 70,
--   and stores still on the old 50/50 standard move to 70. Stores with a split an admin set by
--   hand (anything other than 50) keep it. Past orders keep the share they were recorded with.
-- • Stores now live at storesforcreators.com/<slug> instead of /store/<slug>, so a store can't
--   use the name of one of the site's own pages. Keep the list in sync with RESERVED_SLUGS in
--   src/lib/store-links.ts.
--
-- Run once in the Supabase SQL Editor (after 007). Safe to run again: the split only moves the
-- first time (while the default is still 50), so a later run never undoes a 50 set on purpose.
-- ─────────────────────────────────────────────────────────────

do $$
begin
  if (select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'stores' and column_name = 'revenue_share') = '50' then
    update public.stores set revenue_share = 70 where revenue_share = 50;
    alter table public.stores alter column revenue_share set default 70;
  end if;
end $$;

alter table public.stores drop constraint if exists stores_slug_not_reserved;
alter table public.stores add constraint stores_slug_not_reserved check (slug <> all (array[
  -- Pages and folders the site has today
  'admin', 'api', 'auth', 'dashboard', 'download', 'email-preferences', 'fonts', 'forgot-password',
  'login', 'order', 'privacy', 'product', 'reset-password', 'signup', 'store', 'suspended', 'templates', 'terms',
  -- Kept free for the business
  'about', 'account', 'apply', 'blog', 'careers', 'cart', 'checkout', 'contact', 'creators', 'explore',
  'faq', 'hello', 'help', 'home', 'how-it-works', 'jobs', 'legal', 'logout', 'partners', 'partnerships',
  'press', 'pricing', 'search', 'settings', 'shop', 'sitemap', 'stores', 'support', 'team', 'www'
]));
