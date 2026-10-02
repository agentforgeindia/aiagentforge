// ============================================================
// Backend training — lesson content (English + Hinglish).
// ============================================================
// One "basics" lesson for everyone + one lesson per hub in
// adminHubs.tsx. A member only sees lessons for hubs their role
// can open, so the course is automatically role-wise.
// Each lesson: intro, steps, tips, and a short quiz. Passing the
// quiz (all answers right) marks the lesson complete.
// ============================================================

import { HUBS, type Hub, type L } from "../adminHubs";

export type QuizQ = { q: L; options: L[]; correct: number; why: L };
export type Lesson = {
  key: string;
  /** Hub key from adminHubs — null = for everyone. */
  hub: string | null;
  title: L;
  minutes: number;
  intro: L;
  steps: L[];
  tips?: L[];
  quiz: QuizQ[];
};

const l = (en: string, hi: string): L => ({ en, hi });

export const LESSONS: Lesson[] = [
  // ───────────────────────── Basics (everyone) ─────────────────────────
  {
    key: "basics", hub: null, minutes: 4,
    title: l("Backend basics — start here", "Backend basics — yahan se shuru karo"),
    intro: l(
      "How the admin panel works: checking in, finding modules, tabs, pins, search, language and notifications.",
      "Admin panel kaise chalta hai: check in, module dhoondhna, tabs, pin, search, language aur notifications.",
    ),
    steps: [
      l("Check in first. Until you check in, every page shows the check-in screen — no work can be done. On a lunch/tea break the panel locks again until you tap 'End break'.",
        "Sabse pehle Check in karo. Check in ke bina har page par check-in screen aayegi — koi kaam nahi hoga. Lunch/tea break par panel phir lock hota hai, 'Break khatam karo' dabane tak."),
      l("If you are inactive for 10+ minutes you are checked out automatically. Check in again and give a short reason — it goes to your TL.",
        "10+ minute koi activity na ho to auto check-out ho jata hai. Dobara check in karo aur chhota reason likho — wo TL ko jata hai."),
      l("The left sidebar shows only the modules your role can use. Related screens are grouped — open one and switch with the tabs at the top of the page.",
        "Left sidebar mein sirf wahi modules dikhte hain jo aapka role use kar sakta hai. Milte-julte screens ek saath hain — ek kholo aur page ke upar tabs se switch karo."),
      l("Type in 'Find a module…' (sidebar) or use 'Search anything' / Ctrl+K in the top bar to jump anywhere fast.",
        "Sidebar ke 'Module dhoondo…' mein likho, ya top bar ka 'Search' / Ctrl+K use karo — kahin bhi turant pahunch jaoge."),
      l("Hover a module and tap ☆ to pin it. Pinned modules stay at the top of the sidebar and on the home page.",
        "Module par mouse le jao aur ☆ dabao — wo pin ho jayega aur sidebar ke upar + home par dikhega."),
      l("Use the EN | Hinglish switch in the top bar to change the panel language. The 🔔 bell shows new notifications — opening it marks them read.",
        "Top bar ke EN | Hinglish button se language badlo. 🔔 bell mein nayi notifications aati hain — kholte hi read ho jati hain."),
      l("At the end of the day open the timer (top bar) and tap 'Check Out' with a note of what you did.",
        "Din ke end mein top bar ka timer kholo aur kya kaam kiya likh kar 'Check Out' dabao."),
    ],
    tips: [
      l("Lost? Go to Home (logo, top-left) — it lists everything you can open.", "Raasta bhool gaye? Logo (upar left) dabao — Home par aapke saare modules hain."),
    ],
    quiz: [
      { q: l("You opened the panel but every page shows a check-in screen. What do you do?", "Panel khola par har page par check-in screen aa rahi hai. Kya karoge?"),
        options: [l("Refresh until it goes away", "Refresh karte raho"), l("Ask the founder for a new password", "Founder se naya password maango"), l("Check in — the panel unlocks after that", "Check in karo — uske baad panel khul jayega"), l("Use a different browser", "Dusra browser use karo")],
        correct: 2, why: l("The panel is locked until you check in.", "Check in ke bina panel lock rehta hai.") },
      { q: l("Where do you switch between related screens of one module (e.g. Workshop registrations and reviews)?", "Ek module ke related screens (jaise Workshop registration aur reviews) ke beech kaise switch karoge?"),
        options: [l("Tabs at the top of the page", "Page ke upar wale tabs se"), l("Settings page", "Settings page se"), l("Notification bell", "Notification bell se"), l("Only by typing the URL", "Sirf URL type karke")],
        correct: 0, why: l("Related screens are grouped as tabs on top of the page.", "Related screens page ke upar tabs mein hote hain.") },
    ],
  },

  // ───────────────────────── Overview ─────────────────────────
  {
    key: "dashboard", hub: "dashboard", minutes: 3,
    title: l("Dashboards", "Dashboards"),
    intro: l("Three views of the business: Founder (cash & goals), War Room (today's tasks, hot leads, alerts) and CRM (pipeline, win rate, team performance).",
      "Business ke teen view: Founder (cash aur goals), War Room (aaj ke tasks, hot leads, alerts) aur CRM (pipeline, win rate, team performance)."),
    steps: [
      l("Start your day in War Room: overdue tasks are red, hot leads at the top must be called today.", "Din War Room se shuru karo: overdue tasks laal hain, upar wale hot leads aaj hi call karne hain."),
      l("CRM tab shows the pipeline donut, won-value trend and each member's performance.", "CRM tab mein pipeline, jeete hue deals ka trend aur har member ki performance dikhti hai."),
      l("Founder tab (founder only): live revenue, cash-in-bank and monthly targets — use 'Set Targets' to update goals.", "Founder tab (sirf founder): live revenue, bank cash aur monthly target — 'Set Targets' se goal badlo."),
    ],
    quiz: [
      { q: l("Which tab tells you which tasks are overdue today?", "Aaj ke overdue tasks kis tab mein dikhte hain?"),
        options: [l("CRM", "CRM"), l("Founder", "Founder"), l("Logs", "Logs"), l("War Room", "War Room")],
        correct: 3, why: l("War Room highlights overdue tasks in red.", "War Room overdue tasks ko laal mein dikhata hai.") },
    ],
  },
  {
    key: "announcements", hub: "announcements", minutes: 2,
    title: l("Announcements", "Announcements"),
    intro: l("Post updates that appear in every user's 🔔 notification bell on the website.", "Update post karo jo website par har user ki 🔔 bell mein dikhega."),
    steps: [
      l("Write a short title and message — keep it one clear point.", "Chhota title aur message likho — ek hi clear baat."),
      l("Add a link if users should open a page (offer, new agent, workshop).", "Agar user ko koi page kholna hai (offer, naya agent, workshop) to link daalo."),
      l("Publish, then watch the 'Seen rate' to know how many users read it.", "Publish karo, phir 'Seen rate' se dekho kitne users ne padha."),
    ],
    quiz: [
      { q: l("Where do users see an announcement?", "User announcement kahan dekhte hain?"),
        options: [l("In their notification bell", "Apni notification bell mein"), l("Only by email", "Sirf email mein"), l("On WhatsApp", "WhatsApp par"), l("In the admin panel only", "Sirf admin panel mein")],
        correct: 0, why: l("Announcements show in every user's notification bell.", "Announcement har user ki notification bell mein aata hai.") },
    ],
  },
  {
    key: "approvals", hub: "approvals", minutes: 2,
    title: l("Approvals", "Approvals"),
    intro: l("Any discount, refund or expense needs approval. Team raises a request, a manager approves or rejects it.", "Har discount, refund ya expense ke liye approval chahiye. Team request daalti hai, manager approve ya reject karta hai."),
    steps: [
      l("Tap 'New Request', choose the type (discount / refund / expense) and enter the amount and reason.", "'New Request' dabao, type chuno (discount / refund / expense), amount aur reason likho."),
      l("Managers open the Pending tab and Approve or Reject with a note.", "Manager Pending tab kholte hain aur note ke saath Approve ya Reject karte hain."),
      l("Never give a discount or refund to a customer before it is approved here.", "Yahan approve hone se pehle customer ko koi discount ya refund mat do."),
    ],
    quiz: [
      { q: l("A customer asks for an extra discount. What is the right first step?", "Customer extra discount maang raha hai. Pehla sahi step kya hai?"),
        options: [l("Give it and tell the founder later", "De do, founder ko baad mein batao"), l("Raise an Approval request", "Approval request daalo"), l("Refuse straight away", "Seedha mana kar do"), l("Change the plan price in Settings", "Settings mein plan price badal do")],
        correct: 1, why: l("Discounts must be approved first.", "Discount pehle approve hona zaroori hai.") },
    ],
  },

  // ───────────────────────── Sales ─────────────────────────
  {
    key: "leads", hub: "leads", minutes: 4,
    title: l("Leads", "Leads"),
    intro: l("Everyone who showed interest but hasn't paid yet. Website forms, ads and demo requests land here automatically.",
      "Jinhone interest dikhaya par abhi pay nahi kiya. Website form, ads aur demo requests yahan apne aap aate hain."),
    steps: [
      l("Open a lead to see contact details, source and history.", "Lead kholo — contact, source aur history dikhegi."),
      l("After every call update the status in order: New → Contacted → Demo Sent → Hot Lead → Paid / Lost.", "Har call ke baad status update karo: New → Contacted → Demo Sent → Hot Lead → Paid / Lost."),
      l("Always add a note after the call (what they said, next step) so anyone can continue.", "Call ke baad hamesha note likho (customer ne kya kaha, agla step) taaki koi bhi aage badha sake."),
      l("Use '+ New lead' (top bar) to add a lead you got from a call or walk-in.", "Call ya walk-in se mila lead top bar ke '+ Naya lead' se add karo."),
    ],
    quiz: [
      { q: l("You just finished a call with a lead. What must you always do?", "Lead se call khatam hui. Hamesha kya karna hai?"),
        options: [l("Delete the lead", "Lead delete karo"), l("Nothing, remember it", "Kuch nahi, yaad rakh lo"), l("Send them an invoice", "Invoice bhej do"), l("Update the status and add a note", "Status update karo aur note likho")],
        correct: 3, why: l("Status + note keep the whole team in sync.", "Status aur note se poori team ko pata rehta hai.") },
      { q: l("What does a lead mean?", "Lead ka matlab kya hai?"),
        options: [l("Someone interested who hasn't paid yet", "Jo interested hai par abhi pay nahi kiya"), l("A paying customer", "Paise dene wala customer"), l("A team member", "Team member"), l("A failed payment", "Failed payment")],
        correct: 0, why: l("Once they pay they become a customer.", "Pay karne ke baad wo customer ban jata hai.") },
    ],
  },
  {
    key: "customers", hub: "customers", minutes: 3,
    title: l("Customers", "Customers"),
    intro: l("All signed-up users — plan, credits, usage and contact details.", "Saare signup users — plan, credits, usage aur contact."),
    steps: [
      l("Search by name, email or phone.", "Naam, email ya phone se search karo."),
      l("Open a customer to see generation history, payments and notes.", "Customer kholo — generation history, payments aur notes dikhenge."),
      l("Credit top-ups and refunds need approval — don't promise them before that.", "Credit top-up aur refund ke liye approval chahiye — usse pehle promise mat karo."),
    ],
    quiz: [
      { q: l("A customer says their generation failed. Where do you check first?", "Customer bolta hai generation fail hui. Pehle kahan check karoge?"),
        options: [l("Finance", "Finance"), l("Their customer page → generation history", "Uske customer page → generation history"), l("Announcements", "Announcements"), l("Hiring", "Hiring")],
        correct: 1, why: l("The customer page shows every generation and its status.", "Customer page par har generation aur uska status dikhta hai.") },
    ],
  },
  {
    key: "tasks", hub: "tasks", minutes: 2,
    title: l("Tasks", "Tasks"),
    intro: l("Your to-do list: follow-ups, demos, payment reminders — each with an owner and a due date.", "Aapki to-do list: follow-up, demo, payment reminder — har ek ka owner aur due date."),
    steps: [
      l("Create a task, link it to a lead/customer, assign it and set a due date.", "Task banao, lead/customer se jodo, assign karo aur due date daalo."),
      l("Overdue tasks show as alerts in the War Room — finish or reschedule them.", "Overdue tasks War Room mein alert banke dikhte hain — poora karo ya date badlo."),
      l("Mark the task done as soon as it is finished.", "Kaam hote hi task ko done mark karo."),
    ],
    quiz: [
      { q: l("What happens if you miss a task's due date?", "Task ki due date nikal gayi to kya hota hai?"),
        options: [l("It is deleted", "Delete ho jata hai"), l("Nothing", "Kuch nahi"), l("It shows as an overdue alert in War Room", "War Room mein overdue alert dikhta hai"), l("The customer gets an email", "Customer ko email jata hai")],
        correct: 2, why: l("Overdue tasks surface in the War Room.", "Overdue tasks War Room mein dikhte hain.") },
    ],
  },
  {
    key: "sales-team", hub: "sales-team", minutes: 4,
    title: l("Sales Floor", "Sales Floor"),
    intro: l("The calling team's home: who to call now, daily reports, rankings and incentives.", "Calling team ka ghar: abhi kise call karna hai, daily report, ranking aur incentive."),
    steps: [
      l("Calling Queue: call 🔥 hot leads first, tap 'Call', then save the outcome — the lead status updates itself.", "Calling Queue: pehle 🔥 hot leads ko call karo, 'Call' dabao, phir outcome save karo — lead status apne aap update hota hai."),
      l("Caller Reports: at day end fill calls, demos, hot leads and paid, then 'Save My Report'.", "Caller Report: din ke end mein calls, demo, hot leads aur paid bharo, phir 'Save My Report'."),
      l("Sales Room & Leaderboard: see team ranks, kudos and badges. Incentives: your monthly target and commission progress.", "Sales Room aur Leaderboard: team ranking, kudos aur badges. Incentive: aapka monthly target aur commission."),
    ],
    quiz: [
      { q: l("Which leads should you call first in the Calling Queue?", "Calling Queue mein pehle kin leads ko call karna hai?"),
        options: [l("The oldest ones", "Sabse purane"), l("Random", "Koi bhi"), l("Only lost leads", "Sirf lost leads"), l("🔥 Hot leads", "🔥 Hot leads")],
        correct: 3, why: l("Hot leads have the highest chance to convert.", "Hot leads ke convert hone ka chance sabse zyada hai.") },
      { q: l("When do you fill the Caller Report?", "Caller Report kab bharni hai?"),
        options: [l("At the end of every working day", "Har working din ke end mein"), l("Once a month", "Mahine mein ek baar"), l("Only when the founder asks", "Jab founder bole tab"), l("Never — it fills itself", "Kabhi nahi — apne aap bharti hai")],
        correct: 0, why: l("Daily numbers are logged every day.", "Daily numbers roz bharne hote hain.") },
    ],
  },
  {
    key: "meetings", hub: "meetings", minutes: 3,
    title: l("Meetings & Demos", "Meetings aur Demo"),
    intro: l("Zoom meetings and 'Book a Customize Demo' requests from the website.", "Zoom meetings aur website se aaye 'Customize Demo' requests."),
    steps: [
      l("Meetings: tap 'Schedule Zoom Meeting' to book a call; all admin and self-booked meetings are listed.", "Meetings: 'Schedule Zoom Meeting' se call book karo; saari meetings yahan list hoti hain."),
      l("Demo Requests: build the customer's demo, send it on WhatsApp (use 'Copy' for the message).", "Demo Requests: customer ka demo banao, WhatsApp par bhejo ('Copy' se message lo)."),
      l("Then tap 'Mark demo sent' — the number moves into the Leads pipeline automatically.", "Phir 'Mark demo sent' dabao — number apne aap Leads pipeline mein chala jata hai."),
    ],
    quiz: [
      { q: l("You sent a demo on WhatsApp. What next?", "WhatsApp par demo bhej diya. Ab kya?"),
        options: [l("Delete the request", "Request delete karo"), l("Tap 'Mark demo sent'", "'Mark demo sent' dabao"), l("Create an invoice", "Invoice banao"), l("Nothing", "Kuch nahi")],
        correct: 1, why: l("It records the demo and moves the number to Leads.", "Isse demo record hota hai aur number Leads mein jata hai.") },
    ],
  },
  {
    key: "workshop", hub: "workshop", minutes: 4,
    title: l("Workshop", "Workshop"),
    intro: l("Everything about the paid workshop: registrations, failed payments, certificates, survey and reviews.", "Paid workshop ka sab kuch: registration, failed payment, certificate, survey aur reviews."),
    steps: [
      l("Registrations: paid attendees (from Razorpay). Filter by date, 'Mark joined' when they join the community, download CSV.", "Registration: pay kiye attendees (Razorpay se). Date se filter karo, community join karein to 'Mark joined', CSV download karo."),
      l("Failed Payments: people whose ₹99 payment failed — one click resends the correct date's payment page on WhatsApp.", "Failed Payment: jinka ₹99 payment fail hua — ek click se sahi date ka payment page WhatsApp par dobara jata hai."),
      l("Certificates: who downloaded a certificate. Survey: preferred day/time for the next batch.", "Certificate: kisne certificate download kiya. Survey: agle batch ke liye pasand ka din/time."),
      l("Reviews: Approve good reviews — approved ones show on the public workshop page.", "Reviews: achhe reviews Approve karo — wo public workshop page par dikhte hain."),
    ],
    quiz: [
      { q: l("Someone's ₹99 payment failed. What do you do?", "Kisi ka ₹99 payment fail ho gaya. Kya karoge?"),
        options: [l("Ask them to register again from scratch", "Unhe shuru se register karne bolo"), l("Mark them joined", "Unhe joined mark karo"), l("Resend the payment page from Failed Payments", "Failed Payment tab se payment page dobara bhejo"), l("Approve their review", "Unka review approve karo")],
        correct: 2, why: l("Failed Payments resends the right payment page in one click.", "Failed Payment tab ek click mein sahi payment page bhejta hai.") },
    ],
  },

  // ───────────────────────── Marketing ─────────────────────────
  {
    key: "marketing", hub: "marketing", minutes: 3,
    title: l("Marketing & Analytics", "Marketing aur Analytics"),
    intro: l("Where leads come from and how campaigns perform — plus Meta/GA4/Clarity and the Meta Conversions API log.",
      "Leads kahan se aa rahe hain aur campaign kaise chal rahe hain — saath mein Meta/GA4/Clarity aur Meta CAPI log."),
    steps: [
      l("Lead Sources: compare channels (Meta / Google / organic) and the daily leads trend.", "Lead Source: channels compare karo (Meta / Google / organic) aur roz ke leads ka trend dekho."),
      l("Analytics: ad spend, clicks and CTR for the last 7 days; buttons open each platform.", "Analytics: pichhle 7 din ka ad spend, clicks aur CTR; buttons se har platform khulta hai."),
      l("Meta CAPI: every Purchase/Lead event sent to Meta and whether it was accepted — check here if ad tracking looks wrong.", "Meta CAPI: Meta ko bheje gaye har Purchase/Lead event aur wo accept hua ya nahi — ad tracking galat lage to yahan dekho."),
    ],
    quiz: [
      { q: l("Ads show fewer purchases than real sales. Where do you check?", "Ads mein purchase asli sales se kam dikh rahe hain. Kahan check karoge?"),
        options: [l("Meta CAPI tab", "Meta CAPI tab"), l("Workshop Reviews", "Workshop Reviews"), l("Tasks", "Tasks"), l("HR", "HR")],
        correct: 0, why: l("Meta CAPI shows every event sent to Meta and its status.", "Meta CAPI mein Meta ko bheja har event aur uska status dikhta hai.") },
    ],
  },
  {
    key: "email", hub: "email", minutes: 2,
    title: l("Email", "Email"),
    intro: l("Automated email templates, the send queue and test sends.", "Automatic email template, send queue aur test send."),
    steps: [
      l("Templates: edit subject and body; save (needs edit permission).", "Templates: subject aur body edit karo; save karo (edit permission chahiye)."),
      l("Queue: last 50 emails with status — filter Failed to catch problems.", "Queue: aakhri 50 email aur status — Failed filter karke dikkat pakdo."),
      l("Always 'Send test' to yourself before changing a live template.", "Live template badalne se pehle hamesha khud ko 'Send test' karo."),
    ],
    quiz: [
      { q: l("Before changing a live email template you should…", "Live email template badalne se pehle…"),
        options: [l("Delete the old one", "Purana delete karo"), l("Tell customers", "Customers ko batao"), l("Change the queue", "Queue badlo"), l("Send a test to yourself", "Khud ko test bhejo")],
        correct: 3, why: l("A test send shows exactly what customers will get.", "Test se pata chalta hai customer ko kya milega.") },
    ],
  },
  {
    key: "influencers", hub: "influencers", minutes: 3,
    title: l("Influencers", "Influencers"),
    intro: l("Creator profiles, video approvals, scripts and creator payout requests.", "Creator profile, video approval, script aur creator payout requests."),
    steps: [
      l("Creators: review applications and videos — Approve, Reject or 'Pin to top'.", "Creators: application aur video dekho — Approve, Reject ya 'Pin to top'."),
      l("Use 'New Script' → 'Publish Script' to give creators a ready script.", "'New Script' → 'Publish Script' se creators ko ready script do."),
      l("Withdrawals: check the creator's earnings, then pay (UPI) or reject with a reason.", "Withdrawal: creator ki earning check karo, phir pay (UPI) ya reason ke saath reject karo."),
    ],
    quiz: [
      { q: l("Where do you give creators a ready-made script?", "Creators ko ready script kahan se doge?"),
        options: [l("Email tab", "Email tab"), l("New Script in Creators", "Creators mein New Script"), l("Withdrawals", "Withdrawal"), l("Announcements", "Announcements")],
        correct: 1, why: l("Scripts are created and published from the Creators tab.", "Script Creators tab se banti aur publish hoti hai.") },
    ],
  },
  {
    key: "affiliates", hub: "affiliates", minutes: 2,
    title: l("Affiliates", "Affiliates"),
    intro: l("Referral partners — each gets a link and earns commission on sales they bring.", "Referral partner — har ek ko link milta hai aur unki laayi sale par commission."),
    steps: [
      l("Add a partner with name, email and commission rate.", "Naam, email aur commission rate ke saath partner add karo."),
      l("Share their unique referral link.", "Unka unique referral link share karo."),
      l("Track referred signups and commission payouts here.", "Referral se aaye signup aur commission payout yahan dekho."),
    ],
    quiz: [
      { q: l("How does an affiliate earn?", "Affiliate kaise kamata hai?"),
        options: [l("Fixed salary", "Fixed salary"), l("Per check-in", "Har check-in par"), l("Commission on sales from their link", "Unke link se hui sale par commission"), l("Per blog post", "Har blog post par")],
        correct: 2, why: l("Commission is paid on sales through their link.", "Link se hui sale par commission milta hai.") },
    ],
  },
  {
    key: "content", hub: "content", minutes: 2,
    title: l("Content", "Content"),
    intro: l("Blog/news posts and the testimonials shown on the homepage.", "Blog/news post aur homepage par dikhne wale testimonials."),
    steps: [
      l("Posts: create, save as Draft, then Publish when ready.", "Posts: banao, Draft save karo, ready hone par Publish karo."),
      l("Testimonials: new reviews arrive as Pending — Approve to show them on the homepage.", "Testimonials: naye review Pending mein aate hain — Approve karo to homepage par dikhenge."),
    ],
    quiz: [
      { q: l("A review is in Pending. Is it on the homepage?", "Review Pending mein hai. Kya wo homepage par hai?"),
        options: [l("No — only after you Approve it", "Nahi — Approve karne ke baad hi"), l("Yes, always", "Haan, hamesha"), l("Only on mobile", "Sirf mobile par"), l("Only for founders", "Sirf founder ko")],
        correct: 0, why: l("Only approved reviews go live.", "Sirf approved review live hote hain.") },
    ],
  },

  // ───────────────────────── Finance ─────────────────────────
  {
    key: "finance", hub: "finance", minutes: 3,
    title: l("Finance", "Finance"),
    intro: l("Revenue minus expenses = net profit.", "Revenue minus kharcha = net profit."),
    steps: [
      l("'Add Expense' for manual costs (salary, hosting, tools).", "Manual kharche (salary, hosting, tools) ke liye 'Add Expense'."),
      l("'Sync Costs' pulls Meta Ads and AI API costs automatically.", "'Sync Costs' Meta Ads aur AI API ka kharcha apne aap laata hai."),
      l("'Revenue by Agent' shows which AI agent earns the most.", "'Revenue by Agent' batata hai kaunsa AI agent sabse zyada kama raha hai."),
    ],
    quiz: [
      { q: l("How do you add this month's hosting bill?", "Is mahine ka hosting bill kaise jodoge?"),
        options: [l("Sync Costs", "Sync Costs"), l("Approvals", "Approvals"), l("Invoices", "Invoices"), l("Add Expense", "Add Expense")],
        correct: 3, why: l("Manual costs go in with Add Expense.", "Manual kharcha Add Expense se judta hai.") },
    ],
  },
  {
    key: "billing", hub: "billing", minutes: 3,
    title: l("Billing", "Billing"),
    intro: l("Every invoice, every subscription's expiry, and every credit movement.", "Har invoice, har subscription ki expiry aur credits ka har len-den."),
    steps: [
      l("Invoices: search by email/plan and open any bill.", "Invoices: email/plan se search karo aur koi bhi bill kholo."),
      l("Subscriptions: 'Expiring this week' is your renewal call list — create a renewal task or extend +30 days.", "Subscriptions: 'Expiring this week' renewal ki call list hai — renewal task banao ya +30 din extend karo."),
      l("Credits: the ledger is like a bank statement; Manual Adjustment adds credits (approval first).", "Credits: ledger bank statement jaisa hai; Manual Adjustment se credit judta hai (pehle approval)."),
      l("Android app payments come through Google Play, not Razorpay — their payment id starts with 'gplay:'. To refund one, refund it in Google Play Console first, then record it here with the 'Manual' option (never 'Via Razorpay').", "Android app ke andar hui payment Google Play se aati hai, Razorpay se nahi — uski payment id 'gplay:' se shuru hoti hai. Aisi payment ka refund pehle Google Play Console se karo, phir yahan 'Manual' option se record karo ('Via Razorpay' kabhi nahi)."),
    ],
    quiz: [
      { q: l("Where do you find customers to call for renewal?", "Renewal ke liye kise call karna hai, kahan milega?"),
        options: [l("Subscriptions → Expiring this week", "Subscriptions → Expiring this week"), l("Invoices", "Invoices"), l("Credits ledger", "Credits ledger"), l("Logs", "Logs")],
        correct: 0, why: l("That bucket lists plans about to expire.", "Usme jaldi expire hone wale plan hote hain.") },
      { q: l("A payment id starts with 'gplay:'. How do you refund it?", "Kisi payment ki id 'gplay:' se shuru hoti hai. Uska refund kaise karoge?"),
        options: [l("Choose 'Via Razorpay'", "'Via Razorpay' chuno"), l("Delete the payment row", "Payment row delete kar do"), l("Refund in Google Play Console, then record it as 'Manual'", "Google Play Console se refund karo, phir 'Manual' se record karo"), l("It cannot be refunded", "Iska refund nahi ho sakta")],
        correct: 2, why: l("It was paid through Google Play, so the money goes back from there.", "Payment Google Play se hui thi, isliye paise wahin se wapas jate hain.") },
    ],
  },

  // ───────────────────────── AI ─────────────────────────
  {
    key: "agents", hub: "agents", minutes: 2,
    title: l("Agents", "Agents"),
    intro: l("Turn AI agents on/off, set credits per generation and prompt versions.", "AI agent on/off, har generation ke credits aur prompt version."),
    steps: [
      l("Toggle 'Enabled' off to hide an agent from all users.", "'Enabled' off karo to agent sab users se chhup jayega."),
      l("Set 'Credits Per Generation' to change the price per use.", "'Credits Per Generation' se har use ki keemat badlo."),
      l("Always tap 'Save Changes'.", "Hamesha 'Save Changes' dabao."),
    ],
    quiz: [
      { q: l("You changed an agent's credits. What must you do so it applies?", "Agent ke credits badle. Lagu karne ke liye kya karna hai?"),
        options: [l("Refresh the page", "Page refresh"), l("Tap Save Changes", "Save Changes dabao"), l("Log out", "Log out"), l("Nothing", "Kuch nahi")],
        correct: 1, why: l("Changes apply only after saving.", "Save karne ke baad hi lagu hota hai.") },
    ],
  },
  {
    key: "ai-usage", hub: "ai-usage", minutes: 3,
    title: l("AI Usage & Costs", "AI Usage aur Cost"),
    intro: l("Health of AI generations, every single generation, and what they cost us.", "AI generations ki health, har generation ka record aur hamara kharcha."),
    steps: [
      l("Overview: 🟢/🟡/🔴 health per agent and failed jobs — check daily.", "Overview: har agent ki 🟢/🟡/🔴 health aur failed jobs — roz check karo."),
      l("Generation Log: filter by agent or status to investigate a customer complaint.", "Generation Log: customer complaint ke liye agent ya status se filter karo."),
      l("Costs: API spend per agent and margin per customer.", "Cost: har agent ka API kharcha aur har customer ka margin."),
    ],
    quiz: [
      { q: l("An agent shows 🔴. What does it mean?", "Kisi agent par 🔴 hai. Matlab?"),
        options: [l("It is the most popular", "Sabse popular hai"), l("It is free today", "Aaj free hai"), l("It has problems — check failed jobs", "Dikkat hai — failed jobs check karo"), l("It is archived", "Archive ho gaya")],
        correct: 2, why: l("Red health means failures — investigate.", "Laal matlab failure — jaanch karo.") },
    ],
  },
  {
    key: "assistants", hub: "assistants", minutes: 3,
    title: l("AI Assistants", "AI Assistant"),
    intro: l("AI helpers for calls, questions and message drafts.", "Call, sawal aur message draft ke liye AI helper."),
    steps: [
      l("Caller GPT: type what the customer said/objected → get a ready reply to speak naturally.", "Caller GPT: customer ne jo kaha/objection likho → bolne ke liye ready jawab milega."),
      l("Team Assistant: ask anything about products, process or training.", "Team Assistant: product, process ya training ke baare mein kuch bhi poocho."),
      l("Drafts & Coaching: paste a call transcript for a summary, call notes for coaching, or a customer message for a WhatsApp reply.", "Draft aur Coaching: call transcript daalo summary ke liye, notes daalo coaching ke liye, ya customer message daalo WhatsApp reply ke liye."),
    ],
    quiz: [
      { q: l("During a call the customer says “it's too expensive”. Which tool helps right now?", "Call par customer bolta hai “bahut mehenga hai”. Abhi kaunsa tool madad karega?"),
        options: [l("Generation Log", "Generation Log"), l("Finance", "Finance"), l("Approvals", "Approvals"), l("Caller GPT", "Caller GPT")],
        correct: 3, why: l("Caller GPT gives instant objection replies.", "Caller GPT turant objection ka jawab deta hai.") },
    ],
  },

  // ───────────────────────── Team & Support ─────────────────────────
  {
    key: "support", hub: "support", minutes: 3,
    title: l("Support", "Support"),
    intro: l("Customer problems: tickets, WhatsApp chats, refunds and disputes.", "Customer ki dikkatein: tickets, WhatsApp chat, refund aur dispute."),
    steps: [
      l("Tickets: 'New Ticket' with priority; move Open → In Progress → Resolved.", "Tickets: priority ke saath 'New Ticket'; Open → In Progress → Resolved karo."),
      l("WhatsApp: pick a chat; AI drafts a reply — check/edit it, then Send.", "WhatsApp: chat chuno; AI reply draft karta hai — check/edit karke Send."),
      l("Refunds: log the request → approve → 'Mark Processed' after money is returned.", "Refund: request daalo → approve → paise wapas jane ke baad 'Mark Processed'."),
    ],
    quiz: [
      { q: l("When do you tap 'Mark Processed' on a refund?", "Refund par 'Mark Processed' kab dabana hai?"),
        options: [l("After the money has actually been returned", "Jab paise sach mein wapas chale jayein"), l("As soon as the customer asks", "Customer ke maangte hi"), l("Before approval", "Approval se pehle"), l("Never", "Kabhi nahi")],
        correct: 0, why: l("Processed = money returned.", "Processed matlab paise wapas ho gaye.") },
    ],
  },
  {
    key: "team", hub: "team", minutes: 3,
    title: l("Team", "Team"),
    intro: l("Admin members and roles, attendance, role access and HR.", "Admin members aur roles, attendance, role access aur HR."),
    steps: [
      l("Members: add a person and choose a role — the role decides what they can see and do. Deactivate to remove access immediately.", "Members: insaan add karo aur role chuno — role tay karta hai wo kya dekh/kar sakta hai. Deactivate karte hi access band."),
      l("Attendance: who is online now, daily check-ins and monthly hours.", "Attendance: abhi kaun online hai, roz ke check-in aur mahine ke ghante."),
      l("Role Access (founder): exactly which features each role gets. HR: employees, leaves, salary.", "Role Access (founder): har role ko kaun se features milte hain. HR: employees, leave, salary."),
    ],
    quiz: [
      { q: l("What decides which modules a member sees?", "Member ko kaun se modules dikhenge, ye kya tay karta hai?"),
        options: [l("Their check-in time", "Unka check-in time"), l("Their role", "Unka role"), l("Their language setting", "Unki language setting"), l("Their pinned modules", "Unke pinned modules")],
        correct: 1, why: l("Permissions come from the role.", "Permissions role se aati hain.") },
    ],
  },
  {
    key: "hiring", hub: "hiring", minutes: 3,
    title: l("Hiring", "Hiring"),
    intro: l("No-resume hiring: candidates apply, take an MCQ test and get scored automatically. Plus the Learn & Earn Academy.",
      "Bina resume hiring: candidate apply karte hain, MCQ test dete hain aur apne aap score milta hai. Saath mein Learn & Earn Academy."),
    steps: [
      l("Candidates: move each person through the stages (Applied → Hired); add scores and salary.", "Candidates: har insaan ko stage mein aage badhao (Applied → Hired); score aur salary daalo."),
      l("Questions: add MCQs with 4 options and click the green circle on the correct one — keep correct answers spread across A/B/C/D.", "Questions: 4 option wale MCQ daalo aur sahi wale par green circle dabao — sahi answer A/B/C/D mein mix rakho."),
      l("Academy: WFH candidates — registration, training, assessment.", "Academy: WFH candidates — registration, training, assessment."),
    ],
    quiz: [
      { q: l("Why spread correct answers across A, B, C and D?", "Sahi answer A, B, C, D mein mix kyun rakhte hain?"),
        options: [l("It looks nicer", "Achha dikhta hai"), l("The system requires it", "System ki zaroorat hai"), l("So candidates can't guess one letter", "Taaki candidate ek hi letter guess na kar sake"), l("No reason", "Koi reason nahi")],
        correct: 2, why: l("A pattern would let candidates pass without knowing.", "Pattern ho to bina jaane bhi pass ho jayenge.") },
    ],
  },
  {
    key: "help", hub: "help", minutes: 2,
    title: l("Help & Resources", "Help aur Resources"),
    intro: l("Your role's rules, the knowledge base (SOPs, scripts) and ready WhatsApp templates & links.", "Aapke role ke rules, knowledge base (SOP, script) aur ready WhatsApp template aur links."),
    steps: [
      l("Rules & Help: read your role's rules, commission and escalation contact.", "Rules aur Help: apne role ke rules, commission aur escalation contact padho."),
      l("Knowledge Base: filter by category and read SOPs and sales scripts.", "Knowledge Base: category se filter karo, SOP aur sales script padho."),
      l("Templates & Links: pick a template, Copy, paste in WhatsApp and personalise the name.", "Template aur Links: template chuno, Copy karo, WhatsApp mein paste karke naam badlo."),
    ],
    quiz: [
      { q: l("You need the standard follow-up WhatsApp message. Where?", "Standard follow-up WhatsApp message chahiye. Kahan milega?"),
        options: [l("Templates & Links", "Template aur Links"), l("Finance", "Finance"), l("Logs", "Logs"), l("Agents", "Agents")],
        correct: 0, why: l("All ready messages are in Templates & Links.", "Saare ready messages Template aur Links mein hain.") },
    ],
  },

  // ───────────────────────── System ─────────────────────────
  {
    key: "settings", hub: "settings", minutes: 3,
    title: l("Settings", "Settings"),
    intro: l("Company info and plan prices, connection status of outside services, and if-then automation rules.", "Company info aur plan price, bahar ki services ka connection status, aur if-then automation rules."),
    steps: [
      l("General: change a value (a • marks unsaved fields) then 'Save All'.", "General: value badlo (• matlab unsaved) phir 'Save All'."),
      l("Integrations: 🟢 connected, 🔴 broken — check here first when something stops working.", "Integrations: 🟢 connected, 🔴 kharab — kuch band ho to pehle yahan dekho."),
      l("Automation: 'New Rule' → choose a trigger → add actions → enable.", "Automation: 'New Rule' → trigger chuno → action jodo → enable karo."),
    ],
    quiz: [
      { q: l("Payments suddenly stop working. Where do you look first?", "Payment achanak band ho gaya. Pehle kahan dekhoge?"),
        options: [l("Content", "Content"), l("Integrations", "Integrations"), l("Leaderboard", "Leaderboard"), l("Announcements", "Announcements")],
        correct: 1, why: l("Integrations shows if Razorpay etc. are connected.", "Integrations batata hai Razorpay wagairah connected hai ya nahi.") },
    ],
  },
  {
    key: "logs", hub: "logs", minutes: 2,
    title: l("Logs", "Logs"),
    intro: l("System errors and the audit trail of sensitive actions (refunds, role changes, edits).", "System errors aur sensitive actions (refund, role change, edit) ka audit record."),
    steps: [
      l("Errors: focus on unresolved (red) ones; Payment errors first; tap 'Resolve' once fixed.", "Errors: unresolved (laal) pe dhyan; pehle Payment errors; theek hone par 'Resolve'."),
      l("Audit Log: who did what and when — open a row for full details.", "Audit Log: kisne kya aur kab kiya — poori detail ke liye row kholo."),
    ],
    quiz: [
      { q: l("Which errors should be handled first?", "Sabse pehle kaunse errors theek karne hain?"),
        options: [l("Oldest ones", "Sabse purane"), l("Resolved ones", "Jo resolve ho chuke"), l("Any", "Koi bhi"), l("Payment errors", "Payment errors")],
        correct: 3, why: l("Payment errors directly lose money.", "Payment errors se seedha paisa jata hai.") },
    ],
  },
];

