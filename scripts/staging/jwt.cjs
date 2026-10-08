const crypto = require("node:crypto");
// A made-up value for the local stack only — NOT a real key of any system.
const SECRET = "local-staging-jwt-secret-not-a-real-key-0123456789";
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
function sign(payload) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ iat: Math.floor(Date.now() / 1000) - 10, exp: Math.floor(Date.now() / 1000) + 86400, ...payload });
  const sig = crypto.createHmac("sha256", SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
function verify(token) {
  const [h, b, s] = String(token || "").split(".");
  if (!h || !b || !s) return null;
  const good = crypto.createHmac("sha256", SECRET).update(`${h}.${b}`).digest("base64url");
  if (good !== s) return null;
  try { return JSON.parse(Buffer.from(b, "base64url").toString()); } catch { return null; }
}
module.exports = { SECRET, sign, verify };
if (require.main === module) {
  // Fixed dates so the "keys" printed for the build are the same on every run.
  const [role, sub, email] = process.argv.slice(2);
  process.stdout.write(sign({ iat: 1700000000, exp: 4102444800, role, ...(sub ? { sub, email, aud: "authenticated" } : {}) }));
}
