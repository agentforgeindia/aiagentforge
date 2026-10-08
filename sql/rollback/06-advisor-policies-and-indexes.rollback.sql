-- Rollback for sql/pending/06-advisor-policies-and-indexes.sql
-- Puts every rule back exactly as it was after migrations 00–05 and
-- re-creates the two duplicate indexes. Generated together with 06.
-- Run in the Supabase SQL editor (one transaction).

begin;

-- academy_tasks
drop policy if exists "academy_tasks: select" on public."academy_tasks";
drop policy if exists "academy_tasks: insert" on public."academy_tasks";
drop policy if exists "academy_tasks: update" on public."academy_tasks";
drop policy if exists "academy_tasks: delete" on public."academy_tasks";
create policy "Academy tasks admin manage" on public."academy_tasks" as permissive for all to authenticated
  using ((has_permission('hr.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('hr.manage'::text) OR has_permission('*'::text)));
create policy "Academy tasks admin read" on public."academy_tasks" as permissive for select to authenticated
  using ((has_permission('hr.view'::text) OR has_permission('hr.manage'::text) OR has_permission('*'::text)));

-- admin_notification_reads
alter policy "notification_reads own only" on public."admin_notification_reads"
  using (((reader_email IS NOT NULL) AND (lower(reader_email) = lower(COALESCE(( SELECT u.email
   FROM auth.users u
  WHERE (u.id = auth.uid())), (''::character varying)::text)))))
  with check (((reader_email IS NOT NULL) AND (lower(reader_email) = lower(COALESCE(( SELECT u.email
   FROM auth.users u
  WHERE (u.id = auth.uid())), (''::character varying)::text)))));

-- admin_roles
drop policy if exists "admin_roles: select" on public."admin_roles";
drop policy if exists "admin_roles: insert" on public."admin_roles";
drop policy if exists "admin_roles: update" on public."admin_roles";
drop policy if exists "admin_roles: delete" on public."admin_roles";
create policy "admin_roles read by admins" on public."admin_roles" as permissive for select to authenticated
  using (is_admin());
create policy "admin_roles write founder only" on public."admin_roles" as permissive for all to authenticated
  using (has_permission('team.edit_role'::text))
  with check (has_permission('team.edit_role'::text));

-- admin_training_progress
alter policy "training own insert" on public."admin_training_progress"
  with check ((lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))));
alter policy "training own select" on public."admin_training_progress"
  using ((lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))));
alter policy "training own update" on public."admin_training_progress"
  using ((lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))))
  with check ((lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))));

-- admin_users
drop policy if exists "admin_users: select" on public."admin_users";
drop policy if exists "admin_users: insert" on public."admin_users";
drop policy if exists "admin_users: update" on public."admin_users";
drop policy if exists "admin_users: delete" on public."admin_users";
create policy "Admin users can read own row" on public."admin_users" as permissive for select to authenticated
  using ((lower(email) = lower((auth.jwt() ->> 'email'::text))));
create policy "admin_users admin read" on public."admin_users" as permissive for select to authenticated
  using (is_admin());
create policy "admin_users write by team" on public."admin_users" as permissive for all to authenticated
  using (has_permission('team.add'::text))
  with check (has_permission('team.add'::text));

-- affiliate_payouts
drop policy if exists "affiliate_payouts: select" on public."affiliate_payouts";
drop policy if exists "affiliate_payouts: insert" on public."affiliate_payouts";
drop policy if exists "affiliate_payouts: update" on public."affiliate_payouts";
drop policy if exists "affiliate_payouts: delete" on public."affiliate_payouts";
create policy "affpay read" on public."affiliate_payouts" as permissive for select to authenticated
  using ((has_permission('affiliates.view'::text) OR has_permission('*'::text)));
