-- ============================================================
-- Feedback table — stores user rating + feedback after generation
-- Credits awarded are tracked here + in credit_transactions
-- ============================================================

create table if not exists public.feedback (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  generation_id  text,
  agent          text,
  rating         smallint not null check (rating >= 1 and rating <= 5),
  feedback       text,
  credits_awarded smallint not null default 0,
  created_at     timestamptz not null default now()
);

-- One feedback per generation (prevents abuse)
create unique index if not exists feedback_user_generation_unique
  on public.feedback (user_id, generation_id)
  where generation_id is not null;

-- RLS: users can only read/insert their own feedback
alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

-- Admins (service role) can read all
-- Service role bypasses RLS automatically.
