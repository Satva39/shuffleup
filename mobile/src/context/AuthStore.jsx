import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";
import {
  clearDemoSession,
  clearSession,
  getDemoSession,
  getSession,
  saveDemoSession,
  saveSession,
} from "../services/storage";
import { shuffleSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoExpired, setDemoExpired] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await getSession();
        if (session.token) {
          const result = await authApi.me(session.token);
          if (!active) return;
          setToken(session.token);
          setUser(result.user);
          shuffleSocket.connect(session.token);
          return;
        }
        const demo = await getDemoSession();
        if (demo.token && demo.user && demo.expiresAt > Date.now()) {
          if (!active) return;
          setToken(demo.token);
          setUser({
            ...demo.user,
            isGuest: true,
            demoExpiresAt: demo.expiresAt,
          });
          setDemoExpired(false);
          shuffleSocket.connect(demo.token);
        } else if (demo.token) {
          await clearDemoSession();
          setDemoExpired(true);
        }
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

  useEffect(() => {
    if (!user?.isGuest || !user.demoExpiresAt) return undefined;
    const delay = Math.max(0, Number(user.demoExpiresAt) - Date.now());
    const timer = setTimeout(() => {
      void clearDemoSession();
      shuffleSocket.disconnect();
      setToken(null);
      setUser(null);
      setDemoExpired(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [user?.isGuest, user?.demoExpiresAt]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isDemo: Boolean(user?.isGuest),
      demoExpired,
      clearDemoExpired() {
        setDemoExpired(false);
      },
      demoExpiresAt: user?.isGuest ? user.demoExpiresAt : null,
      async startDemo() {
        setDemoExpired(false);
        const result = await authApi.startDemo();
        await saveDemoSession(
          { ...result.user, isGuest: true, demoExpiresAt: result.expiresAt },
          result.token,
          result.expiresAt,
        );
        setUser({
          ...result.user,
          isGuest: true,
          demoExpiresAt: result.expiresAt,
        });
        setToken(result.token);
        shuffleSocket.connect(result.token);
        return result;
      },
      async login(credentials) {
        const result = await authApi.login(credentials);
        await clearDemoSession();
        await saveSession(result.user, result.token);
        setUser(result.user);
        setToken(result.token);
        setDemoExpired(false);
        shuffleSocket.connect(result.token);
        return result;
      },
      async register(data) {
        // Registration creates an unverified account. Do not create a local
        // session until the user verifies their address and signs in.
        return authApi.register(data);
      },
      async logout() {
        shuffleSocket.disconnect();
        await Promise.all([clearSession(), clearDemoSession()]);
        setUser(null);
        setToken(null);
        setDemoExpired(false);
      },
    }),
    [user, token, loading, demoExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
