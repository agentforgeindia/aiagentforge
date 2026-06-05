-- ============================================================
-- AgentForge Learn & Earn Academy — Full Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Candidates ────────────────────────────────────────────
create table if not exists public.academy_candidates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  mobile        text not null,
  email         text,
  city          text,
  education     text,
  experience    text,
  available_hours text,
  status        text not null default 'applied',
  -- applied → assessment_pending → training → active → inactive | rejected
  job_category  text,
  -- telecaller | researcher | social_media | ai_operator | support
  assessment_score    int,
  assessment_total    int,
  assessment_pct      int generated always as (
    case when assessment_total > 0 then (assessment_score * 100 / assessment_total) else null end
  ) stored,
  assessment_done_at  timestamptz,
  training_started_at timestamptz,
  activated_at        timestamptz,
  notes               text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.academy_candidates enable row level security;
create policy "Service role full access" on public.academy_candidates for all using (true) with check (true);
-- anon can insert (registration)
create policy "Anon can register" on public.academy_candidates for insert to anon with check (true);

-- ── 2. MCQ Question Bank ─────────────────────────────────────
create table if not exists public.academy_questions (
  id          uuid primary key default gen_random_uuid(),
  topic       text not null,
  -- english | communication | computer | internet | ai | sales
  question    text not null,
  options     jsonb not null, -- ["opt A","opt B","opt C","opt D"]
  answer      int  not null,  -- 0-3 index of correct option
  difficulty  text default 'medium',
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table public.academy_questions enable row level security;
create policy "Anyone can read questions" on public.academy_questions for select using (active = true);
create policy "Service role full access" on public.academy_questions for all using (true) with check (true);

-- ── 3. Assessment Attempts ───────────────────────────────────
create table if not exists public.academy_assessments (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.academy_candidates(id) on delete cascade,
  answers       jsonb,   -- {question_id: chosen_index}
  score         int,
  total         int,
  time_taken    int,     -- seconds
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

alter table public.academy_assessments enable row level security;
create policy "Service role full access" on public.academy_assessments for all using (true) with check (true);
create policy "Anon can insert" on public.academy_assessments for insert to anon with check (true);

-- ── 4. Training Modules ──────────────────────────────────────
create table if not exists public.academy_modules (
  id          uuid primary key default gen_random_uuid(),
  number      int not null,
  title       text not null,
  description text,
  content     jsonb,   -- [{type:'heading'|'text'|'bullet', value:'...'}]
  quiz        jsonb,   -- [{question:'...', options:[...], answer:0}]
  duration_min int default 15,
  order_index  int,
  active      boolean default true
);

alter table public.academy_modules enable row level security;
create policy "Anyone can read modules" on public.academy_modules for select using (active = true);
create policy "Service role full access" on public.academy_modules for all using (true) with check (true);

-- ── 5. Candidate Training Progress ──────────────────────────
create table if not exists public.academy_progress (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.academy_candidates(id) on delete cascade,
  module_id     uuid references public.academy_modules(id),
  completed     boolean default false,
  completed_at  timestamptz,
  quiz_score    int,
  created_at    timestamptz default now(),
  unique(candidate_id, module_id)
);

alter table public.academy_progress enable row level security;
create policy "Service role full access" on public.academy_progress for all using (true) with check (true);
create policy "Anon can insert/update" on public.academy_progress for insert to anon with check (true);

-- ── 6. Work Tasks ────────────────────────────────────────────
create table if not exists public.academy_tasks (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.academy_candidates(id) on delete cascade,
  title         text not null,
  description   text,
  category      text,
  status        text default 'pending',
  -- pending | in_progress | completed | rejected
  due_date      date,
  completed_at  timestamptz,
  assigned_by   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.academy_tasks enable row level security;
create policy "Service role full access" on public.academy_tasks for all using (true) with check (true);

-- ── 7. Payroll ───────────────────────────────────────────────
create table if not exists public.academy_payroll (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.academy_candidates(id) on delete cascade,
  month         date not null,
  basic_salary  numeric default 5000,
  incentive     numeric default 0,
  deductions    numeric default 0,
  total_payable numeric generated always as (basic_salary + incentive - deductions) stored,
  status        text default 'pending', -- pending | paid
  paid_at       timestamptz,
  notes         text,
  created_at    timestamptz default now()
);

alter table public.academy_payroll enable row level security;
create policy "Service role full access" on public.academy_payroll for all using (true) with check (true);

-- ── 8. Updated_at triggers ───────────────────────────────────
create or replace function public.academy_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end$$;

create trigger academy_candidates_updated_at
  before update on public.academy_candidates
  for each row execute function public.academy_touch_updated_at();

create trigger academy_tasks_updated_at
  before update on public.academy_tasks
  for each row execute function public.academy_touch_updated_at();

-- ── 9. Admin RPC ─────────────────────────────────────────────
create or replace function public.academy_overview()
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  return jsonb_build_object(
    'total',       (select count(*) from public.academy_candidates),
    'applied',     (select count(*) from public.academy_candidates where status = 'applied'),
    'training',    (select count(*) from public.academy_candidates where status = 'training'),
    'active',      (select count(*) from public.academy_candidates where status = 'active'),
    'rejected',    (select count(*) from public.academy_candidates where status = 'rejected'),
    'avg_score',   (select round(avg(assessment_pct)) from public.academy_candidates where assessment_pct is not null),
    'payroll_pending', (select coalesce(sum(total_payable),0) from public.academy_payroll where status = 'pending')
  );
end$$;

revoke execute on function public.academy_overview() from anon;
grant  execute on function public.academy_overview() to authenticated, service_role;

-- ── 10. Seed: MCQ Questions ──────────────────────────────────
insert into public.academy_questions (topic, question, options, answer) values
-- English
('english', 'Which sentence is grammatically correct?',
 '["She go to market daily.", "She goes to market daily.", "She going to market daily.", "She gone to market daily."]', 1),
('english', 'Choose the correct spelling:',
 '["Recieve", "Receive", "Recive", "Receeve"]', 1),
('english', 'What is the synonym of "Happy"?',
 '["Sad", "Angry", "Joyful", "Tired"]', 2),
('english', 'Fill in the blank: I ___ working here since 2020.',
 '["am", "was", "have been", "had"]', 2),
('english', 'Which word is a noun?',
 '["Quickly", "Beautiful", "Freedom", "Run"]', 2),

-- Communication
('communication', 'When a customer is angry, what should you do first?',
 '["Argue back", "Hang up", "Listen patiently and apologise", "Transfer the call immediately"]', 2),
('communication', 'A good WhatsApp message to a lead should be:',
 '["Very long with all details", "Short, clear and with a CTA", "Full of emojis only", "Copied from internet"]', 1),
('communication', 'What does "follow up" mean in sales?',
 '["Calling a customer once and forgetting", "Contacting the customer again after initial conversation", "Sending a complaint", "Blocking the customer"]', 1),
('communication', 'Professional email subject line should be:',
 '["Hi!!!", "URGENT READ NOW", "Your Demo is Scheduled — AgentForge AI", "no subject"]', 2),
('communication', 'Best time to call a business owner is:',
 '["Late night 10 PM", "Early morning 6 AM", "Business hours 10 AM – 6 PM", "Lunch time only"]', 2),

-- Computer
('computer', 'What is a browser?',
 '["A software to send emails", "A software to access the internet", "An antivirus", "A word processor"]', 1),
('computer', 'Ctrl+C is used for:',
 '["Cut", "Copy", "Close", "Create"]', 1),
('computer', 'What does PDF stand for?',
 '["Portable Document Format", "Print Document File", "Personal Data Form", "Public Document File"]', 0),
('computer', 'Which of these is an email service?',
 '["Google Chrome", "Gmail", "WhatsApp", "YouTube"]', 1),
('computer', 'What is the use of Ctrl+Z?',
 '["Save file", "Close window", "Undo last action", "Zoom in"]', 2),

-- Internet
('internet', 'What does URL stand for?',
 '["Uniform Resource Locator", "Universal Reading Link", "Unique Reference Label", "User Resource Login"]', 0),
('internet', 'Which of these is NOT a social media platform?',
 '["Instagram", "Facebook", "Google Drive", "LinkedIn"]', 2),
('internet', 'HTTPS in a website URL means:',
 '["The site is fast", "The site is secure", "The site is free", "The site is Hindi"]', 1),
('internet', 'What is a Google Form used for?',
 '["Editing photos", "Collecting data/responses online", "Making videos", "Sending money"]', 1),
('internet', 'Cloud storage means:',
 '["Storing files on your desktop", "Storing files on internet servers", "Storing files on a pen drive", "Printing documents"]', 1),

-- AI Awareness
('ai', 'What is Artificial Intelligence?',
 '["A robot that looks like humans", "Technology that makes machines learn and make decisions", "A new social media app", "A type of computer virus"]', 1),
('ai', 'AgentForge AI is mainly used for:',
 '["Playing games", "Generating AI product images and mockups", "Sending emails", "Creating music"]', 1),
('ai', 'What can AI product photography help a business with?',
 '["Remove employees", "Create professional product images without a real photoshoot", "Hack competitors", "Print visiting cards"]', 1),
('ai', 'What is a prompt in AI tools?',
 '["A computer virus", "An instruction or description given to AI to generate output", "A type of camera", "A billing invoice"]', 1),
('ai', 'Which Indian industry can benefit most from AI mockup tools?',
 '["Mining", "Textile and fashion", "Agriculture only", "Real estate only"]', 1),

-- Sales Aptitude
('sales', 'What is a "lead" in sales?',
 '["A confirmed sale", "A potential customer who showed interest", "An employee", "A complaint"]', 1),
('sales', 'If a customer says "price is too high", you should:',
 '["Agree and reduce price immediately", "Hang up", "Explain the value and ROI of the product", "Argue about competitor price"]', 2),
('sales', 'What does CRM stand for?',
 '["Customer Relationship Management", "Cash Receipt Method", "Company Revenue Metric", "Customer Reward Module"]', 0),
('sales', 'Which is the best closing technique?',
 '["Pressure the customer to buy now", "Ask a trial-close question like Are you ready to proceed?", "Send invoice without confirmation", "Ignore follow-ups"]', 1),
('sales', 'A demo is most effective when:',
 '["It is very long and detailed", "It shows exactly how the product solves the customer problem", "It focuses only on price", "It is done without preparation"]', 1)
on conflict do nothing;

-- ── 11. Seed: Training Modules ───────────────────────────────
insert into public.academy_modules (number, title, description, duration_min, order_index, content) values
(1, 'AgentForge Introduction', 'Company, products aur mission samjho', 10, 1,
 '[
   {"type":"heading","value":"AgentForge kya hai?"},
   {"type":"text","value":"AgentForge AI India ka pehla AI Visual Studio hai jo textile, jewellery aur product businesses ke liye professional catalogue images banata hai — bina real photoshoot ke."},
   {"type":"heading","value":"Hamare Products"},
   {"type":"bullet","value":"Textile Mockup Generator — saree, kurti, kurta designs pe models"},
   {"type":"bullet","value":"Jewellery AI Studio — jewellery photoshoot AI se"},
   {"type":"bullet","value":"Productography AI — product photography in seconds"},
   {"type":"bullet","value":"Social Ads Generator — AI se social media ads"},
   {"type":"heading","value":"Hamara Mission"},
   {"type":"text","value":"Har Indian business ko affordable professional visuals dena — jo pehle sirf bade brands afford kar sakte the."}
 ]'),
(2, 'Communication Training', 'WhatsApp, Email aur Calling skills', 15, 2,
 '[
   {"type":"heading","value":"WhatsApp Communication"},
   {"type":"text","value":"WhatsApp pe professionally message karna bahut important hai. Short, clear aur friendly tone rakho."},
   {"type":"bullet","value":"Greeting se shuru karo — Namaste / Hello"},
   {"type":"bullet","value":"Apna naam aur company batao"},
   {"type":"bullet","value":"Clear CTA do — demo book karo / link click karo"},
   {"type":"heading","value":"Email Basics"},
   {"type":"text","value":"Professional email mein clear subject line, short body aur proper sign-off hona chahiye."},
   {"type":"heading","value":"Calling Tips"},
   {"type":"bullet","value":"Confident aur calm raho"},
   {"type":"bullet","value":"Customer ki baat sunno pehle"},
   {"type":"bullet","value":"Notes lo call ke dauran"}
 ]'),
(3, 'Lead Handling', 'Lead kya hoti hai aur kaise qualify karte hain', 15, 3,
 '[
   {"type":"heading","value":"Lead kya hoti hai?"},
   {"type":"text","value":"Koi bhi person ya business jisne humara product dekhne ya jaanने mein interest dikhaya ho woh ek lead hai."},
   {"type":"heading","value":"Lead Qualify Karna"},
   {"type":"bullet","value":"BANT framework: Budget, Authority, Need, Timeline"},
   {"type":"bullet","value":"Poochho: Kya aap online catalogue banate hain?"},
   {"type":"bullet","value":"Poochho: Kaun decision leta hai?"},
   {"type":"heading","value":"Lead Status"},
   {"type":"bullet","value":"New → Contacted → Interested → Demo Booked → Converted"},
   {"type":"text","value":"Har lead ka status CRM mein daily update karna zaroori hai."}
 ]'),
(4, 'AI Product Training', 'Textile, Jewellery aur Productography agents', 20, 4,
 '[
   {"type":"heading","value":"Textile Mockup Agent"},
   {"type":"text","value":"Customer upload karta hai unka fabric design — AI usse model pe pehna ke real-looking photos banata hai."},
   {"type":"heading","value":"Jewellery AI Studio"},
   {"type":"text","value":"Jewellery ki photo lo — AI usse professional background aur lighting pe place kar deta hai."},
   {"type":"heading","value":"Productography AI"},
   {"type":"text","value":"Product ki plain photo lo — AI professional studio shoot jaisi image banata hai 60 seconds mein."},
   {"type":"heading","value":"Demo Kaise Karte Hain"},
   {"type":"bullet","value":"Customer ko live screen share pe dikhao"},
   {"type":"bullet","value":"Unke khud ke product pe demo karo"},
   {"type":"bullet","value":"Before vs After dikhao"}
 ]'),
(5, 'CRM Training', 'Lead update, status aur follow up', 15, 5,
 '[
   {"type":"heading","value":"CRM kya hai?"},
   {"type":"text","value":"CRM yaani Customer Relationship Management — ek system jahan sab leads, calls aur follow-ups track hote hain."},
   {"type":"heading","value":"Lead Update karna"},
   {"type":"bullet","value":"Har call ke baad lead ka status update karo"},
   {"type":"bullet","value":"Notes mein conversation summary likho"},
   {"type":"bullet","value":"Next follow-up date set karo"},
   {"type":"heading","value":"Follow Up Tips"},
   {"type":"text","value":"80% sales 5th follow-up ke baad hoti hain. Follow up chhodna mat."},
   {"type":"bullet","value":"3 din ke andar pehla follow up"},
   {"type":"bullet","value":"Value-add message bhejo — tip ya case study"}
 ]'),
(6, 'Sales Basics', 'Objection handling, pricing aur demo booking', 20, 6,
 '[
   {"type":"heading","value":"Objection Handling"},
   {"type":"text","value":"Jab customer bolе yeh mehnga hai — toh seedha accept mat karo. Value explain karo."},
   {"type":"bullet","value":"Feel-Felt-Found technique: I understand how you feel. Others felt the same. But they found..."},
   {"type":"bullet","value":"ROI dikhao: Ek photoshoot mein kitna kharcha aur AgentForge mein kitna?"},
   {"type":"heading","value":"Pricing Discussion"},
   {"type":"text","value":"Price batane se pehle value build karo. Pehle problem, phir solution, phir price."},
   {"type":"heading","value":"Demo Booking"},
   {"type":"bullet","value":"Specific time do: Kal 3 baje ya 5 baje — aapko konsa time suit karta hai?"},
   {"type":"bullet","value":"Confirm karo: Main calendar pe set kar raha hun — aap confirmation ka wait karo"},
   {"type":"bullet","value":"Reminder bhejo: Demo se 30 min pehle WhatsApp karo"}
 ]')
on conflict do nothing;
