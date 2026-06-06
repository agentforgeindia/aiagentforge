-- ============================================================
-- AgentForge — Admin Notifications (Phase 2.2)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Two tables:
--   admin_notifications        — events worth knowing about
--   admin_notification_reads   — per-user read receipts
--
-- Triggers auto-create notifications on:
--   • leads INSERT             → "New lead from X"
--   • payments status='paid'   → "₹9,999 received from X"
--   • payments status='refunded' → "Refund issued for X"
--   • profiles plan_expires_at crossed today (computed daily — optional cron)
--
-- Helper functions:
--   create_notification(...)      — manual notification
--   mark_notification_read(id)    — single-row mark read
--   mark_all_notifications_read() — bulk mark all
--   admin_unread_count()          — bell badge count
--   list_admin_notifications()    — bell dropdown list
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1.  Tables
-- ────────────────────────────────────────────────────────────

create table if not exists public.admin_notifications (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null,                  -- 'lead.new', 'payment.paid', etc.
  severity            text not null default 'info'
                      check (severity in ('info', 'success', 'warning', 'critical')),
  title               text not null,
  body                text,
  target_url          text,                            -- click destination
  recipient_email     text,                            -- null = broadcast to all admins
  required_permission text,                            -- e.g. 'leads.view' (filter)
  created_at          timestamptz not null default now()
);

create index if not exists admin_notifications_created_idx
  on public.admin_notifications (created_at desc);
create index if not exists admin_notifications_type_idx
  on public.admin_notifications (type, created_at desc);

create table if not exists public.admin_notification_reads (
  notification_id uuid not null references public.admin_notifications(id) on delete cascade,
  reader_email    text not null,
  read_at         timestamptz not null default now(),
  primary key (notification_id, reader_email)
);

create index if not exists admin_notification_reads_reader_idx
  on public.admin_notification_reads (reader_email, read_at desc);

-- ────────────────────────────────────────────────────────────
-- 2.  RLS — only admins read
-- ────────────────────────────────────────────────────────────
alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;

drop policy if exists "notifications read by admins" on public.admin_notifications;
create policy "notifications read by admins"
  on public.admin_notifications for select to authenticated
  using (public.is_admin());

drop policy if exists "notification_reads own only" on public.admin_notification_reads;
create policy "notification_reads own only"
  on public.admin_notification_reads for all to authenticated
  using (
    reader_email is not null
    and lower(reader_email) = lower(coalesce(
      (select u.email from auth.users u where u.id = auth.uid()),
      ''
    ))
  )
  with check (
    reader_email is not null
    and lower(reader_email) = lower(coalesce(
      (select u.email from auth.users u where u.id = auth.uid()),
      ''
    ))
  );

-- ────────────────────────────────────────────────────────────
-- 3.  create_notification — single source of truth for inserts
-- ────────────────────────────────────────────────────────────

