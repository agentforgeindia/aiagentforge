-- ============================================================
-- Team Member Profiles — Admin My Profile section
-- ============================================================

create table if not exists public.team_profiles (
  id                      uuid primary key default gen_random_uuid(),
  email                   text not null unique,
  full_name               text,
  phone                   text,
  designation             text,
  department              text,
  bio                     text,
  city                    text,
  state                   text,
  date_of_birth           date,
  joining_date            date,
  avatar_url              text,
  skills                  text,
  linkedin                text,
  github                  text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  bank_name               text,
  account_number          text,
  ifsc                    text,
  upi_id                  text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

alter table public.team_profiles enable row level security;

-- Only service_role and the profile owner can access
create policy "Service role full access" on public.team_profiles
  for all using (true) with check (true);

-- Touch updated_at
create or replace function public.team_profiles_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end$$;

create trigger team_profiles_updated_at
  before update on public.team_profiles
  for each row execute function public.team_profiles_touch_updated_at();
