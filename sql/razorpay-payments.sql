-- Run this in Supabase SQL Editor.
-- Safe checks for existing AgentForge profile columns.

alter table public.profiles
add column if not exists credits bigint not null default 0;

alter table public.profiles
add column if not exists plan text;

alter table public.profiles
add column if not exists updated_at timestamptz default now();

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  plan_name text not null,
  amount numeric not null,
  credits bigint not null,
  currency text not null default 'INR',
  status text not null default 'paid',
  razorpay_order_id text,
  razorpay_payment_id text unique,
  razorpay_signature text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "Users can view own payments"
on public.payments
for select
to authenticated
using (auth.uid() = user_id);
