import bcrypt from "bcryptjs";
import pool from "../config/database.js";
import generateToken from "../utils/generateToken.js";
import {
  createAuthToken,
  hashAuthToken,
  isValidEmail,
  normalizeEmail,
  validatePassword,
} from "../utils/authSecurity.js";
import {
  emailJsFailureLogFields,
  getEmailJsUserHint,
  isEmailJsConfigured,
  sendEmailJsTemplate,
} from "../utils/emailJs.js";
import { disconnectUserSockets } from "../sockets/activeSocketRegistry.js";

const TOKEN_LIFETIME_MINUTES = 30;
const MAX_EMAILS_PER_WINDOW = 3;
const EMAIL_WINDOW_MINUTES = 15;
const DEFAULT_PUBLIC_APP_URL = "https://shuffleup-five.vercel.app";

function publicAppUrl() {
  const candidate =
    process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    DEFAULT_PUBLIC_APP_URL;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      throw new Error("PUBLIC_APP_URL must use HTTPS outside localhost.");
    }
    return url.origin;
  } catch (error) {
    throw new Error("PUBLIC_APP_URL must be a valid absolute URL.");
  }
}

function tokenUrl(path, token) {
  const url = new URL(path, publicAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

function sendFailure(res, message, status = 400) {
  return res.status(status).json({ message });
}

async function issueSingleUseToken(user, kind) {
  const isReset = kind === "passwordReset";
  const table = isReset ? "password_reset_tokens" : "email_verification_tokens";
  const token = createAuthToken();
  const tokenHash = hashAuthToken(token);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const recent = await client.query(
      `SELECT COUNT(*)::int AS count FROM ${table}\n       WHERE user_id = $1 AND created_at > NOW() - ($2::int * INTERVAL '1 minute')`,
      [user.id, EMAIL_WINDOW_MINUTES],
    );
    if (recent.rows[0].count >= MAX_EMAILS_PER_WINDOW) {
      await client.query("ROLLBACK");
      return { rateLimited: true };
    }

    await client.query(
      `UPDATE ${table} SET consumed_at = NOW()\n       WHERE user_id = $1 AND consumed_at IS NULL`,
      [user.id],
    );
    await client.query(
      `INSERT INTO ${table} (user_id, token_hash, expires_at)\n       VALUES ($1, $2, NOW() + ($3::int * INTERVAL '1 minute'))`,
      [user.id, tokenHash, TOKEN_LIFETIME_MINUTES],
    );
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* already rolled back */
    }
    throw error;
  } finally {
    client.release();
  }

  const params = isReset
    ? {
        to_email: user.email,
        to_name: user.username,
        password_reset_url: tokenUrl("/reset-password", token),
        expires_minutes: TOKEN_LIFETIME_MINUTES,
        app_name: "ShuffleUp",
      }
    : {
        to_email: user.email,
        to_name: user.username,
        verification_url: tokenUrl("/verify-email", token),
        expires_minutes: TOKEN_LIFETIME_MINUTES,
        app_name: "ShuffleUp",
      };
  await sendEmailJsTemplate(kind, params);
  return { rateLimited: false };
}

