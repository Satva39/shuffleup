import assert from "node:assert/strict";
import { isEmailJsConfigured, sendEmailJsTemplate } from "./emailJs.js";

const names = [
  "EMAILJS_SERVICE_ID",
  "EMAILJS_PUBLIC_KEY",
  "EMAILJS_PRIVATE_KEY",
  "EMAILJS_VERIFICATION_TEMPLATE_ID",
  "EMAILJS_PASSWORD_RESET_TEMPLATE_ID",
];
const originalEnv = Object.fromEntries(names.map((name) => [name, process.env[name]]));
const originalFetch = globalThis.fetch;

try {
  process.env.EMAILJS_SERVICE_ID = "service_test";
  process.env.EMAILJS_PUBLIC_KEY = "public_test";
  process.env.EMAILJS_PRIVATE_KEY = "private_test";
  process.env.EMAILJS_VERIFICATION_TEMPLATE_ID = "template_verify";
  process.env.EMAILJS_PASSWORD_RESET_TEMPLATE_ID = "template_reset";
  assert.equal(isEmailJsConfigured("verification"), true);
  assert.equal(isEmailJsConfigured("passwordReset"), true);
  assert.equal(isEmailJsConfigured("unknown"), false);

  let capturedUrl = "";
  let capturedBody = null;
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedBody = JSON.parse(options.body);
    return { ok: true, status: 200 };
  };
  await sendEmailJsTemplate("verification", {
    to_email: "test@example.com",
    verification_url: "https://example.com/verify-email?token=test",
  });
  assert.equal(capturedUrl, "https://api.emailjs.com/api/v1.0/email/send");
  assert.equal(capturedBody.service_id, "service_test");
  assert.equal(capturedBody.template_id, "template_verify");
  assert.equal(capturedBody.user_id, "public_test");
  assert.equal(capturedBody.accessToken, "private_test");
  assert.equal(capturedBody.template_params.to_email, "test@example.com");

  globalThis.fetch = async () => ({ ok: false, status: 429 });
  await assert.rejects(
    sendEmailJsTemplate("passwordReset", { to_email: "test@example.com" }),
    /status 429/,
  );

  console.log("✓ EmailJS configuration, payload, and provider-error tests passed");
} finally {
  globalThis.fetch = originalFetch;
  for (const name of names) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
}
