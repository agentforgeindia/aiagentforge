-- ============================================================
-- AgentForge — Email automation foundation (Phase 3.1)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Two tables + one queue RPC + two triggers + four seeded
-- templates + three permission strings.
--
--   email_templates       — editable subject + HTML/plain body
--                           with {{var}} placeholders.
--   email_events          — queue and log in one table. Every
--                           outgoing email lives here forever.
--
--   enqueue_email(...)    — single source of truth for inserts.
--                           Idempotent via UNIQUE dedupe_key.
--
-- Triggers wire themselves up automatically to:
--   profiles INSERT       → welcome
--   payments INSERT paid  → payment_receipt
--
-- The trial-ending (T-3) and renewal-due (T-0) emails are
-- enqueued by the cron route at /api/cron/email-dispatch (because
-- they're date-relative, not row-event-driven).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Tables
-- ────────────────────────────────────────────────────────────

create table if not exists public.email_templates (
  slug              text primary key,
  subject           text not null,
  html_body         text not null,
  plain_body        text,
  variables         jsonb not null default '{}'::jsonb,
  enabled           boolean not null default true,
  updated_at        timestamptz not null default now(),
  updated_by_email  text
);

create table if not exists public.email_events (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete set null,
  recipient_email      text not null,
  template_slug        text not null references public.email_templates(slug),
  payload              jsonb not null default '{}'::jsonb,
  scheduled_at         timestamptz not null default now(),
  sent_at              timestamptz,
  status               text not null default 'queued'
                       check (status in ('queued','sent','failed','dry_run','skipped')),
  error_text           text,
  provider_message_id  text,
  retry_count          int not null default 0,
  dedupe_key           text unique,
  created_at           timestamptz not null default now()
);

create index if not exists email_events_dispatch_idx
  on public.email_events (status, scheduled_at)
  where status = 'queued';
create index if not exists email_events_recipient_idx
  on public.email_events (recipient_email, created_at desc);
create index if not exists email_events_template_idx
  on public.email_events (template_slug, created_at desc);

-- ────────────────────────────────────────────────────────────
-- 2.  RLS
-- ────────────────────────────────────────────────────────────
alter table public.email_templates enable row level security;
alter table public.email_events    enable row level security;

drop policy if exists "email_templates read by admins" on public.email_templates;
create policy "email_templates read by admins"
  on public.email_templates for select to authenticated
  using (public.has_permission('email.view'));

drop policy if exists "email_templates write by editors" on public.email_templates;
create policy "email_templates write by editors"
  on public.email_templates for all to authenticated
  using (public.has_permission('email.edit'))
  with check (public.has_permission('email.edit'));

drop policy if exists "email_events read by admins" on public.email_events;
create policy "email_events read by admins"
  on public.email_events for select to authenticated
  using (public.has_permission('email.view'));

-- Writes happen only from triggers (security definer) and the
-- service-role dispatcher. No client-side INSERT/UPDATE policy.

-- ────────────────────────────────────────────────────────────
-- 3.  enqueue_email — single source of truth
-- ────────────────────────────────────────────────────────────

create or replace function public.enqueue_email(
  p_slug         text,
  p_recipient    text,
  p_user_id      uuid    default null,
  p_payload      jsonb   default '{}'::jsonb,
  p_scheduled_at timestamptz default now(),
  p_dedupe_key   text    default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_recipient text;
begin
  if p_recipient is null or length(trim(p_recipient)) = 0 then
    return null;
  end if;
  v_recipient := lower(trim(p_recipient));

  -- Template must exist and be enabled. Disabled templates skip
  -- enqueue silently (so disabling welcome doesn't 500 every signup).
  if not exists (
    select 1 from public.email_templates
     where slug = p_slug and enabled = true
  ) then
    return null;
  end if;

  insert into public.email_events(
    user_id, recipient_email, template_slug, payload,
    scheduled_at, dedupe_key
  ) values (
    p_user_id, v_recipient, p_slug, coalesce(p_payload, '{}'::jsonb),
    coalesce(p_scheduled_at, now()), p_dedupe_key
  )
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  return v_id;
end$$;

revoke all on function public.enqueue_email(text, text, uuid, jsonb, timestamptz, text) from public;
grant execute on function public.enqueue_email(text, text, uuid, jsonb, timestamptz, text)
  to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 4.  Triggers
-- ────────────────────────────────────────────────────────────

-- 4a. New profile (signup) → welcome
create or replace function public.email_on_profile_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.email is null or length(trim(new.email)) = 0 then
    return new;
  end if;

  perform public.enqueue_email(
    'welcome',
    new.email,
    new.id,
    jsonb_build_object(
      'full_name', coalesce(new.full_name, ''),
      'email',     new.email
    ),
    now(),
    'welcome:' || new.id::text
  );
  return new;
exception when others then
  -- Never let an email failure block signup.
  raise warning 'email_on_profile_insert failed: %', sqlerrm;
  return new;
end$$;

drop trigger if exists trg_email_on_profile_insert on public.profiles;
create trigger trg_email_on_profile_insert
  after insert on public.profiles
  for each row execute function public.email_on_profile_insert();

-- 4b. Paid payment → receipt
create or replace function public.email_on_payment_paid()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_recipient text;
  v_full_name text;
begin
  if new.status <> 'paid' then
    return new;
  end if;

  -- Prefer the captured billing email, fall back to the auth user.
  v_recipient := coalesce(
    nullif(trim(new.billing_email), ''),
    (select email from public.profiles where id = new.user_id),
    (select u.email from auth.users u where u.id = new.user_id)
  );

  if v_recipient is null then
    return new;
  end if;

  select coalesce(nullif(trim(new.billing_name), ''), full_name)
    into v_full_name
    from public.profiles
   where id = new.user_id;

  perform public.enqueue_email(
    'payment_receipt',
    v_recipient,
    new.user_id,
    jsonb_build_object(
      'full_name',     coalesce(v_full_name, ''),
      'plan',          coalesce(new.plan, ''),
      'amount',        coalesce(new.amount, 0),
      'credits_added', coalesce(new.credits_added, 0),
      'payment_id',    new.id::text
    ),
    now(),
    'payment_receipt:' || new.id::text
  );
  return new;
exception when others then
  raise warning 'email_on_payment_paid failed: %', sqlerrm;
  return new;
end$$;

drop trigger if exists trg_email_on_payment_paid on public.payments;
create trigger trg_email_on_payment_paid
  after insert on public.payments
  for each row execute function public.email_on_payment_paid();

-- ────────────────────────────────────────────────────────────
-- 5.  Permissions — email.view / email.edit / email.send
-- ────────────────────────────────────────────────────────────
-- Founders get '*' so they're covered automatically. Add the
-- three permissions to the 'admin' role; sales/accounts stay
-- out of email config (they can still see the queue via
-- email.view if you add it explicitly).

update public.admin_roles
   set permissions = array(
     select distinct unnest(
       permissions || ARRAY['email.view','email.edit','email.send']
     )
   ),
   updated_at = now()
 where id = 'admin';

-- ────────────────────────────────────────────────────────────
-- 6.  Seed templates
-- ────────────────────────────────────────────────────────────
-- Plain corporate HTML — no gradients, no images, single CTA.
-- The bodies are intentionally short. Edit them later from
-- /admin/email; this seed only runs if a slug is missing.
-- ────────────────────────────────────────────────────────────

insert into public.email_templates (slug, subject, html_body, plain_body, variables) values
(
  'welcome',
  'Welcome to AgentForge, {{full_name}}',
  $$<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#f7f8fb;padding:24px;">
<table cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">
<tr><td style="padding:24px;">
<h1 style="margin:0 0 12px;font-size:20px;">Welcome aboard, {{full_name}}.</h1>
<p style="margin:0 0 12px;font-size:14px;line-height:22px;">Thanks for signing up to AgentForge. You can start generating right away — every plan ships with a free credit pool so you can try the agents before topping up.</p>
<p style="margin:0 0 16px;font-size:14px;line-height:22px;"><strong>Quick links:</strong></p>
<ul style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:22px;">
<li><a href="https://aiagentforge.in/agents" style="color:#4f46e5;">Browse the AI agents</a></li>
<li><a href="https://aiagentforge.in/pricing" style="color:#4f46e5;">Plans &amp; credits</a></li>
<li><a href="https://aiagentforge.in/billing" style="color:#4f46e5;">Your account</a></li>
</ul>
<p style="margin:0;font-size:13px;color:#475569;line-height:20px;">Reply to this email if anything is unclear — a human reads every message.</p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
AgentForge — aiagentforge.in · India
</td></tr></table></body></html>$$,
  $$Welcome aboard, {{full_name}}.

Thanks for signing up to AgentForge. You can start generating right away — every plan ships with a free credit pool so you can try the agents before topping up.

Quick links:
 · Browse the AI agents — https://aiagentforge.in/agents
 · Plans & credits      — https://aiagentforge.in/pricing
 · Your account         — https://aiagentforge.in/billing

Reply to this email if anything is unclear — a human reads every message.

AgentForge — aiagentforge.in$$,
  '{"full_name":"Customer first name","email":"Signup email (informational)"}'::jsonb
),
(
  'payment_receipt',
  'Payment received — {{plan}} (Rs {{amount}})',
  $$<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#f7f8fb;padding:24px;">
<table cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">
<tr><td style="padding:24px;">
<h1 style="margin:0 0 12px;font-size:20px;">Payment received.</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:22px;">Hi {{full_name}}, we have received your payment. Your AgentForge balance has been topped up.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e2e8f0;border-radius:6px;margin:0 0 16px;">
<tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Plan</td><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;font-weight:bold;">{{plan}}</td></tr>
<tr><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">Amount</td><td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;font-weight:bold;">Rs {{amount}}</td></tr>
<tr><td style="padding:10px 14px;font-size:13px;color:#64748b;">Credits added</td><td style="padding:10px 14px;font-size:13px;text-align:right;font-weight:bold;">{{credits_added}}</td></tr>
</table>
<p style="margin:0 0 16px;font-size:14px;line-height:22px;">Download your GST bill from <a href="https://aiagentforge.in/billing" style="color:#4f46e5;">aiagentforge.in/billing</a>.</p>
<p style="margin:0;font-size:13px;color:#475569;line-height:20px;">Reference: {{payment_id}}</p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
AgentForge — aiagentforge.in · India
</td></tr></table></body></html>$$,
  $$Payment received.

Hi {{full_name}}, we have received your payment. Your AgentForge balance has been topped up.

Plan:          {{plan}}
Amount:        Rs {{amount}}
Credits added: {{credits_added}}

Download your GST bill from https://aiagentforge.in/billing

Reference: {{payment_id}}

AgentForge — aiagentforge.in$$,
  '{"full_name":"Customer name","plan":"Plan slug","amount":"Rupee amount","credits_added":"Credits credited","payment_id":"Internal payment UUID"}'::jsonb
),
(
  'trial_ending',
  'Your AgentForge plan ends in 3 days',
  $$<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#f7f8fb;padding:24px;">
<table cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">
<tr><td style="padding:24px;">
<h1 style="margin:0 0 12px;font-size:20px;">Your plan ends on {{expires_on}}.</h1>
<p style="margin:0 0 12px;font-size:14px;line-height:22px;">Hi {{full_name}}, just a heads up — your <strong>{{plan}}</strong> plan ends in three days.</p>
<p style="margin:0 0 20px;font-size:14px;line-height:22px;">Renew now to keep your agents and remaining credits live. One click, no re-onboarding.</p>
<p style="margin:0 0 20px;"><a href="https://aiagentforge.in/pricing" style="display:inline-block;background:#0f172a;color:#fff;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;">Renew plan</a></p>
<p style="margin:0;font-size:13px;color:#475569;line-height:20px;">Questions? Reply to this email.</p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
AgentForge — aiagentforge.in · India
</td></tr></table></body></html>$$,
  $$Your plan ends on {{expires_on}}.

Hi {{full_name}}, just a heads up — your {{plan}} plan ends in three days.

Renew now to keep your agents and remaining credits live: https://aiagentforge.in/pricing

Questions? Reply to this email.

AgentForge — aiagentforge.in$$,
  '{"full_name":"Customer name","plan":"Current plan slug","expires_on":"YYYY-MM-DD plan_expires_at date"}'::jsonb
),
(
  'renewal_due',
  'Your AgentForge plan has expired',
  $$<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#f7f8fb;padding:24px;">
<table cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">
<tr><td style="padding:24px;">
<h1 style="margin:0 0 12px;font-size:20px;">Plan expired.</h1>
<p style="margin:0 0 12px;font-size:14px;line-height:22px;">Hi {{full_name}}, your <strong>{{plan}}</strong> plan expired on {{expired_on}}. Your account is paused — leftover credits are safe and will activate again the moment you renew.</p>
<p style="margin:0 0 20px;"><a href="https://aiagentforge.in/pricing" style="display:inline-block;background:#0f172a;color:#fff;font-weight:bold;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;">Renew now</a></p>
<p style="margin:0;font-size:13px;color:#475569;line-height:20px;">If you would like a custom plan or a callback, just reply.</p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;">
AgentForge — aiagentforge.in · India
</td></tr></table></body></html>$$,
  $$Plan expired.

Hi {{full_name}}, your {{plan}} plan expired on {{expired_on}}. Your account is paused — leftover credits are safe and will activate again the moment you renew.

Renew: https://aiagentforge.in/pricing

If you would like a custom plan or a callback, just reply.

AgentForge — aiagentforge.in$$,
  '{"full_name":"Customer name","plan":"Plan slug at expiry","expired_on":"YYYY-MM-DD plan_expires_at date"}'::jsonb
)
on conflict (slug) do nothing;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- select slug, enabled from public.email_templates;
-- select tgname from pg_trigger where tgname like 'trg_email_%';
-- select public.has_permission('email.view');
-- -- Trigger smoke test (run as service role):
-- insert into public.profiles (id, email, full_name)
--   values ('00000000-0000-0000-0000-000000000099', 'test+welcome@example.com', 'Test User')
--   on conflict do nothing;
-- select status, dedupe_key from public.email_events
--   where template_slug = 'welcome' order by created_at desc limit 1;
-- ============================================================
