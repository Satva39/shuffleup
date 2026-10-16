const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function authRequest(path, data) {
  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
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
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message || "Session expired.");
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result;
}
