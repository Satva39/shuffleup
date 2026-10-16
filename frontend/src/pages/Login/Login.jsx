import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser, resendVerificationEmail } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { saveUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState(() =>
    searchParams.get("demoExpired") === "1"
      ? "Your two-minute demo has ended. Sign in or create an account to keep playing."
      : "",
  );

  useEffect(() => {
    if (searchParams.get("demoExpired") === "1") {
      setMessage(
        "Your two-minute demo has ended. Sign in or create an account to keep playing.",
      );
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [canResendVerification, setCanResendVerification] = useState(false);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setCanResendVerification(false);
    setLoading(true);
    try {
      const result = await loginUser(form);
      saveUser(result.user, result.token);
      navigate(redirectTo || "/", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Login failed.");
      setCanResendVerification(
        Boolean(requestError.data?.verificationRequired),
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setLoading(true);
    setError("");
    try {
      const result = await resendVerificationEmail(form.email);
      setMessage(result.message);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to request a verification email.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          Shuffle<span>Up</span>
        </Link>
        <div className="auth-heading">
          <p>WELCOME BACK</p>
          <h1>Login</h1>
          <span>Sign in and get back to the table.</span>
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="auth-message" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <div className="auth-password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <div className="auth-form-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {canResendVerification && (
          <button
            type="button"
            className="auth-resend"
            onClick={resendVerification}
            disabled={loading || !form.email.trim()}
          >
            Resend verification email
          </button>
        )}
        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <Link
            to={
              redirectTo
                ? `/register?redirect=${encodeURIComponent(redirectTo)}`
                : "/register"
            }
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
