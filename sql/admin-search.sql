-- ============================================================
-- AgentForge — Global admin search (Phase 2.3)
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Single function admin_search(query) returns a jsonb blob with
-- the top matches grouped by entity type:
--   customers (profiles), leads, payments, tasks
--
-- Permission-gated: each group is only included if the caller
-- holds the corresponding *.view permission (or the '*' wildcard).
--
-- Uses ILIKE on the most discriminating columns. Cheap enough
-- for a debounced palette query (200 ms throttle on the client).
-- For datasets > 100k rows, swap to full-text search later.
-- ============================================================

create or replace function public.admin_search(
  p_query text,
  p_limit int default 6
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pattern text;
  v_perms text[];
  v_can_customers boolean;
  v_can_leads     boolean;
  v_can_invoices  boolean;
  v_can_tasks     boolean;

  v_customers jsonb := '[]'::jsonb;
  v_leads     jsonb := '[]'::jsonb;
  v_payments  jsonb := '[]'::jsonb;
  v_tasks     jsonb := '[]'::jsonb;
begin
  -- Empty / too-short queries → empty result
  if p_query is null or length(trim(p_query)) < 1 then
    return jsonb_build_object(
      'customers', '[]'::jsonb,
      'leads',     '[]'::jsonb,
      'payments',  '[]'::jsonb,
      'tasks',     '[]'::jsonb
    );
  end if;
  v_pattern := '%' || trim(p_query) || '%';

  v_perms := coalesce(public.current_user_permissions(), '{}');
  v_can_customers := '*' = any(v_perms) or 'customers.view' = any(v_perms) or 'customers.*' = any(v_perms);
  v_can_leads     := '*' = any(v_perms) or 'leads.view'     = any(v_perms) or 'leads.*'     = any(v_perms);
  v_can_invoices  := '*' = any(v_perms) or 'invoices.view_all' = any(v_perms) or 'invoices.*' = any(v_perms) or 'payments.view_all' = any(v_perms);
  v_can_tasks     := '*' = any(v_perms) or 'tasks.view'     = any(v_perms) or 'tasks.*'     = any(v_perms);

  -- ──────── Customers (profiles) ────────
  if v_can_customers then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',       p.id,
      'name',     p.full_name,
      'email',    p.email,
      'plan',     p.plan,
      'credits',  p.credits,
      'health',   p.health_status
    ) order by p.updated_at desc nulls last), '[]'::jsonb)
    into v_customers
    from (
      select id, full_name, email, plan, credits, health_status, updated_at
        from public.profiles
       where email     ilike v_pattern
          or full_name ilike v_pattern
       order by updated_at desc nulls last
       limit p_limit
    ) p;
  end if;

  -- ──────── Leads ────────
  if v_can_leads then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',            l.id,
      'name',          l.name,
      'email',         l.email,
      'phone',         l.phone,
      'business_name', l.business_name,
      'source',        l.source,
      'status',        l.status
    ) order by l.updated_at desc nulls last), '[]'::jsonb)
    into v_leads
    from (
      select id, name, email, phone, business_name, source, status, updated_at
        from public.leads
       where name          ilike v_pattern
          or email         ilike v_pattern
          or phone         ilike v_pattern
          or business_name ilike v_pattern
          or city          ilike v_pattern
          or external_lead_id ilike v_pattern
       order by updated_at desc nulls last
       limit p_limit
    ) l;
  end if;

  -- ──────── Payments / Invoices ────────
  if v_can_invoices then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',           y.id,
      'user_id',      y.user_id,
      'plan',         y.plan,
      'amount',       y.amount,
      'status',       y.status,
      'buyer_name',   y.billing_name,
      'buyer_email',  y.billing_email,
      'razorpay_payment_id', y.razorpay_payment_id,
      'created_at',   y.created_at
    ) order by y.created_at desc), '[]'::jsonb)
    into v_payments
    from (
      select id, user_id, plan, amount, status, billing_name, billing_email,
             razorpay_payment_id, created_at
        from public.payments
       where billing_name        ilike v_pattern
          or billing_email       ilike v_pattern
          or billing_phone       ilike v_pattern
          or razorpay_payment_id ilike v_pattern
          or razorpay_order_id   ilike v_pattern
          or plan                ilike v_pattern
       order by created_at desc
       limit p_limit
    ) y;
  end if;

  -- ──────── Tasks ────────
  if v_can_tasks then
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',       t.id,
      'title',    t.title,
      'status',   t.status,
      'priority', t.priority,
      'assigned_to', t.assigned_to_email,
      'due_at',   t.due_at
    ) order by t.created_at desc), '[]'::jsonb)
    into v_tasks
    from (
      select id, title, status, priority, assigned_to_email, due_at, created_at
        from public.tasks
       where title             ilike v_pattern
          or description       ilike v_pattern
          or assigned_to_email ilike v_pattern
       order by created_at desc
       limit p_limit
    ) t;
  end if;

  return jsonb_build_object(
    'customers', v_customers,
    'leads',     v_leads,
    'payments',  v_payments,
    'tasks',     v_tasks
  );
end;
$$;

revoke all on function public.admin_search(text, int) from public;
grant execute on function public.admin_search(text, int) to authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- Verification (run while logged in as an admin):
--   select public.admin_search('bhavin');
--   select public.admin_search('9999');
-- ============================================================
