-- ============================================================
-- AgentForge — Knowledge Base (Phase 3+)
-- Run this in Supabase SQL Editor.
-- ============================================================

create table if not exists public.kb_articles (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (category in (
                'sales', 'support', 'operations', 'training', 'sop', 'other'
              )),
  title       text not null,
  content     text not null default '',
  tags        text[] not null default '{}',
  is_pinned   boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists kb_articles_category_idx on public.kb_articles (category, updated_at desc);

alter table public.kb_articles enable row level security;

drop policy if exists "kb_articles read"  on public.kb_articles;
drop policy if exists "kb_articles write" on public.kb_articles;

create policy "kb_articles read"
  on public.kb_articles for select to authenticated
  using (public.has_permission('kb.view'));

create policy "kb_articles write"
  on public.kb_articles for all to authenticated
  using (public.has_permission('kb.manage'))
  with check (public.has_permission('kb.manage'));

-- ── Permissions ─────────────────────────────────────────────
update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'kb.view', 'kb.manage'
   ])), updated_at = now()
 where id in ('founder', 'admin');

update public.admin_roles
   set permissions = array(select distinct unnest(permissions || ARRAY[
     'kb.view'
   ])), updated_at = now()
 where id in ('sales', 'support');

-- Seed starter articles
insert into public.kb_articles (category, title, content, is_pinned) values
(
  'sales',
  'Sales Script — Cold Call',
  E'## Opening\nHi, is this [Name]? Main AgentForge se bol raha hoon.\n\n## Problem Statement\nKya aap apne products ke liye professional photoshoots pe bahut zyada kharch karte hain?\n\n## Solution\nHamara AI aapke product photos ko 60 seconds mein catalogue-ready shoot mein convert karta hai.\n\n## Pricing Hook\nTraditional shoot ₹25,000+ — hamaara ₹1,999/month.\n\n## CTA\nKya main aapko 2 minute mein demo de sakta hoon?',
  true
),
(
  'support',
  'Refund SOP',
  E'## When to Refund\n- Generation failed and credits not returned\n- Duplicate payment\n- Technical issue on our end\n\n## When NOT to Refund\n- User did not like output (subjective)\n- Credits used and output delivered\n\n## Process\n1. Verify payment in Supabase\n2. Check generation status\n3. Go to Admin > Invoices > Refund\n4. Enter reason\n5. Confirm with customer via email',
  true
),
(
  'support',
  'Generation Issue SOP',
  E'## Common Issues\n\n### Image not generating\n1. Check credits balance\n2. Check n8n workflow status\n3. Check FAL API key validity\n4. Check generations table in Supabase for status\n\n### Slow generation\n1. Check FAL API status page\n2. Check n8n queue\n3. Inform user of delay\n\n### Wrong output\n1. Ask user to retry with different image\n2. Check prompt version in Agent Management',
  false
),
(
  'training',
  'AgentForge Admin Training',
  E'## Modules Overview\n\n### War Room\nDaily dashboard — revenue, signups, alerts\n\n### Customers\nAll registered users, plan status, credit balance\n\n### Leads\nInbound from Meta + Google ads, manual entry\n\n### AI Operations\nGeneration counts, failures, credits consumed\n\n### Credits\nPurchased vs consumed, top users, manual adjustments\n\n### Finance\nRevenue vs expenses, monthly P&L\n\n## Daily Checklist\n- [ ] Check War Room alerts\n- [ ] Review failed generations\n- [ ] Follow up on open leads\n- [ ] Check email queue status',
  true
),
(
  'sop',
  'Demo SOP',
  E'## Pre-Demo\n1. Send calendar invite\n2. Prepare sample images (textile/jewellery)\n3. Open AgentForge.in\n\n## During Demo\n1. Show homepage — explain 3 agents\n2. Upload sample image\n3. Generate output live\n4. Show pricing page\n5. Address objections\n\n## Post-Demo\n1. Send follow-up WhatsApp\n2. Create lead in CRM\n3. Set task for follow-up in 2 days',
  false
)
on conflict do nothing;
