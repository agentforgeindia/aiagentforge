-- ============================================================
-- AgentForge — Job Vacancies (openings + work type)
-- Run this in Supabase SQL Editor.
-- ============================================================

alter table public.recruitment_roles
  add column if not exists openings  int  not null default 0,
  add column if not exists work_type text not null default 'office',  -- wfh | office | remote | hybrid
  add column if not exists location  text;

-- Make sure HR role exists
insert into public.recruitment_roles (title, slug) values ('HR Executive','hr-executive')
on conflict (slug) do nothing;

-- ── Set openings + work type per role ────────────────────────
update public.recruitment_roles set openings = 50, work_type = 'wfh',    location = 'Work From Home (Pan India)' where slug = 'telecaller';
update public.recruitment_roles set openings = 4,  work_type = 'wfh',    location = 'Work From Home'             where slug = 'sales-executive';
update public.recruitment_roles set openings = 4,  work_type = 'wfh',    location = 'Work From Home'             where slug = 'support-executive';
update public.recruitment_roles set openings = 2,  work_type = 'hybrid', location = 'Hybrid'                     where slug = 'marketing-executive';
update public.recruitment_roles set openings = 2,  work_type = 'wfh',    location = 'Work From Home'             where slug = 'content-creator';
update public.recruitment_roles set openings = 2,  work_type = 'remote', location = 'Remote'                     where slug = 'ai-operator';
update public.recruitment_roles set openings = 2,  work_type = 'remote', location = 'Remote'                     where slug = 'designer';
update public.recruitment_roles set openings = 2,  work_type = 'remote', location = 'Remote'                     where slug = 'developer';
update public.recruitment_roles set openings = 1,  work_type = 'office', location = 'Office'                     where slug = 'hr-executive';

-- Only show roles with openings > 0 as open
update public.recruitment_roles set is_open = (openings > 0);
