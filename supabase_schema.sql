-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean default false,
  quota_limit int default 100,
  disabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create usage table
create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  "type" text not null,
  amount int default 1,
  meta jsonb,
  created_at timestamptz default now()
);

-- Create releases table
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  version text,
  channel text default 'stable',
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz default now(),
  notes text
);

-- Create admin audit table
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- Enable RLS and add policies
alter table public.profiles enable row level security;

create policy "profiles_is_owner_or_admin" on public.profiles
  for all
  using (auth.uid() = user_id or exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true))
  with check (auth.uid() = user_id or exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

alter table public.usage enable row level security;
create policy "usage_owner_or_admin" on public.usage
  for all
  using (exists(select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()) or exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true))
  with check (exists(select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()) or exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

alter table public.releases enable row level security;
create policy "releases_admin_only" on public.releases
  for all
  using (exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true))
  with check (exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));

alter table public.admin_audit enable row level security;
create policy "admin_audit_admin_only" on public.admin_audit
  for all
  using (exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true))
  with check (exists(select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true));
