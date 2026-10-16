# ShuffleUp EmailJS delivery troubleshooting

The backend sends verification and password-reset email through EmailJS's server-side REST API. A `200 OK` from EmailJS means it accepted the template send request; it does not guarantee inbox placement. Check EmailJS **Email History** for provider delivery errors and recipient details.

## 1. Enable server-side requests

In EmailJS, open **Account → Security** and enable **Allow EmailJS API for non-browser applications**. EmailJS documents that non-browser API calls are disabled by default. If **Use Private Key** is enabled, keep a currently valid `EMAILJS_PRIVATE_KEY` set on the backend only.

## 2. Verify the template

For the **Verification** template:

- Template ID matches `EMAILJS_VERIFICATION_TEMPLATE_ID` exactly.
- **To Email** must be `{{to_email}}` (not a fixed personal address).
- The button/link URL is `{{verification_url}}`.
- Other expected variables are `{{to_name}}`, `{{expires_minutes}}`, and `{{app_name}}`.

For **Password Reset**:

- Template ID matches `EMAILJS_PASSWORD_RESET_TEMPLATE_ID` exactly.
- **To Email** must be `{{to_email}}`.
- The button/link URL is `{{password_reset_url}}`.
- Other expected variables are `{{to_name}}`, `{{expires_minutes}}`, and `{{app_name}}`.

Save both templates after editing. If the To Email field contains a fixed address, email may go to that address instead of the registrant even when the API call succeeds.

## 3. Verify backend environment variables

Check these in the backend host's environment settings. Do not put the private key into the Vite frontend, Android app, or any public repository.

- `EMAILJS_SERVICE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `EMAILJS_VERIFICATION_TEMPLATE_ID`
- `EMAILJS_PASSWORD_RESET_TEMPLATE_ID`
- `PUBLIC_APP_URL=https://shuffleup-five.vercel.app`

After changing backend values, save and redeploy/restart the backend service.

## 4. Read the error

The backend logs a sanitized EmailJS failure code and HTTP status without logging recipient addresses, tokens, template params, or configured keys. Important codes include:

- `EMAILJS_NON_BROWSER_DISABLED`: enable the Account → Security option above.
- `EMAILJS_TEMPLATE_CONFIGURATION`: verify template ID and save the correct template.
- `EMAILJS_SERVICE_CONFIGURATION`: verify service ID and reconnect the EmailJS service if needed.
- `EMAILJS_RECIPIENT_CONFIGURATION`: set template To Email to `{{to_email}}`.
- `EMAILJS_AUTH_CONFIGURATION` or `EMAILJS_ACCESS_DENIED`: verify the public key/private-key settings. If credentials were exposed, rotate them first.
- `EMAILJS_RATE_LIMITED`: wait before retrying; EmailJS allows one send request per second.
- `EMAILJS_NETWORK_ERROR` or `EMAILJS_TIMEOUT`: inspect backend outbound networking and EmailJS availability.

The resend endpoint intentionally returns a generic message to avoid revealing whether an account exists. For each failed resend, check the backend host's logs for `Verification resend email send failed` and inspect **EmailJS → Email History**. Do not repeatedly click resend: this implementation limits an account to three emails in a rolling 15-minute period.

## 5. Recover the pending account

After the provider/template problem is fixed and backend is redeployed, return to ShuffleUp and click **Resend verification email** once for the same address. Check Inbox, Spam, and EmailJS Email History. The backend creates a fresh single-use link when a resend is accepted. The link expires after 30 minutes.
