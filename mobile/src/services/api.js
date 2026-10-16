import { API_URL } from "../constants/config";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
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

function postAuth(path, data) {
  return request(`/api/auth/${path}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export const authApi = {
  startDemo: () => request("/api/demo/session", { method: "POST" }),
  stats: (token) =>
    request("/api/stats/me", { headers: { Authorization: `Bearer ${token}` } }),
  register: (data) => postAuth("register", data),
  login: (data) => postAuth("login", data),
  verifyEmail: (token) => postAuth("verify-email", { token }),
  resendVerification: (email) => postAuth("resend-verification", { email }),
  forgotPassword: (email) => postAuth("forgot-password", { email }),
  resetPassword: (token, password) =>
    postAuth("reset-password", { token, password }),
  me: (token) =>
    request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
};
