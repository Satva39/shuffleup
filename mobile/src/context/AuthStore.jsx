import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";
import { clearSession, getSession, saveSession } from "../services/storage";
import { shuffleSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await getSession();
        if (!session.token) return;
        const result = await authApi.me(session.token);
        if (!active) return;
        setToken(session.token);
        setUser(result.user);
        shuffleSocket.connect(session.token);
      } catch {
        await clearSession();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      async login(credentials) {
        const result = await authApi.login(credentials);
        await saveSession(result.user, result.token);
        setUser(result.user);
        setToken(result.token);
        shuffleSocket.connect(result.token);
        return result;
      },
      async register(data) {
        const result = await authApi.register(data);
        await saveSession(result.user, result.token);
        setUser(result.user);
        setToken(result.token);
        shuffleSocket.connect(result.token);
        return result;
      },
      async logout() {
        shuffleSocket.disconnect();
        await clearSession();
        setUser(null);
        setToken(null);
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
