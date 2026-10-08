// Local stand-in for: Supabase API gateway (REST + auth), Razorpay API, n8n webhooks.
const http = require("node:http");
const { sign, verify } = require("./jwt.cjs");
const PGRST = { host: "127.0.0.1", port: 54401 };
const SERVICE = sign({ role: "service_role" });
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET || "";
const state = { razorpay: { orders: {}, payments: {} }, n8n: { mode: "patched", calls: [] }, razorpayDown: false };

function readBody(req) { return new Promise((r) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => r(Buffer.concat(c))); }); }
function json(res, code, obj) { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); }
function rest(method, path, body, prefer) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = http.request({ ...PGRST, method, path, headers: { authorization: `Bearer ${SERVICE}`, "content-type": "application/json", ...(prefer ? { prefer } : {}), ...(data ? { "content-length": data.length } : {}) } }, (res) => {
      const c = []; res.on("data", (d) => c.push(d)); res.on("end", () => { const t = Buffer.concat(c).toString(); let j = null; try { j = t ? JSON.parse(t) : null; } catch {} resolve({ status: res.statusCode, body: j }); });
    });
    req.on("error", reject); if (data) req.write(data); req.end();
  });
}

// ── fake n8n workflow ───────────────────────────────────────
async function runWorkflow(agent, body) {
  const mode = state.n8n.mode;
  const id = body.generation_id;
  if (mode === "hang") return;
  // "old" = a workflow copy that ignores skip_credit_deduction (what the live Productography one does today)
  // The live Jewellery workflow has no deduct step at all (the route charges).
  const skip = agent === "jewellery" || (mode !== "old" && body.skip_credit_deduction === true);
  const cost = skip ? 0 : Number(body.required_credits || body.credits_required || 15);
  const d = await rest("POST", "/rpc/deduct_credits", { p_user_id: body.user_id, p_amount: cost, p_reason: `${agent}_generate`, p_generation_id: id });
  if (!d.body || d.body.success !== true) {
    await rest("PATCH", `/generations?id=eq.${id}`, { status: "failed", error_message: "Insufficient credits", updated_at: new Date().toISOString() });
    return;
  }
  if (mode === "fail" || mode === "fail-old-refund") {
    await rest("PATCH", `/generations?id=eq.${id}`, { status: "failed", error_message: "Provider error", updated_at: new Date().toISOString() });
    if (mode === "fail-old-refund" && cost > 0) await rest("POST", "/rpc/refund_credits", { p_user_id: body.user_id, p_amount: cost, p_reason: `refund:${agent}_n8n_failed`, p_generation_id: id });
    return;
  }
  await rest("PATCH", `/generations?id=eq.${id}`, { status: "completed", output_url: "https://aiagentforge.in/staging/out.png", updated_at: new Date().toISOString(), completed_at: new Date().toISOString() });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname.startsWith("/rest/v1")) {
      const body = await readBody(req);
      const headers = { ...req.headers }; delete headers.host; delete headers.apikey;
      const p = http.request({ ...PGRST, method: req.method, path: url.pathname.replace("/rest/v1", "") + url.search, headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
      p.on("error", () => json(res, 502, { message: "rest down" })); p.end(body); return;
    }
    if (url.pathname === "/auth/v1/user") {
      const claims = verify(String(req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
      if (!claims || !claims.sub) return json(res, 401, { message: "invalid JWT" });
      return json(res, 200, { id: claims.sub, aud: "authenticated", role: "authenticated", email: claims.email, app_metadata: {}, user_metadata: {} });
    }
    if (url.pathname.startsWith("/razorpay/v1/")) {
      if (state.razorpayDown) return json(res, 503, { error: "down" });
      const [, , , kind, id] = url.pathname.split("/");
      const hit = (state.razorpay[kind] || {})[id];
      return hit ? json(res, 200, hit) : json(res, 400, { error: { code: "BAD_REQUEST_ERROR" } });
    }
    if (url.pathname.startsWith("/n8n/")) {
      const agent = url.pathname.split("/")[2];
      const body = JSON.parse((await readBody(req)).toString() || "{}");
      const authed = !N8N_SECRET || req.headers["x-af-webhook-secret"] === N8N_SECRET;
      state.n8n.calls.push({ agent, authed, skip: body.skip_credit_deduction, sharedCredits: body.shared_settings && body.shared_settings.required_credits, required_credits: body.required_credits, user_id: body.user_id, generation_id: body.generation_id });
      if (!authed) return json(res, 403, { message: "Authorization data is wrong!" });
      if (state.n8n.mode === "dead") return json(res, 404, { message: "webhook not registered" });
      json(res, 200, { message: "Workflow was started" });
      setTimeout(() => runWorkflow(agent, body).catch((e) => console.error("workflow", e)), 50);
      return;
    }
    if (url.pathname === "/_ctl" && req.method === "POST") {
      const b = JSON.parse((await readBody(req)).toString() || "{}");
      if (b.n8nMode) state.n8n.mode = b.n8nMode;
      if (b.order) state.razorpay.orders[b.order.id] = b.order;
      if (b.payment) state.razorpay.payments[b.payment.id] = b.payment;
      if (typeof b.razorpayDown === "boolean") state.razorpayDown = b.razorpayDown;
      if (b.resetCalls) state.n8n.calls = [];
      return json(res, 200, { ok: true });
    }
    if (url.pathname === "/_ctl") return json(res, 200, state);
    json(res, 404, { message: "no route" });
  } catch (e) { json(res, 500, { message: String(e && e.message) }); }
}).listen(54400, "127.0.0.1", () => console.log("gateway on 54400"));
