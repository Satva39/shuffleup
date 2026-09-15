const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

export async function registerUser(data) {
    const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Registration failed."
        );
    }

    return result;
}

export async function loginUser(data) {
    const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Login failed."
        );
    }

    return result;
}

export async function getCurrentUser(token) {
    const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Session expired."
        );
    }

    return result;
}