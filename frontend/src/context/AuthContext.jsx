import { createContext, useContext, useEffect, useState } from "react";

import { getCurrentUser } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("shuffleup_user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      const token = localStorage.getItem("shuffleup_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await getCurrentUser(token);

        localStorage.setItem("shuffleup_user", JSON.stringify(result.user));

        setUser(result.user);
      } catch (error) {
        // Only clear a session when the server explicitly rejects it.
        // A temporary outage or unapplied migration must not erase a saved session.
        if ([401, 403, 404].includes(Number(error?.status))) {
          localStorage.removeItem("shuffleup_user");
          localStorage.removeItem("shuffleup_token");
          setUser(null);
        } else {
          try {
            const cachedUser = JSON.parse(
              localStorage.getItem("shuffleup_user") || "null",
            );
            setUser(cachedUser);
          } catch {
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  function saveUser(userData, token) {
    localStorage.setItem("shuffleup_user", JSON.stringify(userData));

    localStorage.setItem("shuffleup_token", token);
    localStorage.removeItem("shuffleup_demo_token");
    localStorage.removeItem("shuffleup_demo_expires_at");

    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("shuffleup_user");

    localStorage.removeItem("shuffleup_token");
    localStorage.removeItem("shuffleup_demo_token");
    localStorage.removeItem("shuffleup_demo_expires_at");

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        saveUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
