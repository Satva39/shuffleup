import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "shuffleup_token";
const USER_KEY = "shuffleup_user";

export async function saveSession(user, token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getSession() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const rawUser = await SecureStore.getItemAsync(USER_KEY);
  return { token, user: rawUser ? JSON.parse(rawUser) : null };
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
