// Sends the app's Razorpay API reads to the local stand-in. Nothing else is changed.
const real = globalThis.fetch;
globalThis.fetch = function (input, init) {
  const u = typeof input === "string" ? input : input && input.url;
  if (typeof u === "string" && u.startsWith("https://api.razorpay.com/")) {
    return real(u.replace("https://api.razorpay.com/", "http://127.0.0.1:54400/razorpay/"), init);
  }
  return real(input, init);
};