create policy "affpay write" on public."affiliate_payouts" as permissive for all to authenticated
  using ((has_permission('affiliates.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('affiliates.manage'::text) OR has_permission('*'::text)));

-- affiliate_referrals
drop policy if exists "affiliate_referrals: select" on public."affiliate_referrals";
drop policy if exists "affiliate_referrals: insert" on public."affiliate_referrals";
drop policy if exists "affiliate_referrals: update" on public."affiliate_referrals";
drop policy if exists "affiliate_referrals: delete" on public."affiliate_referrals";
create policy "affref read" on public."affiliate_referrals" as permissive for select to authenticated
  using ((has_permission('affiliates.view'::text) OR has_permission('*'::text)));
create policy "affref write" on public."affiliate_referrals" as permissive for all to authenticated
  using ((has_permission('affiliates.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('affiliates.manage'::text) OR has_permission('*'::text)));

-- affiliates
drop policy if exists "affiliates: select" on public."affiliates";
drop policy if exists "affiliates: insert" on public."affiliates";
drop policy if exists "affiliates: update" on public."affiliates";
drop policy if exists "affiliates: delete" on public."affiliates";
create policy "aff read" on public."affiliates" as permissive for select to authenticated
  using ((has_permission('affiliates.view'::text) OR has_permission('*'::text)));
create policy "aff write" on public."affiliates" as permissive for all to authenticated
  using ((has_permission('affiliates.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('affiliates.manage'::text) OR has_permission('*'::text)));

-- agent_costs
drop policy if exists "agent_costs: select" on public."agent_costs";
drop policy if exists "agent_costs: insert" on public."agent_costs";
drop policy if exists "agent_costs: update" on public."agent_costs";
drop policy if exists "agent_costs: delete" on public."agent_costs";
create policy "agent_costs read" on public."agent_costs" as permissive for select to authenticated
  using (has_permission('ai_costs.view'::text));
create policy "agent_costs write" on public."agent_costs" as permissive for all to authenticated
  using (has_permission('ai_costs.edit'::text))
  with check (has_permission('ai_costs.edit'::text));

-- ai_cost_settings
drop policy if exists "ai_cost_settings: select" on public."ai_cost_settings";
drop policy if exists "ai_cost_settings: insert" on public."ai_cost_settings";
drop policy if exists "ai_cost_settings: update" on public."ai_cost_settings";
drop policy if exists "ai_cost_settings: delete" on public."ai_cost_settings";
create policy "ai_cost_settings read" on public."ai_cost_settings" as permissive for select to authenticated
  using (has_permission('ai_costs.view'::text));
create policy "ai_cost_settings write" on public."ai_cost_settings" as permissive for all to authenticated
  using (has_permission('ai_costs.edit'::text))
  with check (has_permission('ai_costs.edit'::text));

-- attendance_breaks
drop policy if exists "attendance_breaks: select" on public."attendance_breaks";
drop policy if exists "attendance_breaks: insert" on public."attendance_breaks";
drop policy if exists "attendance_breaks: update" on public."attendance_breaks";
drop policy if exists "attendance_breaks: delete" on public."attendance_breaks";
create policy "breaks admin" on public."attendance_breaks" as permissive for select to authenticated
  using ((has_permission('team.view'::text) OR has_permission('*'::text)));
create policy "breaks own" on public."attendance_breaks" as permissive for all to authenticated
  using ((lower(member_email) = lower((auth.jwt() ->> 'email'::text))))
  with check ((lower(member_email) = lower((auth.jwt() ->> 'email'::text))));

-- attendance_logs
drop policy if exists "attendance_logs: select" on public."attendance_logs";
drop policy if exists "attendance_logs: insert" on public."attendance_logs";
drop policy if exists "attendance_logs: update" on public."attendance_logs";
drop policy if exists "attendance_logs: delete" on public."attendance_logs";
create policy "attendance admin" on public."attendance_logs" as permissive for select to authenticated
  using (has_permission('team.view'::text));
create policy "attendance own" on public."attendance_logs" as permissive for all to authenticated
  using ((lower(member_email) = lower((auth.jwt() ->> 'email'::text))))
  with check ((lower(member_email) = lower((auth.jwt() ->> 'email'::text))));

-- automation_rules
drop policy if exists "automation_rules: select" on public."automation_rules";
drop policy if exists "automation_rules: insert" on public."automation_rules";
drop policy if exists "automation_rules: update" on public."automation_rules";
drop policy if exists "automation_rules: delete" on public."automation_rules";
create policy "automation read" on public."automation_rules" as permissive for select to authenticated
  using (has_permission('settings.view'::text));
create policy "automation write" on public."automation_rules" as permissive for all to authenticated
  using (has_permission('settings.manage'::text))
  with check (has_permission('settings.manage'::text));

-- bulk_jobs
alter policy "bulk_jobs owner only" on public."bulk_jobs"
  using ((auth.uid() = user_id))
  with check ((auth.uid() = user_id));

-- caller_reports
drop policy if exists "caller_reports: select" on public."caller_reports";
drop policy if exists "caller_reports: insert" on public."caller_reports";
drop policy if exists "caller_reports: update" on public."caller_reports";
drop policy if exists "caller_reports: delete" on public."caller_reports";
create policy "cr admin" on public."caller_reports" as permissive for select to authenticated
  using ((has_permission('team.view'::text) OR has_permission('*'::text)));
create policy "cr own" on public."caller_reports" as permissive for all to authenticated
  using ((lower(caller_email) = lower((auth.jwt() ->> 'email'::text))))
  with check ((lower(caller_email) = lower((auth.jwt() ->> 'email'::text))));

-- candidates
drop policy if exists "candidates: select" on public."candidates";
drop policy if exists "candidates: insert (visitors)" on public."candidates";
drop policy if exists "candidates: insert (signed-in)" on public."candidates";
drop policy if exists "candidates: update" on public."candidates";
drop policy if exists "candidates: delete" on public."candidates";
create policy "cand apply" on public."candidates" as permissive for insert to anon
  with check (((name IS NOT NULL) AND (email IS NOT NULL)));
create policy "cand read" on public."candidates" as permissive for select to authenticated
  using ((has_permission('hr.view'::text) OR has_permission('*'::text)));
create policy "cand write" on public."candidates" as permissive for all to authenticated
  using ((has_permission('hr.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('hr.manage'::text) OR has_permission('*'::text)));

-- commission_rules
drop policy if exists "commission_rules: select" on public."commission_rules";
drop policy if exists "commission_rules: insert" on public."commission_rules";
drop policy if exists "commission_rules: update" on public."commission_rules";
drop policy if exists "commission_rules: delete" on public."commission_rules";
create policy "commission_rules read" on public."commission_rules" as permissive for select to authenticated
  using (has_permission('incentives.view'::text));
create policy "commission_rules write" on public."commission_rules" as permissive for all to authenticated
  using (has_permission('incentives.manage'::text))
  with check (has_permission('incentives.manage'::text));

-- credit_transactions
drop policy if exists "credit_transactions: select" on public."credit_transactions";
create policy "Users read own credit tx" on public."credit_transactions" as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "credit_tx admin read" on public."credit_transactions" as permissive for select to authenticated
  using (is_admin());
create policy "credit_tx own read" on public."credit_transactions" as permissive for select to authenticated
  using ((auth.uid() = user_id));

-- deals
drop policy if exists "deals: select" on public."deals";
drop policy if exists "deals: insert" on public."deals";
drop policy if exists "deals: update" on public."deals";
drop policy if exists "deals: delete" on public."deals";
create policy "deals read" on public."deals" as permissive for select to authenticated
  using (has_permission('leads.view'::text));
create policy "deals write" on public."deals" as permissive for all to authenticated
  using (has_permission('leads.add'::text))
  with check (has_permission('leads.add'::text));

-- email_templates
drop policy if exists "email_templates: select" on public."email_templates";
drop policy if exists "email_templates: insert" on public."email_templates";
drop policy if exists "email_templates: update" on public."email_templates";
drop policy if exists "email_templates: delete" on public."email_templates";
create policy "email_templates read by admins" on public."email_templates" as permissive for select to authenticated
  using (has_permission('email.view'::text));
create policy "email_templates write by editors" on public."email_templates" as permissive for all to authenticated
  using (has_permission('email.edit'::text))
  with check (has_permission('email.edit'::text));

-- error_logs
drop policy if exists "error_logs: select" on public."error_logs";
drop policy if exists "error_logs: insert" on public."error_logs";
drop policy if exists "error_logs: update" on public."error_logs";
drop policy if exists "error_logs: delete" on public."error_logs";
create policy "errors read" on public."error_logs" as permissive for select to authenticated
  using ((has_permission('audit.view'::text) OR has_permission('*'::text)));
create policy "errors write" on public."error_logs" as permissive for all to authenticated
  using (has_permission('*'::text))
  with check (has_permission('*'::text));

-- feedback
alter policy "Users can insert own feedback" on public."feedback"
  with check ((auth.uid() = user_id));
alter policy "Users can read own feedback" on public."feedback"
  using ((auth.uid() = user_id));

-- finance_expenses
drop policy if exists "finance_expenses: select" on public."finance_expenses";
drop policy if exists "finance_expenses: insert" on public."finance_expenses";
drop policy if exists "finance_expenses: update" on public."finance_expenses";
drop policy if exists "finance_expenses: delete" on public."finance_expenses";
create policy "finance_expenses read" on public."finance_expenses" as permissive for select to authenticated
  using (has_permission('finance.view'::text));
create policy "finance_expenses write" on public."finance_expenses" as permissive for all to authenticated
  using (has_permission('finance.edit'::text))
  with check (has_permission('finance.edit'::text));

-- founder_goals
drop policy if exists "founder_goals: select" on public."founder_goals";
drop policy if exists "founder_goals: insert" on public."founder_goals";
drop policy if exists "founder_goals: update" on public."founder_goals";
drop policy if exists "founder_goals: delete" on public."founder_goals";
create policy "founder_goals read" on public."founder_goals" as permissive for select to authenticated
  using ((has_permission('*'::text) OR has_permission('dashboard.view'::text)));
create policy "founder_goals write" on public."founder_goals" as permissive for all to authenticated
  using (has_permission('*'::text))
  with check (has_permission('*'::text));

-- generations
drop policy if exists "generations: select" on public."generations";
create policy "Users can view own generations" on public."generations" as permissive for select to public
  using ((auth.uid() = user_id));
create policy "Users read own generations" on public."generations" as permissive for select to authenticated
  using ((auth.uid() = user_id));
alter policy "generations insert: server only (was: users can insert own)" on public."generations"
  with check ((auth.uid() = user_id));
alter policy "generations insert: server only (was: users insert own)" on public."generations"
  with check ((auth.uid() = user_id));

-- hr_employees
drop policy if exists "hr_employees: select" on public."hr_employees";
drop policy if exists "hr_employees: insert" on public."hr_employees";
drop policy if exists "hr_employees: update" on public."hr_employees";
drop policy if exists "hr_employees: delete" on public."hr_employees";
create policy "hr_employees read" on public."hr_employees" as permissive for select to authenticated
  using (has_permission('hr.view'::text));
create policy "hr_employees write" on public."hr_employees" as permissive for all to authenticated
  using (has_permission('hr.manage'::text))
  with check (has_permission('hr.manage'::text));

-- hr_leaves
drop policy if exists "hr_leaves: select" on public."hr_leaves";
drop policy if exists "hr_leaves: insert" on public."hr_leaves";
drop policy if exists "hr_leaves: update" on public."hr_leaves";
drop policy if exists "hr_leaves: delete" on public."hr_leaves";
create policy "hr_leaves read" on public."hr_leaves" as permissive for select to authenticated
  using (has_permission('hr.view'::text));
create policy "hr_leaves write" on public."hr_leaves" as permissive for all to authenticated
  using (has_permission('hr.manage'::text))
  with check (has_permission('hr.manage'::text));

-- hr_salary_records
drop policy if exists "hr_salary_records: select" on public."hr_salary_records";
drop policy if exists "hr_salary_records: insert" on public."hr_salary_records";
drop policy if exists "hr_salary_records: update" on public."hr_salary_records";
drop policy if exists "hr_salary_records: delete" on public."hr_salary_records";
create policy "hr_salary read" on public."hr_salary_records" as permissive for select to authenticated
  using (has_permission('hr.view'::text));
create policy "hr_salary write" on public."hr_salary_records" as permissive for all to authenticated
  using (has_permission('hr.manage'::text))
  with check (has_permission('hr.manage'::text));

-- invoices
drop policy if exists "invoices: select" on public."invoices";
drop policy if exists "invoices: insert" on public."invoices";
drop policy if exists "invoices: update" on public."invoices";
drop policy if exists "invoices: delete" on public."invoices";
create policy "invoices admin all" on public."invoices" as permissive for all to authenticated
  using (is_admin())
  with check (is_admin());
create policy "invoices own read" on public."invoices" as permissive for select to authenticated
  using ((auth.uid() = user_id));

-- kb_articles
drop policy if exists "kb_articles: select" on public."kb_articles";
drop policy if exists "kb_articles: insert" on public."kb_articles";
drop policy if exists "kb_articles: update" on public."kb_articles";
drop policy if exists "kb_articles: delete" on public."kb_articles";
create policy "kb_articles read" on public."kb_articles" as permissive for select to authenticated
  using (has_permission('kb.view'::text));
create policy "kb_articles write" on public."kb_articles" as permissive for all to authenticated
  using (has_permission('kb.manage'::text))
  with check (has_permission('kb.manage'::text));

-- member_badges
drop policy if exists "member_badges: select" on public."member_badges";
drop policy if exists "member_badges: insert" on public."member_badges";
drop policy if exists "member_badges: update" on public."member_badges";
drop policy if exists "member_badges: delete" on public."member_badges";
create policy "badges read" on public."member_badges" as permissive for select to authenticated
  using (has_permission('team.view'::text));
create policy "badges write" on public."member_badges" as permissive for all to authenticated
  using (has_permission('incentives.manage'::text))
  with check (has_permission('incentives.manage'::text));

-- payments
drop policy if exists "payments: select" on public."payments";
create policy "Users can view own payments" on public."payments" as permissive for select to authenticated
  using ((auth.uid() = user_id));
create policy "payments admin read" on public."payments" as permissive for select to authenticated
  using (is_admin());

-- posts
drop policy if exists "posts: select (visitors)" on public."posts";
drop policy if exists "posts: select (signed-in)" on public."posts";
drop policy if exists "posts: insert" on public."posts";
drop policy if exists "posts: update" on public."posts";
drop policy if exists "posts: delete" on public."posts";
create policy "posts admin read all" on public."posts" as permissive for select to authenticated
  using (is_admin());
create policy "posts admin write" on public."posts" as permissive for all to authenticated
  using (is_admin())
  with check (is_admin());
create policy "posts public read published" on public."posts" as permissive for select to anon, authenticated
  using ((status = 'published'::text));

-- profiles
drop policy if exists "profiles: select" on public."profiles";
drop policy if exists "profiles: insert" on public."profiles";
drop policy if exists "profiles: update" on public."profiles";
create policy "Users can insert own profile" on public."profiles" as permissive for insert to authenticated
  with check ((id = auth.uid()));
create policy "Users can read own profile" on public."profiles" as permissive for select to authenticated
  using ((id = auth.uid()));
create policy "Users can update own profile" on public."profiles" as permissive for update to authenticated
  using ((auth.uid() = id));
create policy "Users can view own profile" on public."profiles" as permissive for select to authenticated
  using ((auth.uid() = id));
create policy "profiles admin read" on public."profiles" as permissive for select to authenticated
  using (is_admin());

-- recruitment_questions
drop policy if exists "recruitment_questions: select" on public."recruitment_questions";
drop policy if exists "recruitment_questions: insert" on public."recruitment_questions";
drop policy if exists "recruitment_questions: update" on public."recruitment_questions";
drop policy if exists "recruitment_questions: delete" on public."recruitment_questions";
create policy "rq read" on public."recruitment_questions" as permissive for select to authenticated
  using ((has_permission('hr.view'::text) OR has_permission('*'::text)));
create policy "rq write" on public."recruitment_questions" as permissive for all to authenticated
  using ((has_permission('hr.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('hr.manage'::text) OR has_permission('*'::text)));

-- recruitment_roles
drop policy if exists "recruitment_roles: select" on public."recruitment_roles";
drop policy if exists "recruitment_roles: insert" on public."recruitment_roles";
drop policy if exists "recruitment_roles: update" on public."recruitment_roles";
drop policy if exists "recruitment_roles: delete" on public."recruitment_roles";
create policy "rec_roles read" on public."recruitment_roles" as permissive for select to public
  using (true);
create policy "rec_roles write" on public."recruitment_roles" as permissive for all to authenticated
  using ((has_permission('hr.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('hr.manage'::text) OR has_permission('*'::text)));

-- recruitment_training
drop policy if exists "recruitment_training: select" on public."recruitment_training";
drop policy if exists "recruitment_training: insert" on public."recruitment_training";
drop policy if exists "recruitment_training: update" on public."recruitment_training";
drop policy if exists "recruitment_training: delete" on public."recruitment_training";
create policy "training read" on public."recruitment_training" as permissive for select to public
  using (true);
create policy "training write" on public."recruitment_training" as permissive for all to authenticated
  using ((has_permission('hr.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('hr.manage'::text) OR has_permission('*'::text)));

-- referral_earnings
drop policy if exists "referral_earnings: select" on public."referral_earnings";
drop policy if exists "referral_earnings: insert" on public."referral_earnings";
drop policy if exists "referral_earnings: update" on public."referral_earnings";
drop policy if exists "referral_earnings: delete" on public."referral_earnings";
create policy "re_auth_write" on public."referral_earnings" as permissive for all to authenticated
  using ((has_permission('hr.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('hr.manage'::text) OR has_permission('*'::text)));
create policy "re_team_read" on public."referral_earnings" as permissive for select to authenticated
  using ((has_permission('finance.view'::text) OR has_permission('affiliates.view'::text) OR has_permission('marketing.view'::text) OR has_permission('hr.view'::text) OR has_permission('*'::text)));

-- referrals
alter policy "referrals own read" on public."referrals"
  using (((auth.uid() = referrer_id) OR (auth.uid() = referred_id) OR is_admin()));

-- refund_requests
drop policy if exists "refund_requests: select" on public."refund_requests";
drop policy if exists "refund_requests: insert" on public."refund_requests";
drop policy if exists "refund_requests: update" on public."refund_requests";
drop policy if exists "refund_requests: delete" on public."refund_requests";
create policy "refundreq read" on public."refund_requests" as permissive for select to authenticated
  using ((has_permission('invoices.refund'::text) OR has_permission('support.view'::text) OR has_permission('*'::text)));
create policy "refundreq write" on public."refund_requests" as permissive for all to authenticated
  using ((has_permission('invoices.refund'::text) OR has_permission('support.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('invoices.refund'::text) OR has_permission('support.manage'::text) OR has_permission('*'::text)));

-- sales_resources
drop policy if exists "sales_resources: select" on public."sales_resources";
drop policy if exists "sales_resources: insert" on public."sales_resources";
drop policy if exists "sales_resources: update" on public."sales_resources";
drop policy if exists "sales_resources: delete" on public."sales_resources";
create policy "resources read" on public."sales_resources" as permissive for select to authenticated
  using ((has_permission('leads.view'::text) OR has_permission('kb.view'::text) OR has_permission('*'::text)));
create policy "resources write" on public."sales_resources" as permissive for all to authenticated
  using ((has_permission('hr.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('hr.manage'::text) OR has_permission('*'::text)));

-- sales_targets
drop policy if exists "sales_targets: select" on public."sales_targets";
drop policy if exists "sales_targets: insert" on public."sales_targets";
drop policy if exists "sales_targets: update" on public."sales_targets";
drop policy if exists "sales_targets: delete" on public."sales_targets";
create policy "sales_targets read" on public."sales_targets" as permissive for select to authenticated
  using (has_permission('incentives.view'::text));
create policy "sales_targets write" on public."sales_targets" as permissive for all to authenticated
  using (has_permission('incentives.manage'::text))
  with check (has_permission('incentives.manage'::text));

-- social_designs
alter policy "social_designs service role only" on public."social_designs"
  using ((auth.role() = 'service_role'::text))
  with check ((auth.role() = 'service_role'::text));

-- support_tickets
drop policy if exists "support_tickets: select" on public."support_tickets";
drop policy if exists "support_tickets: insert (visitors)" on public."support_tickets";
drop policy if exists "support_tickets: insert (signed-in)" on public."support_tickets";
drop policy if exists "support_tickets: update" on public."support_tickets";
drop policy if exists "support_tickets: delete" on public."support_tickets";
create policy "support public submit" on public."support_tickets" as permissive for insert to anon, authenticated
  with check ((status = 'open'::text));
create policy "support_tickets admin" on public."support_tickets" as permissive for all to authenticated
  using (has_permission('support.view'::text))
  with check (has_permission('support.manage'::text));

-- system_settings
drop policy if exists "system_settings: select" on public."system_settings";
drop policy if exists "system_settings: insert" on public."system_settings";
drop policy if exists "system_settings: update" on public."system_settings";
drop policy if exists "system_settings: delete" on public."system_settings";
create policy "system_settings read" on public."system_settings" as permissive for select to authenticated
  using (has_permission('settings.view'::text));
create policy "system_settings write" on public."system_settings" as permissive for all to authenticated
  using (has_permission('settings.manage'::text))
  with check (has_permission('settings.manage'::text));

-- testimonials
drop policy if exists "testimonials: select (visitors)" on public."testimonials";
drop policy if exists "testimonials: select (signed-in)" on public."testimonials";
drop policy if exists "testimonials: insert (visitors)" on public."testimonials";
drop policy if exists "testimonials: insert (signed-in)" on public."testimonials";
drop policy if exists "testimonials: update" on public."testimonials";
drop policy if exists "testimonials: delete" on public."testimonials";
create policy "authenticated_insert" on public."testimonials" as permissive for insert to public
  with check (((auth.uid() = user_id) OR (user_id IS NULL)));
create policy "public_read_approved" on public."testimonials" as permissive for select to public
  using ((status = 'approved'::text));
create policy "testimonials admin manage" on public."testimonials" as permissive for all to authenticated
  using (is_admin())
  with check (is_admin());
create policy "testimonials admin read" on public."testimonials" as permissive for select to authenticated
  using (is_admin());
create policy "testimonials public read approved" on public."testimonials" as permissive for select to anon, authenticated
  using ((status = 'approved'::text));
create policy "testimonials public submit" on public."testimonials" as permissive for insert to anon, authenticated
  with check ((status = 'pending'::text));

-- user_notifications
alter policy "Users read own notifications" on public."user_notifications"
  using ((user_id = auth.uid()));
alter policy "Users update own notifications" on public."user_notifications"
  using ((user_id = auth.uid()));

-- whatsapp_broadcasts
drop policy if exists "whatsapp_broadcasts: select" on public."whatsapp_broadcasts";
drop policy if exists "whatsapp_broadcasts: insert" on public."whatsapp_broadcasts";
drop policy if exists "whatsapp_broadcasts: update" on public."whatsapp_broadcasts";
drop policy if exists "whatsapp_broadcasts: delete" on public."whatsapp_broadcasts";
create policy "wabc read" on public."whatsapp_broadcasts" as permissive for select to authenticated
  using ((has_permission('marketing.view'::text) OR has_permission('support.view'::text) OR has_permission('*'::text)));
create policy "wabc write" on public."whatsapp_broadcasts" as permissive for all to authenticated
  using ((has_permission('support.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('support.manage'::text) OR has_permission('*'::text)));

-- whatsapp_contacts
drop policy if exists "whatsapp_contacts: select" on public."whatsapp_contacts";
drop policy if exists "whatsapp_contacts: insert" on public."whatsapp_contacts";
drop policy if exists "whatsapp_contacts: update" on public."whatsapp_contacts";
drop policy if exists "whatsapp_contacts: delete" on public."whatsapp_contacts";
create policy "wac read" on public."whatsapp_contacts" as permissive for select to authenticated
  using ((has_permission('support.view'::text) OR has_permission('*'::text)));
create policy "wac write" on public."whatsapp_contacts" as permissive for all to authenticated
  using ((has_permission('support.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('support.manage'::text) OR has_permission('*'::text)));

-- whatsapp_messages
drop policy if exists "whatsapp_messages: select" on public."whatsapp_messages";
drop policy if exists "whatsapp_messages: insert" on public."whatsapp_messages";
drop policy if exists "whatsapp_messages: update" on public."whatsapp_messages";
drop policy if exists "whatsapp_messages: delete" on public."whatsapp_messages";
create policy "wa read" on public."whatsapp_messages" as permissive for select to authenticated
  using ((has_permission('support.view'::text) OR has_permission('*'::text)));
create policy "wa write" on public."whatsapp_messages" as permissive for all to authenticated
  using ((has_permission('support.manage'::text) OR has_permission('*'::text)))
  with check ((has_permission('support.manage'::text) OR has_permission('*'::text)));

-- workshop_reviews
drop policy if exists "workshop_reviews: select (visitors)" on public."workshop_reviews";
drop policy if exists "workshop_reviews: select (signed-in)" on public."workshop_reviews";
drop policy if exists "workshop_reviews: insert (visitors)" on public."workshop_reviews";
drop policy if exists "workshop_reviews: insert (signed-in)" on public."workshop_reviews";
drop policy if exists "workshop_reviews: update" on public."workshop_reviews";
drop policy if exists "workshop_reviews: delete" on public."workshop_reviews";
create policy "wreviews admin manage" on public."workshop_reviews" as permissive for all to authenticated
  using (is_admin())
  with check (is_admin());
create policy "wreviews admin read" on public."workshop_reviews" as permissive for select to authenticated
  using (is_admin());
create policy "wreviews public read approved" on public."workshop_reviews" as permissive for select to anon, authenticated
  using ((status = 'approved'::text));
create policy "wreviews public submit" on public."workshop_reviews" as permissive for insert to anon, authenticated
  with check ((status = 'pending'::text));

-- ── Duplicate indexes back ──────────────────────────────────────
create unique index if not exists feedback_user_generation_uniq
  on public.feedback (user_id, generation_id) where (generation_id is not null);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'unique_razorpay_payment_id') then
    alter table public.payments add constraint unique_razorpay_payment_id unique (razorpay_payment_id);
  end if;
end $$;

commit;
