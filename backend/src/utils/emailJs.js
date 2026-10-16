const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const TEMPLATE_ENV = Object.freeze({
  verification: "EMAILJS_VERIFICATION_TEMPLATE_ID",
  passwordReset: "EMAILJS_PASSWORD_RESET_TEMPLATE_ID",
});

let sendQueue = Promise.resolve();
let lastRequestStartedAt = 0;

export function isEmailJsConfigured(templateKind) {
  const templateVariable = TEMPLATE_ENV[templateKind];
  return Boolean(
    templateVariable &&
      process.env.EMAILJS_SERVICE_ID &&
      process.env.EMAILJS_PUBLIC_KEY &&
      process.env.EMAILJS_PRIVATE_KEY &&
      process.env[templateVariable],
  );
}

async function performEmailJsSend(templateKind, templateParams) {
  const templateVariable = TEMPLATE_ENV[templateKind];
  if (!isEmailJsConfigured(templateKind)) {
    throw new Error(`EmailJS configuration is missing for ${templateKind}.`);
  }

  // EmailJS documents a one-request-per-second limit. Serialize sends within
  // this process so normal verification/reset traffic does not burst past it.
  const waitMs = Math.max(0, 1000 - (Date.now() - lastRequestStartedAt));
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastRequestStartedAt = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(EMAILJS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env[templateVariable],
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      // Do not log or forward provider response bodies; they can include sensitive
      // configuration details. The status is enough for operational diagnostics.
      throw new Error(`EmailJS request failed with status ${response.status}.`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function sendEmailJsTemplate(templateKind, templateParams) {
  const pending = sendQueue.then(() => performEmailJsSend(templateKind, templateParams));
  // Recover the queue after a failed provider call; the caller still receives
  // the rejection, but one transient failure must not block all future emails.
  sendQueue = pending.catch(() => undefined);
  return pending;
}
