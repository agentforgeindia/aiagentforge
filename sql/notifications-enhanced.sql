-- ============================================================
-- AgentForge — Enhanced Notifications (Phase 4)
-- Run this in Supabase SQL Editor.
-- Adds triggers for: signups, support tickets, tasks assigned.
-- ============================================================

-- ── Trigger: New signup ──────────────────────────────────────
create or replace function public.notify_on_new_signup()
returns trigger language plpgsql security definer as $$
begin
  perform public.create_notification(
    'user.signup',
    'New signup: ' || coalesce(new.full_name, new.email, 'Unknown'),
    coalesce(new.email, ''),
    '/admin/customers/' || new.id::text,
    'info',
    'customers.view',
    null
  );
  return new;
end$$;

drop trigger if exists profiles_notify_signup on public.profiles;
create trigger profiles_notify_signup
  after insert on public.profiles
  for each row execute function public.notify_on_new_signup();

-- ── Trigger: New support ticket ──────────────────────────────
create or replace function public.notify_on_new_ticket()
returns trigger language plpgsql security definer as $$
declare
  v_severity text;
begin
  v_severity := case new.priority
    when 'urgent' then 'critical'
    when 'high'   then 'warning'
    else 'info'
  end;

  perform public.create_notification(
    'support.ticket',
    'Support #' || new.ticket_number || ': ' || new.subject,
    coalesce(new.user_name, new.user_email, 'Customer') || ' · ' || new.category,
    '/admin/support-center',
    v_severity,
    'support.view',
    null
  );
  return new;
end$$;

drop trigger if exists support_tickets_notify on public.support_tickets;
create trigger support_tickets_notify
  after insert on public.support_tickets
  for each row execute function public.notify_on_new_ticket();

-- ── Trigger: Task assigned ───────────────────────────────────
create or replace function public.notify_on_task_assigned()
returns trigger language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.assigned_to_email is distinct from new.assigned_to_email))
    and new.assigned_to_email is not null
  then
    perform public.create_notification(
      'task.assigned',
      'Task assigned: ' || new.title,
      'Assigned to ' || new.assigned_to_email,
      '/admin/tasks',
      'info',
      'tasks.view',
      new.assigned_to_email
    );
  end if;
  return new;
end$$;

drop trigger if exists tasks_notify_assigned_insert on public.tasks;
drop trigger if exists tasks_notify_assigned_update on public.tasks;

create trigger tasks_notify_assigned_insert
  after insert on public.tasks
  for each row execute function public.notify_on_task_assigned();

create trigger tasks_notify_assigned_update
  after update on public.tasks
  for each row execute function public.notify_on_task_assigned();

-- ── customer_timeline() function ─────────────────────────────
create or replace function public.customer_timeline(p_user_id uuid, p_limit int default 50)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if not (current_user in ('service_role','postgres') or public.has_permission('customers.view') or public.has_permission('*')) then
    raise exception 'customer_timeline: permission denied';
  end if;

  return (
    select coalesce(jsonb_agg(evt order by evt->>'ts' desc), '[]'::jsonb)
    from (
      -- Signup
      select jsonb_build_object(
        'ts', created_at, 'type', 'signup', 'icon', 'user',
        'title', 'Account created',
        'body', coalesce(email, '')
      ) as evt from public.profiles where id = p_user_id

      union all

      -- Payments
      select jsonb_build_object(
        'ts', created_at, 'type', 'payment', 'icon', 'payment',
        'title', '₹' || amount || ' — ' || plan,
        'body', status
      ) from public.payments where user_id = p_user_id

      union all

      -- Credit transactions (last 30)
      select jsonb_build_object(
        'ts', created_at, 'type', 'credit', 'icon', 'credit',
        'title', case when delta > 0 then '+' || delta || ' credits' else delta || ' credits' end,
        'body', reason
      ) from (
        select * from public.credit_transactions
        where user_id = p_user_id
        order by created_at desc limit 30
      ) ct

      union all

      -- Support tickets
      select jsonb_build_object(
        'ts', created_at, 'type', 'support', 'icon', 'ticket',
        'title', 'Support #' || ticket_number || ': ' || subject,
        'body', status || ' · ' || category
      ) from public.support_tickets where user_id = p_user_id

      union all

      -- Generations (last 20)
      select jsonb_build_object(
        'ts', created_at, 'type', 'generation', 'icon', 'ai',
        'title', coalesce(agent_type, agent_slug, agent, 'AI') || ' generation',
        'body', status
      ) from (
        select * from public.generations
        where user_id = p_user_id
        order by created_at desc limit 20
      ) gen

      limit p_limit
    ) events
  );
exception
  when undefined_table or undefined_column then
    return '[]'::jsonb;
end;
$$;

revoke all on function public.customer_timeline(uuid, int) from public;
grant execute on function public.customer_timeline(uuid, int) to authenticated, service_role;
