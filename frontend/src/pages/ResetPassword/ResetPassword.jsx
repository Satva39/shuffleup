import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/auth";
import "../Login/Login.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!token) return setError("This reset link is missing its token.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
    if (password.length < 8 || password.length > 128)
      return setError("Use a password between 8 and 128 characters.");

    setLoading(true);
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message || "Password updated. You can sign in now.");
      setPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(requestError.message || "Could not reset password.");
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
          <p>ACCOUNT SECURITY</p>
          <h1>Reset password</h1>
          <span>Choose a new password you do not use elsewhere.</span>
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
        {!message && (
          <form onSubmit={submit}>
            <label>
              New password
              <div className="auth-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8–128 characters"
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
            <label>
              Confirm new password
              <div className="auth-password-field">
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter it again"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm((value) => !value)}
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <p className="auth-password-hint">
              Avoid common passwords and repeated characters.
            </p>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
        <p className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </main>
  );
}