export async function register(req, res) {
  const username =
    typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!username || username.length < 2 || username.length > 30) {
    return sendFailure(res, "Username must be between 2 and 30 characters.");
  }
  if (!isValidEmail(email))
    return sendFailure(res, "Enter a valid email address.");
  const passwordError = validatePassword(password);
  if (passwordError) return sendFailure(res, passwordError);
  if (!isEmailJsConfigured("verification")) {
    return sendFailure(
      res,
      "Email verification is not configured. Please try again later.",
      503,
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await pool.query(
      `INSERT INTO users (username, email, password_hash, email_verified)\n       VALUES ($1, $2, $3, FALSE)\n       RETURNING id, username, email`,
      [username, email, passwordHash],
    );
    const user = inserted.rows[0];

    try {
      await issueSingleUseToken(user, "verification");
    } catch (error) {
      // Keep the pending account so a resend can recover after EmailJS is fixed.
      // Distinguish a provider rejection from token/schema failures; previously both
      // were reported as an email failure, which hid database migration problems.
      if (String(error?.code || "").startsWith("EMAILJS_")) {
        console.error(
          "Verification email send failed.",
          JSON.stringify(emailJsFailureLogFields(error)),
        );
        return res.status(503).json({
          message: `Your account is saved, but the verification email was not accepted. ${getEmailJsUserHint(error)}`,
          verificationPending: true,
          email,
          deliveryErrorCode: error.code,
        });
      }

      console.error(
        "Verification token creation failed.",
        error?.code || "UNKNOWN_DB_ERROR",
        error?.message || "Unknown database error.",
      );
      return res.status(503).json({
        message:
          "Your account may be saved, but the server could not prepare its verification link. The site owner must check the database migrations and backend logs before you retry.",
        verificationPending: true,
        email,
      });
    }

    return res.status(201).json({
      message:
        "Account created. Check your email for a verification link that expires in 30 minutes.",
      verificationRequired: true,
      email,
    });
  } catch (error) {
    if (error?.code === "23505") {
      return sendFailure(
        res,
        "An account with this email already exists. Try signing in or resending verification.",
        409,
      );
    }
    if (["42703", "42P01"].includes(error?.code)) {
      console.error(
        "Registration blocked because required authentication schema is missing.",
        error.code,
      );
      return sendFailure(
        res,
        "The account service database is not up to date. The server owner must apply the authentication database migrations.",
        503,
      );
    }
    console.error(
      "Registration failed.",
      error?.code || "UNKNOWN_DB_ERROR",
      error?.message || "Unknown database error.",
    );
    return sendFailure(
      res,
      "Unable to create account. Please try again later.",
      500,
    );
  }
}

export async function verifyEmail(req, res) {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  if (token.length < 40 || token.length > 128) {
    return sendFailure(
      res,
      "This verification link is invalid or has expired.",
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query(
      `SELECT id, user_id FROM email_verification_tokens\n       WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()\n       FOR UPDATE`,
      [hashAuthToken(token)],
    );
    if (!found.rows[0]) {
      await client.query("ROLLBACK");
      return sendFailure(
        res,
        "This verification link is invalid or has expired.",
      );
    }
    const { id, user_id: userId } = found.rows[0];
    await client.query("UPDATE users SET email_verified = TRUE WHERE id = $1", [
      userId,
    ]);
    await client.query(
      "UPDATE email_verification_tokens SET consumed_at = NOW() WHERE user_id = $1 AND consumed_at IS NULL",
      [userId],
    );
    await client.query("COMMIT");
    return res.json({ message: "Email verified. You can now sign in." });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignored */
    }
    console.error(
      "Email verification failed.",
      error?.message || "Unknown database error.",
    );
    return sendFailure(
      res,
      "Unable to verify this email right now. Please try again.",
      500,
    );
  } finally {
    client.release();
  }
}

export async function resendVerification(req, res) {
  const email = normalizeEmail(req.body?.email);
  const genericMessage =
    "If an unverified account exists for that email, a verification message may have been sent. Check your inbox and spam folder; if it never arrives, the service owner should check the EmailJS dashboard and backend logs.";
  if (!isValidEmail(email)) return res.json({ message: genericMessage });

  try {
    const found = await pool.query(
      "SELECT id, username, email FROM users WHERE email = $1 AND email_verified = FALSE",
      [email],
    );
    if (found.rows[0] && isEmailJsConfigured("verification")) {
      try {
        const result = await issueSingleUseToken(found.rows[0], "verification");
        if (result?.rateLimited) {
          console.warn(
            "Verification resend rate-limited by per-account email quota.",
          );
        }
      } catch (error) {
        if (String(error?.code || "").startsWith("EMAILJS_")) {
          console.error(
            "Verification resend email send failed.",
            JSON.stringify(emailJsFailureLogFields(error)),
          );
        } else {
          console.error(
            "Verification resend token creation failed.",
            error?.code || "UNKNOWN_DB_ERROR",
            error?.message || "Unknown database error.",
          );
        }
      }
    } else if (found.rows[0]) {
      // Keep a generic public response to avoid account enumeration, but make
      // the missing server configuration visible to the service owner.
      console.error(
        "Verification resend skipped because EmailJS configuration is incomplete.",
      );
    }
    return res.json({ message: genericMessage });
  } catch (error) {
    console.error(
      "Verification resend request failed.",
      error?.message || "Unknown database error.",
    );
    return res.json({ message: genericMessage });
  }
}

