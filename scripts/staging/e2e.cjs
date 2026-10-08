// End-to-end checks against the LOCAL staging stack (see README.md).
// Talks only to 127.0.0.1 — never point it at production.
const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const { sign } = require("./jwt.cjs");
const APP = "http://127.0.0.1:54402", GW = "http://127.0.0.1:54400";
const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222",
  F = "33333333-3333-4333-8333-333333333333", M = "44444444-4444-4444-8444-444444444444", S = "55555555-5555-4555-8555-555555555555",
  TEAM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", CAND = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const tok = { alice: sign({ role: "authenticated", sub: A, email: "alice@example.test" }), bob: sign({ role: "authenticated", sub: B, email: "bob@example.test" }),
  founder: sign({ role: "authenticated", sub: F, email: "founder@example.test" }), member: sign({ role: "authenticated", sub: M, email: "member@example.test" }),
  sales: sign({ role: "authenticated", sub: S, email: "sales@example.test" }) };
const RZP_SECRET = "local-staging-razorpay-secret", WH_SECRET = "local-staging-webhook-secret", CRON = "local-staging-cron-secret";
let ipN = 0; const ip = () => `10.9.${Math.floor(++ipN / 250)}.${ipN % 250 + 1}`;
const sql = (q) => execFileSync("psql", ["-h", process.env.PGHOST || "127.0.0.1", "-p", process.env.PGPORT || "54329", "-U", process.env.PGUSER || "postgres", "-d", "afstaging", "-At", "-F", "|", "-c", q]).toString().trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uuid = () => crypto.randomUUID();
const results = []; let section = "";
function check(name, cond, detail = "") { results.push({ section, name, ok: !!cond, detail }); console.log(`${cond ? "PASS" : "FAIL"}  [${section}] ${name}${cond ? "" : "   <<< " + detail}`); }
async function api(path, { token, body, method, headers = {}, raw } = {}) {
  const res = await fetch(APP + path, { method: method || (body !== undefined || raw !== undefined ? "POST" : "GET"),
    headers: { "content-type": "application/json", "x-real-ip": ip(), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined });
  let json = null; const text = await res.text(); try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}
const ctl = (b) => fetch(GW + "/_ctl", { method: "POST", body: JSON.stringify(b) });
const gwState = async () => (await fetch(GW + "/_ctl")).json();
const credits = (id) => Number(sql(`select credits from profiles where id='${id}'`));
const teamCredits = () => Number(sql(`select credits from teams where id='${TEAM}'`));
const ledger = (gid) => sql(`select coalesce(string_agg(delta||':'||reason, ',' order by created_at, delta),'') from credit_transactions where generation_id='${gid}'`);
const teamLedger = (gid) => sql(`select coalesce(string_agg(delta||':'||reason, ',' order by created_at, delta),'') from team_credit_transactions where generation_id='${gid}'`);
const gen = (gid) => { const r = sql(`select status, coalesce(credits_used,0), coalesce(credit_cost,0), coalesce(credits_refunded,false) from generations where id='${gid}'`).split("|"); return { status: r[0], used: Number(r[1]), cost: Number(r[2]), refunded: r[3] === "t" }; };
async function waitStatus(gid, want, ms = 4000) { const t = Date.now(); while (Date.now() - t < ms) { if (want.includes(gen(gid).status)) return gen(gid); await sleep(120); } return gen(gid); }
const settle = (gid) => sql(`update generations set updated_at = now() - interval '6 minutes' where id='${gid}'`);
const sweep = (dry) => api(`/api/cron/generation-sweeper${dry ? "?dry=1" : ""}`, { method: "POST", headers: { authorization: `Bearer ${CRON}` } });
const DESIGN = "https://aiagentforge.in/staging/design.png";
const textile = (token, extra = {}) => { const id = uuid(); return api("/api/textile/generate", { token, body: { generation_id: id, design_url: DESIGN, product_type: "Saree", quality: "Premium", output_size: "1080x1080", required_credits: 1, skip_credit_deduction: false, ...extra } }).then((r) => ({ id, ...r })); };
const product = (token, extra = {}) => { const id = uuid(); return api("/api/productography/generate", { token, body: { generation_id: id, design_url: DESIGN, quality: "Premium", output_size: "1080x1080", required_credits: 1, ...extra } }).then((r) => ({ id, ...r })); };
const jewel = (token, extra = {}) => { const id = uuid(); return api("/api/jewellery/generate", { token, body: { generation_mode: "single", generation_id: id, source_image_url: DESIGN, required_credits: 1, output_quality: "Premium", output_size: "1080x1080", ...extra } }).then((r) => ({ id, ...r })); };
const sigFor = (o, p) => crypto.createHmac("sha256", RZP_SECRET).update(`${o}|${p}`).digest("hex");
let rz = 1000;
async function rzPair({ notes, amountRupees, status = "captured", orderless = false, paymentAmountRupees }) {
  const n = ++rz; const order = { id: `order_T${n}`, amount: amountRupees * 100, currency: "INR", notes, receipt: `r${n}` };
  const payment = { id: `pay_T${n}`, order_id: orderless ? null : order.id, amount: (paymentAmountRupees ?? amountRupees) * 100, status, email: "payer@example.test", contact: "+919000000000", notes: {} };
  if (!orderless) await ctl({ order }); await ctl({ payment });
  return { order, payment, sig: sigFor(order.id, payment.id) };
}

(async () => {
  sql(`update profiles set credits=1000 where id in ('${A}','${B}'); update profiles set credits=100 where id='${M}'; update teams set credits=1000 where id='${TEAM}';`);

  // ───────────────────────────────────────────────────────────
  section = "1 price list (server decides; browser sent required_credits=1)";
  await ctl({ n8nMode: "patched", resetCalls: true });
  for (const [label, extra, want] of [["Textile Premium 1080px", {}, 15], ["Textile Premium mobile", { output_size: "1080x1920" }, 17], ["Textile Ultra HD 1080px", { quality: "Ultra HD" }, 30], ["Textile Ultra HD mobile", { quality: "Ultra HD", output_size: "1080x1920" }, 32]]) {
    const before = credits(A); const r = await textile(tok.alice, extra); const g = await waitStatus(r.id, ["completed", "failed"]);
    check(`${label} = ${want}`, r.status === 200 && g.status === "completed" && before - credits(A) === want && ledger(r.id) === `-${want}:textile_generate`, `http ${r.status} ${JSON.stringify(g)} ledger=${ledger(r.id)}`);
  }
  for (const [label, extra, want] of [["Productography Premium 1080px", {}, 15], ["Productography Premium mobile", { output_size: "1080x1920" }, 17], ["Productography Ultra HD 1080px", { quality: "Ultra HD" }, 30], ["Productography Ultra HD mobile", { quality: "Ultra HD", output_size: "1080x1920" }, 32]]) {
    const before = credits(A); const r = await product(tok.alice, extra); const g = await waitStatus(r.id, ["completed", "failed"]);
    check(`${label} = ${want}`, r.status === 200 && g.status === "completed" && before - credits(A) === want && ledger(r.id) === `-${want}:productography_generate`, `http ${r.status} ${r.text.slice(0, 120)} ${JSON.stringify(g)} ledger=${ledger(r.id)}`);
  }
  for (const [label, extra, want] of [["Jewellery Premium 1080px", {}, 15], ["Jewellery Premium mobile", { output_size: "1080x1920" }, 17], ["Jewellery Ultra HD 1080px", { output_quality: "Ultra HD" }, 30], ["Jewellery Ultra HD mobile", { output_quality: "Ultra HD", output_size: "1080x1920" }, 32]]) {
    const before = credits(A); const r = await jewel(tok.alice, extra); await sleep(300);
    check(`${label} = ${want}`, r.status === 200 && before - credits(A) === want, `http ${r.status} ${r.text.slice(0, 160)} charged=${before - credits(A)}`);
  }
  { const j = (await gwState()).n8n.calls.filter((c) => c.agent === "jewellery");
    check("Jewellery: n8n told the server price and to skip any deduction of its own", j.length === 4 && j.map((c) => c.required_credits).join() === "15,17,30,32" && j.every((c) => c.skip === true), JSON.stringify(j.map((c) => [c.required_credits, c.skip]))); }
  { const r = await textile(tok.alice, { required_credits: 999 }); await waitStatus(r.id, ["completed"]); check("browser sends 999 for a 15-credit image → charged at most 19 (15 + 4 branding items)", ledger(r.id) === "-19:textile_generate", ledger(r.id)); }
  { const calls = (await gwState()).n8n.calls; const t = calls.filter((c) => c.agent === "textile"); const p = calls.filter((c) => c.agent === "productography");
    check("every n8n call carried the webhook secret header", calls.length > 0 && calls.every((c) => c.authed), JSON.stringify(calls.slice(0, 2)));
    check("Textile: n8n told to skip its own deduction (browser sent skip=false)", t.length === 5 && t.every((c) => c.skip === true && c.required_credits === 0));
    check("Productography personal: n8n told the server-computed amount", p.map((c) => c.required_credits).join() === "15,17,30,32" && p.every((c) => c.skip === false), p.map((c) => c.required_credits).join());
    check("user_id sent to n8n is the logged-in user", calls.every((c) => c.user_id === A)); }
  { const r = await api("/api/textile/generate", { body: { generation_id: uuid(), design_url: DESIGN } }); check("generate without login → 401", r.status === 401, r.status); }
  { const r = await textile(tok.alice, { design_url: "https://evil.example.com/x.png" }); check("source image from another website → refused", r.status === 400, r.status); }
  { const r1 = await textile(tok.alice); await waitStatus(r1.id, ["completed"]); const before = credits(B);
    const r2 = await api("/api/textile/generate", { token: tok.bob, body: { generation_id: r1.id, design_url: DESIGN, quality: "Premium", output_size: "1080x1080" } });
    check("re-using someone else's generation id → 409, charge returned, row untouched", r2.status === 409 && credits(B) === before && sql(`select user_id from generations where id='${r1.id}'`) === A, `${r2.status} bob ${before}->${credits(B)}`); }
  { sql(`update profiles set credits=10 where id='${B}'`); const r = await textile(tok.bob); check("not enough credits → 402, nothing charged, n8n not called", r.status === 402 && credits(B) === 10 && sql(`select count(*) from generations where id='${r.id}'`) === "0", `${r.status}`); sql(`update profiles set credits=1000 where id='${B}'`); }

  // ───────────────────────────────────────────────────────────
  section = "2 one payer per generation (old n8n copy that ignores 'skip')";
  await ctl({ n8nMode: "old" });
  { const before = credits(A); const r = await textile(tok.alice); await waitStatus(r.id, ["completed"]);
    check("Textile personal, old n8n: customer is charged twice (15 by server + 15 by n8n)", before - credits(A) === 30 && ledger(r.id) === "-15:textile_generate,-15:textile_generate", ledger(r.id));
    settle(r.id); const dry = await sweep(true);
    check("sweeper dry run reports it, changes nothing", dry.json?.duplicate_charges_refunded >= 1 && before - credits(A) === 30, JSON.stringify(dry.json));
    const s1 = await sweep(); check("sweeper gives the second charge back (15)", s1.json?.duplicate_credits_refunded === 15 && before - credits(A) === 15 && ledger(r.id).endsWith("15:refund:duplicate_charge"), JSON.stringify(s1.json) + " " + ledger(r.id));
    const s2 = await sweep(); check("second sweeper run refunds nothing more", s2.json?.duplicate_charges_refunded === 0 && before - credits(A) === 15, JSON.stringify(s2.json)); }
  { const pb = credits(M), tb = teamCredits(); const r = await product(tok.member, { team_id: TEAM }); await waitStatus(r.id, ["completed"]);
    check("Team Productography, old n8n (today's live behaviour): team pool −15 AND member's own −15", tb - teamCredits() === 15 && pb - credits(M) === 15 && teamLedger(r.id) === "-15:productography_generate" && ledger(r.id) === "-15:productography_generate", `team ${teamLedger(r.id)} personal ${ledger(r.id)}`);
    settle(r.id); const s = await sweep();
    check("sweeper returns the member's 15, team pool stays charged once", pb === credits(M) && tb - teamCredits() === 15 && s.json?.duplicate_credits_refunded === 15, JSON.stringify(s.json));
    const r2 = await api("/api/feedback/submit", { token: tok.member, body: { rating: 5, generation_id: r.id, agent: "productography" } });
    check("team generation earns no rating reward", r2.status === 200 && r2.json?.creditsAwarded === 0 && credits(M) === pb, JSON.stringify(r2.json)); }
  { sql(`update profiles set credits=0 where id='${M}'`); const tb = teamCredits(); const r = await product(tok.member, { team_id: TEAM }); const g = await waitStatus(r.id, ["completed", "failed"]);
    check("Team member with 0 own credits, old n8n: workflow fails the job ('Insufficient credits') although the team paid", g.status === "failed" && tb - teamCredits() === 15, JSON.stringify(g));
    settle(r.id); const s = await sweep(); check("…sweeper refunds the team pool for that failed job", teamCredits() === tb && s.json?.refunded_credits >= 15, JSON.stringify(s.json)); sql(`update profiles set credits=100 where id='${M}'`); }
  await ctl({ n8nMode: "patched" });
  { const pb = credits(M), tb = teamCredits(); const r = await product(tok.member, { team_id: TEAM }); await waitStatus(r.id, ["completed"]);
    check("Team Productography, FIXED n8n: only the team pool is charged", tb - teamCredits() === 15 && pb === credits(M) && ledger(r.id) === "", `personal ledger '${ledger(r.id)}'`);
    settle(r.id); const s = await sweep(); check("…and the sweeper finds nothing to refund", s.json?.duplicate_charges_refunded === 0 && s.json?.refunded_generations === 0, JSON.stringify(s.json)); }
  { const b = credits(A); const r = await product(tok.alice); await waitStatus(r.id, ["completed"]); settle(r.id); const s = await sweep();
    check("personal Productography (n8n is the one payer) is never treated as a duplicate", b - credits(A) === 15 && s.json?.duplicate_charges_refunded === 0, JSON.stringify(s.json)); }
  { const b = credits(F); const r = await textile(tok.founder, { team_id: TEAM }); await waitStatus(r.id, ["completed"]);
    check("Team Textile: team pool charged, member's own balance untouched", credits(F) === b && teamLedger(r.id) === "-15:textile_generate" && ledger(r.id) === "", `${teamLedger(r.id)} / ${ledger(r.id)}`); }
  { const r = await textile(tok.alice, { team_id: TEAM }); check("non-member tries to spend the team pool → 403", r.status === 403, r.status); }

  // ───────────────────────────────────────────────────────────
  section = "3 failed and stuck generations → refund from the server record";
  await ctl({ n8nMode: "fail" });
  { const b = credits(A); const r = await textile(tok.alice, { quality: "Ultra HD" }); await waitStatus(r.id, ["failed"]);
    const other = await api("/api/credits/refund", { token: tok.bob, body: { generation_id: r.id, amount: 30 } });
    check("another customer asks for this refund → refused, nothing paid", other.status >= 400 && credits(A) === b - 30, `${other.status}`);
    const r1 = await api("/api/credits/refund", { token: tok.alice, body: { generation_id: r.id, amount: 99999, credits: 99999 } });
    check("customer asks for 99,999 → gets exactly the 30 that were charged", r1.status === 200 && credits(A) === b, `${r1.status} ${r1.text.slice(0, 150)} bal ${b}->${credits(A)}`);
    const r2 = await api("/api/credits/refund", { token: tok.alice, body: { generation_id: r.id, amount: 30 } }); const r3 = await api("/api/credits/refund", { token: tok.alice, body: { generation_id: r.id } });
    check("asking again (twice) pays nothing more", credits(A) === b && ledger(r.id) === "-30:textile_generate,30:refund:client_detected_failure" || (credits(A) === b && /^-30:textile_generate,30:refund:[a-z_:]+$/.test(ledger(r.id))), ledger(r.id));
    settle(r.id); const s = await sweep(); check("sweeper does not refund it a second time", credits(A) === b && s.json?.refunded_generations === 0, JSON.stringify(s.json)); }
  { const b = credits(A); const r = await textile(tok.alice); await waitStatus(r.id, ["failed"]); settle(r.id); const s = await sweep();
    check("customer closed the tab: sweeper refunds the failed job by itself (15)", credits(A) === b && s.json?.refunded_credits === 15 && gen(r.id).refunded, JSON.stringify(s.json));
    const again = await Promise.all([sweep(), sweep(), api("/api/credits/refund", { token: tok.alice, body: { generation_id: r.id } })]);
    check("two sweepers + the page at the same moment → still refunded once", credits(A) === b, `bal ${credits(A)} vs ${b}`); }
  await ctl({ n8nMode: "patched" });
  { const b = credits(A); const r = await textile(tok.alice, { quality: "Premium" }); await waitStatus(r.id, ["completed"]);
    const rr = await api("/api/credits/refund", { token: tok.alice, body: { generation_id: r.id, amount: 15 } });
    check("refund request for a generation that SUCCEEDED → refused", gen(r.id).status === "completed" && credits(A) === b - 15 && rr.json?.refunded !== true && ledger(r.id) === "-15:textile_generate", `${rr.status} ${rr.text.slice(0, 120)}`); }
  await ctl({ n8nMode: "fail-old-refund" });
  { const b = credits(A); const r = await product(tok.alice); await waitStatus(r.id, ["failed"]); await sleep(400);
    const rr = await api("/api/credits/refund", { token: tok.alice, body: { generation_id: r.id, amount: 15 } }); settle(r.id); sql(`update generations set updated_at = now() - interval '6 minutes' where id='${r.id}'`); await sweep();
    const rr2 = await api("/api/credits/refund", { token: tok.alice, body: { generation_id: r.id, amount: 15 } });
    check("n8n already refunded its own failure → page + sweeper add nothing on top", credits(A) === b && ledger(r.id) === "-15:productography_generate,15:refund:productography_n8n_failed", `${ledger(r.id)} bal ${b}->${credits(A)} (${rr.status}/${rr2.status})`); }
  await ctl({ n8nMode: "hang" });
  { const b = credits(A); const r = await textile(tok.alice, { output_size: "1080x1920" }); await sleep(300);
    check("stuck job starts as pending with 17 charged", gen(r.id).status === "pending" && b - credits(A) === 17, JSON.stringify(gen(r.id)));
    const s0 = await sweep(); check("sweeper leaves a young job alone", gen(r.id).status === "pending" && s0.json?.marked_failed === 0, JSON.stringify(s0.json));
    sql(`update generations set created_at = now() - interval '25 minutes', updated_at = now() - interval '25 minutes' where id='${r.id}'`);
    const d = await sweep(true); check("dry run: would mark it failed, changes nothing", d.json?.marked_failed === 1 && gen(r.id).status === "pending", JSON.stringify(d.json));
    const s1 = await sweep(); sql(`update generations set updated_at = now() - interval '6 minutes' where id='${r.id}'`); const s2 = await sweep();
    check("after the time limit: marked failed, 17 credits back, once", gen(r.id).status === "failed" && credits(A) === b && gen(r.id).refunded, `${JSON.stringify(gen(r.id))} bal ${b}->${credits(A)} ${JSON.stringify(s1.json)} ${JSON.stringify(s2.json)}`); }
  { const r = await textile(tok.alice); await sleep(200); sql(`update generations set created_at = now() - interval '25 minutes', output_url='https://aiagentforge.in/staging/out.png' where id='${r.id}'`); const b = credits(A); const s = await sweep();
    check("stuck row that already has its image → recovered as completed, no refund", gen(r.id).status === "completed" && credits(A) === b && s.json?.recovered === 1, JSON.stringify(s.json)); }
  await ctl({ n8nMode: "dead" });
  { const b = credits(A); const r = await textile(tok.alice); await sleep(700);
    check("n8n does not accept the job (404): row failed + credits back immediately", gen(r.id).status === "failed" && credits(A) === b && gen(r.id).refunded, `${JSON.stringify(gen(r.id))} ${ledger(r.id)}`); }
  await ctl({ n8nMode: "patched" });
  { const a = await api("/api/cron/generation-sweeper", { method: "POST" }); const w = await api("/api/cron/generation-sweeper", { method: "POST", headers: { authorization: "Bearer wrong" } });
    check("sweeper without / with a wrong secret → 401", a.status === 401 && w.status === 401, `${a.status}/${w.status}`); }

  // ───────────────────────────────────────────────────────────
  section = "4 rating reward = 1 credit, own completed generation, once";
  { const r = await textile(tok.alice); await waitStatus(r.id, ["completed"]); const b = credits(A);
    const f1 = await api("/api/feedback/submit", { token: tok.alice, body: { rating: 5, feedback: "Bahut badhiya result, design bilkul same aaya.", generation_id: r.id, agent: "textile" } });
    check("rating + written feedback → 1 credit (not 3)", f1.status === 200 && f1.json?.creditsAwarded === 1 && credits(A) === b + 1, JSON.stringify(f1.json));
    const f2 = await api("/api/feedback/submit", { token: tok.alice, body: { rating: 4, generation_id: r.id } });
    check("second rating for the same generation → refused, no credit", f2.status === 409 && credits(A) === b + 1, `${f2.status}`);
    const many = await Promise.all([1, 2, 3, 4, 5].map(() => api("/api/feedback/submit", { token: tok.alice, body: { rating: 5, generation_id: r.id } })));
    check("5 ratings fired at once → still only 1 credit in total", credits(A) === b + 1, `bal ${credits(A)} want ${b + 1}`);
    const bb = credits(B); const f3 = await api("/api/feedback/submit", { token: tok.bob, body: { rating: 5, generation_id: r.id } });
    check("rating someone else's generation → no credit", f3.json?.creditsAwarded === 0 && credits(B) === bb, JSON.stringify(f3.json)); }
  { const r = await textile(tok.alice); await waitStatus(r.id, ["completed"]); const b = credits(A);
    const fire = await Promise.all([1, 2, 3, 4, 5, 6].map(() => api("/api/feedback/submit", { token: tok.alice, body: { rating: 5, generation_id: r.id } })));
    check("6 first-time ratings fired together → 1 credit, the rest refused", credits(A) === b + 1, `bal ${credits(A)} want ${b + 1}; statuses ${fire.map((x) => x.status).join()}`); }
  { await ctl({ n8nMode: "fail" }); const r = await textile(tok.alice); await waitStatus(r.id, ["failed"]); await ctl({ n8nMode: "patched" }); const b = credits(A);
    const f = await api("/api/feedback/submit", { token: tok.alice, body: { rating: 5, generation_id: r.id } }); check("rating a FAILED generation → no credit", f.json?.creditsAwarded === 0 && credits(A) === b, JSON.stringify(f.json));
    const g = await api("/api/feedback/submit", { token: tok.alice, body: { rating: 5, generation_id: uuid() } }); check("rating a generation id that does not exist → no credit", g.json?.creditsAwarded === 0 && credits(A) === b, JSON.stringify(g.json));
    const n = await api("/api/feedback/submit", { token: tok.alice, body: { rating: 5 } }); check("rating with no generation at all → no credit", (n.json?.creditsAwarded ?? 0) === 0 && credits(A) === b, JSON.stringify(n.json));
    const u = await api("/api/feedback/submit", { body: { rating: 5, generation_id: r.id } }); check("rating without login → 401", u.status === 401, u.status); }

  // ───────────────────────────────────────────────────────────
  section = "5 Razorpay: plan purchase";
  { const p = await rzPair({ notes: { userId: A, planName: "Starter", type: "credit_plan" }, amountRupees: 1999 }); const b = credits(A);
    const v = await api("/api/razorpay/verify-payment", { token: tok.alice, body: { razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig, planName: "Empire", userId: B, credits: 36000 } });
    check("Starter paid, browser claims Empire for another user → 1,800 credits to the real buyer only", v.status === 200 && credits(A) === b + 1800, `${v.status} ${v.text.slice(0, 160)} ${b}->${credits(A)}`);
    const v2 = await api("/api/razorpay/verify-payment", { token: tok.alice, body: { razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig } });
    const whBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { ...p.payment, notes: { userId: A, planName: "Starter" } } } } });
    const wh = await api("/api/razorpay/webhook", { raw: whBody, headers: { "x-razorpay-signature": crypto.createHmac("sha256", WH_SECRET).update(whBody).digest("hex") } });
    check("same payment again via the page AND the webhook → no second credit", credits(A) === b + 1800 && wh.status === 200 && sql(`select count(*) from payments where razorpay_payment_id='${p.payment.id}'`) === "1", `${v2.status}/${wh.status} bal ${credits(A)}`); }
  { const p = await rzPair({ notes: { type: "meeting", date: "2026-10-20", time: "11:00" }, amountRupees: 99 }); const b = credits(A);
    const v = await api("/api/razorpay/verify-payment", { token: tok.alice, body: { razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig, planName: "Empire" } });
    check("a real ₹99 meeting payment presented as an Empire purchase → refused", v.status === 400 && credits(A) === b, `${v.status}`); }
  { const p = await rzPair({ notes: { userId: A, planName: "Empire", type: "credit_plan" }, amountRupees: 99 }); const b = credits(A);
    const v = await api("/api/razorpay/verify-payment", { token: tok.alice, body: { razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig } });
    check("order says Empire but amount is ₹99 → refused", v.status === 400 && credits(A) === b, `${v.status}`); }
  { const p = await rzPair({ notes: { userId: A, planName: "Starter", type: "credit_plan" }, amountRupees: 1999, status: "failed" }); const b = credits(A);
    const v = await api("/api/razorpay/verify-payment", { token: tok.alice, body: { razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig } });
    check("payment that failed at the bank → no credits", v.status === 400 && credits(A) === b, `${v.status}`); }
  { const p = await rzPair({ notes: { userId: A, planName: "Starter", type: "credit_plan" }, amountRupees: 1999 }); const b = credits(A);
    const v = await api("/api/razorpay/verify-payment", { token: tok.alice, body: { razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: "0".repeat(64) } });
    check("wrong signature → refused", v.status === 400 && credits(A) === b, `${v.status}`); }
  { const p = await rzPair({ notes: { userId: B, planName: "Pro Creator", type: "credit_plan" }, amountRupees: 9999 }); const bB = credits(B), bA = credits(A);
    const whBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: p.payment } } });
    const bad = await api("/api/razorpay/webhook", { raw: whBody, headers: { "x-razorpay-signature": "deadbeef" } });
    check("webhook with a wrong signature → 400, nothing credited", bad.status === 400 && credits(B) === bB, `${bad.status}`);
    await ctl({ razorpayDown: true }); const down = await api("/api/razorpay/webhook", { raw: whBody, headers: { "x-razorpay-signature": crypto.createHmac("sha256", WH_SECRET).update(whBody).digest("hex") } }); await ctl({ razorpayDown: false });
    check("webhook while Razorpay cannot be reached → asks for a retry (503), nothing filed as a workshop seat", down.status === 503 && credits(B) === bB && sql(`select count(*) from workshop_registrations where razorpay_payment_id='${p.payment.id}'`) === "0", `${down.status}`);
    const ok = await api("/api/razorpay/webhook", { raw: whBody, headers: { "x-razorpay-signature": crypto.createHmac("sha256", WH_SECRET).update(whBody).digest("hex") } });
    check("webhook alone (customer closed the page): 9,000 credits to the buyer named in the order", ok.status === 200 && credits(B) === bB + 9000 && credits(A) === bA, `${ok.status} ${ok.text.slice(0, 120)}`); }

  // ───────────────────────────────────────────────────────────
  section = "6 Razorpay: careers deposit, workshop, webhook filing";
  { const p = await rzPair({ notes: { candidate_id: CAND, type: "security_deposit" }, amountRupees: 500 });
    sql(`insert into candidate_payments(candidate_id, razorpay_order_id, amount, status) values ('${CAND}','${p.order.id}',500,'pending')`);
    const w = await rzPair({ notes: { type: "workshop", slot: "5-july" }, amountRupees: 99 });
    const cheap = await api("/api/careers/payment/verify", { body: { candidate_id: CAND, razorpay_order_id: w.order.id, razorpay_payment_id: w.payment.id, razorpay_signature: w.sig } });
    check("a ₹99 workshop payment used as the ₹500 deposit → refused, stage unchanged", cheap.status === 400 && sql(`select stage from candidates where id='${CAND}'`) === "offer_accepted", `${cheap.status}`);
    const other = await api("/api/careers/payment/verify", { body: { candidate_id: uuid(), razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig } });
    check("someone else's deposit used for a different candidate → refused", other.status === 400, `${other.status}`);
    const badsig = await api("/api/careers/payment/verify", { body: { candidate_id: CAND, razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: "f".repeat(64) } });
    check("deposit with a wrong signature → refused", badsig.status === 400, `${badsig.status}`);
    const ok = await api("/api/careers/payment/verify", { body: { candidate_id: CAND, razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig } });
    check("real ₹500 deposit → paid, stage 'security_paid', login details issued", ok.status === 200 && ok.json?.login_password?.length >= 10 && sql(`select stage from candidates where id='${CAND}'`) === "security_paid" && sql(`select status from candidate_payments where razorpay_order_id='${p.order.id}'`) === "paid", `${ok.status} ${ok.text.slice(0, 120).replace(/"login_password":"[^"]*"/, '"login_password":"…"')}`);
    const again = await Promise.all([1, 2, 3].map(() => api("/api/careers/payment/verify", { body: { candidate_id: CAND, razorpay_order_id: p.order.id, razorpay_payment_id: p.payment.id, razorpay_signature: p.sig } })));
    check("same deposit confirmed 3 more times → same login details, one team notification", again.every((x) => x.status === 200 && x.json?.login_password === ok.json?.login_password) && sql(`select count(*) from recruitment_notifications where candidate_id='${CAND}' and event_type='payment_done'`) === "1", again.map((x) => x.status).join());
    const whBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: p.payment } } });
    const wh = await api("/api/razorpay/webhook", { raw: whBody, headers: { "x-razorpay-signature": crypto.createHmac("sha256", WH_SECRET).update(whBody).digest("hex") } });
    check("webhook for the deposit is NOT filed as a workshop registration", wh.status === 200 && wh.json?.skipped === "security_deposit" && sql(`select count(*) from workshop_registrations where razorpay_payment_id='${p.payment.id}'`) === "0", wh.text.slice(0, 100)); }
  { const w = await rzPair({ notes: { type: "workshop", slot: "5-july" }, amountRupees: 99 }); const seats = () => Number(sql(`select seats_filled from workshop_slots where slot_id='5-july'`)); const s0 = seats();
    const m = await rzPair({ notes: { type: "meeting", date: "2026-10-20", time: "11:00" }, amountRupees: 99 });
    const wrong = await api("/api/workshop/verify", { body: { razorpay_order_id: m.order.id, razorpay_payment_id: m.payment.id, razorpay_signature: m.sig, slot: "5-july" } });
    check("a meeting payment used for a workshop seat → refused", wrong.status === 400 && seats() === s0, `${wrong.status}`);
    const slot = await api("/api/workshop/verify", { body: { razorpay_order_id: w.order.id, razorpay_payment_id: w.payment.id, razorpay_signature: w.sig, slot: "unassigned" } });
    check("workshop payment presented for a different day → refused", slot.status === 409 && seats() === s0, `${slot.status}`);
    const ok = await Promise.all([1, 2, 3].map(() => api("/api/workshop/verify", { body: { razorpay_order_id: w.order.id, razorpay_payment_id: w.payment.id, razorpay_signature: w.sig, slot: "5-july" } })));
    check("real workshop payment confirmed 3 times at once → exactly one seat", ok.every((x) => x.status === 200) && seats() === s0 + 1 && sql(`select count(*) from workshop_registrations where razorpay_order_id='${w.order.id}'`) === "1", `${ok.map((x) => x.status)} seats ${s0}->${seats()}`);
    const plan = await rzPair({ notes: { userId: A, planName: "Starter", type: "credit_plan" }, amountRupees: 1999 });
    const as1 = await api("/api/workshop/assign-slot", { body: { payment_id: plan.payment.id, slot: "5-july" } });
    const dep = await rzPair({ notes: { candidate_id: CAND, type: "security_deposit" }, amountRupees: 500 });
    const as2 = await api("/api/workshop/assign-slot", { body: { payment_id: dep.payment.id, slot: "5-july" } });
    check("thank-you page with a credit-plan / deposit payment id → no workshop seat", as1.status === 400 && as2.status === 400 && seats() === s0 + 1, `${as1.status}/${as2.status}`);
    const hosted = await rzPair({ notes: {}, amountRupees: 99 });
    const as3 = await api("/api/workshop/assign-slot", { body: { payment_id: hosted.payment.id, slot: "5-july" } });
    check("hosted Razorpay page payment (₹99, no app notes) → seat on the right day", as3.status === 200 && seats() === s0 + 2, `${as3.status} ${as3.text.slice(0, 100)}`);
    const qr = await rzPair({ notes: {}, amountRupees: 99, orderless: true }); const whBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: qr.payment } } });
    const wh = await api("/api/razorpay/webhook", { raw: whBody, headers: { "x-razorpay-signature": crypto.createHmac("sha256", WH_SECRET).update(whBody).digest("hex") } });
    check("QR / link payment with no order still lands in Workshop Registrations (never dropped)", wh.status === 200 && sql(`select count(*) from workshop_registrations where razorpay_payment_id='${qr.payment.id}'`) === "1", wh.text.slice(0, 120)); }

  // ───────────────────────────────────────────────────────────
  section = "7 admin APIs: login + permission";
  { const fs = require("node:fs"), path = require("node:path"); const root = require("node:path").resolve(__dirname, "../../app/api/admin"); const files = [];
    (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === "route.ts") files.push(p); } })(root);
    let total = 0, noLogin = 0, customer = 0; const leaks = [];
    for (const f of files) { const src = fs.readFileSync(f, "utf8"); const route = "/api/admin" + path.dirname(f).slice(root.length).replace(/\[[^\]]+\]/g, uuid());
      for (const m of ["GET", "POST", "PATCH", "PUT", "DELETE"]) { if (!new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(src)) continue; total++;
        const body = m === "GET" ? undefined : {}; const r1 = await api(route, { method: m, body }); const r2 = await api(route, { method: m, body, token: tok.alice });
        if (r1.status === 401 || r1.status === 403) noLogin++; else leaks.push(`${m} ${route} no-login → ${r1.status}`);
        if (r2.status === 401 || r2.status === 403) customer++; else leaks.push(`${m} ${route} customer → ${r2.status}`); } }
    check(`all ${total} admin endpoints (${files.length} route files) refuse a caller with no login`, noLogin === total, leaks.join("; "));
    check(`all ${total} admin endpoints refuse a logged-in ordinary customer`, customer === total, leaks.join("; ")); }
  { const r = await api("/api/admin/credits/refund", { token: tok.sales, body: { user_id: A, amount: 500 } }); const b = credits(A);
    const g = await api("/api/admin/credits/grant", { token: tok.sales, body: { user_id: A, amount: 500, credits: 500 } });
    check("team member WITHOUT the credits permission cannot refund or grant credits", [401, 403, 404].includes(r.status) && [401, 403, 404].includes(g.status) && credits(A) === b, `${r.status}/${g.status}`);
    sql(`update admin_users set active=false where email='founder@example.test'`); const off = await api("/api/admin/rewards", { token: tok.founder }); sql(`update admin_users set active=true where email='founder@example.test'`); const on = await api("/api/admin/rewards", { token: tok.founder });
    check("a DEACTIVATED admin is refused; the same admin when active is let in", (off.status === 401 || off.status === 403) && on.status !== 401 && on.status !== 403, `${off.status}/${on.status}`); }

  // ───────────────────────────────────────────────────────────
  section = "8 creator portal + direct database access from the browser";
  { const d0 = await api(`/api/careers/influencer/dashboard?cid=${CAND}`); const w0 = await api("/api/careers/influencer/withdraw-earnings", { body: { cid: CAND, upi: "attacker@okhdfc" } });
    check("creator dashboard / withdrawal with only the creator id (old link) → refused", [401, 403].includes(d0.status) && [401, 403].includes(w0.status) && sql(`select count(*) from influencer_withdrawals where upi_id='attacker@okhdfc'`) === "0", `${d0.status}/${w0.status}`);
    const bad = await api("/api/careers/influencer/lookup", { body: { email: "creator@example.test", mobile: "9999999999" } });
    const ok = await api("/api/careers/influencer/lookup", { body: { email: "creator@example.test", mobile: "9000000001" } });
    const token = ok.json?.token || ok.json?.session || ok.json?.session_token;
    check("creator login: right email + wrong mobile refused, right pair accepted", bad.status >= 400 && ok.status === 200 && !!token, `${bad.status}/${ok.status} keys=${Object.keys(ok.json || {})}`);
    const d1 = await api(`/api/careers/influencer/dashboard?cid=${CAND}`, { headers: { "x-af-influencer": token || "" } });
    const d2 = await api(`/api/careers/influencer/dashboard?cid=${uuid()}`, { headers: { "x-af-influencer": token || "" } });
    check("logged-in creator sees own dashboard, not another creator's", d1.status === 200 && [401, 403, 404].includes(d2.status), `${d1.status}/${d2.status}`);
    const forged = await api(`/api/careers/influencer/dashboard?cid=${CAND}`, { headers: { "x-af-influencer": (token || "x").slice(0, -4) + "AAAA" } });
    check("tampered creator session token → refused", [401, 403].includes(forged.status), `${forged.status}`); }
  { const rest = (method, path, token, body) => fetch(GW + "/rest/v1" + path, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", prefer: "return=representation" }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));
    const anon = sign({ role: "anon" }); const b = credits(A); const planBefore = sql(`select plan from profiles where id='${A}'`);
    const p1 = await rest("PATCH", `/profiles?id=eq.${A}`, tok.alice, { credits: 999999, plan: "Empire" });
    check("browser tries to set its own credits/plan directly → refused", p1.status >= 400 && credits(A) === b && sql(`select plan from profiles where id='${A}'`) === planBefore, `${p1.status}`);
    const g1 = await rest("POST", "/generations", tok.alice, { user_id: A, status: "completed" });
    check("browser tries to create a 'completed' generation row (to farm rating rewards) → refused", g1.status >= 400, `${g1.status}`);
    const r1 = await rest("POST", "/rpc/refund_credits", tok.alice, { p_user_id: A, p_amount: 5000, p_reason: "x", p_generation_id: null });
    const r1b = credits(A);
    check("browser calls refund_credits() directly", r1.status >= 400 && r1b === b, `status ${r1.status}, balance ${b} -> ${r1b}`);
    const w1 = await rest("GET", "/influencer_withdrawals?select=upi_id", anon); const e1 = await rest("GET", "/referral_earnings?select=commission_amount", tok.alice);
    check("visitor / customer reads creator payouts and earnings directly → 0 rows", Array.isArray(w1.json) && w1.json.length === 0 && Array.isArray(e1.json) && e1.json.length === 0, `${JSON.stringify(w1.json)?.slice(0, 60)}`);
    const l1 = await rest("GET", `/credit_transactions?select=delta&user_id=eq.${A}`, tok.bob); check("customer reads another customer's credit ledger → 0 rows", Array.isArray(l1.json) && l1.json.length === 0, `${l1.status}`); }

  // ───────────────────────────────────────────────────────────
  section = "9 rate limits";
  { const one = "10.200.0.1"; let limited = 0, last = 0;
    for (let i = 0; i < 130; i++) { const r = await fetch(APP + "/api/referral/check", { method: "POST", headers: { "content-type": "application/json", "x-real-ip": one }, body: JSON.stringify({ code: "ABCD1234" }) }); last = r.status; if (r.status === 429) limited++; }
    check("one visitor sending 130 writes in a minute is cut off (429) before the end", limited > 0 && last === 429, `limited ${limited}, last ${last}`);
    const other = await fetch(APP + "/api/referral/check", { method: "POST", headers: { "content-type": "application/json", "x-real-ip": "10.200.0.2" }, body: JSON.stringify({ code: "ABCD1234" }) });
    check("another visitor at the same moment is not affected", other.status !== 429, `${other.status}`); }

  // ───────────────────────────────────────────────────────────
  const fail = results.filter((r) => !r.ok);
  console.log(`\n==== ${results.length - fail.length} passed, ${fail.length} failed, ${results.length} total ====`);
  require("node:fs").writeFileSync((process.env.AF_STAGING_WORK || __dirname) + "/e2e-results.json", JSON.stringify(results, null, 1));
  process.exit(fail.length ? 1 : 0);
})().catch((e) => { console.error("CRASH", e); process.exit(2); });
