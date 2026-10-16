import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { registerUser, resendVerificationEmail } from "../../services/auth";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendAvailable, setResendAvailable] = useState(false);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResendAvailable(false);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8 || form.password.length > 128) {
      setError("Use a password between 8 and 128 characters.");
      return;
    }
    if (form.password.trim().length === 0) {
      setError("Password cannot contain only spaces.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setForm((current) => ({ ...current, email: result.email || current.email }));
      setMessage(result.message || "Check your email for a verification link.");
      setResendAvailable(true);
    } catch (requestError) {
      setError(requestError.message || "Registration failed.");
      if (requestError.data?.verificationPending || requestError.status === 409) {
        setResendAvailable(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    setLoading(true);
    try {
      const result = await resendVerificationEmail(form.email);
      setMessage(result.message || "Check your inbox if the account needs verification.");
    } catch (requestError) {
      setError(requestError.message || "Unable to request a new verification email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <div className="register-card">
        <Link to="/" className="register-logo">
          Shuffle<span>Up</span>
        </Link>

        <div className="register-heading">
          <p>JOIN SHUFFLEUP</p>
          <h1>Create Account</h1>
          <span>Verify your email before your first sign in.</span>
        </div>

        {error && <div className="register-error" role="alert">{error}</div>}
        {message && <div className="register-message" role="status">{message}</div>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <label>
              Username
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                minLength={2}
                maxLength={30}
                autoComplete="username"
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                maxLength={255}
                required
              />
            </label>

            <label>
              Password
              <div className="register-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="8–128 characters; avoid common passwords"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label>
              Confirm Password
              <div className="register-password-field">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Enter password again"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button type="submit" className="register-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {resendAvailable && (
          <button className="register-resend" type="button" disabled={loading || !form.email.trim()} onClick={resend}>
            {loading ? "Sending..." : "Resend verification email"}
          </button>
        )}

        {message && (
          <button className="register-submit" type="button" onClick={() => navigate(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login")}>
            Continue to Login
          </button>
        )}

        <p className="register-switch">
          Already have an account?{" "}
          <Link to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}>
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
