-- ============================================================
-- AgentForge — Founder Daily Report
-- Run this in Supabase SQL Editor.
-- ============================================================
-- Adds a daily_report_metrics() function that the cron email
-- system calls nightly to send a summary to the founder.
-- ============================================================

create or replace function public.daily_report_metrics()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_today   date := current_date;
  v_yest    date := current_date - 1;
  v_w_start date := current_date - 7;
begin
  return jsonb_build_object(
    'date',              v_today,
    'revenue_today',     (select coalesce(sum(amount),0) from public.payments where status='paid' and created_at::date = v_today),
    'revenue_yesterday', (select coalesce(sum(amount),0) from public.payments where status='paid' and created_at::date = v_yest),
    'revenue_week',      (select coalesce(sum(amount),0) from public.payments where status='paid' and created_at::date >= v_w_start),
    'new_signups',       (select count(*) from public.profiles where created_at::date = v_today),
    'new_leads',         (select count(*) from public.leads where created_at::date = v_today),
    'paid_today',        (select count(*) from public.payments where status='paid' and created_at::date = v_today),
    'gens_today',        (select count(*) from public.generations where created_at::date = v_today),
    'failed_today',      (select count(*) from public.generations where status='failed' and created_at::date = v_today),
    'credits_used',      (select coalesce(abs(sum(delta)),0) from public.credit_transactions where delta < 0 and created_at::date = v_today),
    'open_tickets',      (select count(*) from public.support_tickets where status in ('open','in_progress')),
    'pending_followups', (select count(*) from public.leads where status = 'contacted'),
    'expiring_7d',       (select count(*) from public.profiles where plan_expires_at between now() and now() + interval '7 days'),
    'top_agent',         (
      select case when reason like '%jewellery%' then 'Jewellery AI'
                  when reason like '%textile%'   then 'Textile AI'
                  when reason like '%productograph%' then 'Productography AI'
                  else split_part(reason,'_',1) end
      from public.credit_transactions
      where delta < 0 and created_at::date = v_today
      group by 1 order by count(*) desc limit 1
    )
  );
exception when others then
  return jsonb_build_object('error', sqlerrm);
end;
$$;

revoke all on function public.daily_report_metrics() from public;
grant execute on function public.daily_report_metrics() to authenticated, service_role;

-- ── Email template for daily report ─────────────────────────
insert into public.email_templates (slug, subject, html_body, plain_body, enabled)
values (
  'daily_report',
  'AgentForge Daily Report — {{date}}',
  '<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc">
<div style="background:white;border-radius:12px;padding:24px;border:1px solid #e2e8f0">
  <h1 style="color:#1e293b;font-size:20px;margin:0 0 4px">📊 AgentForge Daily Report</h1>
  <p style="color:#64748b;font-size:13px;margin:0 0 20px">{{date}}</p>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:#f1f5f9"><td style="padding:10px;font-weight:bold;color:#334155">💰 Revenue Today</td><td style="padding:10px;text-align:right;font-size:18px;font-weight:bold;color:#16a34a">₹{{revenue_today}}</td></tr>
    <tr><td style="padding:10px;color:#475569">📈 Revenue This Week</td><td style="padding:10px;text-align:right;font-weight:bold">₹{{revenue_week}}</td></tr>
    <tr style="background:#f1f5f9"><td style="padding:10px;color:#475569">👤 New Signups</td><td style="padding:10px;text-align:right;font-weight:bold">{{new_signups}}</td></tr>
    <tr><td style="padding:10px;color:#475569">🎯 New Leads</td><td style="padding:10px;text-align:right;font-weight:bold">{{new_leads}}</td></tr>
    <tr style="background:#f1f5f9"><td style="padding:10px;color:#475569">💳 Paid Today</td><td style="padding:10px;text-align:right;font-weight:bold;color:#16a34a">{{paid_today}}</td></tr>
    <tr><td style="padding:10px;color:#475569">🤖 AI Generations</td><td style="padding:10px;text-align:right;font-weight:bold">{{gens_today}}</td></tr>
    <tr style="background:#f1f5f9"><td style="padding:10px;color:#475569">❌ Failed Generations</td><td style="padding:10px;text-align:right;font-weight:bold;color:{{failed_color}}">{{failed_today}}</td></tr>
    <tr><td style="padding:10px;color:#475569">💎 Credits Used</td><td style="padding:10px;text-align:right;font-weight:bold">{{credits_used}}</td></tr>
    <tr style="background:#f1f5f9"><td style="padding:10px;color:#475569">🎫 Open Support Tickets</td><td style="padding:10px;text-align:right;font-weight:bold">{{open_tickets}}</td></tr>
    <tr><td style="padding:10px;color:#475569">📞 Pending Followups</td><td style="padding:10px;text-align:right;font-weight:bold">{{pending_followups}}</td></tr>
    <tr style="background:#f1f5f9"><td style="padding:10px;color:#475569">⏰ Renewals Due 7d</td><td style="padding:10px;text-align:right;font-weight:bold;color:#d97706">{{expiring_7d}}</td></tr>
    <tr><td style="padding:10px;color:#475569">🏆 Top Agent Today</td><td style="padding:10px;text-align:right;font-weight:bold">{{top_agent}}</td></tr>
  </table>
  <div style="margin-top:20px;text-align:center">
    <a href="https://aiagentforge.in/admin/dashboard" style="background:#4f46e5;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px">Open War Room →</a>
  </div>
</div>
</body></html>',
  'AgentForge Daily Report - {{date}}
Revenue Today: Rs {{revenue_today}}
New Signups: {{new_signups}}
New Leads: {{new_leads}}
AI Generations: {{gens_today}}
Open War Room: https://aiagentforge.in/admin/dashboard',
  true
)
on conflict (slug) do update set
  subject   = excluded.subject,
  html_body = excluded.html_body,
  enabled   = true;
