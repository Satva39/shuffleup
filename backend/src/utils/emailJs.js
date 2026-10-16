const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";
const TEMPLATE_ENV = Object.freeze({
  verification: "EMAILJS_VERIFICATION_TEMPLATE_ID",
  passwordReset: "EMAILJS_PASSWORD_RESET_TEMPLATE_ID",
});

let sendQueue = Promise.resolve();
let lastRequestStartedAt = 0;

const cleanProviderText = (value) => String(value || "")
  .replace(/[\r\n\t]+/g, " ")
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
  .replace(/(?:eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/g, "[redacted-token]")
  .replace(/\b(?:service|template)_[A-Za-z0-9_-]+\b/g, "[redacted-id]")
  .slice(0, 240);

export class EmailJsDeliveryError extends Error {
  constructor(code, message, { httpStatus = null, providerMessage = "" } = {}) {
    super(message);
    this.name = "EmailJsDeliveryError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.providerMessage = cleanProviderText(providerMessage);
  }
}

export function isEmailJsConfigured(templateKind) {
  const templateVariable = TEMPLATE_ENV[templateKind];
  return Boolean(
    templateVariable &&
      process.env.EMAILJS_SERVICE_ID?.trim() &&
      process.env.EMAILJS_PUBLIC_KEY?.trim() &&
      process.env.EMAILJS_PRIVATE_KEY?.trim() &&
      process.env[templateVariable]?.trim(),
  );
}

function classifyProviderError(status, bodyText) {
  const message = String(bodyText || "").toLowerCase();
  if (status === 429 || /rate.?limit|too many requests/.test(message)) {
    return {
      code: "EMAILJS_RATE_LIMITED",
      message: "EmailJS rate-limited the send request. Wait before retrying.",
    };
  }
  if (/non.browser|headless|browser applications/.test(message) || (status === 403 && !message)) {
    return {
      code: "EMAILJS_NON_BROWSER_DISABLED",
      message: "EmailJS rejected a server-side send. Check Account > Security and enable API requests for non-browser applications; also verify the private-key setting.",
    };
  }
  if (/public.?key|private.?key|access.?token|user_id|unauthori[sz]ed|invalid credentials/.test(message) || status === 401) {
    return {
      code: "EMAILJS_AUTH_CONFIGURATION",
      message: "EmailJS rejected the account credentials. Verify the public key and, if enabled, the private key in the backend environment.",
    };
  }
  if (/template/.test(message) || /template_id/.test(message)) {
    return {
      code: "EMAILJS_TEMPLATE_CONFIGURATION",
      message: "EmailJS rejected the template. Verify the template ID and save the template in the correct EmailJS account.",
    };
  }
  if (/service/.test(message) || /service_id/.test(message)) {
    return {
      code: "EMAILJS_SERVICE_CONFIGURATION",
      message: "EmailJS rejected the email service. Verify the service ID and that the connected email service is active.",
    };
  }
  if (/recipient|to email|email address is empty|invalid email/.test(message)) {
    return {
      code: "EMAILJS_RECIPIENT_CONFIGURATION",
      message: "EmailJS rejected the recipient. Set the template's To Email field to {{to_email}} and ensure the supplied recipient is valid.",
    };
  }
  if (status === 403) {
    return {
      code: "EMAILJS_ACCESS_DENIED",
      message: "EmailJS denied the request. Check Account > Security, your private-key setting, and account permissions for server-side API calls.",
    };
  }
  return {
    code: "EMAILJS_PROVIDER_REJECTED",
    message: "EmailJS rejected the request. Check the EmailJS dashboard's Email History for the provider's reason.",
  };
}

async function performEmailJsSend(templateKind, templateParams) {
  const templateVariable = TEMPLATE_ENV[templateKind];
  if (!isEmailJsConfigured(templateKind)) {
    throw new EmailJsDeliveryError(
      "EMAILJS_CONFIGURATION_MISSING",
      `EmailJS configuration is missing for ${templateKind}.`,
    );
  }

  const recipient = typeof templateParams?.to_email === "string" ? templateParams.to_email.trim() : "";
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new EmailJsDeliveryError(
      "EMAILJS_RECIPIENT_MISSING",
      "The email template recipient is missing or invalid.",
    );
  }

  // EmailJS documents a one-request-per-second limit. Serialize sends within
  // this process so normal verification/reset traffic does not burst past it.
  const waitMs = Math.max(0, 1000 - (Date.now() - lastRequestStartedAt));
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastRequestStartedAt = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(EMAILJS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID.trim(),
        template_id: process.env[templateVariable].trim(),
        user_id: process.env.EMAILJS_PUBLIC_KEY.trim(),
        accessToken: process.env.EMAILJS_PRIVATE_KEY.trim(),
        template_params: templateParams,
      }),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new EmailJsDeliveryError(
        "EMAILJS_TIMEOUT",
        "EmailJS did not respond within 10 seconds. Check EmailJS status and retry later.",
      );
    }
    throw new EmailJsDeliveryError(
      "EMAILJS_NETWORK_ERROR",
      "The backend could not connect to EmailJS. Check outbound network access and retry.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let providerBody = "";
    try {
      providerBody = await response.text();
    } catch {
      providerBody = "";
    }
    const classified = classifyProviderError(response.status, providerBody);
    throw new EmailJsDeliveryError(classified.code, classified.message, {
      httpStatus: response.status,
      providerMessage: providerBody,
    });
  }
}

export function emailJsFailureLogFields(error) {
  return {
    code: typeof error?.code === "string" ? error.code : "EMAILJS_UNKNOWN_ERROR",
    httpStatus: Number.isInteger(error?.httpStatus) ? error.httpStatus : undefined,
    providerMessage: cleanProviderText(error?.providerMessage),
    // Never log recipient, token, template parameters, or any configured key.
  };
}

export function getEmailJsUserHint(error) {
  if (error?.code === "EMAILJS_NON_BROWSER_DISABLED") {
    return "The email provider is not allowing backend sends. The site owner must enable EmailJS API requests for non-browser applications in Account > Security.";
  }
  if (error?.code === "EMAILJS_TEMPLATE_CONFIGURATION") {
    return "The verification template configuration was rejected. The site owner must check the saved template ID and recipient field.";
  }
  if (error?.code === "EMAILJS_RECIPIENT_CONFIGURATION" || error?.code === "EMAILJS_RECIPIENT_MISSING") {
    return "The email template recipient is not configured correctly. The site owner must set To Email to {{to_email}}.";
  }
  if (error?.code === "EMAILJS_RATE_LIMITED") {
    return "The email provider is temporarily rate-limiting requests. Please wait a minute and try again.";
  }
  if (error?.code === "EMAILJS_AUTH_CONFIGURATION" || error?.code === "EMAILJS_ACCESS_DENIED") {
    return "The email provider rejected its server credentials or permissions. The site owner must check EmailJS Account > Security and the backend keys.";
  }
  if (error?.code === "EMAILJS_SERVICE_CONFIGURATION") {
    return "The configured EmailJS service was rejected. The site owner must verify the service ID and reconnect the email service if needed.";
  }
  return "The email provider rejected the message. The site owner should check Render logs and EmailJS Email History before retrying.";
}

export function sendEmailJsTemplate(templateKind, templateParams) {
  const pending = sendQueue.then(() => performEmailJsSend(templateKind, templateParams));
  // Recover the queue after a failed provider call; the caller still receives
  // the rejection, but one transient failure must not block all future emails.
  sendQueue = pending.catch(() => undefined);
  return pending;
}
