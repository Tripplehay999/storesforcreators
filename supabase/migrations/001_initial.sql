-- Browne's Talent Group — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- PROFILES — one row per auth user, created by trigger on signup
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  social_handle text not null default '',
  role text not null default 'creator' check (role in ('creator', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, social_handle)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'social_handle', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- STORES — a creator storefront. Demo stores have no owner.
-- ─────────────────────────────────────────────────────────────

create table public.stores (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  owner_id uuid unique references public.profiles (id) on delete set null,
  name text not null,
  short text not null default '',
  category text not null default '',
  description text not null default '',
  headline text not null default '',
  headline_em text not null default '',
  bio text not null default '',
  image text not null default '',
  label text not null default '',
  background text not null default '#f6eaf1' check (background ~ '^#[0-9a-fA-F]{6}$'),
  featured_product_id text,
  revenue_share int not null default 50 check (revenue_share between 0 and 100),
  is_demo boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────────────────────

create table public.products (
  id text primary key check (id ~ '^[a-z0-9-]{1,80}$'),
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  name text not null,
  category text not null default '',
  tagline text not null default '',
  description text not null default '',
  price numeric(10, 2) not null default 0 check (price between 0 and 9999),
  price_label text not null default '',
  badge text not null default '',
  image text not null default '',
  gallery text[] not null default '{}',
  theme text not null default '#eee3f0' check (theme ~ '^#[0-9a-fA-F]{6}$'),
  layout text not null default 'split' check (layout in ('split', 'center')),
  cta text not null default 'Explore product',
  features text[] not null default '{}',
  faqs jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index products_store_slug_idx on public.products (store_slug);

-- ─────────────────────────────────────────────────────────────
-- ORDERS — written by checkout / admins, read by store owners
-- ─────────────────────────────────────────────────────────────

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_slug text not null references public.stores (slug) on update cascade on delete cascade,
  product_id text references public.products (id) on delete set null,
  product_name text not null,
  customer_email text,
  amount numeric(10, 2) not null check (amount >= 0),
  creator_amount numeric(10, 2) not null check (creator_amount >= 0),
  status text not null default 'completed' check (status in ('completed', 'refunded')),
  created_at timestamptz not null default now()
);

create index orders_store_created_idx on public.orders (store_slug, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- APPLICATIONS — "Become a partner" form submissions
-- ─────────────────────────────────────────────────────────────

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  social_profile text not null check (char_length(social_profile) between 1 and 200),
  followers text not null check (char_length(followers) <= 50),
  niche text not null default '' check (char_length(niche) <= 200),
  message text not null default '' check (char_length(message) <= 4000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.applications enable row level security;

-- profiles: read/update yourself; admins read everyone.
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- Creators may only change these columns (role is admin-only).
revoke update on public.profiles from authenticated;
grant update (full_name, social_handle) on public.profiles to authenticated;

-- stores: published stores are public; owners manage their own.
create policy "stores: public read" on public.stores
  for select using (published or owner_id = auth.uid() or public.is_admin());
create policy "stores: owner insert" on public.stores
  for insert with check (owner_id = auth.uid() and not is_demo);
create policy "stores: owner or admin update" on public.stores
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "stores: admin delete" on public.stores
  for delete using (public.is_admin());
-- Creators can't set their own revenue share or flag a store as a demo.
revoke insert, update on public.stores from authenticated;
grant insert (slug, owner_id, name, short, category, description, headline, headline_em,
              bio, image, label, background, featured_product_id, published)
  on public.stores to authenticated;
grant update (name, short, category, description, headline, headline_em,
              bio, image, label, background, featured_product_id, published)
  on public.stores to authenticated;

create or replace function public.can_manage_store(target_slug text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.stores where slug = target_slug and owner_id = auth.uid()
  );
$$;

-- products: public catalog; store owners and admins write.
create policy "products: public read" on public.products
  for select using (true);
create policy "products: manage insert" on public.products
  for insert with check (public.can_manage_store(store_slug));
create policy "products: manage update" on public.products
  for update using (public.can_manage_store(store_slug))
  with check (public.can_manage_store(store_slug));
create policy "products: manage delete" on public.products
  for delete using (public.can_manage_store(store_slug));

-- orders: store owners read theirs; admins read and record.
create policy "orders: owner read" on public.orders
  for select using (public.can_manage_store(store_slug));
create policy "orders: admin insert" on public.orders
  for insert with check (public.is_admin());
create policy "orders: admin update" on public.orders
  for update using (public.is_admin());

-- applications: anyone may submit; admins review.
create policy "applications: anyone insert" on public.applications
  for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = auth.uid()));
create policy "applications: admin read" on public.applications
  for select using (public.is_admin());
create policy "applications: admin update" on public.applications
  for update using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- STORAGE — product and store images
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Each user uploads into a folder named after their user id.
create policy "product-images: owner upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "product-images: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────
-- SEED — the three illustrative creator stores from the landing page
-- ─────────────────────────────────────────────────────────────

insert into public.stores
  (slug, name, short, category, description, headline, headline_em, bio, image, label, background, featured_product_id, is_demo)
values
  ('jasmine', 'Jasmine''s Financials', 'jasmine''s financials.', 'FINANCE / MONEY TIPS',
   'Budgeting, money management, and everyday financial confidence.',
   'Your money.', 'Your way.',
   'Budget planners and money tools designed to help you feel more confident with your finances.',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1000&h=1100&fit=crop&crop=faces',
   'MONEY TIPS', '#f6eaf1', 'budget', true),
  ('sofia', 'Sofia''s Fit Life', 'sofia. fit', 'FITNESS / WELLNESS',
   'Fitness routines, meal preparation, and healthy habits.',
   'Feel good.', 'Feel stronger.',
   'Meal preparation and fitness tools for building routines that fit your life.',
   'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1000&h=1100&fit=crop',
   'FITNESS & MEALS', '#eef4eb', 'fitness', true),
  ('nia', 'Notes by Nia', 'notes by nia.', 'STUDY GUIDES / PLANNING',
   'Study guides, academic planning, and better organization.',
   'Study smarter.', 'Dream bigger.',
   'Study planning and academic organization tools made for busy students.',
   'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1000&h=1100&fit=crop&crop=faces',
   '📖 STUDY EDIT', '#f0eaf7', 'study', true);

insert into public.products
  (id, store_slug, name, category, tagline, description, price, price_label, badge, image, gallery, theme, layout, cta, features, faqs, created_at)
values
  ('budget', 'jasmine', 'Budget Planner Collection', 'PERSONAL FINANCE',
   'Choose a budget planner that works for you.',
   'Beautiful digital budgeting templates designed to organize income, spending, savings goals, and financial planning. Choose from different planner options to fit your lifestyle.',
   19, '$19–$59 USD', 'DIGITAL BUDGET TEMPLATES',
   '/templates/student-money-planner.png', array['/templates/complete-budget-planner.png'],
   '#f0e0ed', 'split', 'Explore budget planners',
   array['Monthly income and expense tracking', 'Budget categories and spending summaries',
         'Savings goals and financial planning', 'Visual charts and dashboards',
         'Student and complete planner options'],
   '[["Is this a physical product?", "No. This example collection contains digital budget planners."],
     ["Are there different planner options?", "Yes. The collection can offer different planner versions at different prices."]]',
   now() - interval '4 minutes'),
  ('coaching', 'jasmine', '1:1 Financial Coaching', 'FINANCIAL COACHING',
   'Personalized support for your money goals.',
   'An illustrative one-on-one financial coaching offering focused on budgeting habits, savings organization, and practical money planning. Actual availability, qualifications, and service scope must be confirmed before booking.',
   105, '$105 USD / hour', 'PERSONALIZED SUPPORT',
   'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000&h=850&fit=crop', '{}',
   '#eadcea', 'split', 'Explore coaching',
   array['One-on-one budgeting conversation', 'Personal money goal planning',
         'Spending and savings organization', 'Illustrative 60-minute session'],
   '[["Can I book right now?", "Not through this demonstration. Live booking and payment are not connected."],
     ["Is this regulated financial advice?", "No regulated advice is represented by this sample. A real provider must operate within their qualifications and applicable rules."]]',
   now() - interval '3 minutes'),
  ('fitness', 'sofia', 'Fitness & Meal Prep Planner', 'FITNESS / WELLNESS',
   'Plan your meals. Love your routine.',
   'A digital meal preparation and fitness planning concept featuring weekly meal schedules, grocery lists, workouts, and healthy habit tracking.',
   29, 'From $29 USD', 'MEAL PREP & FITNESS',
   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&h=850&fit=crop', '{}',
   '#e4efdf', 'split', 'Explore meal planner',
   array['Weekly meal preparation planner', 'Grocery list organization', 'Workout schedule',
         'Habit tracking', 'Weekly progress pages'],
   '[["Is this a personalized nutrition program?", "No. This is a general digital planning concept, not individualized medical or nutrition advice."]]',
   now() - interval '2 minutes'),
  ('study', 'nia', 'Study Guides & Planning', 'STUDY / PRODUCTIVITY',
   'Less chaos. More clarity.',
   'Digital study guides and academic planning resources to help organize assignments, deadlines, study sessions, and exam preparation.',
   19, 'From $19 USD', 'STUDY SMARTER',
   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000&h=850&fit=crop', '{}',
   '#ece3f3', 'split', 'Explore study guides',
   array['Assignment and deadline tracking', 'Weekly study planning', 'Exam preparation schedules',
         'Study guide templates', 'Academic organization'],
   '[]',
   now() - interval '1 minute');
