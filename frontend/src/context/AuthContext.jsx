import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { getCurrentUser } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser =
            localStorage.getItem("shuffleup_user");

        return savedUser
            ? JSON.parse(savedUser)
            : null;
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function verifySession() {
            const token =
                localStorage.getItem("shuffleup_token");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const result =
                    await getCurrentUser(token);

                localStorage.setItem(
                    "shuffleup_user",
                    JSON.stringify(result.user)
                );

                setUser(result.user);
            } catch {
                localStorage.removeItem(
                    "shuffleup_user"
                );

                localStorage.removeItem(
                    "shuffleup_token"
                );

                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        verifySession();
    }, []);

    function saveUser(userData, token) {
        localStorage.setItem(
            "shuffleup_user",
            JSON.stringify(userData)
        );

        localStorage.setItem(
            "shuffleup_token",
            token
        );

        setUser(userData);
    }

    function logout() {
        localStorage.removeItem(
            "shuffleup_user"
        );

        localStorage.removeItem(
            "shuffleup_token"
        );

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