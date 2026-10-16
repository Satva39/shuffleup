import { API_BASE_URL } from "./apiBase";

const API_URL = API_BASE_URL;

async function authRequest(path, data) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again shortly.");
    }
    throw new Error(`Unable to reach the ShuffleUp server at ${API_URL}. Check that the backend is deployed and VITE_API_URL is correct.`);
  } finally {
    window.clearTimeout(timeout);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || "Request failed.");
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result;
}

export function registerUser(data) {
  return authRequest("register", data);
}

export function loginUser(data) {
  return authRequest("login", data);
}

export function verifyEmail(token) {
  return authRequest("verify-email", { token });
}

export function resendVerificationEmail(email) {
  return authRequest("resend-verification", { email });
}

export function requestPasswordReset(email) {
  return authRequest("forgot-password", { email });
}

export function resetPassword(token, password) {
  return authRequest("reset-password", { token, password });
}

export async function getCurrentUser(token) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  } catch (requestError) {
    if (requestError?.name === "AbortError") {
      const error = new Error("Checking your session timed out. Please retry when the server is available.");
      error.transient = true;
      throw error;
    }
    const error = new Error("Unable to reach the ShuffleUp server while checking your session.");
    error.transient = true;
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || "Session expired.");
    error.status = response.status;
    error.data = result;
    error.transient = response.status >= 500;
    throw error;
  }
  return result;
}