export async function login(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!isValidEmail(email) || typeof password !== "string" || !password) {
    return sendFailure(res, "Email and password are required.");
  }

  try {
    const result = await pool.query(
      "SELECT id, username, email, password_hash, email_verified, auth_version, created_at FROM users WHERE email = $1",
      [email],
    );
    if (result.rows.length === 0) {
      return sendFailure(res, "Invalid email or password.", 401);
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch)
      return sendFailure(res, "Invalid email or password.", 401);
    if (user.email_verified === false) {
      return res.status(403).json({
        message:
          "Verify your email before signing in. You can request a new verification link from this screen.",
        verificationRequired: true,
      });
    }

    const token = generateToken(user);
    return res.json({
      message: "Login successful.",
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    if (["42703", "42P01"].includes(error?.code)) {
      console.error(
        "Login blocked because required authentication schema is missing.",
        error.code,
      );
      return sendFailure(
        res,
        "The login service database is not up to date. Existing accounts are safe; the server owner must apply the authentication database migrations.",
        503,
      );
    }
    console.error(
      "Login failed.",
      error?.code || "UNKNOWN_DB_ERROR",
      error?.message || "Unknown database error.",
    );
    return sendFailure(res, "Unable to login. Please try again later.", 500);
  }
}

export async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body?.email);
  const genericMessage =
    "If a verified account exists for that email, password reset instructions will be sent.";
  if (!isValidEmail(email)) return res.json({ message: genericMessage });

  try {
    const found = await pool.query(
      "SELECT id, username, email FROM users WHERE email = $1 AND email_verified = TRUE",
      [email],
    );
    if (found.rows[0] && isEmailJsConfigured("passwordReset")) {
      try {
        await issueSingleUseToken(found.rows[0], "passwordReset");
      } catch (error) {
        if (String(error?.code || "").startsWith("EMAILJS_")) {
          console.error(
            "Password reset email send failed.",
            JSON.stringify(emailJsFailureLogFields(error)),
          );
        } else {
          console.error(
            "Password reset token creation failed.",
            error?.code || "UNKNOWN_DB_ERROR",
            error?.message || "Unknown database error.",
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "Password reset request failed.",
      error?.message || "Unknown database error.",
    );
  }
  return res.json({ message: genericMessage });
}

export async function resetPassword(req, res) {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const password = req.body?.password;
  if (token.length < 40 || token.length > 128) {
    return sendFailure(
      res,
      "This password reset link is invalid or has expired.",
    );
  }
  const passwordError = validatePassword(password);
  if (passwordError) return sendFailure(res, passwordError);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query(
      `SELECT id, user_id FROM password_reset_tokens\n       WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()\n       FOR UPDATE`,
      [hashAuthToken(token)],
    );
    if (!found.rows[0]) {
      await client.query("ROLLBACK");
      return sendFailure(
        res,
        "This password reset link is invalid or has expired.",
      );
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = found.rows[0].user_id;
    await client.query(
      "UPDATE users SET password_hash = $1, auth_version = auth_version + 1 WHERE id = $2",
      [passwordHash, userId],
    );
    await client.query(
      "UPDATE password_reset_tokens SET consumed_at = NOW() WHERE user_id = $1 AND consumed_at IS NULL",
      [userId],
    );
    await client.query("COMMIT");
    try {
      disconnectUserSockets(userId);
    } catch (disconnectError) {
      console.error(
        "Could not immediately disconnect old sessions.",
        disconnectError?.message || "Unknown socket error.",
      );
    }
    return res.json({
      message: "Password updated. You can now sign in with your new password.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignored */
    }
    console.error(
      "Password reset failed.",
      error?.message || "Unknown database error.",
    );
    return sendFailure(
      res,
      "Unable to reset your password right now. Please try again.",
      500,
    );
  } finally {
    client.release();
  }
}

export async function getCurrentUser(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, username, email, created_at\n       FROM users\n       WHERE id = $1 AND email_verified = TRUE`,
      [req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error(
      "Get-current-user request failed.",
      error?.message || "Unknown database error.",
    );
    return sendFailure(res, "Unable to get user right now.", 500);
  }
}