create or replace function public.create_notification(
  p_type      text,
  p_title     text,
  p_body      text default null,
  p_target    text default null,
  p_severity  text default 'info',
  p_required_permission text default null,
  p_recipient text default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.admin_notifications(
    type, severity, title, body, target_url, required_permission, recipient_email
  ) values (
    p_type, coalesce(p_severity, 'info'), p_title, p_body, p_target,
    p_required_permission, p_recipient
  )
  returning id into v_id;
  return v_id;
end$$;

revoke all on function public.create_notification(text, text, text, text, text, text, text) from public;
grant execute on function public.create_notification(text, text, text, text, text, text, text) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 4.  Triggers
-- ────────────────────────────────────────────────────────────

-- 4a. New lead
create or replace function public.notify_on_new_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_source text;
begin
  v_source := coalesce(new.source, 'unknown');
  perform public.create_notification(
    'lead.new',
    'New lead from ' || coalesce(new.name, 'unknown'),
    case
      when new.business_name is not null then new.business_name || ' · ' || v_source
      else v_source
    end,
    '/admin/leads/' || new.id::text,
    'info',
    'leads.view',
    null
  );
  return new;
end$$;

drop trigger if exists leads_notify_insert on public.leads;
create trigger leads_notify_insert
  after insert on public.leads
  for each row execute function public.notify_on_new_lead();

-- 4b. Payment paid / refunded
create or replace function public.notify_on_payment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_label text;
  v_severity text;
  v_type text;
  v_buyer text;
begin
  v_buyer := coalesce(new.billing_name, new.billing_email, 'a customer');

  -- New paid payment
  if (tg_op = 'INSERT' and new.status = 'paid') then
    v_label := '₹' || to_char(new.amount, 'FM999,999,999') || ' received';
    perform public.create_notification(
      'payment.paid',
      v_label,
      new.plan || ' from ' || v_buyer,
      '/admin/invoices',
      'success',
      'invoices.view_all',
      null
    );
    return new;
  end if;

  -- Status flipped → refunded / partially_refunded
  if (tg_op = 'UPDATE'
      and old.status not in ('refunded', 'partially_refunded')
      and new.status in ('refunded', 'partially_refunded')) then
    v_label := 'Refund issued · ₹' || to_char(coalesce(new.refund_amount, new.amount), 'FM999,999,999');
    perform public.create_notification(
      'payment.refunded',
      v_label,
      v_buyer || ' — ' || coalesce(new.refund_reason, 'no reason'),
      '/admin/invoices',
      'warning',
      'invoices.view_all',
      null
    );
    return new;
  end if;

  return new;
end$$;

drop trigger if exists payments_notify_insert on public.payments;
create trigger payments_notify_insert
  after insert on public.payments
  for each row execute function public.notify_on_payment_change();

drop trigger if exists payments_notify_update on public.payments;
create trigger payments_notify_update
  after update on public.payments
  for each row execute function public.notify_on_payment_change();

-- ────────────────────────────────────────────────────────────
-- 5.  Read tracking helpers
-- ────────────────────────────────────────────────────────────

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return; end if;
  insert into public.admin_notification_reads(notification_id, reader_email)
    values (p_notification_id, v_email)
    on conflict do nothing;
end$$;

create or replace function public.mark_all_notifications_read()
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_email text;
  v_count int;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return 0; end if;

  insert into public.admin_notification_reads(notification_id, reader_email)
  select n.id, v_email
    from public.admin_notifications n
   where (n.recipient_email is null
          or lower(n.recipient_email) = lower(v_email))
     and not exists (
       select 1 from public.admin_notification_reads r
        where r.notification_id = n.id
          and lower(r.reader_email) = lower(v_email)
     )
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end$$;

revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_notification_read(uuid) to authenticated, service_role;
grant execute on function public.mark_all_notifications_read() to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 6.  Bell-drive listing function
-- ────────────────────────────────────────────────────────────
-- Returns last 20 notifications visible to the current admin,
-- with a read=true/false flag joined from admin_notification_reads.
-- ────────────────────────────────────────────────────────────

create or replace function public.list_admin_notifications(
  p_limit int default 20
)
returns table (
  id           uuid,
  type         text,
  severity     text,
  title        text,
  body         text,
  target_url   text,
  created_at   timestamptz,
  is_read      boolean
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_email text;
  v_perms text[];
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return; end if;

  v_perms := coalesce(public.current_user_permissions(), '{}');

  return query
  select
    n.id,
    n.type,
    n.severity,
    n.title,
    n.body,
    n.target_url,
    n.created_at,
    exists (
      select 1 from public.admin_notification_reads r
       where r.notification_id = n.id
         and lower(r.reader_email) = lower(v_email)
    ) as is_read
  from public.admin_notifications n
  where (n.recipient_email is null
         or lower(n.recipient_email) = lower(v_email))
    and (
      n.required_permission is null
      or '*' = any(v_perms)
      or n.required_permission = any(v_perms)
      or (split_part(n.required_permission, '.', 1) || '.*') = any(v_perms)
    )
  order by n.created_at desc
  limit greatest(p_limit, 1);
end$$;

revoke all on function public.list_admin_notifications(int) from public;
grant execute on function public.list_admin_notifications(int) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- 7.  Unread badge count
-- ────────────────────────────────────────────────────────────

create or replace function public.admin_unread_count()
returns int
language plpgsql stable security definer set search_path = public
as $$
declare
  v_email text;
  v_perms text[];
  v_count int;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return 0; end if;

  v_perms := coalesce(public.current_user_permissions(), '{}');

  select count(*) into v_count
    from public.admin_notifications n
    where (n.recipient_email is null
           or lower(n.recipient_email) = lower(v_email))
      and (
        n.required_permission is null
        or '*' = any(v_perms)
        or n.required_permission = any(v_perms)
        or (split_part(n.required_permission, '.', 1) || '.*') = any(v_perms)
      )
      and not exists (
        select 1 from public.admin_notification_reads r
         where r.notification_id = n.id
           and lower(r.reader_email) = lower(v_email)
      );

  return v_count;
end$$;

revoke all on function public.admin_unread_count() from public;
grant execute on function public.admin_unread_count() to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
-- -- After running, every NEW lead insert will create a notification.
-- -- Test the bell:
-- select public.admin_unread_count();
-- select * from public.list_admin_notifications(10);
-- ============================================================
