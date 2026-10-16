import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "shuffleup_token";
const USER_KEY = "shuffleup_user";
const DEMO_TOKEN_KEY = "shuffleup_demo_token";
const DEMO_USER_KEY = "shuffleup_demo_user";
const DEMO_EXPIRY_KEY = "shuffleup_demo_expiry";

export async function saveSession(user, token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getSession() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const rawUser = await SecureStore.getItemAsync(USER_KEY);
  return { token, user: rawUser ? JSON.parse(rawUser) : null };
}

export async function saveDemoSession(user, token, expiresAt) {
  await clearSession();
  await SecureStore.setItemAsync(DEMO_TOKEN_KEY, token);
  await SecureStore.setItemAsync(DEMO_USER_KEY, JSON.stringify(user));
  await SecureStore.setItemAsync(DEMO_EXPIRY_KEY, String(expiresAt));
}

export async function getDemoSession() {
  const token = await SecureStore.getItemAsync(DEMO_TOKEN_KEY);
  const rawUser = await SecureStore.getItemAsync(DEMO_USER_KEY);
  const expiresAt = Number(await SecureStore.getItemAsync(DEMO_EXPIRY_KEY));
  return { token, user: rawUser ? JSON.parse(rawUser) : null, expiresAt };
}

export async function clearDemoSession() {
  await SecureStore.deleteItemAsync(DEMO_TOKEN_KEY);
  await SecureStore.deleteItemAsync(DEMO_USER_KEY);
  await SecureStore.deleteItemAsync(DEMO_EXPIRY_KEY);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  await clearDemoSession();
}
