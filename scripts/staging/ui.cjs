// Browser checks against the LOCAL staging stack (needs Playwright + Chromium).
// Covers what e2e.cjs cannot see: the mobile-number popup and page text.
//   node scripts/staging/ui.cjs
const path = require("node:path");
const { execFileSync } = require("node:child_process");
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("/opt/npm-tools/node_modules/playwright")); }
const { sign } = require("./jwt.cjs");
const APP = "http://127.0.0.1:54402";
const A = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222";
const sql = (q) => execFileSync("psql", ["-h", process.env.PGHOST || "127.0.0.1", "-p", process.env.PGPORT || "54329", "-U", process.env.PGUSER || "postgres", "-d", "afstaging", "-At", "-c", q]).toString().trim();
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "   <<< " + detail}`); };

function session(id, email) {
  const access_token = sign({ role: "authenticated", sub: id, email, aud: "authenticated" });
  const now = Math.floor(Date.now() / 1000);
  return JSON.stringify({ access_token, token_type: "bearer", expires_in: 86000, expires_at: now + 86000, refresh_token: "local-staging",
    user: { id, email, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() } });
}
async function as(browser, id, email) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(([s]) => { try { window.localStorage.setItem("sb-127-auth-token", s); } catch {} }, [session(id, email)]);
  return ctx;
}
const popup = (page) => page.getByRole("dialog", { name: "Add your mobile number" });

(async () => {
  const M = "44444444-4444-4444-8444-444444444444";
  sql(`update profiles set phone = null, billing_phone = null where id in ('${B}','${M}'); update profiles set phone='9876543210' where id='${A}';
       delete from generations where user_id in ('${B}','${M}');
       insert into generations(id, user_id, status, agent_type) values (gen_random_uuid(), '${M}', 'completed', 'textile')`);
  const browser = await chromium.launch({ headless: true });
  const imageReady = (page) => page.evaluate(() => window.dispatchEvent(new CustomEvent("af:generation-completed", { detail: { agent: "textile" } })));

  // ── customer WITHOUT a number and without any image yet ──────
  const ctx = await as(browser, B, "bob@example.test");
  const page = await ctx.newPage();
  await page.goto(APP + "/pricing", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  check("signed-in customer without a number is NOT pushed to /complete-profile", new URL(page.url()).pathname === "/pricing", page.url());
  await page.waitForTimeout(34000);
  check("no popup after 40 seconds on the site — the 30-second popup is gone", (await popup(page).count()) === 0);

  // ── buying a plan is the one place the number is required ────
  const paymentsBefore = sql(`select count(*) from payments where user_id='${B}'`);
  await page.getByRole("button", { name: "Choose Starter" }).click();
  await popup(page).waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  check("'Choose Starter' without a number opens the required version, worded for billing",
    (await page.getByText("Add your mobile number for billing").count()) === 1 && (await page.getByRole("button", { name: "Save & continue" }).count()) === 1 && (await page.getByRole("button", { name: "Cancel" }).count()) === 1);
  await page.getByRole("button", { name: "Cancel" }).click();
  check("'Cancel' closes it, nothing is saved and no payment starts", (await popup(page).count()) === 0 && sql(`select coalesce(phone,'') from profiles where id='${B}'`) === "" && sql(`select count(*) from payments where user_id='${B}'`) === paymentsBefore);

  // ── first successful image → optional popup ──────────────────
  const t1 = Date.now();
  await imageReady(page);
  await page.waitForTimeout(3000);
  check("right after an image finishes nothing covers the result", (await popup(page).count()) === 0);
  await popup(page).waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  const shownAfter = Math.round((Date.now() - t1) / 1000);
  check(`a few seconds after the first successful image the optional popup appears (seen at ~${shownAfter}s)`, (await popup(page).count()) === 1 && shownAfter >= 6 && shownAfter <= 14, `${shownAfter}s`);
  check("it is the optional version ('optional' in the title, a 'Later' button)", (await page.getByText("Add your WhatsApp number (optional)").count()) === 1 && await page.getByRole("button", { name: "Later" }).isVisible().catch(() => false));
  await page.getByRole("button", { name: "Later" }).click();
  check("'Later' closes it and nothing is saved", (await popup(page).count()) === 0 && sql(`select coalesce(phone,'') from profiles where id='${B}'`) === "");
  await imageReady(page);
  await page.waitForTimeout(12000);
  check("after 'Later' another finished image does not bring it back in the same visit", (await popup(page).count()) === 0);

  // ── validation and saving (required version) ─────────────────
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("af:phone-required", { detail: { reason: "billing" } })));
  await popup(page).waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
  const input = page.getByPlaceholder("10-digit mobile number");
  await input.fill("12345");
  check("a short number cannot be saved (button disabled)", await page.getByRole("button", { name: "Save & continue" }).isDisabled());
  await input.fill("1234567890");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await page.waitForTimeout(600);
  check("a number that is not an Indian mobile (starts with 1) is refused with a message", (await popup(page).count()) === 1 && (await page.getByText("valid 10-digit Indian mobile number").count()) === 1 && sql(`select coalesce(phone,'') from profiles where id='${B}'`) === "");
  await input.fill("9123456789");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await popup(page).waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
  check("a valid number is saved to the profile and the popup closes", (await popup(page).count()) === 0 && sql(`select phone from profiles where id='${B}'`) === "9123456789", sql(`select coalesce(phone,'') from profiles where id='${B}'`));
  await ctx.close();

  // ── returning customer who already has an image, no number ───
  const ctxM = await as(browser, M, "member@example.test");
  const pageM = await ctxM.newPage();
  await pageM.goto(APP + "/support", { waitUntil: "domcontentloaded" });
  await popup(pageM).waitFor({ state: "visible", timeout: 25000 }).catch(() => {});
  check("a returning customer who already has an image is offered the optional popup once", (await pageM.getByText("Add your WhatsApp number (optional)").count()) === 1);
  await ctxM.close();

  // ── customer WITH a number ───────────────────────────────────
  const ctx2 = await as(browser, A, "alice@example.test");
  const page2 = await ctx2.newPage();
  await page2.goto(APP + "/pricing", { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(5000);
  await imageReady(page2);
  await page2.waitForTimeout(12000);
  check("customer who already gave a number never sees the popup, also after an image", (await popup(page2).count()) === 0);
  const text = await page2.locator("body").innerText();
  check("pricing page as seen in the browser: 'one-time · lifetime access', no '/ month'", /one-time · lifetime access/i.test(text) && !/\/\s*month/i.test(text));
  check("pricing page: Empire is 36,000 Credits, no 'unlimited credits', no 'Unlimited regeneration' promise", /36,000 Credits/.test(text) && !/unlimited credits/i.test(text) && !/Unlimited regenerat/.test(text) && /No plan includes free or unlimited regenerations/.test(text));
  check("pricing page shows the price table (Premium 15 · Ultra HD 30 · add-ons +2 / +1)", /Premium image/.test(text) && /Ultra HD image/.test(text) && /\+2 credits/.test(text) && /\+1 credit each/.test(text));
  check("pricing page states the failed / retry / regeneration rules", /Failed images are refunded automatically/.test(text) && /Automatic retries are not charged/.test(text) && /Regenerating and new variations/.test(text));
  const r = await page2.goto(APP + "/ai-social-publisher", { waitUntil: "domcontentloaded" });
  check("Social Publisher address shows the 'not found' page, even when signed in", r.status() === 404);
  const rc = await page2.goto(APP + "/case-studies", { waitUntil: "domcontentloaded" });
  check("Case studies address shows the 'not found' page", rc.status() === 404);
  await ctx2.close();

  // ── visitor (not signed in) ──────────────────────────────────
  const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page3 = await ctx3.newPage();
  await page3.goto(APP + "/", { waitUntil: "domcontentloaded" });
  await page3.waitForTimeout(6000);
  await imageReady(page3);
  await page3.waitForTimeout(12000);
  check("a visitor who is not signed in is never asked for a number", (await popup(page3).count()) === 0);
  const home = await page3.locator("body").innerText();
  check("footer no longer links to Case Studies", !/Case Studies/.test(home));
  await page3.goto(APP + "/about", { waitUntil: "domcontentloaded" });
  const about = await page3.locator("body").innerText();
  check("about page no longer claims a '4.9 / 5' user rating", !/4\.9\s*\/\s*5/.test(about));
  await page3.goto(APP + "/textileprints-to-mockup", { waitUntil: "domcontentloaded" });
  await page3.waitForTimeout(5000);
  const tex = await page3.locator("body").innerText();
  check("Textile page: the made-up example reviews are gone", !/Rajesh K|Priya S\*|Anil M\*|Suresh P\*/.test(tex));
  check("Textile page: the review a customer agreed to publish is shown", /Sent through the review form/.test(tex), tex.slice(0, 0));
  check("Textile page: the rating-popup comment nobody agreed to publish is NOT shown", !/Typed in the rating popup/.test(tex));
  await browser.close();

  const failed = results.filter((x) => !x).length;
  console.log(`\n==== ${results.length - failed} passed, ${failed} failed, ${results.length} total ====`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("CRASH", e); process.exit(2); });
