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
  sql(`update profiles set phone = null, billing_phone = null where id='${B}'; update profiles set phone='9876543210' where id='${A}'`);
  const browser = await chromium.launch({ headless: true });

  // ── customer WITHOUT a number ────────────────────────────────
  const ctx = await as(browser, B, "bob@example.test");
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(APP + "/pricing", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  check("signed-in customer without a number is NOT pushed to /complete-profile any more", new URL(page.url()).pathname === "/pricing", page.url());
  check("no popup in the first seconds", (await popup(page).count()) === 0);
  await popup(page).waitFor({ state: "visible", timeout: 40000 }).catch(() => {});
  const shownAfter = Math.round((Date.now() - t0) / 1000);
  check(`popup appears after about 30 seconds on the site (seen at ~${shownAfter}s)`, (await popup(page).count()) === 1 && shownAfter >= 28 && shownAfter <= 45, `${shownAfter}s`);
  check("it is the optional version (a 'Later' button)", await page.getByRole("button", { name: "Later" }).isVisible().catch(() => false));
  await page.getByRole("button", { name: "Later" }).click();
  check("'Later' closes it and nothing is saved", (await popup(page).count()) === 0 && sql(`select coalesce(phone,'') from profiles where id='${B}'`) === "");
  await page.goto(APP + "/support", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(34000);
  check("after 'Later' it does not come back on the next page in the same visit", (await popup(page).count()) === 0);

  // ── what a Generate button triggers when the number is still missing ─
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("af:phone-required")));
  await popup(page).waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
  check("Generate without a number opens the required version ('Save & generate', 'Cancel')",
    (await page.getByRole("button", { name: "Save & generate" }).count()) === 1 && (await page.getByRole("button", { name: "Cancel" }).count()) === 1);
  const input = page.getByPlaceholder("10-digit mobile number");
  await input.fill("12345");
  check("a short number cannot be saved (button disabled)", await page.getByRole("button", { name: "Save & generate" }).isDisabled());
  await input.fill("1234567890");
  await page.getByRole("button", { name: "Save & generate" }).click();
  await page.waitForTimeout(600);
  check("a number that is not an Indian mobile (starts with 1) is refused with a message", (await popup(page).count()) === 1 && (await page.getByText("valid 10-digit Indian mobile number").count()) === 1 && sql(`select coalesce(phone,'') from profiles where id='${B}'`) === "");
  await input.fill("9123456789");
  await page.getByRole("button", { name: "Save & generate" }).click();
  await popup(page).waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
  check("a valid number is saved to the profile and the popup closes", (await popup(page).count()) === 0 && sql(`select phone from profiles where id='${B}'`) === "9123456789", sql(`select coalesce(phone,'') from profiles where id='${B}'`));
  await ctx.close();

  // ── customer WITH a number ───────────────────────────────────
  const ctx2 = await as(browser, A, "alice@example.test");
  const page2 = await ctx2.newPage();
  await page2.goto(APP + "/pricing", { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(36000);
  check("customer who already gave a number never sees the popup", (await popup(page2).count()) === 0);
  const text = await page2.locator("body").innerText();
  check("pricing page as seen in the browser: 'one-time · lifetime access', no '/ month'", /one-time · lifetime access/i.test(text) && !/\/\s*month/i.test(text));
  check("pricing page shows 15 / 30 credit prices nowhere as 'per month' and Empire as 36,000 Credits", /36,000 Credits/.test(text) && !/unlimited credits/i.test(text));
  const r = await page2.goto(APP + "/ai-social-publisher", { waitUntil: "domcontentloaded" });
  check("Social Publisher address shows the 'not found' page, even when signed in", r.status() === 404);
  await ctx2.close();

  // ── visitor (not signed in) ──────────────────────────────────
  const ctx3 = await browser.newContext();
  const page3 = await ctx3.newPage();
  await page3.goto(APP + "/", { waitUntil: "domcontentloaded" });
  await page3.waitForTimeout(34000);
  check("a visitor who is not signed in is never asked for a number", (await popup(page3).count()) === 0);
  await browser.close();

  const failed = results.filter((x) => !x).length;
  console.log(`\n==== ${results.length - failed} passed, ${failed} failed, ${results.length} total ====`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("CRASH", e); process.exit(2); });