// ── Safety net: every hub always has a lesson ──────────────────
// If a new module hub is added to adminHubs.tsx without a written
// lesson above, an automatic lesson is built from its description
// and tabs (with a quiz), so it still shows up in everyone's course.
// The founder sees these listed as "needs a written lesson".

function autoLesson(hub: Hub): Lesson {
  const others = HUBS.filter((h) => h.key !== hub.key).slice(0, 12);
  const pick = (n: number) => others[(hub.key.length * 7 + n * 5) % others.length];
  const distractors = [pick(1), pick(2), pick(3)].map((h) => h.description);
  const correct = hub.key.length % 4; // spread the right answer across A–D
  const options = [...distractors];
  options.splice(correct, 0, hub.description);
  return {
    key: hub.key,
    hub: hub.key,
    minutes: 2,
    title: hub.label,
    intro: hub.description,
    steps: [
      l(`Open ${hub.label.en} from the sidebar (or use the button below).`, `Sidebar se ${hub.label.hi} kholo (ya neeche wala button dabao).`),
      l("If the page has tabs on top, open each tab once and see what it shows.", "Agar page ke upar tabs hain to har tab ek baar kholo aur dekho kya dikhta hai."),
      l("Not sure about something? Ask your team lead or check Help & Resources.", "Kuch samajh na aaye to apne team lead se poocho ya Help aur Resources dekho."),
    ],
    quiz: [
      {
        q: l(`What is ${hub.label.en} used for?`, `${hub.label.hi} kis kaam ke liye hai?`),
        options,
        correct,
        why: hub.description,
      },
    ],
  };
}

/** Hubs that have no hand-written lesson yet (founder warning). */
const NO_LESSON = new Set(["training"]); // the course itself

export function hubsMissingLesson(): Hub[] {
  const written = new Set(LESSONS.map((x) => x.hub));
  return HUBS.filter((h) => !NO_LESSON.has(h.key) && !written.has(h.key));
}

/** Full course: basics + a lesson for every hub (written or automatic), in sidebar order. */
export function allLessons(): Lesson[] {
  const basics = LESSONS.filter((x) => x.hub === null);
  const perHub = HUBS.filter((h) => !NO_LESSON.has(h.key)).map((h) => LESSONS.find((x) => x.hub === h.key) ?? autoLesson(h));
  return [...basics, ...perHub];
}

export function lessonByKey(k: string) {
  return allLessons().find((x) => x.key === k);
}
